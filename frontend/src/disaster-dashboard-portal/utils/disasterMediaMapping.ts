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
  'storm-cyclone': ['storm-cyclone', 'stormcyclone', 'storm cyclone', 'cyclone', 'storm'],
  landslide: ['landslide', 'land slide'],
  'cold-wave': ['cold-wave', 'coldwave', 'cold wave'],
  smog: ['smog'],
}

let disasterFolderCache: Record<string, FolderRow> | null = null
let disasterLoadPromise: Promise<void> | null = null
const DISASTER_MEDIA_ROOT = 'content/disaster-dashboard'
const FALLBACK_AUDIO_EXTENSIONS = ['mp3', 'm4a', 'wav', 'ogg']
const FALLBACK_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']
const FALLBACK_VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v']

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

function titleCaseWords(words: string[]): string {
  return words
    .map((word) => {
      const clean = String(word ?? '').trim()
      return clean ? `${clean[0].toUpperCase()}${clean.slice(1).toLowerCase()}` : ''
    })
    .filter(Boolean)
    .join(' ')
}

function variantTokens(raw: string): string[] {
  const canonical = normalizeDisasterKey(raw)
  if (!canonical) return []
  const words = canonical.split('-').filter(Boolean)
  const compactLower = words.join('')
  const compactUpper = compactLower.toUpperCase()
  const lowerHyphen = words.join('-')
  const lowerUnderscore = words.join('_')
  const lowerSpace = words.join(' ')
  const upperHyphen = lowerHyphen.toUpperCase()
  const upperUnderscore = lowerUnderscore.toUpperCase()
  const upperSpace = lowerSpace.toUpperCase()
  const titleSpace = titleCaseWords(words)

  return [
    upperSpace,
    upperUnderscore,
    upperHyphen,
    lowerHyphen,
    lowerUnderscore,
    lowerSpace,
    compactLower,
    compactUpper,
    titleSpace,
  ].filter(Boolean)
}

function folderTokens(raw: string): string[] {
  const canonical = normalizeDisasterKey(raw)
  if (!canonical) return []
  const words = canonical.split('-').filter(Boolean)
  return [...new Set([words.join('-'), words.join('_'), words.join(' '), words.join('')].filter(Boolean))]
}

function joinEncodedPath(base: string, ...segments: string[]): string {
  const cleanBase = String(base ?? '').trim().replace(/\/+$/, '')
  const encoded = segments
    .map((segment) => String(segment ?? '').trim())
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return `${cleanBase}/${encoded}`
}

function buildCandidateFileUrls(base: string, dir: string, names: string[], extensions: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const name of names) {
    const cleanName = String(name ?? '').trim()
    if (!cleanName) continue
    for (const ext of extensions) {
      const cleanExt = String(ext ?? '').trim().replace(/^\./, '')
      if (!cleanExt) continue
      const url = joinEncodedPath(base, dir, `${cleanName}.${cleanExt}`)
      if (seen.has(url)) continue
      seen.add(url)
      out.push(url)
    }
  }
  return out
}

async function probeReachableUrl(urls: string[]): Promise<string | undefined> {
  for (const url of urls) {
    try {
      const head = await fetch(url, { method: 'HEAD', cache: 'no-store' })
      if (head.ok) return url
    } catch {
      // Continue probing fallbacks when HEAD is blocked or URL is unreachable.
    }
  }
  return undefined
}

function resolveDisasterContentBase(payload: MediaMetadataPayload): string {
  const sourceMetadata = String(payload.source?.metadataUrl ?? '').trim()
  if (sourceMetadata) {
    const stripped = sourceMetadata.replace(/\/metadata\.json(?:\?.*)?$/i, '').replace(/\/+$/, '')
    if (stripped) return stripped
  }
  const mediaBase = String(payload.source?.mediaBaseUrl ?? '').trim().replace(/\/+$/, '')
  if (mediaBase) {
    if (/\/content$/i.test(mediaBase)) return `${mediaBase}/disaster-dashboard`
    if (/\/content\/disaster-dashboard$/i.test(mediaBase)) return mediaBase
    return `${mediaBase}/${DISASTER_MEDIA_ROOT}`
  }
  return `/${DISASTER_MEDIA_ROOT}`
}

