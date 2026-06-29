import { useEffect, useRef } from 'react'

const DEFAULT_MIN_HEIGHT = 720

type IframeAutoHeightOptions = {
  observeResize?: boolean
  observeMutations?: boolean
  pollIntervalMs?: number
  maxHeightPx?: number
}

function measureDocumentHeight(doc: Document): number {
  const body = doc.body
  const root = doc.documentElement
  let measured = Math.max(
    body?.scrollHeight ?? 0,
    body?.offsetHeight ?? 0,
    root?.scrollHeight ?? 0,
    root?.offsetHeight ?? 0,
  )

  const appRoot =
    doc.getElementById('root') ?? doc.querySelector('main') ?? (body?.firstElementChild as HTMLElement | null)
  if (appRoot instanceof HTMLElement) {
    measured = Math.max(measured, appRoot.scrollHeight, appRoot.offsetHeight)
  }

  return measured
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
    const observeResize = options.observeResize !== false
    const observeMutations = options.observeMutations !== false
    const pollIntervalMs = options.pollIntervalMs ?? 2500
    const maxHeightPx = options.maxHeightPx && options.maxHeightPx > 0 ? options.maxHeightPx : Number.POSITIVE_INFINITY

    const applyHeight = (): boolean => {
      const node = iframeRef.current
      if (!node) return false
      try {
        const doc = node.contentDocument
        if (!doc) return false
        const measured = measureDocumentHeight(doc)
        const next = Math.min(maxHeightPx, Math.max(minHeight, measured))
        const prev = Number.parseInt(node.style.height || '0', 10) || 0
        if (!Number.isFinite(next) || next <= 0 || Math.abs(prev - next) < 2) {
          return false
        }
        node.style.height = `${next}px`
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
          resizeObserver.observe(root)
          resizeObserver.observe(body)
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
          }, pollIntervalMs)
        }
      } catch {
        // Cross-origin; best-effort fallback only.
      }
    }

    const onLoad = () => {
      scheduleMeasure()
      attachObservers()
      window.setTimeout(scheduleMeasure, 160)
      window.setTimeout(scheduleMeasure, 700)
      window.setTimeout(scheduleMeasure, 1800)
    }

    iframe.style.minHeight = `${minHeight}px`
    iframe.setAttribute('scrolling', 'auto')
    iframe.addEventListener('load', onLoad)
    onLoad()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      if (interval !== null) window.clearInterval(interval)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
      iframe.removeEventListener('load', onLoad)
    }
  }, [minHeight, options.maxHeightPx, options.observeMutations, options.observeResize, options.pollIntervalMs])

  return iframeRef
}

