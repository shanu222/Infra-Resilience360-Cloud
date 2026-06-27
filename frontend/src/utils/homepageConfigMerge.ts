import staticDefaults from '../data/homepageStaticDefaults.json'
import type { CmsMediaLibraryItem } from '../types/cmsMedia'
import type {
  HomepageBackgroundScope,
  HomepageConfigCard,
  HomepageConfigPayload,
  HomepageFooterConfig,
  HomepageFooterLocaleBlock,
} from '../types/homepageConfig'
import { type BilingualOrString, resolveBilingual } from './bilingualText'

/**
 * Canonical homepage tiles (11). Order matches `homepageStaticDefaults.json` `cards`.
 * Merged config always includes all 11; the public app filters by role + `enabled`.
 */
export const HOMEPAGE_FIXED_CARD_ROUTE_ORDER = [
  'retrofit',
  'infraModels',
  'designToolkit',
  'smartConstruction',
  'materialHubs',
  'pgbc',
  'bestPractices',
  'readiness',
  'learn',
  'riskMaps',
  'disasterDashboard',
] as const

export type HomepageFixedCardRoute = (typeof HOMEPAGE_FIXED_CARD_ROUTE_ORDER)[number]

type StaticFile = typeof staticDefaults

const safeString = (v: unknown) => String(v ?? '').trim()
const isRecord = (v: unknown): v is Record<string, unknown> =>
  Boolean(v) && typeof v === 'object' && !Array.isArray(v)

function normalizeBilingual(v: unknown): BilingualOrString {
  if (isRecord(v) && ('en' in v || 'ur' in v)) {
    return {
      en: safeString(v.en),
      ur: safeString(v.ur),
    }
  }
  return safeString(v)
}

const HOMEPAGE_ROUTE_ALIASES: Record<string, string> = {
  'disaster-dashboard': 'disasterDashboard',
  'material-hubs': 'materialHubs',
  'infra-models': 'infraModels',
  'design-toolkit': 'designToolkit',
  'smart-construction': 'smartConstruction',
  'building-codes': 'pgbc',
  'best-practices': 'bestPractices',
  'readiness-calculator': 'readiness',
  'learn-train': 'learn',
  'live-earthquake': 'riskMaps',
  'live-earthquake-alerts': 'riskMaps',
  'retrofit-guide': 'retrofit',
  'resilience-models': 'infraModels',
  'resilience-infra-models': 'infraModels',
}

/** Maps DB/API route strings (any casing, hyphens) to the canonical 11 card route keys. */
function matchCanonicalHomepageFixedRoute(normalizedLower: string): HomepageFixedCardRoute | undefined {
  const compact = normalizedLower.replace(/-/g, '')
  for (const k of HOMEPAGE_FIXED_CARD_ROUTE_ORDER) {
    const kl = k.toLowerCase()
    if (kl === normalizedLower || kl === compact) return k
  }
  return undefined
}

export function normalizeHomepageCardRoute(route: unknown): string {
  const s = safeString(route)
  if (!s) return ''
  const lower = s.toLowerCase().replace(/_/g, '-')
  if (HOMEPAGE_ROUTE_ALIASES[lower]) return HOMEPAGE_ROUTE_ALIASES[lower]
  const fixed = matchCanonicalHomepageFixedRoute(lower)
  if (fixed) return fixed
  return s
}

function canonicalHomepageCardKey(c: { id?: string; route?: string }): string {
  const routeNorm = normalizeHomepageCardRoute(c?.route)
  const idNorm = normalizeHomepageCardRoute(c?.id)
  return routeNorm || idNorm || safeString(c?.id) || safeString(c?.route)
}

/** Missing card transparency in API payloads → glass baseline (~70% transparent), not opaque. */
function clampTransparencyOrDefault(v: unknown): number {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0.3
  return Math.min(1, Math.max(0, n))
}

