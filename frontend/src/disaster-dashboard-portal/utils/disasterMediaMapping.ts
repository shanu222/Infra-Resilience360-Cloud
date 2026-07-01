import { buildApiTargets } from '@/services/apiBase'
import { disasterDashboardContentUrl } from '@/config/disasterDashboardPaths'

type FolderRow = {
  video?: string
  audio?: string
  image?: string
}

type SignedVideoRow = {
  videoUrl: string
  fetchedAt: number
}

type SectionManifestResponse = {
  groupedByFolder?: Record<string, FolderRow | { videos?: unknown; images?: unknown; audio?: unknown }>
  videos?: unknown[]
  images?: unknown[]
  audio?: unknown[]
}

const MANIFEST_REFRESH_MS = 5 * 60 * 1000
const SIGNED_VIDEO_REFRESH_MS = 8 * 60 * 1000

const DISASTER_TO_FOLDER: Record<string, string> = {
  flood: 'flood',
  earthquake: 'earthquake',
  cyclone: 'storm-cyclone',
  'storm-cyclone': 'storm-cyclone',
  'urban-fire': 'urban-fire',
  'crop-fire': 'crop-fire',
  heatwave: 'heatwave',
  loadshedding: 'load-shedding',
  'load-shedding': 'load-shedding',
  landslide: 'landslide',
  'cold-wave': 'cold-wave',
  smog: 'smog',
  avalanche: 'avalanche',
  glof: 'glof',
  'forest-fire': 'forest-fire',
  blizzard: 'blizzard',
  drought: 'drought',
}

let folderMediaCache: Record<string, FolderRow> | null = null
let folderMediaLoadedAt = 0
let folderMediaPromise: Promise<void> | null = null
const signedVideoCache: Record<string, SignedVideoRow> = {}

function normalizeDisasterKey(raw: string): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s*\/\s*/g, '-')
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeFolderSlug(raw: string): string {
  const normalized = normalizeDisasterKey(raw)
  if (!normalized) return ''
  const compact = normalized.replace(/-/g, '')
  if (compact === 'cyclone' || compact === 'stormcyclone') return 'storm-cyclone'
  if (compact === 'loadshedding' || compact === 'loadscheduling') return 'load-shedding'
  if (compact === 'urbanfire') return 'urban-fire'
  if (compact === 'cropfire') return 'crop-fire'
  if (compact === 'coldwave') return 'cold-wave'
  if (compact === 'forestfire') return 'forest-fire'
  return normalized
}

export function folderSlugCandidates(disasterId: string): string[] {
  const key = normalizeDisasterKey(disasterId)
  const mapped = normalizeFolderSlug(DISASTER_TO_FOLDER[key] ?? key)
  if (!mapped) return []
  if (mapped === 'storm-cyclone') return ['storm-cyclone', 'cyclone']
  if (mapped === 'load-shedding') return ['load-shedding', 'loadshedding', 'loadscheduling']
  return [mapped]
}

function coerceUrl(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value) && value.length > 0) return coerceUrl(value[0])
  if (value && typeof value === 'object') {
    const row = value as { url?: unknown; proxyUrl?: unknown; videoUrl?: unknown }
    return coerceUrl(row.url ?? row.proxyUrl ?? row.videoUrl ?? '')
  }
  return ''
}

function sectionManifestTargets(): string[] {
  const out = new Set<string>()
  const paths = ['/api/section-content/disaster-dashboard', '/api/section-content/disasterdashboard']
  for (const path of paths) {
    try {
      for (const target of buildApiTargets(path)) out.add(target)
    } catch {
      out.add(path)
    }
  }
  return [...out]
}

function signedVideoTargets(slug: string): string[] {
  const out = new Set<string>()
  const paths = [`/api/disaster-media/${encodeURIComponent(slug)}`]
  for (const path of paths) {
    try {
      for (const target of buildApiTargets(path)) out.add(target)
    } catch {
      out.add(path)
    }
  }
  return [...out]
}

function mergeAliasRows(next: Record<string, FolderRow>, toKey: string, fromKey: string): void {
  const from = next[fromKey]
  if (!from) return
  const to = next[toKey] ?? {}
  next[toKey] = {
    image: to.image || from.image,
    video: to.video || from.video,
    audio: to.audio || from.audio,
  }
}

