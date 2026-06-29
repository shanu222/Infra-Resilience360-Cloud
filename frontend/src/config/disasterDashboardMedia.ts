import { disasterDashboardContentUrl } from './disasterDashboardPaths'
import {
  preloadDisasterAudioUrl,
  preloadDisasterImageUrl,
  preloadDisasterVideoUrl,
} from '../disaster-dashboard-portal/utils/disasterMediaCache'

/**
 * Local-first disaster media map under:
 * disaster-dashboard/{images|videos|audio}/{hazard}/
 */
type DisasterMediaSpec = {
  folder: string
  flatImageFile?: string
  flatVideoFile?: string
  image?: string
  video?: string
  audio?: string
  imageFlatFallbackFiles?: string[]
  videoFlatFallbackFiles?: string[]
  imageFallbackFolders?: string[]
  videoFallbackFolders?: string[]
  audioFallbackFolders?: string[]
}

/**
 * Media is resolved ONLY by slug-keyed folder paths:
 *   images/{id}/image.png
 *   videos/{id}/video.mp4
 *   audio/{id}/audio.aac
 *
 * The previous flat (index-based) files like images/image.png,
 * images/image-1.png … images/image-9.png have been removed because they
 * were numbered by array position and caused cross-loading (e.g. Flood showed
 * Cold Wave media when image.png on R2 contained the wrong content).
 * Resolving by slug is the only safe approach.
 */
export const DISASTER_DASHBOARD_MEDIA_SPECS: Record<string, DisasterMediaSpec> = {
  flood: {
    folder: 'flood',
    image: 'image.png',
    video: 'video.mp4',
    audio: 'audio.aac',
  },
  earthquake: {
    folder: 'earthquake',
    image: 'image.png',
    video: 'video.mp4',
    audio: 'audio.aac',
  },
  'urban-fire': {
    folder: 'urban-fire',
    image: 'image.png',
    video: 'video.mp4',
    audio: 'audio.aac',
  },
  'crop-fire': {
    folder: 'crop-fire',
    image: 'image.png',
    video: 'video.mp4',
    audio: 'audio.aac',
  },
  heatwave: {
    folder: 'heatwave',
    image: 'image.png',
    video: 'video.mp4',
    audio: 'audio.aac',
  },
  'load-shedding': {
    folder: 'load-shedding',
    image: 'image.png',
    video: 'video.mp4',
    audio: 'audio.aac',
  },
  'storm-cyclone': {
    folder: 'storm-cyclone',
    image: 'image.png',
    video: 'video.mp4',
    audio: 'audio.aac',
  },
  landslide: {
    folder: 'landslide',
    image: 'image.png',
    video: 'video.mp4',
    audio: 'audio.aac',
  },
  'cold-wave': {
    folder: 'cold-wave',
    image: 'image.png',
    video: 'video.mp4',
    audio: 'audio.aac',
  },
  smog: {
    folder: 'smog',
    image: 'image.png',
    video: 'video.mp4',
    audio: 'audio.aac',
  },
}

export type DisasterDashboardGuidanceMedia = {
  imageUrl: string
  imageCandidates: string[]
  videoUrl: string
  videoCandidates: string[]
  audioUrl: string
  audioCandidates: string[]
}
const DISASTER_MEDIA_CACHE = new Map<string, DisasterDashboardGuidanceMedia>()

function fileUrl(kind: 'image' | 'video' | 'audio', folder: string, file: string): string {
  const mediaRoot = kind === 'image' ? 'images' : kind === 'video' ? 'videos' : 'audio'
  return disasterDashboardContentUrl(`${mediaRoot}/${folder}/${file}`)
}

function fileUrlFlat(kind: 'image' | 'video' | 'audio', file: string): string {
  const mediaRoot = kind === 'image' ? 'images' : kind === 'video' ? 'videos' : 'audio'
  return disasterDashboardContentUrl(`${mediaRoot}/${file}`)
}

function uniqueUrls(urls: string[]): string[] {
  return [...new Set(urls.filter(Boolean))]
}

function buildFileCandidates(
  spec: DisasterMediaSpec,
  kind: 'image' | 'video' | 'audio',
  fileName: string,
  fallbackKey: 'imageFallbackFolders' | 'videoFallbackFolders' | 'audioFallbackFolders',
): string[] {
  const urls: string[] = []

  if (kind === 'image') {
    if (spec.flatImageFile) urls.push(fileUrlFlat('image', spec.flatImageFile))
    for (const fallbackFile of spec.imageFlatFallbackFiles ?? []) {
      urls.push(fileUrlFlat('image', fallbackFile))
    }
  }
  if (kind === 'video') {
    if (spec.flatVideoFile) urls.push(fileUrlFlat('video', spec.flatVideoFile))
    for (const fallbackFile of spec.videoFlatFallbackFiles ?? []) {
      urls.push(fileUrlFlat('video', fallbackFile))
    }
  }

  if (spec[kind]) urls.push(fileUrl(kind, spec.folder, fileName))
  for (const folder of spec[fallbackKey] ?? []) {
    urls.push(fileUrl(kind, folder, fileName))
  }

  return uniqueUrls(urls)
}

export function disasterDashboardGuidanceMedia(disasterId: string): DisasterDashboardGuidanceMedia {
  const cached = DISASTER_MEDIA_CACHE.get(disasterId)
  if (cached) return cached
  const spec = DISASTER_DASHBOARD_MEDIA_SPECS[disasterId]
  if (!spec) {
    const empty = {
      imageUrl: '',
      imageCandidates: [],
      videoUrl: '',
      videoCandidates: [],
      audioUrl: '',
      audioCandidates: [],
    }
    DISASTER_MEDIA_CACHE.set(disasterId, empty)
    return empty
  }

  const imageCandidates = buildFileCandidates(spec, 'image', 'image.png', 'imageFallbackFolders')
  const videoCandidates = buildFileCandidates(spec, 'video', 'video.mp4', 'videoFallbackFolders')
  const audioCandidates = buildFileCandidates(spec, 'audio', 'audio.aac', 'audioFallbackFolders')

  const resolved = {
    imageUrl: imageCandidates[0] ?? '',
    imageCandidates,
    videoUrl: videoCandidates[0] ?? '',
    videoCandidates,
    audioUrl: audioCandidates[0] ?? '',
    audioCandidates,
  }
  DISASTER_MEDIA_CACHE.set(disasterId, resolved)
  return resolved
}

export function disasterDashboardCardImageUrl(disasterId: string): string {
  return disasterDashboardGuidanceMedia(disasterId).imageUrl
}

export function preloadDisasterMedia(disasterId: string): void {
  const { imageCandidates, videoCandidates, audioCandidates } = disasterDashboardGuidanceMedia(disasterId)
  const preload = () => {
    if (imageCandidates[0]) preloadDisasterImageUrl(imageCandidates[0])
    if (videoCandidates[0]) preloadDisasterVideoUrl(videoCandidates[0])
    if (audioCandidates[0]) preloadDisasterAudioUrl(audioCandidates[0])
  }
  const win = window as Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
  }
  if (typeof win.requestIdleCallback === 'function') {
    win.requestIdleCallback(preload, { timeout: 1200 })
    return
  }
  window.setTimeout(preload, 0)
}