function normCardSize(v: unknown): 'small' | 'medium' | 'large' {
  const s = safeString(v).toLowerCase()
  if (s === 'small' || s === 'sm') return 'small'
  if (s === 'large' || s === 'lg') return 'large'
  return 'medium'
}

function clampRadius(v: unknown): number | undefined {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return Math.min(48, Math.max(1, Math.round(n)))
}

function sanitizeCards(incoming: unknown) {
  if (!Array.isArray(incoming)) return []
  return incoming
    .map((c: Record<string, unknown>) => {
      const route = normalizeHomepageCardRoute(c?.route)
      const br = clampRadius(c?.borderRadius)
      const idRaw = safeString(c?.id)
      const row: HomepageConfigCard = {
        id: normalizeHomepageCardRoute(idRaw) || idRaw || route,
        title: normalizeBilingual(c?.title),
        color: safeString(c?.color),
        icon: safeString(c?.icon),
        route,
        subtitle: normalizeBilingual(c?.subtitle),
        textColor: safeString(c?.textColor),
        backgroundImage: safeString(c?.backgroundImage),
        transparency: clampTransparencyOrDefault(c?.transparency),
        size: normCardSize(c?.size),
        shadow: c?.shadow === false ? false : true,
        fontFamily: safeString(c?.fontFamily) || undefined,
        fontSize: safeString(c?.fontSize) || undefined,
        fontWeight: safeString(c?.fontWeight) || undefined,
        textAlign:
          safeString(c?.textAlign) === 'center' ? 'center'
          : safeString(c?.textAlign) === 'right' ? 'right'
          : safeString(c?.textAlign) === 'left' ? 'left'
          : undefined,
        lineHeight: safeString(c?.lineHeight) || undefined,
        letterSpacing: safeString(c?.letterSpacing) || undefined,
        padding: safeString(c?.padding) || undefined,
        margin: safeString(c?.margin) || undefined,
        width: safeString(c?.width) || undefined,
        height: safeString(c?.height) || undefined,
        border: safeString(c?.border) || undefined,
        backgroundGradient: safeString(c?.backgroundGradient) || undefined,
        enabled: c?.enabled !== false,
      }
      if (br !== undefined) row.borderRadius = br
      return row
    })
    .filter((c: { route: string }) => c.route.length > 0)
}

/**
 * Build the 11 canonical homepage cards purely from CMS/API data (no static default rows).
 * Returns null if any fixed route is missing after sanitization.
 */
function buildHomepageCardsCmsPriority(raw: unknown): HomepageConfigCard[] | null {
  const mongoCards = Array.isArray(raw) ? sanitizeCards(raw) : []
  const byRoute = new Map<string, HomepageConfigCard>()
  for (const c of mongoCards) {
    if (c.route) byRoute.set(c.route, c)
  }
  const out: HomepageConfigCard[] = []
  for (const route of HOMEPAGE_FIXED_CARD_ROUTE_ORDER) {
    const row = byRoute.get(route)
    if (!row) return null
    out.push(row)
  }
  return out
}

/**
 * Returns true when Mongo/API payload is complete enough to skip static default card overlay.
 * Keeps golden rule: if invalid → caller must keep static merge path.
 */
export function validateHomepagePayloadForCmsPriority(o: Record<string, unknown>): boolean {
  if (!o || typeof o !== 'object') return false
  const colors = o.colors
  if (!colors || typeof colors !== 'object') return false
  const c = colors as Record<string, unknown>
  if (!safeString(c.primary) || !safeString(c.secondary)) return false
  if (!Array.isArray(o.cards) || o.cards.length < HOMEPAGE_FIXED_CARD_ROUTE_ORDER.length) return false
  return buildHomepageCardsCmsPriority(o.cards) !== null
}

export type MergeHomepagePublicOptions = {
  /**
   * When true and `validateHomepagePayloadForCmsPriority(raw)` passes, card rows are taken only
   * from CMS/API (canonical 11 routes). Otherwise static-default overlay is used (safe fallback).
   */
  cmsPriority?: boolean
}