export async function loadDisasterMediaManifest(): Promise<void> {
  if (folderMediaCache && Date.now() - folderMediaLoadedAt < MANIFEST_REFRESH_MS) return
  if (folderMediaPromise) return folderMediaPromise

  folderMediaPromise = (async () => {
    const next: Record<string, FolderRow> = {}

    for (const target of sectionManifestTargets()) {
      try {
        const res = await fetch(target, { cache: 'no-store' })
        if (!res.ok) continue
        const data = (await res.json()) as SectionManifestResponse

        const grouped = data.groupedByFolder
        if (grouped && typeof grouped === 'object') {
          for (const [rawFolder, rawRow] of Object.entries(grouped)) {
            const folder = normalizeFolderSlug(rawFolder)
            if (!folder || !rawRow || typeof rawRow !== 'object') continue
            const row = rawRow as {
              image?: unknown
              video?: unknown
              audio?: unknown
              images?: unknown
              videos?: unknown
            }
            next[folder] = {
              image: coerceUrl(row.image) || coerceUrl(row.images),
              video: coerceUrl(row.video) || coerceUrl(row.videos),
              audio: coerceUrl(row.audio),
            }
          }
        }

        if (Object.keys(next).length > 0) break
      } catch {
        // try next endpoint candidate
      }
    }

    mergeAliasRows(next, 'storm-cyclone', 'cyclone')
    mergeAliasRows(next, 'load-shedding', 'loadshedding')
    mergeAliasRows(next, 'load-shedding', 'loadscheduling')

    folderMediaCache = next
    folderMediaLoadedAt = Date.now()
  })()

  try {
    await folderMediaPromise
  } finally {
    folderMediaPromise = null
  }
}

function templateImageUrl(folder: string): string {
  return disasterDashboardContentUrl(`images/${folder}/image.png`)
}

function templateVideoUrl(folder: string): string {
  return disasterDashboardContentUrl(`videos/${folder}/video.mp4`)
}

function templateAudioUrl(folder: string): string {
  return disasterDashboardContentUrl(`audio/${folder}/audio.aac`)
}

function uniqueUrls(values: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of values) {
    const value = String(raw ?? '').trim()
    if (!value) continue
    const dedupe = value.split('?')[0]
    if (seen.has(dedupe)) continue
    seen.add(dedupe)
    out.push(value)
  }
  return out
}

export async function loadDisasterSignedVideo(disasterId: string): Promise<void> {
  const slugs = folderSlugCandidates(disasterId)
  if (slugs.length === 0) return
  const now = Date.now()
  const key = normalizeDisasterKey(disasterId)

  for (const slug of [key, ...slugs]) {
    const cached = signedVideoCache[slug]
    if (cached && now - cached.fetchedAt < SIGNED_VIDEO_REFRESH_MS && cached.videoUrl) return
  }

  for (const slug of slugs) {
    for (const target of signedVideoTargets(slug)) {
      try {
        const res = await fetch(target, { cache: 'no-store' })
        if (!res.ok) continue
        const data = (await res.json()) as { url?: unknown; proxyUrl?: unknown; videoUrl?: unknown }
        const videoUrl = coerceUrl(data.videoUrl) || coerceUrl(data.proxyUrl) || coerceUrl(data.url)
        if (!videoUrl) continue
        const row: SignedVideoRow = { videoUrl, fetchedAt: Date.now() }
        signedVideoCache[key] = row
        signedVideoCache[slug] = row
        return
      } catch {
        // try next endpoint candidate
      }
    }
  }
}

function signedVideoFor(disasterId: string): string {
  const key = normalizeDisasterKey(disasterId)
  const now = Date.now()
  for (const slug of [key, ...folderSlugCandidates(disasterId)]) {
    const row = signedVideoCache[slug]
    if (row && now - row.fetchedAt < SIGNED_VIDEO_REFRESH_MS && row.videoUrl) return row.videoUrl
  }
  return ''
}

export function resolveDisasterMediaCandidates(disasterId: string): {
  imageCandidates: string[]
  videoCandidates: string[]
  audioCandidates: string[]
} {
  const slugs = folderSlugCandidates(disasterId)
  const rows = folderMediaCache ?? {}
  const image: string[] = []
  const video: string[] = []
  const audio: string[] = []
  const signedVideo = signedVideoFor(disasterId)
  if (signedVideo) video.push(signedVideo)

  for (const slug of slugs) {
    const row = rows[slug]
    if (row?.image) image.push(row.image)
    if (row?.video) video.push(row.video)
    if (row?.audio) audio.push(row.audio)

    image.push(templateImageUrl(slug))
    video.push(templateVideoUrl(slug))
    audio.push(templateAudioUrl(slug))
  }

  return {
    imageCandidates: uniqueUrls(image),
    videoCandidates: uniqueUrls(video),
    audioCandidates: uniqueUrls(audio),
  }
}
