import { buildApiTargets, buildApiUrl } from '@/services/apiBase'

type FolderRow = { video?: string; audio?: string; image?: string }
type DisasterMediaRow = {
  section?: unknown
  page?: unknown
  folder?: unknown
  type?: unknown
  mediaType?: unknown
  url?: unknown
  s3Key?: unknown
}

/** Keep aligned with Android Disaster Dashboard media resolver behavior. */
const DEFAULT_S3_PUBLIC_BASE = 'https://pak-population-data.s3.eu-north-1.amazonaws.com'

function buildPortalApiTargets(path: string): string[] {
  if (!path.startsWith('/')) throw new Error(`API path must start with '/': ${path}`)
  try {
    return buildApiTargets(path)
  } catch {
    return [path]
  }
}

function buildPortalApiUrl(path: string): string {
  if (!path.startsWith('/')) throw new Error(`API path must start with '/': ${path}`)
  try {
    return buildApiUrl(path)
  } catch {
    return path
  }
}

function isLikelyS3ObjectKey(raw: string): boolean {
  const s = String(raw ?? '').trim().toLowerCase()
  if (!s) return false
  return (
    s.startsWith('resilience360/disaster-dashboard/') ||
    s.startsWith('disaster-dashboard/') ||
    s.startsWith('for-disaster-dashboard/')
  )
}

function toApiMediaProxyFromKey(raw: string): string {
  const canonical = String(raw ?? '')
    .trim()
    .replace(/^\/+/, '')
    .split('?')[0]
  return absoluteProxyUrlForS3Key(canonical)
}

function absoluteProxyUrlForS3Key(canonicalKey: string): string {
  const segments = canonicalKey
    .split('/')
    .filter(Boolean)
    .map((s) => encodeURIComponent(s))
  const rel = `/static/media/s3/${segments.join('/')}`
  if (typeof window === 'undefined') return rel
  try {
    return buildPortalApiUrl(rel)
  } catch {
    return rel
  }
}

/** Template fallback when manifest has no row. */
function templateUrlsForFolderSlug(folderSlug: string): FolderRow {
  const id = folderSlug.trim().toLowerCase()
  if (!id) return {}
  const baseKey = `resilience360/disaster-dashboard/${id}`
  return {
    video: '',
    audio: absoluteProxyUrlForS3Key(`${baseKey}/audio.m4a`),
    image: absoluteProxyUrlForS3Key(`${baseKey}/image.png`),
  }
}

function rewriteDirectHttpsDisasterDashboard(trimmed: string): string | null {
  const base = DEFAULT_S3_PUBLIC_BASE.replace(/\/+$/, '')
  const lower = trimmed.toLowerCase()
  if (!lower.startsWith(`${base.toLowerCase()}/`)) return null
  const pathPart = trimmed.slice(base.length + 1).split('?')[0]
  let key: string
  try {
    key = decodeURIComponent(pathPart)
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  } catch {
    return null
  }
  if (
    !key.startsWith('resilience360/disaster-dashboard/') &&
    !key.startsWith('disaster-dashboard/') &&
    !key.startsWith('for-disaster-dashboard/')
  ) {
    return null
  }
  return absoluteProxyUrlForS3Key(key)
}

const DISASTER_TO_FOLDER: Record<string, string> = {
  flood: 'flood',
  earthquake: 'earthquake',
  cyclone: 'cyclone',
  'urban-fire': 'urban-fire',
  'crop-fire': 'crop-fire',
  heatwave: 'heatwave',
  loadshedding: 'loadshedding',
  'load-shedding': 'load-shedding',
  'storm-cyclone': 'storm-cyclone',
  landslide: 'landslide',
  'cold-wave': 'cold-wave',
  smog: 'smog',
}

function normalizeFolderSlug(raw: string): string {
  const normalized = String(raw ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s*\/\s*/g, '-')
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!normalized) return ''
  const compact = normalized.replace(/-/g, '')
  if (compact === 'stormcyclone' || compact === 'cyclone') return 'storm-cyclone'
  if (compact === 'loadshedding' || compact === 'loadscheduling' || compact === 'loadshedding') return 'load-shedding'
  if (compact === 'urbanfire') return 'urban-fire'
  if (compact === 'cropfire') return 'crop-fire'
  if (compact === 'coldwave') return 'cold-wave'
  return normalized
}

