import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import type { UniversalElementPayload } from '../../types/universalElement'
import type { AppLocaleStrings } from '../../i18n/appLocale'
import type { Language, SectionKey } from '../../types/sectionKeys'
import { homeCardMeta } from '../../constants/homepageGrid'
import type { HomeCardRow } from '../../utils/homepagePresentation'
import { migrateToBilingual, resolveBilingualPreferStaticForActiveLang } from '../../utils/bilingualText'
import { hexToRgba } from '../../utils/colorMix'
import { mergeCms } from '../../utils/mergeCms'
import { resolveSectionMediaUrl } from '../../utils/sectionMediaUrl'
import { getCmsElement } from '../../utils/getCmsElement'
import { usePageConfigElementsContext } from '../../context/PageConfigElementsContext'
import { localContentUrl } from '../../config/localContent'


function cardCmsId(key: SectionKey) {
  return `card.${key}` as const
}

export type HomeCardVariant = 'grid' | 'spotlight'

export type HomeCardTileProps = {
  row: HomeCardRow
  cardIndex: number
  t: AppLocaleStrings
  language: Language
  navigateToSection: (key: SectionKey | null) => void
  editMode?: boolean
  onAdminCardClick?: (key: SectionKey, row: HomeCardRow, anchor: HTMLElement) => void
  variant?: HomeCardVariant
  exploreLabel?: string
  mediaPriority?: 'eager' | 'lazy'
}

const SPOTLIGHT_HOME_MEDIA_BASE = localContentUrl('home', 'images')

const SPOTLIGHT_HOME_MEDIA_FILES: Partial<Record<SectionKey, { images: string[]; videos?: string[] }>> = {
  retrofit: {
    images: ['retrofit module picture.png'],
    videos: ['Retrofit module video.mp4'],
  },
  infraModels: {
    images: ['Resilience infra model pic.png'],
    videos: ['Resilience infra models video.mp4'],
  },
  designToolkit: {
    images: ['Design toolkit pic.png'],
  },
  smartConstruction: {
    images: ['Smart construction pic.png'],
  },
  materialHubs: {
    images: ['Material hubs pic.png'],
  },
  pgbc: {
    images: ['Building Codes pic.png'],
  },
  bestPractices: {
    images: ['Best Practices.png'],
  },
  readiness: {
    images: ['Readiness calculator pic.png'],
  },
  learn: {
    images: ['Learn and train pic.png'],
  },
  riskMaps: {
    images: ['Live earthquake alerts.png'],
  },
  liveEarthquakeMap: {
    images: ['Live earthquake alerts.png'],
  },
  disasterDashboard: {
    images: ['disaster dashboard pic.png'],
  },
}

const toTitleCase = (value: string) =>
  value.replace(/\w\S*/g, (w) => `${w.charAt(0).toUpperCase()}${w.slice(1).toLowerCase()}`)

const fileNameVariants = (fileName: string): string[] => {
  const raw = String(fileName || '').trim()
  if (!raw) return []
  const extMatch = raw.match(/(\.[^.]+)$/)
  const ext = extMatch?.[1] ?? ''
  const nameOnly = ext ? raw.slice(0, -ext.length) : raw
  const candidates = [
    raw,
    `${nameOnly.toLowerCase()}${ext}`,
    `${toTitleCase(nameOnly)}${ext}`,
    `${nameOnly.replace(/\s+/g, '-')}${ext}`,
    `${nameOnly.replace(/\s+/g, '_')}${ext}`,
  ]
  return [...new Set(candidates.map((v) => v.trim()).filter(Boolean))]
}

const toS3ObjectUrls = (fileName: string): string[] => {
  const variants = fileNameVariants(fileName)
  if (variants.length === 0) return []
  const out: string[] = []
  for (const variant of variants) {
    const encoded = variant
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/')
    const direct = `${SPOTLIGHT_HOME_MEDIA_BASE}/${encoded}`
    if (direct && !out.includes(direct)) out.push(direct)
  }
  return out
}

const preloadCache = new Set<string>()

