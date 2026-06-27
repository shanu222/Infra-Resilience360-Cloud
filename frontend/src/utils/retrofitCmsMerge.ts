import staticDefaults from '../data/retrofitCmsStaticDefaults.json'
import type { RetrofitCmsPageRecord, RetrofitCmsPayload } from '../types/retrofitCms'

const safeString = (v: unknown) => String(v ?? '').trim()
const isRecord = (v: unknown): v is Record<string, unknown> =>
  Boolean(v) && typeof v === 'object' && !Array.isArray(v)
const RETROFIT_REQUIRED_PAGE_IDS = ['main', 'analysis', 'estimate'] as const

function normalizeContentTexts(v: unknown): Record<string, string> {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const out: Record<string, string> = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === 'string') out[k] = val
    }
    return out
  }
  return {}
}

function normalizePageRecord(raw: unknown): RetrofitCmsPageRecord {
  const d = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const dc = d.content && typeof d.content === 'object' ? (d.content as Record<string, unknown>) : {}
  const images = dc.images && typeof dc.images === 'object' && !Array.isArray(dc.images) ? (dc.images as Record<string, unknown>) : {}
  const videos = dc.videos && typeof dc.videos === 'object' && !Array.isArray(dc.videos) ? (dc.videos as Record<string, unknown>) : {}
  const audios = dc.audios && typeof dc.audios === 'object' && !Array.isArray(dc.audios) ? (dc.audios as Record<string, unknown>) : {}
  const icons = dc.icons && typeof dc.icons === 'object' && !Array.isArray(dc.icons) ? (dc.icons as Record<string, unknown>) : {}

  const strMap = (o: Record<string, unknown>): Record<string, string> => {
    const out: Record<string, string> = {}
    for (const [k, val] of Object.entries(o)) {
      if (typeof val === 'string') out[k] = val
    }
    return out
  }

  return {
    pageId: typeof d.pageId === 'string' ? d.pageId : '',
    order: typeof d.order === 'number' ? d.order : 0,
    content: {
      texts: normalizeContentTexts(dc.texts),
      images: strMap(images),
      videos: strMap(videos),
      audios: strMap(audios),
      icons: strMap(icons),
    },
    styles: d.styles && typeof d.styles === 'object' && !Array.isArray(d.styles) ? (d.styles as Record<string, unknown>) : {},
  }
}

function normalizePagesFromCmsOnly(raw: unknown): RetrofitCmsPageRecord[] {
  if (!Array.isArray(raw)) return []
  return raw.map((p) => normalizePageRecord(p))
}

function normalizePages(raw: unknown, fallback: RetrofitCmsPageRecord[]): RetrofitCmsPageRecord[] {
  const list = Array.isArray(raw) && raw.length > 0 ? raw : fallback
  return list.map((p) => normalizePageRecord(p))
}

function clamp01(v: unknown): number {
  const n = Number(v)
  if (!Number.isFinite(n)) return 1
  return Math.min(1, Math.max(0, n))
}

function mergeTextOverrides(base: Record<string, string>, incoming: Record<string, string>) {
  return { ...base, ...incoming }
}

function normalizeTextOverridesFromCmsOnly(raw: unknown): { en: Record<string, string>; ur: Record<string, string> } {
  const o = isRecord(raw) ? raw : {}
  const en = isRecord(o.en) ? o.en : {}
  const ur = isRecord(o.ur) ? o.ur : {}
  return {
    en: Object.fromEntries(Object.entries(en).filter(([, v]) => typeof v === 'string')) as Record<string, string>,
    ur: Object.fromEntries(Object.entries(ur).filter(([, v]) => typeof v === 'string')) as Record<string, string>,
  }
}

function normalizeGlobalStylesFromCmsOnly(raw: unknown): RetrofitCmsPayload['globalStyles'] {
  const gs = isRecord(raw) ? raw : {}
  return {
    backgroundColor: safeString(gs.backgroundColor),
    backgroundImage: safeString(gs.backgroundImage),
    backgroundVideo: safeString(gs.backgroundVideo),
    isVideoEnabled: Boolean(gs.isVideoEnabled),
    textColor: safeString(gs.textColor),
    transparency: clamp01(gs.transparency),
  }
}

/**
 * Strict validator for enabling CMS-priority (no static merge).
 * Requires complete section structure with all retrofit pages present and non-empty IDs.
 */
