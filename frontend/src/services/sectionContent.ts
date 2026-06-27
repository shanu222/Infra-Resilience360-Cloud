import { buildApiTargets } from './apiBase'
import { isExcludedLearnCatalogRow } from '../utils/learnCatalogExclude'
import type { CmsMediaLibraryItem, MediaType } from '../types/cmsMedia'

export type SectionMediaItem = {
  id: string
  assetId?: string
  url: string
  kind?: 'video' | 'image' | 'document' | 'audio'
  type?: MediaType
  section?: string
  folder?: string
  s3Key?: string
  updatedAt?: string
  title?: string
  fileName?: string
  /** Optional CMS key from Mongo (e.g. card id) when `matchedId` is absent. */
  externalKey?: string
  /** Stable UI id (Learn card id, Infra model id, etc.) from Mongo `cms_media_library.matchedId`. */
  matchedId?: string
}

/** Per-folder URLs for disaster-dashboard section (from GET /static/content/disasterdashboard). */
export type DisasterFolderMedia = {
  video?: string
  audio?: string
  image?: string
  pdf?: string
  document?: string
}

export type SectionContentPayload = {
  section: string
  updatedAt?: string
  videos: SectionMediaItem[]
  images: SectionMediaItem[]
  documents: SectionMediaItem[]
  /** Disaster dashboard: flat list of audio items (Mongo CMS). */
  audio?: SectionMediaItem[]
  /** Present for `disasterDashboard` when CMS provides folder-keyed URLs. */
  groupedByFolder?: Record<string, DisasterFolderMedia | { video?: string; audio?: string; image?: string }>
} & Record<string, unknown>

const emptyPayload = (section: string): SectionContentPayload => ({
  section,
  videos: [],
  images: [],
  documents: [],
})

const normalizeSectionKey = (raw: string): string =>
  String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')

const sectionAliases = (section: string): Set<string> => {
  const s = normalizeSectionKey(section)
  const out = new Set<string>([s])
  const compact = s.replace(/-/g, '')
  if (compact && compact !== s) out.add(compact)

  const addPair = (a: string, b: string) => {
    if (s === a || s === b) {
      out.add(a)
      out.add(b)
    }
  }

  addPair('disasterdashboard', 'disaster-dashboard')
  addPair('inframodels', 'infra-models')
  addPair('bestpractices', 'best-practices')
  addPair('designtoolkit', 'design-toolkit')
  addPair('riskmaps', 'risk-maps')
  addPair('materialhubs', 'material-hubs')
  addPair('smartconstruction', 'smart-construction')
  addPair('retrofitcalculator', 'retrofit-calculator')
  addPair('applyregion', 'apply-region')
  addPair('liveearthquakemap', 'live-earthquake-map')
  addPair('liveearthquakealerts', 'live-earthquake-alerts')
  addPair('buildingcodes', 'pgbc')
  addPair('readinesscalculator', 'readiness')

  if (s === 'disasterdashboard' || s === 'disaster-dashboard') {
    out.add('disasterdashboard')
    out.add('disaster-dashboard')
  }
  if (s === 'inframodels' || s === 'infra-models') {
    out.add('inframodels')
    out.add('infra-models')
  }
  if (s === 'bestpractices' || s === 'best-practices') {
    out.add('bestpractices')
    out.add('best-practices')
  }
  if (s === 'learn') out.add('learn')
  return out
}

const toTimestamp = (item: Pick<CmsMediaLibraryItem, 'updatedAt' | 'createdAt'>): number => {
  const updated = Date.parse(String(item.updatedAt || ''))
  if (Number.isFinite(updated)) return updated
  const created = Date.parse(String(item.createdAt || ''))
  if (Number.isFinite(created)) return created
  return 0
}