function inferFolderSlugFromMediaRow(row: DisasterMediaRow): string {
  const folder = normalizeFolderSlug(String(row.folder ?? ''))
  if (folder) return folder
  const s3Key = String(row.s3Key ?? '').trim().toLowerCase()
  if (s3Key) {
    const parts = s3Key.split('/').filter(Boolean)
    if (parts[0] === 'resilience360' && parts[1] === 'disaster-dashboard' && parts[2]) {
      return normalizeFolderSlug(parts[2])
    }
    if ((parts[0] === 'disaster-dashboard' || parts[0] === 'for-disaster-dashboard') && parts[1]) {
      return normalizeFolderSlug(parts[1])
    }
  }
  return ''
}

function inferMediaTypeFromRow(row: DisasterMediaRow): 'video' | 'audio' | 'image' | '' {
  const explicit = String(row.type ?? row.mediaType ?? '').trim().toLowerCase()
  if (explicit === 'video' || explicit === 'audio' || explicit === 'image') return explicit
  const url = String(row.url ?? '').trim().toLowerCase().split('?')[0]
  if (/\.(mp4|webm|mov|m4v)$/i.test(url)) return 'video'
  if (/\.(m4a|mp3|wav|ogg|aac)$/i.test(url)) return 'audio'
  if (/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(url)) return 'image'
  return ''
}

function isDisasterSectionRow(row: DisasterMediaRow): boolean {
  const sec = String(row.section ?? row.page ?? '').trim().toLowerCase()
  return sec === 'disaster-dashboard' || sec === 'disasterdashboard'
}

export function folderSlugCandidates(normalizedKey: string): string[] {
  const k = normalizedKey.toLowerCase()
  const folder = (DISASTER_TO_FOLDER[k] ?? 'earthquake').toLowerCase()
  if (k === 'storm-cyclone' || folder === 'storm-cyclone') {
    return ['storm-cyclone', 'cyclone']
  }
  if (k === 'load-shedding' || folder === 'load-shedding') {
    return ['load-shedding', 'loadshedding', 'loadscheduling']
  }
  return [folder]
}

function coerceFolderMediaUrl(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const t = value.trim()
    return t.length > 0 ? t : undefined
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const picked = coerceFolderMediaUrl(item)
      if (picked) return picked
    }
    return undefined
  }
  if (value && typeof value === 'object') {
    const maybeUrl = (value as { url?: unknown }).url
    if (typeof maybeUrl === 'string') {
      const t = maybeUrl.trim()
      return t.length > 0 ? t : undefined
    }
  }
  return undefined
}

function firstMediaUrl(arr: unknown, legacy?: unknown): string | undefined {
  if (Array.isArray(arr) && arr.length > 0) {
    const el = arr[0] as { url?: string } | string
    if (typeof el === 'string' && el.trim()) return el.trim()
    if (el && typeof el === 'object' && typeof (el as { url?: string }).url === 'string') {
      const u = String((el as { url: string }).url).trim()
      if (u) return u
    }
  }
  return coerceFolderMediaUrl(legacy)
}

let disasterFolderCache: Record<string, FolderRow> | null = null
let disasterLoadPromise: Promise<void> | null = null

type SignedDisasterPlayback = {
  videoUrl: string
  title: string
  description: string
  fetchedAt: number
  expiresAt: number
}

const signedDisasterPlaybackByKey: Record<string, SignedDisasterPlayback> = {}
const signedPlaybackNegativeAt: Record<string, number> = {}
const SIGNED_PLAYBACK_TTL_MS = 8 * 60 * 1000
const SIGNED_PLAYBACK_NEGATIVE_MS = 45 * 1000
const SIGNED_PLAYBACK_REFRESH_GUARD_MS = 75 * 1000

function parseSignedUrlExpiryMs(url: string, fetchedAt: number): number {
  const fallback = fetchedAt + SIGNED_PLAYBACK_TTL_MS
  try {
    const parsed = new URL(url)
    const amzDateRaw = parsed.searchParams.get('X-Amz-Date') ?? parsed.searchParams.get('x-amz-date') ?? ''
    const amzExpiresRaw = parsed.searchParams.get('X-Amz-Expires') ?? parsed.searchParams.get('x-amz-expires') ?? ''
    const amzExpiresSeconds = Number(amzExpiresRaw)
    if (!amzDateRaw || !Number.isFinite(amzExpiresSeconds) || amzExpiresSeconds <= 0) return fallback
    const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(amzDateRaw.trim())
    if (!m) return fallback
    const signedAt = Date.UTC(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
      Number(m[6]),
    )
    if (!Number.isFinite(signedAt)) return fallback
    return signedAt + Math.floor(amzExpiresSeconds * 1000)
  } catch {
    return fallback
  }
}

