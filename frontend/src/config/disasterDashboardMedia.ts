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
 * R2 bucket layout (post-reorganisation — slug-named, never positional):
 *
 *   images/FLOOD.png          → flatImageFile primary
 *   images/flood/FLOOD.png    → image fallback (slug subfolder)
 *   videos/FLOOD.mp4          → flatVideoFile primary
 *   videos/flood/FLOOD.mp4    → video fallback (slug subfolder)
 *   audio/flood/audio.aac     → audio (slug subfolder, fixed filename)
 *
 * Files with spaces ("URBAN FIRE.png") are URL-encoded by disasterDashboardContentUrl
 * automatically (each path segment is passed through encodeURIComponent).
 *
 * Never use image.png, image-1 … image-9, video-1 … video-9 or any other
 * positional names — these caused cross-loading between disasters.
 */
export const DISASTER_DASHBOARD_MEDIA_SPECS: Record<string, DisasterMediaSpec> = {
  flood: {
    folder: 'flood',
    flatImageFile: 'FLOOD.png',       image: 'FLOOD.png',
    flatVideoFile: 'FLOOD.mp4',       video: 'FLOOD.mp4',
    audio: 'audio.aac',
  },
  earthquake: {
    folder: 'earthquake',
    flatImageFile: 'EARTHQUAKE.png',  image: 'EARTHQUAKE.png',
    flatVideoFile: 'EARTHQUAKE.mp4',  video: 'EARTHQUAKE.mp4',
    audio: 'audio.aac',
  },
  'urban-fire': {
    folder: 'urban-fire',
    flatImageFile: 'URBAN FIRE.png',  image: 'URBAN FIRE.png',
    flatVideoFile: 'URBAN FIRE.mp4',  video: 'URBAN FIRE.mp4',
    audio: 'audio.aac',
  },
  'crop-fire': {
    folder: 'crop-fire',
    flatImageFile: 'CROP FIRE.png',   image: 'CROP FIRE.png',
    flatVideoFile: 'CROP FIRE.mp4',   video: 'CROP FIRE.mp4',
    audio: 'audio.aac',
  },
  heatwave: {
    folder: 'heatwave',
    flatImageFile: 'HEATWAVE.png',    image: 'HEATWAVE.png',
    flatVideoFile: 'HEATWAVE.mp4',    video: 'HEATWAVE.mp4',
    audio: 'audio.aac',
  },
  'load-shedding': {
    folder: 'load-shedding',
    flatVideoFile: 'LOAD SHEDDING.mp4', video: 'LOAD SHEDDING.mp4',
    audio: 'audio.aac',
  },
  'storm-cyclone': {
    folder: 'storm-cyclone',
    flatImageFile: 'STORM.png',       image: 'STORM.png',
    flatVideoFile: 'STORM.mp4',       video: 'STORM.mp4',
    audio: 'audio.aac',
  },
  landslide: {
    folder: 'landslide',
    flatImageFile: 'LANDSLIDE.png',   image: 'LANDSLIDE.png',
    flatVideoFile: 'LANDSLIDE.mp4',   video: 'LANDSLIDE.mp4',
    audio: 'audio.aac',
  },
  'cold-wave': {
    folder: 'cold-wave',
    flatImageFile: 'COLD WAVE.png',   image: 'COLD WAVE.png',
    flatVideoFile: 'COLD WAVE.mp4',   video: 'COLD WAVE.mp4',
    audio: 'audio.aac',
  },
  smog: {
    folder: 'smog',
    flatImageFile: 'SMOG.png',        image: 'SMOG.png',
    flatVideoFile: 'SMOG.mp4',        video: 'SMOG.mp4',
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
  fallbackKey: 'imageFallbackFolders' | 'videoFallbackFolders' | 'audioFallbackFolders',
): string[] {
  const urls: string[] = []
  // spec[kind] is the actual slug-named filename (e.g. 'FLOOD.png', 'audio.aac')
  const specFile = spec[kind] as string | undefined

  if (kind === 'image') {
    // Primary: flat root (images/FLOOD.png)
    if (spec.flatImageFile) urls.push(fileUrlFlat('image', spec.flatImageFile))
    for (const fallbackFile of spec.imageFlatFallbackFiles ?? []) {
      urls.push(fileUrlFlat('image', fallbackFile))
    }
  }
  if (kind === 'video') {
    // Primary: flat root (videos/FLOOD.mp4)
    if (spec.flatVideoFile) urls.push(fileUrlFlat('video', spec.flatVideoFile))
    for (const fallbackFile of spec.videoFlatFallbackFiles ?? []) {
      urls.push(fileUrlFlat('video', fallbackFile))
    }
  }

  // Disaster dashboard R2 currently stores image/video assets at flat roots.
  // Keep folder-based mapping for audio only.
  if (kind === 'audio' && specFile) {
    urls.push(fileUrl(kind, spec.folder, specFile))
    for (const folder of spec[fallbackKey] ?? []) {
      urls.push(fileUrl(kind, folder, specFile))
    }
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

  const imageCandidates = buildFileCandidates(spec, 'image', 'imageFallbackFolders')
  const videoCandidates = buildFileCandidates(spec, 'video', 'videoFallbackFolders')
  const audioCandidates = buildFileCandidates(spec, 'audio', 'audioFallbackFolders')

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
