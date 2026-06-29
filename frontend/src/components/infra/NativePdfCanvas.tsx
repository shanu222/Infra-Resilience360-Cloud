import { useEffect, useRef, useState } from 'react'

type NativePdfCanvasProps = {
  src: string
  className?: string
  onLoaded?: () => void
  onError?: () => void
  onFullscreen?: () => void
}

export function NativePdfCanvas({ src, className, onLoaded, onError, onFullscreen }: NativePdfCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [isRendering, setIsRendering] = useState(true)
  const [renderError, setRenderError] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host || !src) return

    let cancelled = false
    host.replaceChildren()
    setIsRendering(true)
    setRenderError(false)

    const render = async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString()

        const loadingTask = pdfjs.getDocument({ url: src, withCredentials: false })
        const pdf = await loadingTask.promise
        if (cancelled) return

        const fragment = document.createDocumentFragment()
        const containerWidth = Math.max(host.clientWidth || 320, 280)

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber)
          if (cancelled) return

          const viewport = page.getViewport({ scale: 1 })
          const scale = containerWidth / viewport.width
          const scaledViewport = page.getViewport({ scale })

          const canvas = document.createElement('canvas')
          canvas.className = 'infra-model-pdf-page-canvas'
          canvas.width = Math.floor(scaledViewport.width)
          canvas.height = Math.floor(scaledViewport.height)

          const context = canvas.getContext('2d')
          if (!context) continue

          await page.render({ canvasContext: context, viewport: scaledViewport, canvas }).promise
          if (cancelled) return
          fragment.appendChild(canvas)
        }

        host.appendChild(fragment)
        if (!cancelled) {
          setIsRendering(false)
          onLoaded?.()
        }
      } catch {
        if (!cancelled) {
          setRenderError(true)
          setIsRendering(false)
          onError?.()
        }
      }
    }

    void render()

    return () => {
      cancelled = true
    }
  }, [src, onLoaded, onError])

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