function folderSlugFromSegment(segment: string): string {
  const s = String(segment ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || 'general'
}

function basenameDecoded(pathStr: string): string {
  const last = String(pathStr || '')
    .split(/[?#]/)[0]
    .split('/')
    .filter(Boolean)
    .pop() || ''
  try {
    return decodeURIComponent(last)
  } catch {
    return last
  }
}

const inferFolderFromItem = (item: CmsMediaLibraryItem): string => {
  const explicitFolder = String(item.folder ?? '').trim()
  if (explicitFolder) return folderSlugFromSegment(explicitFolder)
  if (item.page && item.section) return folderSlugFromSegment(item.section)

  const section = normalizeSectionKey(String(item.page || item.section || ''))

  const key = String(item.s3Key || '').trim()
  if (key) {
    const parts = key.split('/').filter(Boolean)
    if (parts[0] === 'resilience360-static' && parts.length >= 3) return parts[2]
    if (section === 'learn') {
      if (parts[0] === 'resilience360' && parts[1] === 'learn') {
        if (parts.length >= 4) return folderSlugFromSegment(parts[2])
        if (parts.length === 3) {
          const stem = parts[2].replace(/\.[^.]+$/i, '')
          return folderSlugFromSegment(stem)
        }
      }
      if (parts[0] === 'learn') {
        if (parts.length >= 3) return folderSlugFromSegment(parts[1])
        if (parts.length === 2) {
          const stem = parts[1].replace(/\.[^.]+$/i, '')
          return folderSlugFromSegment(stem)
        }
      }
    }
  }
  const url = String(item.url || '')
  const m = url.match(/\/resilience360-static\/[^/]+\/([^/?#]+)/i)
  return m?.[1] ? decodeURIComponent(m[1]) : 'general'
}

const inferTypeFromUrl = (url: string): Exclude<CmsMediaLibraryItem['type'], 'background'> => {
  const clean = String(url || '').toLowerCase().split('?')[0]
  if (/\.(mp4|webm|mov|m4v)$/i.test(clean)) return 'video'
  if (/\.(mp3|wav|ogg|aac|m4a)$/i.test(clean)) return 'audio'
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(clean)) return 'image'
  if (/\.pdf$/i.test(clean)) return 'pdf'
  return 'other'
}

const resolveLibraryItemType = (
  item: CmsMediaLibraryItem,
): Exclude<CmsMediaLibraryItem['type'], 'background'> => {
  if (item.type === 'background') {
    const mediaType = String(item.mediaType || '').toLowerCase()
    if (mediaType === 'image' || mediaType === 'video' || mediaType === 'audio' || mediaType === 'pdf') {
      return mediaType
    }
    return inferTypeFromUrl(item.url)
  }
  return item.type || inferTypeFromUrl(item.url)
}

const isLikelyMediaUrl = (url: string): boolean => {
  const u = String(url || '').trim()
  if (!u) return false
  if (/^https?:\/\//i.test(u)) return true
  if (u.startsWith('/api/') || u.startsWith('/storage/content/') || u.startsWith('/media/')) return true
  if (u.startsWith('/')) return true
  return false
}

const toSectionMediaItem = (item: CmsMediaLibraryItem): SectionMediaItem => {
  const type = resolveLibraryItemType(item)
  const folder = inferFolderFromItem(item)
  const s3Key = String(item.s3Key || '').trim()
  const rawUrl = String(item.url || '').trim() || String((item as { videoUrl?: string }).videoUrl || '').trim()
  const explicitFile = String(item.fileName || '').trim()
  const fileFromKey = s3Key ? basenameDecoded(s3Key) : ''
  const fileFromUrl = rawUrl ? basenameDecoded(rawUrl) : ''
  const fileName = explicitFile || fileFromKey || fileFromUrl || undefined
  const titleRaw = String(item.title ?? '').trim()
  const displayTitle = titleRaw || fileName || undefined
  const matchedIdRaw = String((item as { matchedId?: string }).matchedId ?? '').trim()
  const externalKeyRaw = String(item.externalKey ?? '').trim()
  return {
    id: String(item.id || ''),
    assetId: String(item.id || ''),
    url: rawUrl,
    kind: type === 'pdf' ? 'document' : type === 'audio' ? 'audio' : type === 'image' ? 'image' : 'video',
    type,
    section: String(item.page || item.section || ''),
    folder,
    s3Key: s3Key || undefined,
    updatedAt: String(item.updatedAt || item.createdAt || '') || undefined,
    title: displayTitle,
    fileName,
    ...(matchedIdRaw ? { matchedId: matchedIdRaw } : {}),
    ...(externalKeyRaw ? { externalKey: externalKeyRaw } : {}),
  }
}

/**
 * Keep latest upload only per section+folder+type (preferred behavior),
 * then expose lists sorted newest first.
 */
function buildSectionPayloadFromMedia(section: string, rows: CmsMediaLibraryItem[]): SectionContentPayload {
  const aliases = sectionAliases(section)
  const filtered = rows.filter((item) => {
    const pageKey = normalizeSectionKey(String(item.page || item.section || ''))
    return aliases.has(pageKey) && isLikelyMediaUrl(String(item.url || ''))
  })
  const sorted = [...filtered].sort((a, b) => {
    const aOn = a.isActive !== false ? 1 : 0
    const bOn = b.isActive !== false ? 1 : 0
    if (aOn !== bOn) return bOn - aOn
    return toTimestamp(b) - toTimestamp(a)
  })
  const isLearnSection = aliases.has('learn')
  const keepDistinctAssetsSection =
    aliases.has('inframodels') ||
    aliases.has('infra-models') ||
    aliases.has('bestpractices') ||
    aliases.has('best-practices')

  /** Learn catalogue: keep every distinct video row (per `s3Key` / URL), not one winner per folder. */
  let latest: CmsMediaLibraryItem[]
  if (isLearnSection) {
    const seen = new Set<string>()
    latest = sorted.filter((item) => {
      const type = resolveLibraryItemType(item)
      if (type !== 'video') return false
      const k = String(item.s3Key || '').trim() || String(item.url || '').split('?')[0]
      if (!k) return false
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  } else {
    const latestByGroup = new Map<string, CmsMediaLibraryItem>()
    for (const item of sorted) {
      const type = resolveLibraryItemType(item)
      const folder = inferFolderFromItem(item) || 'general'
      const matchedId = String((item as { matchedId?: string }).matchedId || '')
        .trim()
        .toLowerCase()
      const fileName = String(item.fileName || '')
        .trim()
        .toLowerCase()
      const s3Key = String(item.s3Key || '')
        .trim()
        .toLowerCase()
      const rawUrl = String(item.url || '').trim().split('?')[0].toLowerCase()
      const uniqueToken =
        keepDistinctAssetsSection ?
          matchedId || fileName || s3Key || rawUrl || folder.toLowerCase()
        : folder.toLowerCase()
      const key = `${normalizeSectionKey(item.section)}|${type}|${uniqueToken}`
      if (!latestByGroup.has(key)) latestByGroup.set(key, item)
    }
    latest = [...latestByGroup.values()].sort((a, b) => toTimestamp(b) - toTimestamp(a))
  }
  const videos: SectionMediaItem[] = []
  const images: SectionMediaItem[] = []
  const documents: SectionMediaItem[] = []
  const audio: SectionMediaItem[] = []
  const groupedByFolder: Record<string, DisasterFolderMedia> = {}

  for (const raw of latest) {
    const item = toSectionMediaItem(raw)
    if (!item.url) continue
    const folder = item.folder || 'general'
    if (!groupedByFolder[folder]) groupedByFolder[folder] = {}
    if (item.type === 'video') {
      videos.push(item)
      groupedByFolder[folder].video = item.url
    } else if (item.type === 'image') {
      images.push(item)
      groupedByFolder[folder].image = item.url
    } else if (item.type === 'audio') {
      audio.push(item)
      groupedByFolder[folder].audio = item.url
    } else if (item.type === 'pdf') {
      documents.push(item)
      groupedByFolder[folder].pdf = item.url
      groupedByFolder[folder].document = item.url
    }
  }
  const latestTs = latest.length > 0 ? toTimestamp(latest[0]) : 0
  const isInfraModelsSection = aliases.has('inframodels') || aliases.has('infra-models')
  let normalizedVideos = videos
  if (isInfraModelsSection) {
    /** Infra overview video must always come from latest Mongo/S3 upload only. */
    normalizedVideos = videos.slice(0, 1)
  }
  if (aliases.has('learn')) {
    normalizedVideos = normalizedVideos.filter(
      (v) =>
        !isExcludedLearnCatalogRow({
          id: String(v.matchedId || v.id || '').trim(),
          title: v.title,
          fileName: v.fileName,
          url: v.url,
          s3Key: v.s3Key,
          externalKey: v.externalKey,
        }),
    )
  }
  return {
    section,
    updatedAt: latestTs > 0 ? new Date(latestTs).toISOString() : undefined,
    videos: normalizedVideos,
    images,
    documents,
    audio,
    groupedByFolder: Object.keys(groupedByFolder).length > 0 ? groupedByFolder : undefined,
  }
}

/**
 * Build fetch URLs through the section manifest API endpoint.
 */
export function buildSectionContentFetchTargets(section: string): string[] {
  const safe = String(section ?? '')
    .trim()
    .replace(/[^a-z0-9-]/gi, '')
    .toLowerCase()
  if (!safe) return []

  const enc = encodeURIComponent(safe)
  const paths = [`/api/section-content/${enc}`]
  const seen = new Set<string>()
  const out: string[] = []
  for (const p of paths) {
    for (const t of buildApiTargets(p)) {
      if (!seen.has(t)) {
        seen.add(t)
        out.push(t)
      }
    }
  }
  return out
}

/**
 * Fetches admin-configured content for a section (MongoDB-backed; includes disaster folder map when applicable).
 */
export async function fetchSectionContent(section: string): Promise<SectionContentPayload> {
  const safe = String(section ?? '')
    .trim()
    .replace(/[^a-z0-9-]/gi, '')
    .toLowerCase()
  if (!safe) return emptyPayload('')

  /** Learn: bundled static catalog (no Mongo media query). */
  if (safe === 'learn') {
    const { staticLearnItemsAsMediaLibrary } = await import('./learnStaticCatalog')
    const scoped = staticLearnItemsAsMediaLibrary()
    if (scoped.length > 0) {
      return buildSectionPayloadFromMedia(safe, scoped)
    }
  }

  /** Material Hubs is fully static and does not fetch CMS/API section content. */
  if (safe === 'materialhubs' || safe === 'material-hubs') {
    return emptyPayload('material-hubs')
  }

  /** Disaster Dashboard is fully static and does not fetch CMS/API section content. */
  if (safe === 'disasterdashboard' || safe === 'disaster-dashboard') {
    return emptyPayload('disaster-dashboard')
  }
  /** Static S3 architecture: all other sections resolve from local config/constants. */
  return emptyPayload(safe)
}

