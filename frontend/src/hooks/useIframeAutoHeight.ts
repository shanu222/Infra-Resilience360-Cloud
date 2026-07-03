import { useEffect, useRef } from 'react'

const DEFAULT_MIN_HEIGHT = 720

type IframeAutoHeightOptions = {
  observeResize?: boolean
  observeMutations?: boolean
  pollIntervalMs?: number
  stopWhenStableTicks?: number
  maxHeightPx?: number
}

function measureDocumentHeight(doc: Document): number {
  const body = doc.body
  const root = doc.documentElement
  if (!body || !root) return 0
  // scrollHeight and offsetHeight on body/root reflect actual content layout.
  // At the point this is called, the iframe has already been shrunk to 1px so
  // 100vh = 1px inside the frame, which collapses any min-h-screen (100vh) divs
  // to 1px. scrollHeight then returns true content height, not the viewport floor.
  return Math.max(
    body.scrollHeight,
    body.offsetHeight,
    root.scrollHeight,
    root.offsetHeight,
  )
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
    let unchangedTicks = 0
    const observeResize = options.observeResize !== false
    const observeMutations = options.observeMutations !== false
    const pollIntervalMs = options.pollIntervalMs ?? 5000
    const stopWhenStableTicks = options.stopWhenStableTicks ?? 8
    const maxHeightPx = options.maxHeightPx && options.maxHeightPx > 0 ? options.maxHeightPx : Number.POSITIVE_INFINITY

    const applyHeight = (): boolean => {
      const node = iframeRef.current
      if (!node) return false
      try {
        const doc = node.contentDocument
        if (!doc) return false

        // Read the stable height before we temporarily shrink the iframe.
        const prev = parseFloat(node.style.height || '0') || 0

        // KEY FIX: Temporarily shrink the iframe to 1px so that, inside the
        // frame, 100vh = 1px. Any element using `min-h-screen` (min-height:100vh)
        // then collapses to 1px, breaking the circular dependency:
        //   iframe.height → 100vh → min-h-screen → scrollHeight → iframe.height
        // Reading scrollHeight AFTER this change forces a synchronous reflow
        // inside the frame with the new 1px viewport — giving the true content height.
        node.style.height = '1px'

        const measured = measureDocumentHeight(doc)
        const next = Math.min(maxHeightPx, Math.max(minHeight, measured))

        // Always restore to the correct height (even when unchanged),
        // so the 1px state is never left visible.
        if (!Number.isFinite(next) || next <= 0) {
          node.style.height = prev > 0 ? `${prev}px` : `${minHeight}px`
          unchangedTicks += 1
          return false
        }

        node.style.height = `${next}px`

        if (Math.abs(prev - next) < 4) {
          unchangedTicks += 1
          return false
        }
        unchangedTicks = 0
        return true
      } catch {
        // Cross-origin or transient loading; keep fallback min-height.
        return false
      }
    }

    const scheduleMeasure = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(applyHeight)
    }

    const attachObservers = () => {
      const node = iframeRef.current
      if (!node) return
      try {
        const doc = node.contentDocument
        if (!doc) return
        const root = doc.documentElement
        const body = doc.body
        if (!root || !body) return

        if (observeResize) {
          resizeObserver = new ResizeObserver(scheduleMeasure)
          // Observe the app's #root element instead of body/html.
          // Observing body/html creates a second feedback loop because our own
          // 1px→contentHeight transition resizes them on every measurement cycle.
          // #root only resizes when the ACTUAL CONTENT changes, so the observer
          // fires only when necessary and quickly becomes stable.
          const appRoot = doc.getElementById('root') ?? body
          resizeObserver.observe(appRoot)
        }

        if (observeMutations) {
          mutationObserver = new MutationObserver(scheduleMeasure)
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
            if (unchangedTicks >= stopWhenStableTicks && interval !== null) {
              window.clearInterval(interval)
              interval = null
            }
          }, pollIntervalMs)
        }
      } catch {
        // Cross-origin; best-effort fallback only.
      }
    }

    const onLoad = () => {
      unchangedTicks = 0
      scheduleMeasure()
      attachObservers()
      window.setTimeout(scheduleMeasure, 160)
      window.setTimeout(scheduleMeasure, 700)
    }

    iframe.style.minHeight = `${minHeight}px`
    iframe.setAttribute('scrolling', 'no')
    iframe.addEventListener('load', onLoad)
    onLoad()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      if (interval !== null) window.clearInterval(interval)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
      iframe.removeEventListener('load', onLoad)
    }
  }, [minHeight, options.maxHeightPx, options.observeMutations, options.observeResize, options.pollIntervalMs, options.stopWhenStableTicks])

  return iframeRef
}
