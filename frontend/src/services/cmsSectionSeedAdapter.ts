import { getCmsMappedSection, type CmsMappedSectionDocument } from './cmsReadAdapter'
import {
  getStaticInfraSeeds,
  getStaticLearnSeeds,
  getStaticPortalSeeds,
  getStaticRiskSeeds,
} from './staticContent'
import { CmsBootstrapError } from './cmsBootstrapError'
import type { CmsMediaLibraryItem } from '../types/cmsMedia'
import { normalizeCmsMediaLibraryItem } from '../types/cmsMedia'
import { isValidS3VideoSource } from '../utils/videoSourceValidation'
import { resolveSectionMediaUrl } from '../utils/sectionMediaUrl'
import { learnRowDisplayTitle } from '../utils/learnMediaTitle'
import { isExcludedLearnCatalogRow } from '../utils/learnCatalogExclude'

export { validateLearnPayloadForCmsPriority } from '../utils/learnSeedsValidation'

export type LearnVideoSeed = {
  id: string
  title: string
  summary: string
  fileName: string
  /** Playback URL from CMS/Mongo (`videos[].url` for matchedId). */
  url?: string
  /** Canonical S3 object key when provided by CMS/Mongo. */
  s3Key?: string
  /** Mongo `_id` for admin PATCH (title / replace). */
  mediaId?: string
}
export type InfraModelSeed = {
  id: string
  title: string
  description: string
  features: string[]
  advantagesPakistan: string[]
}

export type CmsSectionSeeds = {
  learn?: {
    videos?: LearnVideoSeed[]
    iconMap?: Record<string, string>
  }
  infraModels?: {
    models?: InfraModelSeed[]
    pdfMap?: Record<string, string>
  }
  riskMaps?: {
    provinceRisk?: Record<string, { earthquake: string; flood: string; infraRisk: string; landslide: string }>
    districtCenters?: Record<string, { lat: number; lng: number }>
  }
  portals?: {
    pgbcSrc?: string
    materialHubsSrc?: string
    retrofitCalculatorSrc?: string
    smartConstructionSrc?: string
    disasterDashboardCandidates?: string[]
    visibility?: Record<string, boolean>
  }
}

export type LearnSeedsWithPriority = NonNullable<CmsSectionSeeds['learn']> & { cmsPriority: boolean }

function getElement(doc: CmsMappedSectionDocument, matchedId: string) {
  return doc.elements?.find((e) => e?.meta?.matchedId === matchedId) ?? null
}