export function validateRetrofitPayloadForCmsPriority(raw: Record<string, unknown>): boolean {
  if (!isRecord(raw)) return false

  const pagesRaw = raw.pages
  if (!Array.isArray(pagesRaw) || pagesRaw.length < RETROFIT_REQUIRED_PAGE_IDS.length) return false

  const pages = normalizePagesFromCmsOnly(pagesRaw)
  const byId = new Map<string, RetrofitCmsPageRecord>()
  for (const page of pages) {
    if (!safeString(page.pageId)) return false
    if (!isRecord(page.content)) return false
    if (
      !isRecord(page.content.texts) ||
      !isRecord(page.content.images) ||
      !isRecord(page.content.videos) ||
      !isRecord(page.content.audios) ||
      !isRecord(page.content.icons)
    ) {
      return false
    }
    byId.set(page.pageId, page)
  }
  for (const requiredId of RETROFIT_REQUIRED_PAGE_IDS) {
    if (!byId.has(requiredId)) return false
  }

  const textOverrides = raw.textOverrides
  if (!isRecord(textOverrides) || !isRecord(textOverrides.en) || !isRecord(textOverrides.ur)) return false

  const gs = raw.globalStyles
  if (!isRecord(gs)) return false
  if (!('backgroundColor' in gs) || !('backgroundImage' in gs) || !('backgroundVideo' in gs) || !('textColor' in gs)) {
    return false
  }
  if (typeof gs.isVideoEnabled !== 'boolean') return false
  if (!Number.isFinite(Number(gs.transparency))) return false

  return true
}

export type MergeRetrofitPublicOptions = {
  /**
   * When true and payload passes `validateRetrofitPayloadForCmsPriority`, build output from CMS only.
   * Otherwise use static-overlay merge path for safety.
   */
  cmsPriority?: boolean
}

/**
 * Mirrors server merge for GET /api/cms/retrofit when offline or parsing cached payloads.
 */
export function mergeRetrofitCmsPublicPayload(
  raw: Record<string, unknown> | null | undefined,
  options?: MergeRetrofitPublicOptions,
): RetrofitCmsPayload {
  const d = staticDefaults as unknown as RetrofitCmsPayload
  const o = raw && typeof raw === 'object' ? raw : {}
  const useCmsOnly = Boolean(raw && options?.cmsPriority && validateRetrofitPayloadForCmsPriority(o))

  if (useCmsOnly) {
    return {
      type: safeString(o.type) || 'retrofit_cms',
      section: safeString(o.section) || 'retrofit',
      pages: normalizePagesFromCmsOnly(o.pages),
      textOverrides: normalizeTextOverridesFromCmsOnly(o.textOverrides),
      globalStyles: normalizeGlobalStylesFromCmsOnly(o.globalStyles),
      updatedAt:
        typeof o.updatedAt === 'string' && o.updatedAt.trim().length > 0 ?
          o.updatedAt
        : new Date().toISOString(),
    }
  }

  const textOverrides = {
    en: mergeTextOverrides(
      (d.textOverrides?.en as Record<string, string>) || {},
      (o.textOverrides as { en?: Record<string, string> } | undefined)?.en || {},
    ),
    ur: mergeTextOverrides(
      (d.textOverrides?.ur as Record<string, string>) || {},
      (o.textOverrides as { ur?: Record<string, string> } | undefined)?.ur || {},
    ),
  }

  const gs = (o.globalStyles && typeof o.globalStyles === 'object' ? o.globalStyles : {}) as Record<string, unknown>
  const dg = d.globalStyles

  const globalStyles = {
    backgroundColor: safeString(gs.backgroundColor ?? dg.backgroundColor),
    backgroundImage: safeString(gs.backgroundImage ?? dg.backgroundImage),
    backgroundVideo: safeString(gs.backgroundVideo ?? dg.backgroundVideo),
    isVideoEnabled: Boolean(gs.isVideoEnabled ?? dg.isVideoEnabled),
    textColor: safeString(gs.textColor ?? dg.textColor),
    transparency: clamp01(gs.transparency !== undefined ? gs.transparency : dg.transparency),
  }

  const pages = normalizePages(o.pages, d.pages)

  return {
    type: 'retrofit_cms',
    section: 'retrofit',
    pages,
    textOverrides,
    globalStyles,
    updatedAt:
      typeof o.updatedAt === 'string' && o.updatedAt ? o.updatedAt : new Date().toISOString(),
  }
}

/** Merge CMS string overrides onto base locale strings (flat object). Empty / whitespace = keep default. */
export function mergeRetrofitCopy<T extends Record<string, string>>(
  base: T,
  overrides?: Record<string, string> | null,
): T {
  if (!overrides || typeof overrides !== 'object') return base
  const next = { ...base }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined || v === null) continue
    if (String(v).trim() === '') continue
    if (Object.prototype.hasOwnProperty.call(next, k)) (next as Record<string, string>)[k] = String(v)
  }
  return next
}
