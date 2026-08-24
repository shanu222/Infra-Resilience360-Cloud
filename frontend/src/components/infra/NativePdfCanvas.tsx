import { useEffect, useRef, useState } from 'react'
import { loadPdfJs } from '../../utils/pdfJsCdn'

type NativePdfCanvasProps = {
  src: string
  className?: string
  onLoaded?: () => void
  onError?: () => void
  onFullscreen?: () => void
}

/**
 * Renders every page of a model board into stacked canvases.
 *
 * Pages are appended as they finish rather than in one batch at the end, so the
 * first page shows up almost immediately instead of after the whole document has
 * been rasterised.
 */
export function NativePdfCanvas({ src, className, onLoaded, onError, onFullscreen }: NativePdfCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [isRendering, setIsRendering] = useState(true)
  const [renderError, setRenderError] = useState(false)

  // Callers pass inline arrow functions, so depending on them directly would
  // give the effect a new identity on every parent render and re-download plus
  // re-rasterise the whole document each time.
  const onLoadedRef = useRef(onLoaded)
  const onErrorRef = useRef(onError)
  onLoadedRef.current = onLoaded
  onErrorRef.current = onError

  useEffect(() => {
    const host = hostRef.current
    if (!host || !src) return

    let cancelled = false
    let doc: { numPages: number; getPage: (n: number) => Promise<unknown>; destroy: () => Promise<void> } | null = null

    host.replaceChildren()
    setIsRendering(true)
    setRenderError(false)

    const render = async () => {
      try {
        const pdfjs = await loadPdfJs()
        if (cancelled) return

        const task = pdfjs.getDocument({ url: src, withCredentials: false })
        doc = (await task.promise) as typeof doc
        if (cancelled || !doc) return

        const containerWidth = Math.max(host.clientWidth || 320, 280)
        // Cap the pixel ratio: matching a 3x screen exactly triples decode time
        // and memory for a barely visible gain on a board-style diagram.
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

        for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
          const page = (await doc.getPage(pageNumber)) as {
            getViewport: (o: { scale: number }) => { width: number; height: number }
            render: (o: unknown) => { promise: Promise<void> }
          }
          if (cancelled) return

          const baseViewport = page.getViewport({ scale: 1 })
          const cssScale = containerWidth / baseViewport.width
          const viewport = page.getViewport({ scale: cssScale * pixelRatio })

          const canvas = document.createElement('canvas')
          canvas.className = 'infra-model-pdf-page-canvas'
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          // The backing store is oversampled; keep the layout box at CSS size.
          canvas.style.width = '100%'
          canvas.style.height = 'auto'

          const context = canvas.getContext('2d')
          if (!context) continue

          await page.render({ canvasContext: context, viewport, canvas }).promise
          if (cancelled) return

          host.appendChild(canvas)

          // Reveal the viewer as soon as there is something to look at.
          if (pageNumber === 1) {
            setIsRendering(false)
            onLoadedRef.current?.()
          }
        }
      } catch {
        if (!cancelled) {
          setRenderError(true)
          setIsRendering(false)
          onErrorRef.current?.()
        }
      }
    }

    void render()

    return () => {
      cancelled = true
      const pending = doc
      doc = null
      if (pending) void pending.destroy().catch(() => {})
    }
  }, [src])

  if (renderError) {
    return (
      <div className="infra-model-media-placeholder" role="status" aria-live="polite">
        Model Board not available.
      </div>
    )
  }

  return (
    <div className={`infra-model-pdf-canvas-host ${className ?? ''}`.trim()}>
      {onFullscreen ?
        <div className="infra-model-pdf-toolbar">
          <button type="button" className="infra-model-pdf-fullscreen-btn" onClick={onFullscreen}>
            Full Screen
          </button>
        </div>
      : null}
      {isRendering ?
        <div className="infra-model-media-skeleton infra-model-pdf-skeleton is-compact" role="status" aria-live="polite">
          Loading model board…
        </div>
      : null}
      <div ref={hostRef} className="infra-model-pdf-canvas-pages" aria-label="Resilience Model Board PDF" />
    </div>
  )
}