function mergeDefaultCardWithMongo(def: HomepageConfigCard, mongo: HomepageConfigCard | undefined) {
  if (!mongo) return { ...def }
  const out: HomepageConfigCard = { ...def }
  const skipEmptyOverwrite = [
    'title',
    'icon',
    'color',
    'subtitle',
    'textColor',
    'backgroundImage',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'letterSpacing',
    'padding',
    'margin',
    'width',
    'height',
    'border',
    'backgroundGradient',
    'textAlign',
  ] as const
  for (const k of Object.keys(mongo) as (keyof HomepageConfigCard)[]) {
    if (k === 'id' || k === 'route') continue
    const v = mongo[k]
    if (v === undefined || v === null) continue
    if (
      typeof v === 'string' &&
      (skipEmptyOverwrite as readonly string[]).includes(k) &&
      !v.trim()
    ) {
      continue
    }
    ;(out as Record<string, unknown>)[k as string] = v as unknown
  }
  out.id = def.id
  out.route = def.route
  if (Object.prototype.hasOwnProperty.call(mongo, 'enabled')) {
    out.enabled = mongo.enabled !== false
  }
  return out
}

/**
 * Overlay CMS rows onto static defaults (same rules as server GET /api/homepage-config).
 * Returns only the 11 static default cards; extra rows in storage are ignored.
 */
export function mergeHomepageCardsWithDefaults(rawMongoCards: unknown): HomepageConfigCard[] {
  const d = staticDefaults as StaticFile
  const defaultCards = sanitizeCards(d.cards)
  const mongoCards = Array.isArray(rawMongoCards) ? sanitizeCards(rawMongoCards) : []

  const mongoById = new Map<string, HomepageConfigCard>()
  const mongoByRoute = new Map<string, HomepageConfigCard>()
  for (const c of mongoCards) {
    const key = canonicalHomepageCardKey(c)
    if (key && !mongoById.has(key)) mongoById.set(key, c)
    if (c.route && !mongoByRoute.has(c.route)) mongoByRoute.set(c.route, c)
  }

  // One merged row per static default (all 11); nothing can be removed at the data layer.
  return defaultCards.map((def) => {
    const m =
      mongoById.get(canonicalHomepageCardKey(def)) ||
      mongoById.get(def.id) ||
      mongoByRoute.get(def.route)
    return mergeDefaultCardWithMongo(def, m)
  })
}

function normalizeFooterLocaleBlock(
  incoming: unknown,
  fallback: HomepageFooterLocaleBlock,
): HomepageFooterLocaleBlock {
  if (!incoming || typeof incoming !== 'object') return { ...fallback }
  const inc = incoming as Record<string, unknown>
  const out: HomepageFooterLocaleBlock = { ...fallback }
  for (const k of ['taglineBefore', 'taglineStrong', 'taglineAfter', 'versionLine'] as const) {
    if (inc[k] !== undefined) out[k] = safeString(inc[k])
  }
  return out
}

function mergeFooterFromApi(o: Record<string, unknown>, d: StaticFile): HomepageFooterConfig {
  const base = (d.footer && typeof d.footer === 'object' ? d.footer : {}) as HomepageFooterConfig
  const raw = o.footer
  if (!raw || typeof raw !== 'object') {
    return {
      en: { ...(base.en ?? {}) },
      ur: { ...(base.ur ?? {}) },
    }
  }
  const fr = raw as Record<string, unknown>
  return {
    en: normalizeFooterLocaleBlock(fr.en, base.en ?? {}),
    ur: normalizeFooterLocaleBlock(fr.ur, base.ur ?? {}),
  }
}

/**
 * Mirrors server merge for GET /api/homepage-config when the API is unreachable.
 */
