import { buildApiTargets } from '@/services/apiBase'

type HazardResolved = {
  hazardId?: string
  aliases?: unknown
  images?: unknown
  videos?: unknown
  audio?: unknown
  pdfs?: unknown
  gallery?: unknown
  guidanceImages?: unknown
  thumbnail?: unknown
  poster?: unknown
  video?: unknown
  audioPrimary?: unknown
  pdf?: unknown
}

type MediaMetadataPayload = {
  ok?: boolean
  source?: { metadataUrl?: string; mediaBaseUrl?: string }
  aliases?: Record<string, string[]>
  hazards?: Record<string, HazardResolved>
}

type FolderRow = {
  imageCandidates: string[]
  videoCandidates: string[]
  audioCandidates: string[]
  pdfCandidates: string[]
}

const DISASTER_ALIAS_MAP: Record<string, string[]> = {
  flood: ['flood'],
  earthquake: ['earthquake'],
  'urban-fire': ['urban-fire', 'urbanfire', 'urban fire'],
  'crop-fire': ['crop-fire', 'cropfire', 'crop fire'],
  heatwave: ['heatwave', 'heat-wave', 'heat wave'],
  'load-shedding': ['load-shedding', 'loadshedding', 'load shedding', 'loadscheduling'],
  'storm-cyclone': ['storm-cyclone', 'stormcyclone', 'storm cyclone', 'cyclone'],
  landslide: ['landslide', 'land slide'],
  'cold-wave': ['cold-wave', 'coldwave', 'cold wave'],
  smog: ['smog'],
}

let disasterFolderCache: Record<string, FolderRow> | null = null
let disasterLoadPromise: Promise<void> | null = null

function devLog(...args: unknown[]): void {
  if (!import.meta.env.DEV) return
  console.info('[disaster-media]', ...args)
}

function normalizeDisasterKey(raw: string): string {
  const normalized = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s*\/\s*/g, '-')
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  const compact = normalized.replace(/-/g, '')
  if (compact === 'stormcyclone' || compact === 'cyclone') return 'storm-cyclone'
  if (compact === 'loadshedding' || compact === 'loadscheduling') return 'load-shedding'
  if (compact === 'urbanfire') return 'urban-fire'
  if (compact === 'cropfire') return 'crop-fire'
  if (compact === 'coldwave') return 'cold-wave'
  return normalized
}

function extractUrl(value: unknown): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    const candidate = (value as { url?: unknown }).url
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }
  return undefined
}

function extractUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const one = extractUrl(value)
    return one ? [one] : []
  }
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of value) {
    const url = extractUrl(item)
    if (!url) continue
    const dedupe = url.split('?')[0]
    if (seen.has(dedupe)) continue
    seen.add(dedupe)
    out.push(url)
  }
  return out
}

function toFolderRow(value: HazardResolved | undefined): FolderRow {
  const images = extractUrls(value?.guidanceImages).concat(extractUrls(value?.gallery), extractUrls(value?.images))
  const imageCandidates = [...new Set(images)]
  const videoCandidates = [...new Set(extractUrls(value?.videos).concat(extractUrls(value?.video)))]
  const audioCandidates = [...new Set(extractUrls(value?.audio).concat(extractUrls(value?.audioPrimary)))]
  const pdfCandidates = [...new Set(extractUrls(value?.pdfs).concat(extractUrls(value?.pdf)))]
  return { imageCandidates, videoCandidates, audioCandidates, pdfCandidates }
}

function mergeIntoCache(hazards: Record<string, HazardResolved>, aliasesFromApi?: Record<string, string[]>): void {
  const next: Record<string, FolderRow> = {}
  for (const [rawKey, hazard] of Object.entries(hazards)) {
    const canonical = normalizeDisasterKey(rawKey)
    if (!canonical) continue
    const row = toFolderRow(hazard)
    next[canonical] = row

    const aliases = [
      ...(Array.isArray(aliasesFromApi?.[rawKey]) ? aliasesFromApi![rawKey] : []),
      ...(Array.isArray(hazard.aliases) ? (hazard.aliases as string[]) : []),
      ...(DISASTER_ALIAS_MAP[canonical] ?? []),
    ]
    for (const alias of aliases) {
      const aliasKey = normalizeDisasterKey(alias)
      if (!aliasKey || next[aliasKey]) continue
      next[aliasKey] = row
    }
  }
  disasterFolderCache = next
}

export function folderSlugCandidates(normalizedKey: string): string[] {
  const canonical = normalizeDisasterKey(normalizedKey)
  const aliases = DISASTER_ALIAS_MAP[canonical] ?? [canonical]
  return [...new Set([canonical, ...aliases.map((v) => normalizeDisasterKey(v)).filter(Boolean)])]
}

export function resetDisasterDashboardMediaCache(): void {
  disasterFolderCache = null
  disasterLoadPromise = null
}

export function toWebSafeUrl(value?: string | null): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export async function loadDisasterMediaManifest(): Promise<void> {
  if (disasterLoadPromise) return disasterLoadPromise
  disasterLoadPromise = (async () => {
    const targets = [...new Set(buildApiTargets('/api/disaster-dashboard/media-metadata'))]
    let payload: MediaMetadataPayload | null = null
    let endpointUsed = ''

    for (const endpoint of targets) {
      try {
        devLog('metadata endpoint', endpoint)
        const response = await fetch(endpoint, { cache: 'no-store' })
        if (!response.ok) {
          devLog('metadata endpoint status', endpoint, response.status)
          continue
        }
        payload = (await response.json()) as MediaMetadataPayload
        endpointUsed = endpoint
        break
      } catch (error) {
        devLog('metadata endpoint failed', endpoint, String(error))
      }
    }

    if (!payload?.hazards || typeof payload.hazards !== 'object') {
      disasterFolderCache = {}
      devLog('metadata received empty hazards')
      return
    }

    devLog('metadata received', {
      endpoint: endpointUsed,
      source: payload.source,
      hazards: Object.keys(payload.hazards),
    })

    mergeIntoCache(payload.hazards, payload.aliases)
  })()

  return disasterLoadPromise
}

export async function loadDisasterSignedVideo(_disasterId: string): Promise<void> {
  await loadDisasterMediaManifest()
}

export function resolveDisasterMediaCandidates(disasterId: string): {
  imageCandidates: string[]
  videoCandidates: string[]
  audioCandidates: string[]
} {
  const key = normalizeDisasterKey(disasterId)
  const slugCandidates = folderSlugCandidates(key)
  for (const slug of slugCandidates) {
    const row = disasterFolderCache?.[slug]
    if (!row) continue
    devLog('resolved hazard mapping', { disasterId, slug, row })
    return {
      imageCandidates: [...row.imageCandidates],
      videoCandidates: [...row.videoCandidates],
      audioCandidates: [...row.audioCandidates],
    }
  }
  devLog('resolved hazard mapping missing', { disasterId, slugCandidates })
  return { imageCandidates: [], videoCandidates: [], audioCandidates: [] }
}
