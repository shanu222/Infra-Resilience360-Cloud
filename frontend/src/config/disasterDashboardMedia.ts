import {
  preloadDisasterAudioUrl,
  preloadDisasterImageUrl,
  preloadDisasterVideoUrl,
} from '../disaster-dashboard-portal/utils/disasterMediaCache'
import {
  loadDisasterMediaManifest,
  loadDisasterSignedVideo,
  resolveDisasterMediaCandidates,
} from '../disaster-dashboard-portal/utils/disasterMediaMapping'

export type DisasterDashboardGuidanceMedia = {
  imageUrl: string
  imageCandidates: string[]
  videoUrl: string
  videoCandidates: string[]
  audioUrl: string
  audioCandidates: string[]
}
const DISASTER_MEDIA_CACHE = new Map<string, DisasterDashboardGuidanceMedia>()
const MEDIA_SUBSCRIBERS = new Set<() => void>()

function sameArray(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function notifyMediaSubscribers(): void {
  for (const listener of MEDIA_SUBSCRIBERS) listener()
}

async function refreshDisasterMedia(disasterId: string): Promise<void> {
  const previous = DISASTER_MEDIA_CACHE.get(disasterId)
  await loadDisasterMediaManifest()
  await loadDisasterSignedVideo(disasterId)
  DISASTER_MEDIA_CACHE.delete(disasterId)
  const next = disasterDashboardGuidanceMedia(disasterId)
  if (
    previous &&
    previous.imageUrl === next.imageUrl &&
    previous.videoUrl === next.videoUrl &&
    previous.audioUrl === next.audioUrl &&
    sameArray(previous.imageCandidates, next.imageCandidates) &&
    sameArray(previous.videoCandidates, next.videoCandidates) &&
    sameArray(previous.audioCandidates, next.audioCandidates)
  ) {
    return
  }
  notifyMediaSubscribers()
}

export function subscribeDisasterDashboardMedia(listener: () => void): () => void {
  MEDIA_SUBSCRIBERS.add(listener)
  return () => {
    MEDIA_SUBSCRIBERS.delete(listener)
  }
}

export function disasterDashboardGuidanceMedia(disasterId: string): DisasterDashboardGuidanceMedia {
  const cached = DISASTER_MEDIA_CACHE.get(disasterId)
  if (cached) return cached
  const { imageCandidates, videoCandidates, audioCandidates } = resolveDisasterMediaCandidates(disasterId)
  if (imageCandidates.length === 0 && videoCandidates.length === 0 && audioCandidates.length === 0) {
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
  void refreshDisasterMedia(disasterId)
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
