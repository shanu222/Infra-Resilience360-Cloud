import { useEffect, useRef } from 'react'

/**
 * Embedded portals are sized to their content, so there is no sensible viewport
 * floor: any non-zero default shows up as dead space under short pages.
 */
const DEFAULT_MIN_HEIGHT = 0

/** Minimum gap between observer-driven measurements (ms). */
const MEASURE_THROTTLE_MS = 100

const HEIGHT_NEUTRALIZER_ID = 'r360-iframe-height-neutralizer'

type IframeAutoHeightOptions = {
  observeResize?: boolean
  observeMutations?: boolean
  pollIntervalMs?: number
  maxHeightPx?: number
}

function measureDocumentHeight(doc: Document): number {
  const body = doc.body
  const root = doc.documentElement
  if (!body || !root) return 0
  // At the point this is called the iframe has already been shrunk to 1 px so
  // 100vh = 1 px inside the frame, collapsing any min-h-screen (100vh) divs.
  // scrollHeight therefore returns the true content height, not the vh floor.
  return Math.max(
    body.scrollHeight,
    body.offsetHeight,
    root.scrollHeight,
    root.offsetHeight,
  )
}

/**
 * Removes the viewport-height floor from the frame's own root elements.
 *
 * A portal bundle that ships `html, body { min-height: 100vh }` reports at least
 * a full viewport of height no matter how short its content is, which surfaces in
 * the shell as a band of empty background below the portal. Only the document
 * roots are touched: inner `min-h-screen` sections stay intact and simply track
 * whatever height the frame settles on.
 */
function injectHeightNeutralizer(doc: Document): void {
  if (doc.getElementById(HEIGHT_NEUTRALIZER_ID)) return
  const head = doc.head
  if (!head) return
  const style = doc.createElement('style')
  style.id = HEIGHT_NEUTRALIZER_ID
  style.textContent = `
    html, body, body > #root {
      min-height: 0 !important;
      height: auto !important;
    }
  `
  head.appendChild(style)
}

/**
 * Client-side routers navigate with history.pushState, which fires no event, so
 * a route change to a shorter page would otherwise keep the previous height.
 */
function patchHistoryForRemeasure(win: Window, onNavigate: () => void): () => void {
  const historyRef = win.history
  if (!historyRef) return () => {}

  const originalPushState = historyRef.pushState.bind(historyRef)
  const originalReplaceState = historyRef.replaceState.bind(historyRef)

  historyRef.pushState = (...args: Parameters<History['pushState']>) => {
    originalPushState(...args)
    onNavigate()
  }
  historyRef.replaceState = (...args: Parameters<History['replaceState']>) => {
    originalReplaceState(...args)
    onNavigate()
  }

  return () => {
    historyRef.pushState = originalPushState
    historyRef.replaceState = originalReplaceState
  }
}

/**
 * Returns true when the mobile software keyboard is probably visible.
 *
 * When the keyboard is open, visualViewport.height is significantly smaller
 * than window.innerHeight. We use the gap to detect this state so we can skip
 * iframe height updates: the keyboard does NOT change actual page layout, only
 * the visible area, so resizing the iframe while the keyboard is open would
 * cause the browser to scroll the page to keep the focused element in view.
 */
function isSoftwareKeyboardOpen(): boolean {
  const vv = window.visualViewport
  if (!vv) return false
  // Keyboard is considered open when it consumes at least 150 px or 20 % of
  // the window height (whichever is larger). This threshold comfortably catches
  // typical mobile keyboards (~30-50 % of screen) while ignoring small
  // browser-chrome adjustments on scroll.
  const gap = window.innerHeight - vv.height
  return gap > Math.max(150, window.innerHeight * 0.2)
}

