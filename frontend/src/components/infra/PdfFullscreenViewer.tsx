import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PDFDocumentProxy } from 'pdfjs-dist'

type PdfFullscreenViewerProps = {
  src: string
  title: string
  open: boolean
  onClose: () => void
}

export function PdfFullscreenViewer({ src, title, open, onClose }: PdfFullscreenViewerProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const scaleRef = useRef(1)
  const pinchRef = useRef<{ startDistance: number; startScale: number } | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    // Register Android back-button handler.
    ;(window as Window & { __R360_PDF_FULLSCREEN_CLOSE__?: () => void }).__R360_PDF_FULLSCREEN_CLOSE__ = onClose
    // Do NOT set document.body.style.overflow = 'hidden' here.
    // On Android WebView, overflow:hidden on body breaks position:fixed — the overlay
    // scrolls with the document instead of staying pinned to the viewport.
    // The overlay covers 100vw/100vh and has overflow:hidden itself, so body lock is unnecessary.
    return () => {
      delete (window as Window & { __R360_PDF_FULLSCREEN_CLOSE__?: () => void }).__R360_PDF_FULLSCREEN_CLOSE__
    }
  }, [open, onClose])

  useEffect(() => {
    const host = hostRef.current
    if (!open || !host || !src) return

    let cancelled = false
    host.replaceChildren()
    setIsLoading(true)
    scaleRef.current = 1
    if (stageRef.current) {
      stageRef.current.style.transform = 'scale(1)'
    }

    const render = async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString()

        const pdf = await pdfjs.getDocument({ url: src, withCredentials: false }).promise
        if (cancelled) {
          void pdf.destroy()
          return
        }
        pdfRef.current = pdf

        const fragment = document.createDocumentFragment()
        const containerWidth = Math.max(Math.min(window.innerWidth, document.documentElement.clientWidth) - 24, 280)

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
        if (!cancelled) setIsLoading(false)
      } catch {
        if (!cancelled) setIsLoading(false)
      }
    }

    void render()
    return () => {
      cancelled = true
      const pdf = pdfRef.current
      pdfRef.current = null
      if (pdf) void pdf.destroy()
      host.replaceChildren()
    }
  }, [open, src])

  useEffect(() => {
    const stage = stageRef.current
    if (!open || !stage) return

    const applyScale = (next: number) => {
      const clamped = Math.max(1, Math.min(next, 4))
      scaleRef.current = clamped
      stage.style.transform = `scale(${clamped})`
    }

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return
      const [a, b] = [event.touches[0], event.touches[1]]
      const dx = a.clientX - b.clientX
      const dy = a.clientY - b.clientY
      pinchRef.current = {
        startDistance: Math.hypot(dx, dy),
        startScale: scaleRef.current,
      }
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!pinchRef.current || event.touches.length !== 2) return
      event.preventDefault()
      const [a, b] = [event.touches[0], event.touches[1]]
      const dx = a.clientX - b.clientX
      const dy = a.clientY - b.clientY
      const distance = Math.hypot(dx, dy)
      const ratio = distance / pinchRef.current.startDistance
      applyScale(pinchRef.current.startScale * ratio)
    }

    const onTouchEnd = () => {
      pinchRef.current = null
    }

    stage.addEventListener('touchstart', onTouchStart, { passive: true })
    stage.addEventListener('touchmove', onTouchMove, { passive: false })
    stage.addEventListener('touchend', onTouchEnd)
    stage.addEventListener('touchcancel', onTouchEnd)
    return () => {
      stage.removeEventListener('touchstart', onTouchStart)
      stage.removeEventListener('touchmove', onTouchMove)
      stage.removeEventListener('touchend', onTouchEnd)
      stage.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="infra-pdf-fullscreen-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="infra-pdf-fullscreen-toolbar">
        <p className="infra-pdf-fullscreen-title">{title}</p>
        <button type="button" className="infra-pdf-fullscreen-close" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="infra-pdf-fullscreen-scroll">
        {isLoading ?
          <div className="infra-model-media-skeleton infra-model-pdf-skeleton" role="status" aria-live="polite">
            Loading model board…
          </div>
        : null}
        <div ref={stageRef} className="infra-pdf-fullscreen-stage">
          <div ref={hostRef} className="infra-model-pdf-canvas-pages infra-pdf-fullscreen-pages" />
        </div>
      </div>
    </div>,
    document.body,
  )
}