function isValidPortalSource(value: unknown): value is string {
  const v = String(value ?? '').trim()
  if (!v) return false
  if (/^[a-zA-Z_$][\w$]*\s*\(/.test(v)) return false
  if (/\bfunction\b|=>/.test(v)) return false
  if (/^https?:\/\//i.test(v)) return true
  if (/^\//.test(v)) return true
  return /^[a-z0-9][a-z0-9\-_/]*\.html$/i.test(v)
}

function sanitizePortalSource(value: unknown): string | undefined {
  return isValidPortalSource(value) ? String(value).trim() : undefined
}

function sanitizePortalSourceList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const out = value.map((v) => sanitizePortalSource(v)).filter((v): v is string => Boolean(v))
  return out.length > 0 ? out : undefined
}

/** Drop empty / placeholder portal URLs from Mongo (e.g. `[""]` would otherwise block built-in fallbacks). */
export function filterValidPortalSourceList(urls: readonly unknown[] | undefined): string[] {
  if (!Array.isArray(urls) || urls.length === 0) return []
  return urls.map((v) => sanitizePortalSource(v)).filter((v): v is string => Boolean(v))
}

const LEARN_SECTION_KEYS = new Set(['learn'])

function resolveLibraryRowMediaType(item: CmsMediaLibraryItem): string {
  const t = String(item.type || '').toLowerCase()
  if (t === 'background') return String(item.mediaType || '').toLowerCase() || 'other'
  return t
}

function learnVideoStemFromPath(value: string): string {
  const raw = String(value || '').split(/[?#]/)[0]
  const last = raw.split('/').filter(Boolean).pop() || ''
  return last.replace(/\.(mp4|webm|mov|m4v)$/i, '').trim().toLowerCase()
}

function normalizeLearnKeyPath(s3Key: string): string {
  const k = String(s3Key || '').trim().toLowerCase()
  if (!k) return ''
  return k.replace(/^resilience360\/learn\//, '').replace(/^learn\//, '')
}

function learnDedupeKey(item: CmsMediaLibraryItem, matchedId: string, resolvedUrl: string): string {
  const s3Norm = normalizeLearnKeyPath(String(item.s3Key || ''))
  if (s3Norm) return `stem:${learnVideoStemFromPath(s3Norm)}`
  const fileName = String(item.fileName || '').trim()
  if (fileName) return `stem:${learnVideoStemFromPath(fileName)}`
  const urlStem = learnVideoStemFromPath(resolvedUrl)
  if (urlStem) return `stem:${urlStem}`
  if (matchedId) return `id:${matchedId.toLowerCase()}`
  return ''
}

function learnSourceRank(item: CmsMediaLibraryItem, resolvedUrl: string): number {
  const s3 = String(item.s3Key || '').toLowerCase()
  if (s3.startsWith('resilience360/learn/')) return 4
  const u = String(resolvedUrl || '').toLowerCase()
  if (u.includes('/resilience360/learn/')) return 4
  return 1
}

/** Build Learn & Train catalog rows from `GET /static/media?section=learn` (Mongo + S3). */
export function buildLearnCatalogFromMediaItems(rawItems: CmsMediaLibraryItem[]): LearnVideoSeed[] {
  const items = rawItems.map((r) => normalizeCmsMediaLibraryItem(r))
  const byLogicalKey = new Map<string, { seed: LearnVideoSeed; rank: number }>()
  for (const item of items) {
    const sec = String(item.section || '').toLowerCase().trim()
    const page = String(item.page || '').toLowerCase().trim()
    if (!LEARN_SECTION_KEYS.has(sec) && page !== 'learn') continue
    if (item.isActive === false) continue
    if (resolveLibraryRowMediaType(item) !== 'video') continue
    const url = String(item.url || '').trim()
    if (!url) continue
    const resolved = resolveSectionMediaUrl(url).trim()
    if (!resolved || !isValidS3VideoSource(resolved)) continue
    const matched = String(item.matchedId || '').trim()
    const mongoId = String(item.id || '').trim()
    const dedupeKey = learnDedupeKey(item, matched, resolved)
    if (!dedupeKey) continue
    const id = matched || mongoId || dedupeKey
    if (!id) continue
    if (
      isExcludedLearnCatalogRow({
        id,
        title: item.title,
        fileName: item.fileName,
        url,
        s3Key: item.s3Key,
        externalKey: item.externalKey,
      })
    ) {
      continue
    }
    const title = learnRowDisplayTitle({
      title: item.title,
      fileName: item.fileName,
      url: item.url,
      s3Key: item.s3Key,
      id,
    })
    const summary = title
    const nextSeed: LearnVideoSeed = {
      id,
      title,
      summary,
      fileName: String(item.fileName || '').trim() || id,
      url,
      s3Key: String(item.s3Key || '').trim() || undefined,
      mediaId: mongoId || undefined,
    }
    const nextRank = learnSourceRank(item, resolved)
    const prev = byLogicalKey.get(dedupeKey)
    if (!prev || nextRank > prev.rank) {
      byLogicalKey.set(dedupeKey, { seed: nextSeed, rank: nextRank })
    }
  }
  return [...byLogicalKey.values()].map((x) => x.seed).sort((a, b) => a.title.localeCompare(b.title))
}

/**
 * Learn & Train — static config only (`src/config/learnTrainVideos.ts`).
 */
export async function fetchLearnSeedsStrict(): Promise<LearnSeedsWithPriority> {
  const fromStatic = getStaticLearnSeeds()
  if (Array.isArray(fromStatic.videos) && fromStatic.videos.length > 0) {
    return {
      videos: fromStatic.videos,
      iconMap: fromStatic.iconMap ?? {},
      cmsPriority: true,
    }
  }
  return { videos: [], iconMap: {}, cmsPriority: false }
}

/** @deprecated Pass-through to {@link fetchLearnSeedsStrict}; static argument ignored. */
export async function fetchLearnSeedsWithFallback(
  _fallback: NonNullable<CmsSectionSeeds['learn']>,
): Promise<LearnSeedsWithPriority> {
  return fetchLearnSeedsStrict()
}

/** Infra models — Mongo mapping only. */
export async function fetchInfraSeedsStrict(): Promise<NonNullable<CmsSectionSeeds['infraModels']>> {
  const doc = await getCmsMappedSection('infraModels')
  if (!doc) {
    throw new CmsBootstrapError('infra-models', 'Missing infraModels mapping document')
  }
  const models = getElement(doc, 'infra-model-dataset')
  const pdf = getElement(doc, 'infra-model-pdf-map')
  const m = (models?.content?.models as InfraModelSeed[] | undefined) ?? []
  const pdfMap = (pdf?.media?.pdfMap as Record<string, string> | undefined) ?? {}
  return { models: m, pdfMap }
}

/**
 * Infra models: prefers Mongo mapping; when `/api/cms-mapping/defaults` is missing or the
 * section doc is absent (static deploy, API down), uses bundled `App.tsx` defaults.
 */
export async function fetchInfraSeedsWithFallback(
  fallback: NonNullable<CmsSectionSeeds['infraModels']>,
): Promise<NonNullable<CmsSectionSeeds['infraModels']>> {
  const fromStatic = getStaticInfraSeeds()
  if ((fromStatic.models?.length ?? 0) > 0) {
    return {
      models: fromStatic.models ?? [],
      pdfMap: { ...(fallback.pdfMap ?? {}), ...fromStatic.pdfMap },
    }
  }
  const doc = await getCmsMappedSection('infraModels')
  if (!doc) {
    return {
      models: Array.isArray(fallback.models) ? fallback.models : [],
      pdfMap: { ...(fallback.pdfMap ?? {}) },
    }
  }
  const models = getElement(doc, 'infra-model-dataset')
  const pdf = getElement(doc, 'infra-model-pdf-map')
  const m = (models?.content?.models as InfraModelSeed[] | undefined) ?? []
  const pdfMap = (pdf?.media?.pdfMap as Record<string, string> | undefined) ?? {}
  return {
    models: m.length > 0 ? m : Array.isArray(fallback.models) ? fallback.models : [],
    pdfMap: { ...(fallback.pdfMap ?? {}), ...pdfMap },
  }
}

/** Risk maps — Mongo mapping only. */
export async function fetchRiskSeedsStrict(): Promise<NonNullable<CmsSectionSeeds['riskMaps']>> {
  const doc = await getCmsMappedSection('riskMapsReadiness')
  if (!doc) {
    throw new CmsBootstrapError('risk-maps', 'Missing riskMapsReadiness mapping document')
  }
  const province = getElement(doc, 'province-risk-table')
  const district = getElement(doc, 'district-centers')
  const provinceRisk =
    (province?.content?.provinceRisk as Record<
      string,
      { earthquake: string; flood: string; infraRisk: string; landslide: string }
    > | undefined) ?? {}
  const districtCenters =
    (district?.content?.districtCenters as Record<string, { lat: number; lng: number }> | undefined) ?? {}
  return { provinceRisk, districtCenters }
}

/** Risk maps: prefers Mongo mapping; falls back to bundled `App.tsx` data when mapping is unavailable. */
export async function fetchRiskSeedsWithFallback(
  fallback: NonNullable<CmsSectionSeeds['riskMaps']>,
): Promise<NonNullable<CmsSectionSeeds['riskMaps']>> {
  const fromStatic = getStaticRiskSeeds()
  const hasStatic =
    Object.keys(fromStatic.provinceRisk ?? {}).length > 0 ||
    Object.keys(fromStatic.districtCenters ?? {}).length > 0
  if (hasStatic) {
    return {
      provinceRisk: { ...(fallback.provinceRisk ?? {}), ...fromStatic.provinceRisk },
      districtCenters: { ...(fallback.districtCenters ?? {}), ...fromStatic.districtCenters },
    }
  }
  const doc = await getCmsMappedSection('riskMapsReadiness')
  if (!doc) {
    return {
      provinceRisk: { ...(fallback.provinceRisk ?? {}) },
      districtCenters: { ...(fallback.districtCenters ?? {}) },
    }
  }
  const province = getElement(doc, 'province-risk-table')
  const district = getElement(doc, 'district-centers')
  const provinceRisk =
    (province?.content?.provinceRisk as Record<
      string,
      { earthquake: string; flood: string; infraRisk: string; landslide: string }
    > | undefined) ?? {}
  const districtCenters =
    (district?.content?.districtCenters as Record<string, { lat: number; lng: number }> | undefined) ?? {}
  return {
    provinceRisk: { ...(fallback.provinceRisk ?? {}), ...provinceRisk },
    districtCenters: { ...(fallback.districtCenters ?? {}), ...districtCenters },
  }
}

/** Portals — Mongo mapping only. */
export async function fetchPortalSeedsStrict(): Promise<NonNullable<CmsSectionSeeds['portals']>> {
  const doc = await getCmsMappedSection('portals')
  if (!doc) {
    throw new CmsBootstrapError('portals', 'Missing portals mapping document')
  }
  const pgbc = getElement(doc, 'pgbc-portal')
  const mh = getElement(doc, 'material-hubs-portal')
  const rc = getElement(doc, 'retrofit-calculator-portal')
  const sc = getElement(doc, 'smart-construction-portal')
  const dd = getElement(doc, 'disaster-dashboard-portal')
  const ddFromList = sanitizePortalSourceList(dd?.content?.sourceCandidates)
  const ddFromTemplate = sanitizePortalSource(dd?.content?.sourceTemplate)
  const disasterDashboardCandidates = ddFromList ?? (ddFromTemplate ? [ddFromTemplate] : [])
  return {
    pgbcSrc: sanitizePortalSource(pgbc?.content?.sourceTemplate) ?? '',
    materialHubsSrc: sanitizePortalSource(mh?.content?.sourceTemplate) ?? '',
    retrofitCalculatorSrc: sanitizePortalSource(rc?.content?.sourceTemplate) ?? '',
    smartConstructionSrc: sanitizePortalSource(sc?.content?.sourceTemplate) ?? '',
    disasterDashboardCandidates,
    visibility: {
      pgbc: pgbc?.visibility?.visible !== false,
      materialHubs: mh?.visibility?.visible !== false,
      retrofitCalculator: rc?.visibility?.visible !== false,
      smartConstruction: sc?.visibility?.visible !== false,
      disasterDashboard: dd?.visibility?.visible !== false,
    },
  }
}

/** Portals: prefers Mongo mapping; falls back to bundled defaults when mapping is unavailable. */
export async function fetchPortalSeedsWithFallback(
  fallback: NonNullable<CmsSectionSeeds['portals']>,
): Promise<NonNullable<CmsSectionSeeds['portals']>> {
  const staticSeeds = getStaticPortalSeeds()
  const doc = await getCmsMappedSection('portals')
  if (!doc) {
    return {
      pgbcSrc: fallback.pgbcSrc || staticSeeds.pgbcSrc,
      materialHubsSrc: fallback.materialHubsSrc || staticSeeds.materialHubsSrc,
      retrofitCalculatorSrc: fallback.retrofitCalculatorSrc || staticSeeds.retrofitCalculatorSrc,
      smartConstructionSrc: fallback.smartConstructionSrc || staticSeeds.smartConstructionSrc,
      disasterDashboardCandidates:
        Array.isArray(fallback.disasterDashboardCandidates) && fallback.disasterDashboardCandidates.length > 0 ?
          fallback.disasterDashboardCandidates
        : staticSeeds.disasterDashboardCandidates,
      visibility: staticSeeds.visibility ?? fallback.visibility,
    }
  }
  const pgbc = getElement(doc, 'pgbc-portal')
  const mh = getElement(doc, 'material-hubs-portal')
  const rc = getElement(doc, 'retrofit-calculator-portal')
  const sc = getElement(doc, 'smart-construction-portal')
  const dd = getElement(doc, 'disaster-dashboard-portal')
  const ddFromList = sanitizePortalSourceList(dd?.content?.sourceCandidates)
  const ddFromTemplate = sanitizePortalSource(dd?.content?.sourceTemplate)
  const disasterDashboardCandidates =
    ddFromList && ddFromList.length > 0 ? ddFromList
    : ddFromTemplate ? [ddFromTemplate]
    : Array.isArray(fallback.disasterDashboardCandidates) ? fallback.disasterDashboardCandidates
    : []
  return {
    pgbcSrc: sanitizePortalSource(pgbc?.content?.sourceTemplate) ?? fallback.pgbcSrc ?? '',
    materialHubsSrc: sanitizePortalSource(mh?.content?.sourceTemplate) ?? fallback.materialHubsSrc ?? '',
    retrofitCalculatorSrc: sanitizePortalSource(rc?.content?.sourceTemplate) ?? fallback.retrofitCalculatorSrc ?? '',
    smartConstructionSrc: sanitizePortalSource(sc?.content?.sourceTemplate) ?? fallback.smartConstructionSrc ?? '',
    disasterDashboardCandidates,
    visibility: {
      pgbc: pgbc?.visibility?.visible !== false,
      materialHubs: mh?.visibility?.visible !== false,
      retrofitCalculator: rc?.visibility?.visible !== false,
      smartConstruction: sc?.visibility?.visible !== false,
      disasterDashboard: dd?.visibility?.visible !== false,
    },
  }
}