async function buildFallbackRow(base: string, hazardId: string, aliases: string[]): Promise<FolderRow> {
  const keys = [hazardId, ...aliases]
  const names = [...new Set(keys.flatMap((key) => variantTokens(key)).filter(Boolean))]
  const folders = [...new Set(keys.flatMap((key) => folderTokens(key)).filter(Boolean))]

  const imageUrl =
    (await probeReachableUrl(buildCandidateFileUrls(base, 'images', names, FALLBACK_IMAGE_EXTENSIONS))) ??
    (await probeReachableUrl(buildCandidateFileUrls(base, 'images', names, FALLBACK_VIDEO_EXTENSIONS))) ??
    ''
  const videoUrl =
    (await probeReachableUrl(buildCandidateFileUrls(base, 'videos', names, FALLBACK_VIDEO_EXTENSIONS))) ?? ''

  const lowerAudioNames = [
    ...new Set(
      keys
        .flatMap((key) => folderTokens(key))
        .map((value) => value.toLowerCase().trim())
        .filter(Boolean),
    ),
  ]
  const audioVariantNames = [...new Set(keys.flatMap((key) => variantTokens(key)).filter(Boolean))]
  const audioFileNames = [
    ...new Set(['audio', 'guidance', 'main', 'track', 'before', 'during', 'after', ...lowerAudioNames, ...audioVariantNames]),
  ]
  const audioCandidates: string[] = []
  const seenAudio = new Set<string>()
  for (const folder of folders) {
    for (const fileName of audioFileNames) {
      for (const ext of FALLBACK_AUDIO_EXTENSIONS) {
        const url = joinEncodedPath(base, 'audio', folder, `${fileName}.${ext}`)
        if (seenAudio.has(url)) continue
        seenAudio.add(url)
        audioCandidates.push(url)
      }
    }
  }
  for (const folder of folders) {
    for (const ext of FALLBACK_AUDIO_EXTENSIONS) {
      const direct = joinEncodedPath(base, 'audio', `${folder}.${ext}`)
      if (!seenAudio.has(direct)) {
        seenAudio.add(direct)
        audioCandidates.push(direct)
      }
    }
  }
  const audioUrl = (await probeReachableUrl(audioCandidates)) ?? ''

  return {
    imageCandidates: imageUrl ? [imageUrl] : [],
    videoCandidates: videoUrl ? [videoUrl] : [],
    audioCandidates: audioUrl ? [audioUrl] : [],
    pdfCandidates: [],
  }
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

    const base = resolveDisasterContentBase(payload)
    const nextCache = { ...(disasterFolderCache ?? {}) }
    const hazardIds = Object.keys(DISASTER_ALIAS_MAP)
    await Promise.all(
      hazardIds.map(async (hazardId) => {
        const canonical = normalizeDisasterKey(hazardId)
        if (!canonical) return
        const row = nextCache[canonical]
        if (row && row.imageCandidates.length > 0 && row.videoCandidates.length > 0 && row.audioCandidates.length > 0) {
          return
        }
        const fallback = await buildFallbackRow(base, canonical, DISASTER_ALIAS_MAP[canonical] ?? [])
        if (fallback.imageCandidates.length === 0 && fallback.videoCandidates.length === 0 && fallback.audioCandidates.length === 0) {
          return
        }
        const merged: FolderRow = {
          imageCandidates: row?.imageCandidates.length ? row.imageCandidates : fallback.imageCandidates,
          videoCandidates: row?.videoCandidates.length ? row.videoCandidates : fallback.videoCandidates,
          audioCandidates: row?.audioCandidates.length ? row.audioCandidates : fallback.audioCandidates,
          pdfCandidates: row?.pdfCandidates ?? [],
        }
        nextCache[canonical] = merged
        for (const alias of DISASTER_ALIAS_MAP[canonical] ?? []) {
          const aliasKey = normalizeDisasterKey(alias)
          if (!aliasKey) continue
          nextCache[aliasKey] = merged
        }
      }),
    )
    disasterFolderCache = nextCache
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
