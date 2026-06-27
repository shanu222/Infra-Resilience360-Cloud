import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { AppLocaleStrings } from '../../i18n/appLocale'
import type { Language, SectionKey } from '../../types/sectionKeys'
import type { HomepageFooterConfig } from '../../types/homepageConfig'
import type { HomeCardRow } from '../../utils/homepagePresentation'
import { HomeBottomStrip } from './HomeBottomStrip'
import { HomeCardTile } from './HomeCardTile'
import { getSpotlightMediaCandidatesForSection } from './spotlightMedia'

const SWIPE_PX = 56
const spotlightPreloadCache = new Set<string>()

export type HomePageCarouselBodyProps = {
  t: AppLocaleStrings
  homeCardRows: HomeCardRow[]
  navigateToSection: (key: SectionKey | null) => void
  language?: Language
  footerCms?: HomepageFooterConfig
  editMode?: boolean
  onAdminCardClick?: (key: SectionKey, row: HomeCardRow, anchor: HTMLElement) => void
  onAdminFooterClick?: () => void
  showSettingsButton?: boolean
}

export function HomePageCarouselBody({
  t,
  homeCardRows,
  navigateToSection,
  language = 'en',
  footerCms,
  editMode,
  onAdminCardClick,
  onAdminFooterClick,
  showSettingsButton,
}: HomePageCarouselBodyProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragDx, setDragDx] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const draggingRef = useRef(false)
  const didDragRef = useRef(false)
  const startXRef = useRef(0)
  const dragDxRef = useRef(0)
  const suppressSwipeReleaseClickRef = useRef(false)
  const clearSuppressTimerRef = useRef<number | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  const n = homeCardRows.length
  const clampedIndex = n === 0 ? 0 : Math.min(activeIndex, n - 1)
  const activeRow = n === 0 ? null : homeCardRows[clampedIndex]

  useEffect(() => {
    if (activeIndex >= n && n > 0) setActiveIndex(n - 1)
  }, [activeIndex, n])

  useEffect(() => {
    if (n === 0) return
    const targets = [clampedIndex, clampedIndex - 1, clampedIndex + 1].filter((idx) => idx >= 0 && idx < n)
    for (const idx of targets) {
      const row = homeCardRows[idx]
      if (!row) continue
      const media = getSpotlightMediaCandidatesForSection(row.key)
      for (const url of [...media.videos.slice(0, 1), ...media.images.slice(0, 2)]) {
        if (!url || spotlightPreloadCache.has(url)) continue
        spotlightPreloadCache.add(url)
        if (/\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url)) {
          const video = document.createElement('video')
          video.preload = 'metadata'
          video.muted = true
          video.src = url
          video.load()
        } else {
          const image = new Image()
          image.decoding = 'async'
          image.src = url
        }
      }
    }
  }, [clampedIndex, homeCardRows, n])

  const go = useCallback(
    (delta: number) => {
      if (n <= 1 || editMode) return
      setActiveIndex((i) => {
        const next = i + delta
        return Math.max(0, Math.min(n - 1, next))
      })
    },
    [editMode, n],
  )

  const endDrag = useCallback(() => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setIsDragging(false)
    const dx = dragDxRef.current
    dragDxRef.current = 0
    setDragDx(0)
    if (didDragRef.current && Math.abs(dx) >= SWIPE_PX) {
      suppressSwipeReleaseClickRef.current = true
      if (clearSuppressTimerRef.current != null) window.clearTimeout(clearSuppressTimerRef.current)
      clearSuppressTimerRef.current = window.setTimeout(() => {
        suppressSwipeReleaseClickRef.current = false
        clearSuppressTimerRef.current = null
      }, 0)
      if (dx < 0) go(1)
      else go(-1)
    }
    didDragRef.current = false
  }, [go])

  useEffect(
    () => () => {
      if (clearSuppressTimerRef.current != null) window.clearTimeout(clearSuppressTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    if (editMode || n === 0) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      }
    }
    const el = viewportRef.current
    el?.addEventListener('keydown', onKey)
    return () => el?.removeEventListener('keydown', onKey)
  }, [editMode, go, n])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (editMode || n <= 1) return
    draggingRef.current = true
    didDragRef.current = false
    setIsDragging(false)
    startXRef.current = e.clientX
    dragDxRef.current = 0
    setDragDx(0)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || editMode) return
    const dx = e.clientX - startXRef.current
    if (!didDragRef.current && Math.abs(dx) < 10) return
    didDragRef.current = true
    if (!isDragging) setIsDragging(true)
    dragDxRef.current = dx
    setDragDx(dx)
  }

  const onPointerUp = () => {
    endDrag()
  }

  const onCardClickCapture = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null
    if (target?.closest('.home-card-spotlight-cta-btn')) return
    if (suppressSwipeReleaseClickRef.current) {
      e.preventDefault()
      e.stopPropagation()
      suppressSwipeReleaseClickRef.current = false
    }
  }

  const slideStyle: CSSProperties = {
    transform: `translateX(${dragDx}px)`,
    transition: isDragging ? 'none' : 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
  }

  return (
    <>
      <section
        className="home-carousel"
        aria-roledescription="carousel"
        aria-label={t.homeCarouselAria}
      >
        <div className="home-carousel-stage">
          <button
            type="button"
            className="home-carousel-arrow home-carousel-arrow--prev"
            aria-label={t.homeCarouselPrev}
            disabled={editMode || clampedIndex <= 0}
            onClick={() => go(-1)}
          >
            ‹
          </button>

          <div
            ref={viewportRef}
            className="home-carousel-viewport"
            tabIndex={0}
            role="group"
            aria-live="polite"
            aria-label={t.homeCarouselViewportAria}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={() => {
              if (draggingRef.current) endDrag()
            }}
            onClickCapture={onCardClickCapture}
          >
            {activeRow ?
              <div className="home-carousel-slide-clip">
                <div key={clampedIndex} className="home-carousel-slide" style={slideStyle}>
                  <HomeCardTile
                    row={activeRow}
                    cardIndex={clampedIndex}
                    t={t}
                    language={language}
                    navigateToSection={navigateToSection}
                    editMode={editMode}
                    onAdminCardClick={onAdminCardClick}
                    variant="spotlight"
                    exploreLabel={t.homeCarouselExplore}
                    mediaPriority="eager"
                  />
                </div>
              </div>
            : null}
          </div>

          <button
            type="button"
            className="home-carousel-arrow home-carousel-arrow--next"
            aria-label={t.homeCarouselNext}
            disabled={editMode || clampedIndex >= n - 1}
            onClick={() => go(1)}
          >
            ›
          </button>
        </div>

        {n > 1 ?
          <div className="home-carousel-dots" role="tablist" aria-label={t.homeCarouselDotsAria}>
            {homeCardRows.map((row, i) => (
              <button
                key={row.cardId || row.key}
                type="button"
                role="tab"
                aria-selected={i === clampedIndex}
                className={`home-carousel-dot ${i === clampedIndex ? 'is-active' : ''}`}
                onClick={() => !editMode && setActiveIndex(i)}
                disabled={editMode}
              />
            ))}
          </div>
        : null}
      </section>

      <HomeBottomStrip
        t={t}
        language={language}
        footerCms={footerCms}
        editMode={editMode}
        onAdminFooterClick={onAdminFooterClick}
        navigateToSection={navigateToSection}
        showSettingsButton={showSettingsButton}
      />
    </>
  )
}
