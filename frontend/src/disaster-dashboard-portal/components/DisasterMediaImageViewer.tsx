import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Minus, Plus, RotateCcw, X, ZoomIn } from 'lucide-react'
import { useMediaCandidates } from '../hooks/useMediaCandidates'
import { isVideoLikeMediaUrl } from '../utils/mediaType'

type DisasterMediaImageViewerProps = {
  candidates: string[]
  alt: string
}

export const DisasterMediaImageViewer = memo(function DisasterMediaImageViewer({
  candidates,
  alt,
}: DisasterMediaImageViewerProps) {
  const { src, loaded, failed, onLoad, onError } = useMediaCandidates(candidates, { cacheAsImage: false })
  const isVideo = isVideoLikeMediaUrl(src)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalFailed, setModalFailed] = useState(false)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null)
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; panX: number; panY: number } | null>(
    null,
  )
  const viewportRef = useRef<HTMLDivElement>(null)

  const resetTransform = useCallback(() => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    if (!modalOpen) return
    resetTransform()
    setModalFailed(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)

    const viewport = viewportRef.current
    const clampScale = (next: number) => Math.min(4, Math.max(1, next))
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY < 0 ? 0.15 : -0.15
      setScale((s) => clampScale(s + delta))
    }
    viewport?.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      viewport?.removeEventListener('wheel', onWheel)
    }
  }, [modalOpen, resetTransform])

  const clampScale = (next: number) => Math.min(4, Math.max(1, next))

  const touchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.hypot(dx, dy)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchRef.current = { dist: touchDistance(e.touches), scale }
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dist = touchDistance(e.touches)
      if (dist > 0) {
        const ratio = dist / pinchRef.current.dist
        setScale(clampScale(pinchRef.current.scale * ratio))
      }
    }
  }

  const onTouchEnd = () => {
    pinchRef.current = null
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1 || e.pointerType === 'touch') return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current?.active) return
    setPan({
      x: dragRef.current.panX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.panY + (e.clientY - dragRef.current.startY),
    })
  }

  const onPointerUp = () => {
    if (dragRef.current) dragRef.current.active = false
  }

  if (failed) return null

  return (
    <>
      <button
        type="button"
        className="dd-media-image-thumb"
        onClick={() => loaded && !isVideo && setModalOpen(true)}
        aria-label={isVideo ? `Play guidance media: ${alt}` : `View fullscreen image: ${alt}`}
        disabled={!loaded}
      >
        {!loaded ? <span className="dd-skeleton dd-skeleton--image dd-skeleton--fill" aria-hidden /> : null}
        {src && isVideo ?
          <video
            src={src}
            className={`dd-media-image-thumb__img${loaded ? ' is-loaded' : ''}`}
            muted
            autoPlay
            loop
            playsInline
            preload="metadata"
            onLoadedData={onLoad}
            onError={onError}
          />
        : null}
        {src && !isVideo ? (
          <img
            src={src}
            alt={alt}
            className={`dd-media-image-thumb__img${loaded ? ' is-loaded' : ''}`}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onLoad={onLoad}
            onError={onError}
          />
        ) : null}
        {loaded && !isVideo ? (
          <span className="dd-media-image-thumb__hint">
            <ZoomIn className="w-4 h-4" aria-hidden />
            Tap to enlarge
          </span>
        ) : null}
      </button>

      {modalOpen && src && loaded &&
        createPortal(
          <div
            className="dd-media-lightbox r360-fullscreen-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`${alt} — fullscreen`}
            onClick={() => setModalOpen(false)}
          >
            <div className="dd-media-lightbox__panel r360-fullscreen-overlay__panel" onClick={(e) => e.stopPropagation()}>
              <div className="dd-media-lightbox__toolbar">
                <span className="dd-media-lightbox__title r360-fullscreen-overlay__title">{alt}</span>
                <div className="dd-media-lightbox__tools">
                  <button type="button" className="dd-media-lightbox__tool" onClick={() => setScale((s) => clampScale(s - 0.25))} aria-label="Zoom out">
                    <Minus className="w-5 h-5" />
                  </button>
                  <button type="button" className="dd-media-lightbox__tool" onClick={() => setScale((s) => clampScale(s + 0.25))} aria-label="Zoom in">
                    <Plus className="w-5 h-5" />
                  </button>
                  <button type="button" className="dd-media-lightbox__tool" onClick={resetTransform} aria-label="Reset zoom and pan">
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button type="button" className="dd-media-lightbox__tool dd-media-lightbox__close" onClick={() => setModalOpen(false)} aria-label="Close">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div
                ref={viewportRef}
                className="dd-media-lightbox__viewport"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{ touchAction: 'none' }}
              >
                {modalFailed ? (
                  <div className="dd-media-fallback dd-media-fallback--on-dark">Image unavailable</div>
                ) : (
                  <img
                    src={src}
                    alt={alt}
                    className="dd-media-lightbox__img"
                    draggable={false}
                    decoding="async"
                    style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
                    onError={() => setModalFailed(true)}
                  />
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
})