export function useIframeAutoHeight(
  minHeight = DEFAULT_MIN_HEIGHT,
  options: IframeAutoHeightOptions = {},
) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    let raf = 0
    let throttleTimer = 0
    let lastMeasureAt = 0
    let interval: number | null = null
    let resizeObserver: ResizeObserver | null = null
    let mutationObserver: MutationObserver | null = null
    let teardownHistoryPatch: (() => void) | null = null
    let teardownWindowListeners: (() => void) | null = null
    let teardownDocListeners: (() => void) | null = null

    const observeResize = options.observeResize !== false
    const observeMutations = options.observeMutations !== false
    const pollIntervalMs = options.pollIntervalMs ?? 2500
    const maxHeightPx =
      options.maxHeightPx && options.maxHeightPx > 0 ? options.maxHeightPx : Number.POSITIVE_INFINITY

    const applyHeight = (): void => {
      const node = iframeRef.current
      if (!node) return

      // ── Mobile keyboard guard ────────────────────────────────────────────────
      // On mobile browsers, when the software keyboard opens the visual viewport
      // shrinks significantly. If we resize the iframe at that moment the browser
      // fires its scroll-to-focus gesture and the page jumps downward. The
      // keyboard does not change actual page layout so skipping is safe — the
      // existing iframe height is already correct. We will measure again once the
      // keyboard is dismissed (the next MutationObserver / poll tick will fire).
      if (isSoftwareKeyboardOpen()) return

      try {
        const doc = node.contentDocument
        if (!doc) return

        lastMeasureAt = Date.now()

        // Save the stable height before the temporary 1 px measurement.
        const prev = parseFloat(node.style.height || '0') || 0

        // ── Scroll-position guard ────────────────────────────────────────────────
        // We are about to shrink the iframe to 1 px (see below). On mobile this
        // intermediate state can trigger the browser's built-in scroll-to-focus
        // logic (keeping the tapped element in view), which moves the outer page
        // before we restore the correct height. Capturing the position here and
        // restoring it synchronously — before the next paint — prevents any
        // visible jump on mobile or desktop.
        const savedScrollX = window.scrollX
        const savedScrollY = window.scrollY

        // ── 100 vh feedback-loop fix ─────────────────────────────────────────────
        // Temporarily set the iframe to 1 px so that inside the frame 100vh = 1 px.
        // This collapses any element using min-h-screen (min-height: 100vh) to 1 px,
        // breaking the circular dependency:
        //   iframe.height → 100vh → min-h-screen → scrollHeight → iframe.height
        // Reading scrollHeight immediately after forces a synchronous reflow in the
        // inner frame with the new 1 px viewport — returning the true content height.
        // Both writes happen in one task, so the 1 px state is never painted.
        node.style.height = '1px'

        const measured = measureDocumentHeight(doc)
        const next = Math.min(maxHeightPx, Math.max(minHeight, measured))

        // Always restore to a valid height so the 1 px state is never left visible.
        if (!Number.isFinite(next) || next <= 0) {
          node.style.height = prev > 0 ? `${prev}px` : `${minHeight}px`
          return
        }

        node.style.height = `${next}px`

        // Restore the outer-page scroll position. Reading scrollY/X here forces
        // the layout to settle; if the browser moved the page during the 1 px
        // phase we bring it back synchronously so the user sees no movement.
        if (window.scrollY !== savedScrollY || window.scrollX !== savedScrollX) {
          window.scrollTo(savedScrollX, savedScrollY)
        }
      } catch {
        // Cross-origin or transient loading; keep the current height.
      }
    }

    const measureNow = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(applyHeight)
      })
    }

    /**
     * Observer-driven remeasure. A portal with a spinner or a chart animation
     * mutates continuously; measuring on every mutation would force two
     * synchronous reflows per frame inside the WebView, so trailing-edge
     * throttling keeps the frame responsive while still converging.
     */
    const scheduleMeasure = () => {
      if (throttleTimer) return
      const elapsed = Date.now() - lastMeasureAt
      if (elapsed >= MEASURE_THROTTLE_MS) {
        measureNow()
        return
      }
      throttleTimer = window.setTimeout(() => {
        throttleTimer = 0
        measureNow()
      }, MEASURE_THROTTLE_MS - elapsed)
    }

    const attachObservers = () => {
      const node = iframeRef.current
      if (!node) return

      const doc = node.contentDocument
      const win = node.contentWindow
      if (!doc || !win) return

      const root = doc.documentElement
      const body = doc.body
      if (!root || !body) return

      // Each step is isolated: a failure in one (for example a frame that blocks
      // history patching) must not prevent the observers below from attaching.
      try {
        injectHeightNeutralizer(doc)
      } catch {
        /* frame not writable */
      }

      try {
        teardownHistoryPatch?.()
        teardownHistoryPatch = patchHistoryForRemeasure(win, measureNow)
      } catch {
        teardownHistoryPatch = null
      }

      try {
        teardownWindowListeners?.()
        const onRouteChange = () => measureNow()
        win.addEventListener('hashchange', onRouteChange)
        win.addEventListener('popstate', onRouteChange)
        teardownWindowListeners = () => {
          win.removeEventListener('hashchange', onRouteChange)
          win.removeEventListener('popstate', onRouteChange)
        }
      } catch {
        teardownWindowListeners = null
      }

      try {
        teardownDocListeners?.()
        const onAssetLoad = (event: Event) => {
          const target = event.target
          if (target instanceof HTMLImageElement || target instanceof SVGElement) {
            scheduleMeasure()
          }
        }
        doc.addEventListener('load', onAssetLoad, true)
        doc.fonts?.ready.then(() => measureNow()).catch(() => {})

        const onPortalMessage = (event: MessageEvent) => {
          if (event.source !== win) return
          const data = event.data
          if (data && typeof data === 'object' && (data as { type?: string }).type === 'r360-portal-resize') {
            scheduleMeasure()
          }
        }
        // Rotating the device changes the frame width, so the content reflows to
        // a different height and must be remeasured.
        const onViewportChange = () => measureNow()
        window.addEventListener('message', onPortalMessage)
        window.addEventListener('resize', onViewportChange)
        window.addEventListener('orientationchange', onViewportChange)

        teardownDocListeners = () => {
          doc.removeEventListener('load', onAssetLoad, true)
          window.removeEventListener('message', onPortalMessage)
          window.removeEventListener('resize', onViewportChange)
          window.removeEventListener('orientationchange', onViewportChange)
        }
      } catch {
        teardownDocListeners = null
      }

      try {
        if (observeResize) {
          resizeObserver?.disconnect()
          resizeObserver = new ResizeObserver(scheduleMeasure)
          // Observe the app's #root element instead of body/html.
          // Observing body/html creates a second feedback loop because our own
          // 1 px → contentHeight transition resizes them on every measurement
          // cycle. #root only resizes when the ACTUAL CONTENT changes, so the
          // observer fires only when necessary and quickly becomes stable.
          const appRoot = doc.getElementById('root') ?? body
          resizeObserver.observe(appRoot)
        }

        if (observeMutations) {
          mutationObserver?.disconnect()
          mutationObserver = new MutationObserver(scheduleMeasure)
          mutationObserver.observe(root, {
            subtree: true,
            childList: true,
            attributes: true,
            characterData: true,
          })
        }
      } catch {
        /* cross-origin */
      }

      if (pollIntervalMs > 0) {
        if (interval !== null) window.clearInterval(interval)
        interval = window.setInterval(() => {
          if (document.visibilityState === 'hidden') return
          scheduleMeasure()
        }, pollIntervalMs)
      }
    }

    const onLoad = () => {
      measureNow()
      attachObservers()
      window.setTimeout(measureNow, 120)
      window.setTimeout(measureNow, 400)
      window.setTimeout(measureNow, 900)
      window.setTimeout(measureNow, 1800)
    }

    iframe.style.minHeight = '0px'
    iframe.setAttribute('scrolling', 'no')
    iframe.addEventListener('load', onLoad)
    onLoad()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      if (throttleTimer) window.clearTimeout(throttleTimer)
      if (interval !== null) window.clearInterval(interval)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
      teardownHistoryPatch?.()
      teardownWindowListeners?.()
      teardownDocListeners?.()
      iframe.removeEventListener('load', onLoad)
    }
  }, [minHeight, options.maxHeightPx, options.observeMutations, options.observeResize, options.pollIntervalMs])

  return iframeRef
}