export function mergeHomepagePublicPayload(
  raw: Record<string, unknown> | null | undefined,
  options?: MergeHomepagePublicOptions,
): HomepageConfigPayload {
  const d = staticDefaults as StaticFile
  const base = d
  const o = raw && typeof raw === 'object' ? raw : {}

  const useCmsCards =
    Boolean(options?.cmsPriority) && validateHomepagePayloadForCmsPriority(o as Record<string, unknown>)
  /**
   * Even when the payload is “CMS-complete”, overlay static defaults per tile so empty color /
   * border / transparency from Mongo never replace the shipped glass baseline (client must match
   * server GET merge behavior).
   */
  const cards = useCmsCards ?
    (() => {
      const cmsOnly = buildHomepageCardsCmsPriority(o.cards)
      if (!cmsOnly) return mergeHomepageCardsWithDefaults(o.cards)
      const defaultCards = sanitizeCards((staticDefaults as StaticFile).cards)
      return defaultCards.map((def, idx) => mergeDefaultCardWithMongo(def, cmsOnly[idx]))
    })()
  : mergeHomepageCardsWithDefaults(o.cards)

  const colors = (o.colors && typeof o.colors === 'object' ? o.colors : {}) as Record<string, unknown>
  const text = (o.text && typeof o.text === 'object' ? o.text : {}) as Record<string, unknown>
  const snap = base.staticSnapshot || { heroTitle: '', heroSubtitle: '' }

  const titleDb = text.title !== undefined ? normalizeBilingual(text.title) : ''
  const subtitleDb = text.subtitle !== undefined ? normalizeBilingual(text.subtitle) : ''

  const hero = {
    title:
      resolveBilingual(titleDb, 'en', '').trim() ? titleDb : safeString(snap.heroTitle) || '',
    subtitle:
      resolveBilingual(subtitleDb, 'en', '').trim() ? subtitleDb : safeString(snap.heroSubtitle) || '',
  }

  let mediaLibrary: CmsMediaLibraryItem[] | undefined
  if (Array.isArray(o.mediaLibrary)) {
    mediaLibrary = o.mediaLibrary.filter(
      (row): row is CmsMediaLibraryItem =>
        Boolean(row && typeof row === 'object' && typeof (row as CmsMediaLibraryItem).url === 'string'),
    )
  }

  const backgroundScope: HomepageBackgroundScope =
    o.backgroundScope === 'global' ? 'global' : 'home'

  const bmRaw = o.backgroundMedia
  const hasBm = bmRaw && typeof bmRaw === 'object' && !Array.isArray(bmRaw)
  const b = hasBm ? (bmRaw as Record<string, unknown>) : null
  const backgroundMedia = hasBm
    ? {
        video: typeof b!.video === 'string' && safeString(b!.video) ? safeString(b!.video) : null,
        image: typeof b!.image === 'string' && safeString(b!.image) ? safeString(b!.image) : null,
      }
    : undefined

  const videoEffective =
    (backgroundMedia?.video && safeString(backgroundMedia.video)) || safeString(o.backgroundVideo)
  const imageEffective =
    (backgroundMedia?.image && safeString(backgroundMedia.image)) || safeString(o.backgroundImage)

  return {
    type: 'homepage_config',
    backgroundImage: imageEffective || base.backgroundImage,
    backgroundVideo: videoEffective,
    isVideoEnabled: Boolean(videoEffective),
    backgroundScope,
    footer: mergeFooterFromApi(o, base),
    colors: {
      primary: safeString(colors.primary) || base.colors.primary,
      secondary: safeString(colors.secondary) || base.colors.secondary,
      text: colors.text !== undefined && colors.text !== null ? safeString(colors.text) : base.colors.text,
    },
    text: {
      title: titleDb,
      subtitle: subtitleDb,
    },
    hero,
    cards,
    updatedAt:
      typeof o.updatedAt === 'string' && o.updatedAt
        ? o.updatedAt
        : new Date().toISOString(),
    staticSnapshot: base.staticSnapshot,
    ...(mediaLibrary ? { mediaLibrary } : {}),
    ...(backgroundMedia ? { backgroundMedia } : {}),
  }
}