function isSignedPlaybackFresh(row: SignedDisasterPlayback | undefined, now: number, minRemainingMs = 0): boolean {
  if (!row?.videoUrl) return false
  if (now - row.fetchedAt >= SIGNED_PLAYBACK_TTL_MS) return false
  return now + Math.max(0, minRemainingMs) < row.expiresAt
}

export function resetDisasterDashboardMediaCache(): void {
  disasterFolderCache = null
  disasterLoadPromise = null
  for (const k of Object.keys(signedDisasterPlaybackByKey)) delete signedDisasterPlaybackByKey[k]
  for (const k of Object.keys(signedPlaybackNegativeAt)) delete signedPlaybackNegativeAt[k]
}

function normalizeDisasterVideoKey(raw: string): string {
  return String(raw ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s*\/\s*/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function folderRowForCandidate(disasterKey: string, candidateSlug: string): FolderRow | undefined {
  const slug = normalizeFolderSlug(candidateSlug)
  const key = normalizeFolderSlug(disasterKey)
  return disasterFolderCache?.[slug] ?? disasterFolderCache?.[key]
}

function activeSignedVideoUrlForKey(disasterKey: string): string | undefined {
  const key = normalizeDisasterVideoKey(disasterKey)
  const now = Date.now()
  for (const slug of [key, ...folderSlugCandidates(key)]) {
    const row = signedDisasterPlaybackByKey[slug]
    if (isSignedPlaybackFresh(row, now)) {
      return String(row.videoUrl).trim()
    }
  }
  return undefined
}

function enforceHttpsWhenPageIsHttps(url: string): string {
  const raw = String(url ?? '').trim()
  if (!raw) return raw
  if (typeof window === 'undefined') return raw
  if (window.location.protocol !== 'https:') return raw
  if (!/^http:\/\//i.test(raw)) return raw
  try {
    const parsed = new URL(raw)
    const host = parsed.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1') return raw
  } catch {
    return raw
  }
  return raw.replace(/^http:\/\//i, 'https://')
}

export function toWebSafeUrl(value?: string | null): string | undefined {
  if (value == null || typeof value !== 'string') return undefined

  const trimmed = value.trim()
  if (!trimmed) return undefined

  if (isLikelyS3ObjectKey(trimmed)) {
    return toApiMediaProxyFromKey(trimmed)
  }

  if (/^[a-zA-Z]:\\/.test(trimmed) || /^file:\/\//i.test(trimmed)) {
    return undefined
  }

  const normalizedApiPath =
    trimmed.startsWith('/static/media/s3/') ? trimmed
    : trimmed.startsWith('api/media/s3/') ? `/${trimmed}`
    : ''
  if (normalizedApiPath) {
    try {
      return buildPortalApiUrl(normalizedApiPath)
    } catch {
      return normalizedApiPath
    }
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed)
      const pathWithQuery = `${parsed.pathname}${parsed.search || ''}`
      if (pathWithQuery.startsWith('/static/media/s3/')) {
        try {
          return buildPortalApiUrl(pathWithQuery)
        } catch {
          return pathWithQuery
        }
      }
    } catch {
      // keep legacy absolute URL fallback below
    }
    const proxied = rewriteDirectHttpsDisasterDashboard(trimmed)
    if (proxied) return proxied
    return enforceHttpsWhenPageIsHttps(trimmed)
  }

  if (trimmed.startsWith('/')) return trimmed
  if (trimmed.startsWith('api/')) return `/${trimmed}`
  if (trimmed.startsWith('content/')) return `/${trimmed}`

  try {
    return new URL(trimmed, window.location.origin).toString()
  } catch {
    return undefined
  }
}

function appendCacheBust(url: string, t: number): string {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}t=${t}`
}

export async function loadDisasterMediaManifest(): Promise<void> {
  if (disasterLoadPromise) return disasterLoadPromise
  disasterLoadPromise = (async () => {
    try {
      const candidateUrls = [
        ...buildPortalApiTargets('/static/disaster-dashboard'),
        ...buildPortalApiTargets('/content/disasterdashboard'),
        ...buildPortalApiTargets('/static/content/disasterdashboard'),
      ]
      const seen = new Set<string>()
      let res: Response | null = null
      for (const url of candidateUrls) {
        if (seen.has(url)) continue
        seen.add(url)
        try {
          const attempt = await fetch(url, { cache: 'no-store' })
          if (attempt.ok) {
            res = attempt
            break
          }
        } catch {
          // keep trying fallbacks
        }
      }
      if (!res || !res.ok) {
        disasterFolderCache = {}
        return
      }

      let data: Record<string, unknown>
      try {
        data = (await res.json()) as Record<string, unknown>
      } catch {
        disasterFolderCache = {}
        return
      }

      const next: Record<string, FolderRow> = {}
      const skipTop = new Set(['section', 'updatedAt', 'videos', 'images', 'audio', 'documents', 'groupedByFolder'])

      const ingestFolderRow = (folderKey: string, row: unknown) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) return
        const slug = normalizeFolderSlug(folderKey)
        if (!slug) return
        const r = row as FolderRow & { images?: unknown; videos?: unknown; audio?: unknown }
        if (Array.isArray(r.images) || Array.isArray(r.videos) || Array.isArray(r.audio)) {
          const legacy = row as FolderRow
          next[slug] = {
            image: firstMediaUrl(r.images, legacy.image),
            video: firstMediaUrl(r.videos, legacy.video),
            audio: firstMediaUrl(r.audio, legacy.audio),
          }
          return
        }
        next[slug] = {
          video: coerceFolderMediaUrl(r.video),
          audio: coerceFolderMediaUrl(r.audio),
          image: coerceFolderMediaUrl(r.image),
        }
      }

      for (const [k, v] of Object.entries(data)) {
        if (skipTop.has(k)) continue
        if (k === 'groupedByFolder' && v && typeof v === 'object' && !Array.isArray(v)) {
          for (const [folderKey, row] of Object.entries(v as Record<string, unknown>)) {
            ingestFolderRow(folderKey, row)
          }
          continue
        }
        if (Array.isArray(v)) continue
        if (v && typeof v === 'object') ingestFolderRow(k, v)
      }

      const items = Array.isArray((data as { items?: unknown }).items)
        ? ((data as { items: unknown[] }).items as DisasterMediaRow[])
        : []
      if (items.length > 0) {
        for (const row of items) {
          if (!row || typeof row !== 'object') continue
          if (!isDisasterSectionRow(row)) continue
          const folder = inferFolderSlugFromMediaRow(row)
          if (!folder) continue
          const mediaType = inferMediaTypeFromRow(row)
          if (!mediaType) continue
          const safeUrl = coerceFolderMediaUrl(row.url)
          if (!safeUrl) continue
          const prev = next[folder] || {}
          next[folder] = {
            ...prev,
            ...(mediaType === 'video' ? { video: prev.video || safeUrl } : {}),
            ...(mediaType === 'audio' ? { audio: prev.audio || safeUrl } : {}),
            ...(mediaType === 'image' ? { image: prev.image || safeUrl } : {}),
          }
        }
      }

      const pages = data.pages
      if (Array.isArray(pages)) {
        for (const p of pages) {
          if (!p || typeof p !== 'object') continue
          const hid = String((p as { hazardId?: string }).hazardId ?? '')
            .trim()
            .toLowerCase()
          if (!hid || hid === 'portal') continue
          const m = (p as { media?: unknown }).media
          if (!m || typeof m !== 'object' || Array.isArray(m)) continue
          const r = m as FolderRow
          const slug = normalizeFolderSlug(hid)
          if (!slug) continue
          const prev = next[slug] || {}
          next[slug] = {
            video: coerceFolderMediaUrl(r.video) ?? prev.video,
            audio: coerceFolderMediaUrl(r.audio) ?? prev.audio,
            image: coerceFolderMediaUrl(r.image) ?? prev.image,
          }
        }
      }

      const mergeFolderRow = (toKey: string, fromKey: string) => {
        const from = next[fromKey]
        if (!from) return
        const to = next[toKey] || {}
        next[toKey] = {
          video: coerceFolderMediaUrl(to.video) ?? coerceFolderMediaUrl(from.video),
          audio: coerceFolderMediaUrl(to.audio) ?? coerceFolderMediaUrl(from.audio),
          image: coerceFolderMediaUrl(to.image) ?? coerceFolderMediaUrl(from.image),
        }
      }
      mergeFolderRow('load-shedding', 'loadshedding')
      mergeFolderRow('load-shedding', 'loadscheduling')
      mergeFolderRow('storm-cyclone', 'cyclone')

      disasterFolderCache = next
    } catch {
      disasterFolderCache = {}
    }
  })()
  return disasterLoadPromise
}

export async function loadDisasterSignedVideo(disasterId: string): Promise<void> {
  const key = normalizeDisasterVideoKey(disasterId)
  const now = Date.now()
  const slugs = folderSlugCandidates(key)
  const cacheKeys = [key, ...slugs]
  for (const k of cacheKeys) {
    const row = signedDisasterPlaybackByKey[k]
    if (isSignedPlaybackFresh(row, now, SIGNED_PLAYBACK_REFRESH_GUARD_MS)) {
      signedDisasterPlaybackByKey[key] = row
      return
    }
  }

  for (const slug of slugs) {
    const negAt = signedPlaybackNegativeAt[slug]
    if (negAt && now - negAt < SIGNED_PLAYBACK_NEGATIVE_MS) continue

    const enc = encodeURIComponent(slug)
    const targets = [...new Set(buildPortalApiTargets(`/static/media/${enc}`))]
    let res: Response | null = null
    for (const url of targets) {
      try {
        const attempt = await fetch(url, { cache: 'no-store' })
        if (attempt.ok) {
          res = attempt
          break
        }
      } catch {
        // try next
      }
    }

    if (!res?.ok) {
      signedPlaybackNegativeAt[slug] = Date.now()
      continue
    }

    let data: { videoUrl?: string; title?: string; description?: string }
    try {
      data = (await res.json()) as { videoUrl?: string; title?: string; description?: string }
    } catch {
      signedPlaybackNegativeAt[slug] = Date.now()
      continue
    }

    const rawVideoUrl = typeof data.videoUrl === 'string' ? data.videoUrl.trim() : ''
    const videoUrl = toWebSafeUrl(rawVideoUrl) ?? enforceHttpsWhenPageIsHttps(rawVideoUrl)
    if (!videoUrl) {
      signedPlaybackNegativeAt[slug] = Date.now()
      continue
    }

    const row: SignedDisasterPlayback = {
      videoUrl,
      title: typeof data.title === 'string' ? data.title : '',
      description: typeof data.description === 'string' ? data.description : '',
      fetchedAt: now,
      expiresAt: parseSignedUrlExpiryMs(videoUrl, now),
    }
    signedDisasterPlaybackByKey[slug] = row
    signedDisasterPlaybackByKey[key] = row
    return
  }
}

export function resolveDisasterMediaCandidates(disasterId: string): {
  imageCandidates: string[]
  videoCandidates: string[]
  audioCandidates: string[]
} {
  const key = normalizeDisasterVideoKey(disasterId)
  const image = toWebSafeUrl(resolveGuidanceImagePath(key))
  const video = getGuidanceVideoCandidates(key, Date.now())
  const audio = getGuidanceAudioCandidates(key, Date.now())
  return {
    imageCandidates: image ? [image] : [],
    videoCandidates: [...video],
    audioCandidates: [...audio],
  }
}

function resolveGuidanceImagePath(disasterKey: string): string {
  const key = normalizeDisasterVideoKey(disasterKey)
  const slugs = folderSlugCandidates(key)
  for (const slug of slugs) {
    const row = folderRowForCandidate(key, slug)
    const img = row?.image
    if (img) return img
  }
  for (const slug of slugs) {
    const tmpl = templateUrlsForFolderSlug(slug)
    if (tmpl.image) return tmpl.image
  }
  return ''
}

function getGuidanceVideoCandidates(disasterKey: string, _cacheBustMs: number): string[] {
  const signed = activeSignedVideoUrlForKey(disasterKey)
  if (signed) return [String(signed).trim()]
  return []
}

function getGuidanceAudioCandidates(disasterKey: string, cacheBustMs: number): string[] {
  const key = normalizeDisasterVideoKey(disasterKey)
  const seen = new Set<string>()
  const out: string[] = []
  for (const slug of folderSlugCandidates(key)) {
    const row = folderRowForCandidate(key, slug)
    const tmpl = templateUrlsForFolderSlug(slug)
    const raw = row?.audio ?? tmpl.audio ?? ''
    const safe = toWebSafeUrl(raw)
    if (!safe) continue
    const dedupeKey = safe.split('?')[0]
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    out.push(appendCacheBust(safe, cacheBustMs))
  }
  return out
}
