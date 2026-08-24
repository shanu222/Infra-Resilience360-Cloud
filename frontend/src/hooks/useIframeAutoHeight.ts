import { useEffect, useRef } from 'react'

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
  // typical mobile keyboards (≈ 30–50 % of screen) while ignoring small
  // browser-chrome adjustments on scroll.
  const gap = window.innerHeight - vv.height
  return gap > Math.max(150, window.innerHeight * 0.2)
}

export function useIframeAutoHeight(minHeight = DEFAULT_MIN_HEIGHT, options: IframeAutoHeightOptions = {}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    let raf = 0
    let interval: number | null = null
    let resizeObserver: ResizeObserver | null = null
    let mutationObserver: MutationObserver | null = null
    let teardownHistoryPatch: (() => void) | null = null
    let teardownWindowListeners: (() => void) | null = null
    let teardownDocListeners: (() => void) | null = null

    const observeResize = options.observeResize !== false
    const observeMutations = options.observeMutations !== false
    const pollIntervalMs = options.pollIntervalMs ?? 2500
    const maxHeightPx = options.maxHeightPx && options.maxHeightPx > 0 ? options.maxHeightPx : Number.POSITIVE_INFINITY
    let lastAppliedHeight = 0

    const applyHeight = (): boolean => {
      const node = iframeRef.current
      if (!node) return false

      // ── Mobile keyboard guard ────────────────────────────────────────────────
      // On mobile browsers, when the software keyboard opens the visual viewport
      // shrinks significantly. If we resize the iframe at that moment the browser
      // fires its scroll-to-focus gesture and the page jumps downward. The
      // keyboard does not change actual page layout so skipping is safe — the
      // existing iframe height is already correct. We will measure again once the
      // keyboard is dismissed (the next MutationObserver / poll tick will fire).
      if (isSoftwareKeyboardOpen()) return false

      try {
        const doc = node.contentDocument
        if (!doc) return false

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
        node.style.height = '1px'

        const measured = measureDocumentHeight(doc)
        const next = Math.min(maxHeightPx, Math.max(minHeight, measured))

        // Always restore to a valid height so the 1 px state is never left visible.
        if (!Number.isFinite(next) || next <= 0) {
          node.style.height = prev > 0 ? `${prev}px` : `${minHeight}px`
          unchangedTicks += 1
          return false
        }

        node.style.height = `${next}px`

        // Restore the outer-page scroll position. Reading scrollY/X here forces
        // the layout to settle; if the browser moved the page during the 1 px
        // phase we bring it back synchronously so the user sees no movement.
        if (window.scrollY !== savedScrollY || window.scrollX !== savedScrollX) {
          window.scrollTo(savedScrollX, savedScrollY)
        }

        if (Math.abs(prev - next) < 4) {
          unchangedTicks += 1
          return false
        }
        unchangedTicks = 0
        return true
      } catch {
        return false
      }
    }

    const scheduleMeasure = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(applyHeight)
      })
    }

    const attachObservers = () => {
      const node = iframeRef.current
      if (!node) return
      try {
        const doc = node.contentDocument
        const win = node.contentWindow
        if (!doc || !win) return

        const root = doc.documentElement
        const body = doc.body
        if (!root || !body) return

        injectHeightNeutralizer(doc)

        teardownHistoryPatch?.()
        teardownHistoryPatch = patchHistoryForRemeasure(win, () => {
          lastAppliedHeight = 0
          scheduleMeasure()
        })

        teardownWindowListeners?.()
        const onRouteChange = () => {
          lastAppliedHeight = 0
          scheduleMeasure()
        }
        win.addEventListener('hashchange', onRouteChange)
        win.addEventListener('popstate', onRouteChange)
        teardownWindowListeners = () => {
          win.removeEventListener('hashchange', onRouteChange)
          win.removeEventListener('popstate', onRouteChange)
        }

        teardownDocListeners?.()
        const onAssetLoad = (event: Event) => {
          const target = event.target
          if (target instanceof HTMLImageElement || target instanceof SVGElement) {
            scheduleMeasure()
          }
        }
        doc.addEventListener('load', onAssetLoad, true)
        doc.fonts?.ready.then(() => scheduleMeasure()).catch(() => {})

        const onPortalMessage = (event: MessageEvent) => {
          if (event.source !== win) return
          const data = event.data
          if (data && typeof data === 'object' && (data as { type?: string }).type === 'r360-portal-resize') {
            scheduleMeasure()
          }
        }
        window.addEventListener('message', onPortalMessage)

        teardownDocListeners = () => {
          doc.removeEventListener('load', onAssetLoad, true)
          window.removeEventListener('message', onPortalMessage)
        }

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
          // Reset lastAppliedHeight on every DOM mutation so height can freely
          // shrink (not just grow).  Without this, navigating from a tall step to
          // a shorter step keeps the old height because the delta check passes but
          // the measurement itself returns the previous (inflated) value.
          mutationObserver = new MutationObserver(() => {
            lastAppliedHeight = 0
            scheduleMeasure()
          })
          mutationObserver.observe(root, {
            subtree: true,
            childList: true,
            attributes: true,
            characterData: true,
          })
        }

        if (pollIntervalMs > 0) {
          if (interval !== null) window.clearInterval(interval)
          interval = window.setInterval(() => {
            if (document.visibilityState === 'hidden') return
            scheduleMeasure()
          }, pollIntervalMs)
        }
      } catch {
        /* cross-origin */
      }
    }

    const onLoad = () => {
      lastAppliedHeight = 0
      scheduleMeasure()
      attachObservers()
      window.setTimeout(scheduleMeasure, 120)
      window.setTimeout(scheduleMeasure, 400)
      window.setTimeout(scheduleMeasure, 900)
    }

    iframe.style.minHeight = '0px'
    iframe.setAttribute('scrolling', 'no')
    iframe.addEventListener('load', onLoad)
    onLoad()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      if (interval !== null) window.clearInterval(interval)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
      teardownHistoryPatch?.()
      teardownWindowListeners?.()
      teardownDocListeners?.()
      iframe.removeEventListener('load', onLoad)
    }
  }, [options.maxHeightPx, options.observeMutations, options.observeResize, options.pollIntervalMs])

  return iframeRef
}
