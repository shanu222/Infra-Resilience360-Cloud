import type { CSSProperties } from 'react'
import type { UniversalElementPayload } from '../types/universalElement'
import type { HomepageConfigCard, HomepageConfigPayload } from '../types/homepageConfig'
import type { AppLocaleStrings } from '../i18n/appLocale'
import type { Language, SectionKey } from '../types/sectionKeys'
import type { RoleOption } from '../constants/homepageGrid'
import { homeSectionKeysByRole, isHomeSectionKey } from '../constants/homepageGrid'
import {
  HOMEPAGE_FIXED_CARD_ROUTE_ORDER,
  normalizeHomepageCardRoute,
} from './homepageConfigMerge'
import { finalizeRemoteMediaUrl, resolveSectionMediaUrl } from './sectionMediaUrl'
import { resolveBilingual, resolveBilingualPreferStaticForActiveLang } from './bilingualText'

/** CMS / JSON may surface numbers or objects where the schema expects CSS strings. */
function strTrim(v: unknown): string {
  return String(v ?? '').trim()
}

function optionalStr(v: unknown): string | undefined {
  const s = strTrim(v)
  return s || undefined
}

/**
 * Resolved absolute URLs from Mongo homepage-config for immediate shell `<video>` + poster paint,
 * before GET `/api/cms?page=homepage` returns (cuts perceived load latency).
 */
export function homepageBackgroundSeedMedia(cfg: HomepageConfigPayload): { video: string; poster: string } {
  const bm = cfg.backgroundMedia
  const videoRaw =
    (bm && typeof bm === 'object' && typeof bm.video === 'string' && strTrim(bm.video)) ||
    strTrim(cfg.backgroundVideo)
  const imageRaw =
    (bm && typeof bm === 'object' && typeof bm.image === 'string' && strTrim(bm.image)) ||
    strTrim(cfg.backgroundImage)
  const ts = Date.parse(cfg.updatedAt || '') || Date.now()
  const video = videoRaw ? finalizeRemoteMediaUrl(resolveSectionMediaUrl(videoRaw), ts, cfg.updatedAt) : ''
  let poster = ''
  if (imageRaw) {
    const url = resolveSectionMediaUrl(imageRaw)
    const sep = url.includes('?') ? '&' : '?'
    const cv = cfg.updatedAt ? `${sep}cv=${encodeURIComponent(cfg.updatedAt)}` : ''
    poster = `${url}${cv}`
  }
  return { video, poster }
}

/** Homepage-only background from `HomepageConfig` / `backgroundMedia` (Mongo + direct media URLs). */
export function homepageConfigBackgroundMedia(
  homepageConfig: HomepageConfigPayload,
): { mediaStyle?: CSSProperties; videoSrc: string } {
  const bm = homepageConfig.backgroundMedia
  const videoRaw =
    (bm && typeof bm === 'object' && typeof bm.video === 'string' && strTrim(bm.video)) ||
    strTrim(homepageConfig.backgroundVideo)
  if (videoRaw) {
    const ts = Date.parse(homepageConfig.updatedAt || '') || Date.now()
    const videoSrc = finalizeRemoteMediaUrl(resolveSectionMediaUrl(videoRaw), ts, homepageConfig.updatedAt)
    return { mediaStyle: { backgroundImage: 'none' }, videoSrc }
  }
  const imageRaw =
    (bm && typeof bm === 'object' && typeof bm.image === 'string' && strTrim(bm.image)) ||
    strTrim(homepageConfig.backgroundImage)
  if (!imageRaw) return { videoSrc: '' }
  const url = resolveSectionMediaUrl(imageRaw)
  const sep = url.includes('?') ? '&' : '?'
  const cv = homepageConfig.updatedAt ? `${sep}cv=${encodeURIComponent(homepageConfig.updatedAt)}` : ''
  const full = `${url}${cv}`
  return {
    mediaStyle: {
      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.28), rgba(0,0,0,0.12)), url("${full}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
    },
    videoSrc: '',
  }
}

