import { useEffect, useRef } from 'react'

const DEFAULT_MIN_HEIGHT = 720

function measureDocumentHeight(doc: Document): number {
  const body = doc.body
  const root = doc.documentElement
  return Math.max(
    body?.scrollHeight ?? 0,
    body?.offsetHeight ?? 0,
    root?.scrollHeight ?? 0,
    root?.offsetHeight ?? 0,
    root?.clientHeight ?? 0,
  )
}

export function useIframeAutoHeight(minHeight = DEFAULT_MIN_HEIGHT) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    let raf = 0
    let interval: number | null = null
    let resizeObserver: ResizeObserver | null = null
    let mutationObserver: MutationObserver | null = null

    const applyHeight = () => {
      const node = iframeRef.current
      if (!node) return
      try {
        const doc = node.contentDocument
        if (!doc) return
        const measured = measureDocumentHeight(doc)
        const next = Math.max(minHeight, measured)
        const prev = Number.parseInt(node.style.height || '0', 10) || 0
        if (!Number.isFinite(next) || next <= 0 || Math.abs(prev - next) < 4) return
        node.style.height = `${next}px`
      } catch {
        // Cross-origin or transient loading; keep fallback min-height.
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

        resizeObserver = new ResizeObserver(scheduleMeasure)
        resizeObserver.observe(root)
        resizeObserver.observe(body)

        mutationObserver = new MutationObserver(scheduleMeasure)
        mutationObserver.observe(root, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        })

        interval = window.setInterval(scheduleMeasure, 1200)
      } catch {
        // Cross-origin; best-effort fallback only.
      }
    }

    const onLoad = () => {
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
  }, [minHeight])

  return iframeRef
}