function preloadMedia(url: string): void {
  const normalized = String(url ?? '').trim()
  if (!normalized || preloadCache.has(normalized)) return
  preloadCache.add(normalized)
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(normalized)) {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.src = normalized
    video.load()
    return
  }
  const image = new Image()
  image.decoding = 'async'
  image.src = normalized
}

export function HomeCardTile({
  row,
  cardIndex,
  t,
  language,
  navigateToSection,
  editMode,
  onAdminCardClick,
  variant = 'grid',
  exploreLabel = 'Explore Now',
  mediaPriority = 'lazy',
}: HomeCardTileProps) {
  const ctx = usePageConfigElementsContext()
  const homepageElements = ctx?.elements ?? {}
  const isUrdu = language === 'ur'
  const key = row.key
  const cmsId = cardCmsId(key)
  const cms = getCmsElement(homepageElements, cmsId)

  const baseTitle = row.customTitle ?? ''
  const baseSubtitle = row.customSubtitle ?? ''
  const defaultData: UniversalElementPayload = {
    text: migrateToBilingual(baseTitle),
    placeholder: migrateToBilingual(baseSubtitle),
  }
  const merged = mergeCms(defaultData, cms)
  const homeFb = t.homeCards[key]
  const title = resolveBilingualPreferStaticForActiveLang(merged.text, language, homeFb?.title ?? '')
  const subtitle = resolveBilingualPreferStaticForActiveLang(merged.placeholder, language, homeFb?.subtitle ?? '')

  const cmsBgUrl = merged.media?.url || merged.media?.src
  const toneClass =
    row.customColor || row.customBgImage || cmsBgUrl ? '' : homeCardMeta[key].tone
  const tr = typeof row.transparency === 'number' ? row.transparency : 0.3
  const sizeClass =
    variant === 'spotlight' ?
      ''
    : row.cardSize === 'small' ? 'home-card--sm'
    : row.cardSize === 'large' ? 'home-card--lg'
    : ''
  let cardStyle: CSSProperties | undefined
  if (row.customColor && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(row.customColor.trim())) {
    cardStyle = { background: hexToRgba(row.customColor.trim(), tr) }
  } else if (row.customColor) {
    cardStyle = { background: row.customColor, opacity: tr < 1 ? tr : undefined }
  } else {
    cardStyle = undefined
  }
  if (row.customBackgroundGradient) {
    cardStyle = { ...cardStyle, background: row.customBackgroundGradient }
  }
  if (row.customBgImage && variant !== 'spotlight') {
    const mediaUrl = resolveSectionMediaUrl(row.customBgImage)
    const isVideo = /\.(mp4|webm|ogg)(\?|#|$)/i.test(mediaUrl) || /\/video\//i.test(mediaUrl)
    if (!isVideo) {
      cardStyle = {
        ...cardStyle,
        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.22), rgba(0,0,0,0.12)), url("${mediaUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    }
  }
  if (typeof row.borderRadius === 'number' && row.borderRadius > 0) {
    cardStyle = { ...cardStyle, borderRadius: row.borderRadius }
  }
  if (row.customPadding) cardStyle = { ...cardStyle, padding: row.customPadding }
  if (row.customMargin) cardStyle = { ...cardStyle, margin: row.customMargin }
  if (row.customWidth) cardStyle = { ...cardStyle, width: row.customWidth }
  if (row.customHeight) cardStyle = { ...cardStyle, height: row.customHeight }
  if (row.customBorder) cardStyle = { ...cardStyle, border: row.customBorder }
  const hasInlineBgOverride = Boolean(row.customColor || row.customBackgroundGradient || row.customBgImage)
  if (row.shadowEnabled === false) {
    cardStyle = { ...cardStyle, boxShadow: 'none' }
  } else if (hasInlineBgOverride) {
    cardStyle = {
      ...cardStyle,
      boxShadow:
        (cardStyle as { boxShadow?: string })?.boxShadow ??
        '0 0 0 1px rgba(255, 255, 255, 0.14), 0 14px 40px rgba(2, 10, 35, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.18)',
    }
  }
  if (!editMode && variant === 'grid') {
    cardStyle = { ...cardStyle, animationDelay: `${Math.min(cardIndex, 14) * 52}ms` }
  }
  if (merged.styles && !hasInlineBgOverride) {
    const st = merged.styles
    cardStyle = {
      ...cardStyle,
      ...(st.background ? { background: st.background } : {}),
      ...(st.backgroundColor ? { backgroundColor: st.backgroundColor } : {}),
    }
  }

  const rawIcon = row.customIcon
  const iconIsUrl =
    rawIcon && (/^https?:\/\//i.test(rawIcon) || rawIcon.startsWith('/') || rawIcon.startsWith('data:'))
  const copyStyle: CSSProperties | undefined = {
    ...(row.customTextColor ? { color: row.customTextColor } : {}),
    ...(row.customTextAlign ? { textAlign: row.customTextAlign } : {}),
    ...(row.customFontFamily ? { fontFamily: row.customFontFamily } : {}),
  }
  const titleStyle: CSSProperties | undefined = {
    ...(isUrdu ? { textAlign: 'right' } : {}),
    ...(row.customFontSize ? { fontSize: row.customFontSize } : {}),
    ...(row.customFontWeight ? { fontWeight: row.customFontWeight } : {}),
    ...(row.customLineHeight ? { lineHeight: row.customLineHeight } : {}),
    ...(row.customLetterSpacing ? { letterSpacing: row.customLetterSpacing } : {}),
  }

  void cms
  void cmsId

  const spotlightModifier = variant === 'spotlight' ? 'home-card--spotlight' : ''
  const enterClass = editMode ? 'hp-edit-target' : variant === 'grid' ? 'home-card--enter' : 'home-card--carousel-enter'

  const iconEl = (
    <span className="home-card-icon">
      {iconIsUrl ?
        <img src={resolveSectionMediaUrl(rawIcon)} alt="" className="home-card-icon-img" />
      : (rawIcon || homeCardMeta[key].icon)}
    </span>
  )

  const spotlightHomeMedia = SPOTLIGHT_HOME_MEDIA_FILES[key]
  const spotlightVideoCandidates = useMemo(() => {
    const out: string[] = []
    if (spotlightHomeMedia?.videos) {
      for (const fileName of spotlightHomeMedia.videos) {
        for (const url of toS3ObjectUrls(fileName)) {
          if (url && !out.includes(url)) out.push(url)
        }
      }
    }
    return out
  }, [spotlightHomeMedia?.videos])
  const spotlightImageCandidates = useMemo(() => {
    const out: string[] = []
    if (spotlightHomeMedia?.images) {
      for (const fileName of spotlightHomeMedia.images) {
        for (const url of toS3ObjectUrls(fileName)) {
          if (url && !out.includes(url)) out.push(url)
        }
      }
    }
    return out
  }, [spotlightHomeMedia?.images])
  const [videoCandidateIndex, setVideoCandidateIndex] = useState(0)
  const [imageCandidateIndex, setImageCandidateIndex] = useState(0)
  const [isSpotlightImageLoaded, setIsSpotlightImageLoaded] = useState(false)
  const [isSpotlightVideoLoaded, setIsSpotlightVideoLoaded] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  useEffect(() => {
    setVideoCandidateIndex(0)
    setImageCandidateIndex(0)
    setVideoFailed(false)
    setIsSpotlightVideoLoaded(false)
    setIsSpotlightImageLoaded(false)
  }, [spotlightVideoCandidates.join('|'), spotlightImageCandidates.join('|')])
  useEffect(() => {
    const warm = [...spotlightVideoCandidates.slice(0, 1), ...spotlightImageCandidates.slice(0, 2)]
    for (const url of warm) preloadMedia(url)
  }, [spotlightVideoCandidates.join('|'), spotlightImageCandidates.join('|')])
  const activeVideoSrc = spotlightVideoCandidates[videoCandidateIndex]
  const activeImageSrc = spotlightImageCandidates[imageCandidateIndex]
  const showVideo = Boolean(activeVideoSrc) && !videoFailed

  const copyEl = (
    <span className="home-card-copy" style={copyStyle}>
      <strong
        className={isUrdu ? 'home-card-title-ur' : undefined}
        dir={isUrdu ? 'rtl' : 'ltr'}
        style={titleStyle}
      >
        {title}
      </strong>
      <small
        className={isUrdu ? 'home-card-subtitle-ur' : undefined}
        dir={isUrdu ? 'rtl' : 'ltr'}
        style={
          row.customTextColor ?
            { color: row.customTextColor, opacity: 0.88, ...(isUrdu ? { textAlign: 'right' } : {}) }
          : isUrdu ?
            { textAlign: 'right' }
          : undefined
        }
      >
        {variant === 'spotlight' ? '' : subtitle}
      </small>
    </span>
  )

  const navigateFromCard = () => {
    const openLiveEarthquake = () => {
      try {
        window.dispatchEvent(
          new CustomEvent<SectionKey>('r360-admin-navigate-section', { detail: 'liveEarthquakeMap' }),
        )
      } catch {
        /* ignore */
      }
      navigateToSection('liveEarthquakeMap')
    }
    if (key === 'riskMaps' || key === 'liveEarthquakeMap') {
      openLiveEarthquake()
      return
    }
    navigateToSection(key)
  }

  return (
    <button
      type="button"
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`home-card ${spotlightModifier} ${toneClass} ${sizeClass} ${hasInlineBgOverride ? 'home-card--cms-surface' : ''} ${enterClass}`.trim()}
      style={cardStyle}
      data-hp-card={key}
      data-cms-id={cmsId}
      onClick={(e) => {
        const allowDirectLiveEarthquakeNav = key === 'liveEarthquakeMap' || key === 'riskMaps'
        if (editMode && onAdminCardClick && !allowDirectLiveEarthquakeNav) {
          e.preventDefault()
          e.stopPropagation()
          onAdminCardClick(key, row, e.currentTarget)
          return
        }
        e.stopPropagation()
        navigateFromCard()
      }}
    >
      {variant === 'spotlight' ?
        <>
          <div className="home-card-spotlight-col home-card-spotlight-col--copy">
            {iconEl}
            {copyEl}
            <p className="home-card-spotlight-desc" dir={isUrdu ? 'rtl' : 'ltr'}>
              {subtitle}
            </p>
            <button
              type="button"
              className="home-card-spotlight-cta home-card-spotlight-cta-btn"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                navigateFromCard()
              }}
            >
              {exploreLabel} →
            </button>
          </div>
          <div className="home-card-spotlight-col home-card-spotlight-col--visual" aria-hidden="true">
            <div className="home-card-spotlight-orbs">
              <div className="home-card-spotlight-skeleton" />
              {showVideo ?
                <video
                  key={activeVideoSrc}
                  className={`home-card-spotlight-media ${isSpotlightVideoLoaded ? 'is-loaded' : ''}`}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onLoadedData={() => {
                    setIsSpotlightVideoLoaded(true)
                    void title
                  }}
                  onError={() => {
                    setIsSpotlightVideoLoaded(false)
                    void title
                    if (videoCandidateIndex + 1 < spotlightVideoCandidates.length) {
                      setVideoCandidateIndex((i) => i + 1)
                    } else {
                      setVideoFailed(true)
                    }
                  }}
                >
                  <source src={activeVideoSrc} />
                </video>
              : null}
              {activeImageSrc ?
                <img
                  key={activeImageSrc}
                  src={activeImageSrc}
                  alt=""
                  className={`home-card-spotlight-media ${isSpotlightImageLoaded && !showVideo ? 'is-loaded' : ''}`}
                  loading={mediaPriority}
                  decoding="async"
                  onLoad={() => {
                    setIsSpotlightImageLoaded(true)
                    void title
                  }}
                  onError={() => {
                    setIsSpotlightImageLoaded(false)
                    void title
                    if (imageCandidateIndex + 1 < spotlightImageCandidates.length) {
                      setImageCandidateIndex((i) => i + 1)
                    }
                  }}
                />
              : null}
            </div>
          </div>
        </>
      : <>
          {iconEl}
          {copyEl}
        </>
      }
    </button>
  )
}