function pageShellElementMedia(
  el: UniversalElementPayload | null | undefined,
  pageUpdatedAt: string | null | undefined,
): { mediaStyle?: CSSProperties; videoSrc: string } | null {
  if (!el || el.media === null) return null
  const m = el.media
  if (!m && el.styles?.backgroundImage === undefined) return null
  const vid = String(m?.backgroundVideoSrc || '').trim()
  if (vid) {
    const ts = Date.parse(pageUpdatedAt || '') || Date.now()
    const videoSrc = finalizeRemoteMediaUrl(resolveSectionMediaUrl(vid), ts, pageUpdatedAt ?? undefined)
    return { mediaStyle: { backgroundImage: 'none' }, videoSrc }
  }
  const imgUrl = String(m?.url || m?.src || '').trim()
  if (imgUrl) {
    const url = resolveSectionMediaUrl(imgUrl)
    const sep = url.includes('?') ? '&' : '?'
    const cv = pageUpdatedAt ? `${sep}cv=${encodeURIComponent(pageUpdatedAt)}` : ''
    const full = `${url}${cv}`
    return {
      mediaStyle: {
        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.28), rgba(0,0,0,0.12)), url("${full}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      },
      videoSrc: '',
    }
  }
  const bgImg = el.styles?.backgroundImage
  if (bgImg != null && bgImg !== '' && String(bgImg) !== 'none') {
    return {
      mediaStyle: {
        backgroundImage: String(bgImg),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      },
      videoSrc: '',
    }
  }
  return null
}

function hasPerPageShellMedia(
  r: { mediaStyle?: CSSProperties; videoSrc: string } | null,
): boolean {
  if (!r) return false
  if (r.videoSrc) return true
  if (r.mediaStyle?.backgroundImage) return true
  return false
}

export type HomeCardRow = {
  key: SectionKey
  cardId?: string
  customTitle?: string
  customSubtitle?: string
  customColor?: string
  customIcon?: string
  customTextColor?: string
  customBgImage?: string
  transparency?: number
  cardSize?: 'small' | 'medium' | 'large'
  borderRadius?: number
  shadowEnabled?: boolean
  customFontFamily?: string
  customFontSize?: string
  customFontWeight?: string
  customTextAlign?: 'left' | 'center' | 'right'
  customLineHeight?: string
  customLetterSpacing?: string
  customPadding?: string
  customMargin?: string
  customWidth?: string
  customHeight?: string
  customBorder?: string
  customBackgroundGradient?: string
}

