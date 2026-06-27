import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, GraduationCap, Images, X } from 'lucide-react'
import { MATERIAL_HUB_GUIDANCE_COUNT, MATERIAL_HUB_GUIDANCE_ITEMS } from '@/config/materialHubGuidance'
import { mockHubs } from '@/config/materialHubCatalog'
import { MaterialHubMediaImage, MaterialHubMediaVideo } from '../../components/MaterialHubMedia'

import { useMaterialHubStrings } from '@/hooks/useMaterialHubStrings'

export function TrainingPortal() {
  const s = useMaterialHubStrings()
  const guidanceItems = MATERIAL_HUB_GUIDANCE_ITEMS
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchEndX, setTouchEndX] = useState<number | null>(null)

  const activeItem = guidanceItems[activeIndex]

  const openLightbox = (index: number) => {
    setActiveIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => setLightboxOpen(false)

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % guidanceItems.length)
  }

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + guidanceItems.length) % guidanceItems.length)
  }

  useEffect(() => {
    if (!lightboxOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLightbox()
      if (event.key === 'ArrowRight') goNext()
      if (event.key === 'ArrowLeft') goPrev()
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [lightboxOpen, guidanceItems.length])

  useEffect(() => {
    if (!lightboxOpen || !activeItem) return

    const neighbors = [
      guidanceItems[activeIndex]?.media.preview,
      guidanceItems[(activeIndex - 1 + guidanceItems.length) % guidanceItems.length]?.media.preview,
      guidanceItems[(activeIndex + 1) % guidanceItems.length]?.media.preview,
    ]

    neighbors.forEach((src) => {
      if (!src) return
      const img = new Image()
      img.src = src
    })
  }, [activeIndex, lightboxOpen, activeItem, guidanceItems])

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.changedTouches[0]?.clientX ?? null)
    setTouchEndX(null)
  }

  const onTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchEndX(event.changedTouches[0]?.clientX ?? null)
  }

  const onTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return
    const swipeDistance = touchStartX - touchEndX
    if (swipeDistance > 45) goNext()
    else if (swipeDistance < -45) goPrev()
  }

  const lightboxPreview = useMemo(
    () => activeItem?.media.preview ?? activeItem?.media.image,
    [activeItem],
  )

  const lightboxPortal =
    lightboxOpen && activeItem && typeof document !== 'undefined' ?
      createPortal(
        <div
          className="r360-fullscreen-overlay mh-guidance-lightbox fixed inset-0 z-[10000]"
          onClick={closeLightbox}
          aria-modal="true"
          role="dialog"
          aria-label={`${activeItem.title} — guidance gallery`}
        >
          <div className="mh-guidance-lightbox__frame" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={closeLightbox}
              className="mh-guidance-lightbox__nav mh-guidance-lightbox__close"
              aria-label="Close gallery"
            >
              <X className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={goPrev}
              className="mh-guidance-lightbox__nav mh-guidance-lightbox__nav--prev"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>

            <button
              type="button"
              onClick={goNext}
              className="mh-guidance-lightbox__nav mh-guidance-lightbox__nav--next"
              aria-label="Next image"
            >
              <ChevronRight className="h-7 w-7" />
            </button>

            <div
              className="mh-guidance-lightbox__stage"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {activeItem.media.video ?
                <MaterialHubMediaVideo
                  src={activeItem.media.video}
                  poster={lightboxPreview}
                  className="max-h-full w-full rounded-lg object-contain"
                  wrapperClassName="max-h-full w-full min-h-[160px]"
                />
              : <MaterialHubMediaImage
                  src={lightboxPreview}
                  alt={activeItem.title}
                  className="max-h-full w-full rounded-lg object-contain"
                  wrapperClassName="max-h-full w-full min-h-[160px]"
                  loading="eager"
                />
              }
            </div>

            <div className="mh-guidance-lightbox__caption">
              <h3 className="mb-1 text-base font-semibold text-white sm:text-lg">{activeItem.title}</h3>
              <p className="text-sm text-slate-200 sm:text-base">{activeItem.description}</p>
              <div className="mt-2 text-xs text-slate-400 sm:text-sm">
                {activeIndex + 1} / {guidanceItems.length}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mh-page-header-glass text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{s.trainTitle}</h1>
        <p className="text-xl">{s.trainSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="mh-stat-card mh-stat-card--green rounded-xl p-6">
          <GraduationCap className="h-10 w-10 mb-3 opacity-80" />
          <div className="mh-stat-number text-3xl mb-2">{mockHubs.length}</div>
          <div>{s.trainActiveHubs}</div>
        </div>

        <div className="mh-stat-card mh-stat-card--blue rounded-xl p-6">
          <Images className="h-10 w-10 mb-3 opacity-80" />
          <div className="mh-stat-number text-3xl mb-2">{MATERIAL_HUB_GUIDANCE_COUNT}</div>
          <div>{s.trainGuidanceImages}</div>
        </div>

        <div className="mh-stat-card mh-stat-card--purple rounded-xl p-6">
          <Images className="h-10 w-10 mb-3 opacity-80" />
          <div className="mh-stat-number text-3xl mb-2">{guidanceItems.filter((g) => g.media.video).length}</div>
          <div>{s.trainTotalViews}</div>
        </div>
      </div>

      <div className="mh-guidance-library rounded-2xl p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Images className="h-7 w-7 mr-3 text-emerald-400" />
          {s.trainGuidanceLibrary}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guidanceItems.map((item, idx) => {
            const previewSrc = item.media.preview ?? item.media.image
            const trainingThemes = [
              'mh-training-card--emerald',
              'mh-training-card--blue',
              'mh-training-card--amber',
              'mh-training-card--teal',
              'mh-training-card--slate',
            ] as const
            const themeClass = trainingThemes[idx % trainingThemes.length]

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openLightbox(idx)}
                className={`mh-training-card ${themeClass} group w-full min-w-0 max-w-full text-left p-4 transition-all duration-300 cursor-pointer hover:-translate-y-1`}
              >
                <div className="rounded-xl h-40 mb-4 overflow-hidden border border-white/15 bg-black/20">
                  <MaterialHubMediaImage
                    src={previewSrc}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    wrapperClassName="h-40 w-full"
                  />
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm line-clamp-2">{item.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {lightboxPortal}
    </div>
  )
}
