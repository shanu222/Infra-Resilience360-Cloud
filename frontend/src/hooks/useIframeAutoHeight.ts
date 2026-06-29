import { useEffect, useRef } from 'react'

const DEFAULT_MIN_HEIGHT = 720

type IframeAutoHeightOptions = {
  observeResize?: boolean
  observeMutations?: boolean
  pollIntervalMs?: number
  maxHeightPx?: number
}

function isInflatedHeightNode(element: HTMLElement): boolean {
  const style = element.ownerDocument.defaultView?.getComputedStyle(element)
  if (!style) return false
  const minHeight = style.minHeight
  if (minHeight.endsWith('vh') && Number.parseFloat(minHeight) >= 90) {
    const hasMeaningfulChildren = Array.from(element.children).some((child) => {
      if (!(child instanceof HTMLElement)) return false
      const childStyle = element.ownerDocument.defaultView?.getComputedStyle(child)
      if (childStyle?.position === 'fixed' || childStyle?.position === 'absolute') return false
      return child.getBoundingClientRect().height > 24
    })
    return !hasMeaningfulChildren
  }
  return false
}

function measureDocumentHeight(doc: Document): number {
  const body = doc.body
  const root = doc.documentElement
  if (!body) {
    return Math.max(root?.scrollHeight ?? 0, root?.offsetHeight ?? 0)
  }

  let maxBottom = 0
  const bodyTop = body.getBoundingClientRect().top

  const measureElement = (element: Element) => {
    if (!(element instanceof HTMLElement)) return
    if (element.tagName === 'IFRAME' || element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return
    if (isInflatedHeightNode(element)) return

    const style = doc.defaultView?.getComputedStyle(element)
    if (style?.display === 'none' || style?.visibility === 'hidden') return
    if (style?.position === 'fixed' || style?.position === 'sticky') return

    const rect = element.getBoundingClientRect()
    if (rect.height <= 0 || rect.width <= 0) return

    const bottom = rect.bottom - bodyTop + body.scrollTop
    if (bottom > maxBottom) maxBottom = bottom

    for (const child of element.children) {
      measureElement(child)
    }
  }

  measureElement(body)

  const fallback = Math.max(
    body.scrollHeight,
    body.offsetHeight,
    root?.scrollHeight ?? 0,
    root?.offsetHeight ?? 0,
  )

  const appRoot =
    doc.getElementById('root') ?? doc.querySelector('main') ?? (body.firstElementChild as HTMLElement | null)
  const appRootHeight =
    appRoot instanceof HTMLElement && !isInflatedHeightNode(appRoot)
      ? appRoot.getBoundingClientRect().bottom - bodyTop + body.scrollTop
      : 0

  const measured = Math.ceil(Math.max(maxBottom, appRootHeight))
  if (measured > 0) return measured
  return fallback
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
        const next =
          minHeight > 0
            ? Math.min(maxHeightPx, Math.max(minHeight, measured))
            : Math.min(maxHeightPx, measured)
        const prev = Number.parseInt(node.style.height || '0', 10) || 0
        if (!Number.isFinite(next) || next <= 0 || Math.abs(prev - next) < 2) {
          return false
        }
        node.style.height = `${next}px`
        node.style.minHeight = minHeight > 0 ? `${minHeight}px` : '0px'
        return true
      } catch {
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
          const appRoot = doc.getElementById('root')
          if (appRoot) resizeObserver.observe(appRoot)
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
        /* cross-origin */
      }
    }

    const onLoad = () => {
      scheduleMeasure()
      attachObservers()
      window.setTimeout(scheduleMeasure, 160)
      window.setTimeout(scheduleMeasure, 700)
      window.setTimeout(scheduleMeasure, 1800)
    }

    iframe.style.minHeight = minHeight > 0 ? `${minHeight}px` : '0px'
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