export function computeHomePresentation(params: {
  homepageConfig: HomepageConfigPayload
  selectedRole: RoleOption
  language: Language
  t: AppLocaleStrings
  /** When false (user navigated into a section), shell hero/video styles are not applied. */
  isHomeView: boolean
}) {
  const { homepageConfig, selectedRole, language, t, isHomeView } = params

  const fixedOrder = HOMEPAGE_FIXED_CARD_ROUTE_ORDER as readonly string[]
  const fixedSet = new Set<string>(fixedOrder)
  const allowedKeys = homeSectionKeysByRole[selectedRole]
  const allowed = new Set(allowedKeys)

  /** Normalized CMS rows, then role filter: `allowedKeys.includes(route)` (+ fixed grid + enabled). */
  const normalizedCards: HomepageConfigCard[] = (homepageConfig.cards ?? []).map((c) => ({
    ...c,
    route: normalizeHomepageCardRoute(c.route) || String(c.route ?? '').trim(),
  }))
  const filteredByRole = normalizedCards.filter(
    (c) =>
      c.enabled !== false &&
      Boolean(c.route) &&
      allowed.has(c.route as SectionKey) &&
      fixedSet.has(c.route) &&
      isHomeSectionKey(c.route),
  )

  const cardByRoute = new Map<string, HomepageConfigCard>()
  for (const c of filteredByRole) {
    if (!cardByRoute.has(c.route)) cardByRoute.set(c.route, c)
  }

  const homeDynamicCards: HomepageConfigCard[] = []
  const homeCardRows: HomeCardRow[] = []

  for (const route of fixedOrder) {
    if (!allowed.has(route as SectionKey)) continue
    const c = cardByRoute.get(route)
    if (c && c.enabled === false) continue
    if (c) {
      homeDynamicCards.push(c)
      homeCardRows.push({
        key: c.route as SectionKey,
        cardId: optionalStr(c.id),
        customTitle:
          resolveBilingualPreferStaticForActiveLang(
            c.title,
            language,
            t.homeCards[c.route as SectionKey]?.title ?? '',
          ).trim() || undefined,
        customSubtitle:
          resolveBilingualPreferStaticForActiveLang(
            c.subtitle,
            language,
            t.homeCards[c.route as SectionKey]?.subtitle ?? '',
          ).trim() || undefined,
        customColor: optionalStr(c.color),
        customIcon: optionalStr(c.icon),
        customTextColor: optionalStr(c.textColor),
        customBgImage: optionalStr(c.backgroundImage),
        transparency: typeof c.transparency === 'number' ? c.transparency : 0.3,
        cardSize: c.size === 'small' || c.size === 'large' ? c.size : 'medium',
        borderRadius: typeof c.borderRadius === 'number' ? c.borderRadius : undefined,
        shadowEnabled: c.shadow !== false,
        customFontFamily: optionalStr(c.fontFamily),
        customFontSize: optionalStr(c.fontSize),
        customFontWeight: optionalStr(c.fontWeight),
        customTextAlign: c.textAlign ?? undefined,
        customLineHeight: optionalStr(c.lineHeight),
        customLetterSpacing: optionalStr(c.letterSpacing),
        customPadding: optionalStr(c.padding),
        customMargin: optionalStr(c.margin),
        customWidth: optionalStr(c.width),
        customHeight: optionalStr(c.height),
        customBorder: optionalStr(c.border),
        customBackgroundGradient: optionalStr(c.backgroundGradient),
      })
    } else {
      homeCardRows.push({ key: route as SectionKey })
    }
  }

  const homeMediaBundle = isHomeView ? homepageConfigBackgroundMedia(homepageConfig) : { mediaStyle: undefined, videoSrc: '' }
  const homeShellMediaStyle = homeMediaBundle.mediaStyle
  const homeVideoSrc = homeMediaBundle.videoSrc

  const homeHeroColorStyle: CSSProperties | undefined = !isHomeView ?
    undefined
  : {
      color: '#ffffff',
      textShadow:
        '0 2px 14px rgba(0, 0, 0, 0.72), 0 1px 4px rgba(0, 0, 0, 0.85), 0 0 1px rgba(0, 0, 0, 0.9)',
    }

  const homeHeroTitleDisplay = !isHomeView ?
      ''
    : (() => {
        const cms = resolveBilingual(homepageConfig.text?.title, language, '').trim()
        if (cms) return cms
        return resolveBilingual(homepageConfig.hero?.title, language, t.heroTitle).trim() || t.heroTitle
      })()

  const homeHeroSubtitleDisplay = !isHomeView ?
      ''
    : (() => {
        const cms = resolveBilingual(homepageConfig.text?.subtitle, language, '').trim()
        if (cms) return cms
        return resolveBilingual(homepageConfig.hero?.subtitle, language, t.heroSubtitle).trim() || t.heroSubtitle
      })()

  const homeShellThemeVars: CSSProperties | undefined = !isHomeView ?
      undefined
    : (() => {
        const p = strTrim(homepageConfig.colors?.primary)
        const s = strTrim(homepageConfig.colors?.secondary)
        if (!p && !s) return undefined
        return {
          ['--home-primary' as string]: p || '#005f73',
          ['--home-secondary' as string]: s || '#0a9396',
        }
      })()

  return {
    homeDynamicCards,
    homeCardRows,
    homeShellMediaStyle,
    homeVideoSrc,
    homeHeroColorStyle,
    homeHeroTitleDisplay,
    homeHeroSubtitleDisplay,
    homeShellThemeVars,
  }
}

/**
 * Non-home sections: background from `page_config` element `shell.pageBackground` only.
 * Global homepage spill and per-section `cms_media_library` rows are composed in `App.tsx`
 * so each route can show its own media without sharing the home hero asset.
 */
export function resolveSectionShellBackdrop(
  _homepageConfig: HomepageConfigPayload,
  pageShellElement: UniversalElementPayload | undefined,
  pageShellUpdatedAt: string | null | undefined,
): { mediaStyle?: CSSProperties; videoSrc: string } | null {
  const per = pageShellElementMedia(pageShellElement, pageShellUpdatedAt)
  if (hasPerPageShellMedia(per)) {
    return { mediaStyle: per!.mediaStyle, videoSrc: per!.videoSrc }
  }
  return null
}
