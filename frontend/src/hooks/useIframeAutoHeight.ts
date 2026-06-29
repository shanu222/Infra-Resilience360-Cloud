import { useEffect, useRef } from 'react'

type IframeAutoHeightOptions = {
  observeResize?: boolean
  observeMutations?: boolean
  pollIntervalMs?: number
  maxHeightPx?: number
}

const HEIGHT_NEUTRALIZER_ID = 'r360-iframe-height-neutralizer'

function isInflatedHeightNode(element: HTMLElement): boolean {
  const view = element.ownerDocument.defaultView
  const style = view?.getComputedStyle(element)
  if (!style) return false

  const minHeight = style.minHeight
  const height = style.height

  if (minHeight.includes('vh') && Number.parseFloat(minHeight) > 0) return true
  if (height.includes('vh') && Number.parseFloat(height) > 0) return true

  if (minHeight.endsWith('%') && Number.parseFloat(minHeight) >= 100) return true
  if (height === '100%' || (height.endsWith('%') && Number.parseFloat(height) >= 100)) return true

  return false
}

function shouldSkipMeasurementNode(element: HTMLElement): boolean {
  const tag = element.tagName
  if (tag === 'IFRAME' || tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return true

  const style = element.ownerDocument.defaultView?.getComputedStyle(element)
  if (!style) return true
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return true
  if (style.position === 'fixed' || style.position === 'sticky') return true

  return false
}

function measureDeepestContentBottom(doc: Document): number {
  const body = doc.body
  if (!body) return 0

  const bodyTop = body.getBoundingClientRect().top
  let maxBottom = 0

  const measureElement = (element: Element) => {
    if (!(element instanceof HTMLElement)) return

    const inflated = isInflatedHeightNode(element)
    if (!shouldSkipMeasurementNode(element) && !inflated) {
      const rect = element.getBoundingClientRect()
      if (rect.height > 0 && rect.width > 0) {
        const bottom = rect.bottom - bodyTop + body.scrollTop
        if (bottom > maxBottom) maxBottom = bottom
      }
    }

    for (const child of element.children) {
      measureElement(child)
    }
  }

  measureElement(body)
  return maxBottom
}

function measureContainerScrollHeight(element: HTMLElement | null): number {
  if (!element || isInflatedHeightNode(element)) return 0
  const scrollHeight = element.scrollHeight
  const offsetHeight = element.offsetHeight
  if (scrollHeight <= 0 && offsetHeight <= 0) return 0
  return Math.max(scrollHeight, offsetHeight)
}

function measureDocumentHeight(doc: Document): number {
  const root = doc.documentElement
  const body = doc.body
  const appRoot = doc.getElementById('root')
  const main = doc.querySelector('main')

  const contentBottom = measureDeepestContentBottom(doc)

  const scrollCandidates = [
    measureContainerScrollHeight(root),
    measureContainerScrollHeight(body),
    measureContainerScrollHeight(appRoot),
    main instanceof HTMLElement ? measureContainerScrollHeight(main) : 0,
  ].filter((value) => value > 0)

  const contentAlignedScroll = scrollCandidates.filter(
    (value) => contentBottom <= 0 || value <= contentBottom + 8,
  )

  const measured = Math.max(contentBottom, ...(contentAlignedScroll.length > 0 ? contentAlignedScroll : scrollCandidates))

  if (measured > 0) return Math.ceil(measured)
  if (contentBottom > 0) return Math.ceil(contentBottom)

  const fallback = scrollCandidates.length > 0 ? Math.min(...scrollCandidates) : 0
  return Math.ceil(fallback)
}

function injectHeightNeutralizer(doc: Document): void {
  if (doc.getElementById(HEIGHT_NEUTRALIZER_ID)) return
  const style = doc.createElement('style')
  style.id = HEIGHT_NEUTRALIZER_ID
  style.textContent = `
    html, body, #root, main {
      min-height: 0 !important;
      height: auto !important;
    }
    .min-h-screen, .min-h-full, .h-screen, .h-full {
      min-height: auto !important;
      height: auto !important;
    }
  `
  doc.head?.appendChild(style)
}

function patchHistoryForRemeasure(win: Window, scheduleMeasure: () => void): () => void {
  const historyRef = win.history
  if (!historyRef) return () => {}

  const originalPushState = historyRef.pushState.bind(historyRef)
  const originalReplaceState = historyRef.replaceState.bind(historyRef)

  historyRef.pushState = (...args) => {
    originalPushState(...args)
    scheduleMeasure()
  }
  historyRef.replaceState = (...args) => {
    originalReplaceState(...args)
    scheduleMeasure()
  }

  return () => {
    historyRef.pushState = originalPushState
    historyRef.replaceState = originalReplaceState
  }
}

export function useIframeAutoHeight(_minHeight = 0, options: IframeAutoHeightOptions = {}) {
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
      try {
        const doc = node.contentDocument
        if (!doc?.body) return false

        injectHeightNeutralizer(doc)

        const savedWindowScrollY = window.scrollY
        const mainScrollEl = document.querySelector<HTMLElement>('.app-shell > main')
        const savedMainScrollTop = mainScrollEl?.scrollTop ?? 0

        const measured = measureDocumentHeight(doc)
        const next = Math.min(maxHeightPx, Math.max(0, measured))
        if (!Number.isFinite(next) || next <= 0) {
          return false
        }

        if (Math.abs(lastAppliedHeight - next) < 1) {
          return false
        }

        node.style.height = `${next}px`
        node.style.minHeight = '0px'
        node.setAttribute('scrolling', 'no')
        lastAppliedHeight = next

        requestAnimationFrame(() => {
          window.scrollTo(0, savedWindowScrollY)
          if (mainScrollEl) mainScrollEl.scrollTop = savedMainScrollTop
        })

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
          resizeObserver.observe(root)
          resizeObserver.observe(body)
          const appRoot = doc.getElementById('root')
          if (appRoot) resizeObserver.observe(appRoot)
          const main = doc.querySelector('main')
          if (main) resizeObserver.observe(main)
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
