import { useEffect, useSyncExternalStore } from 'react'
import {
  disasterDashboardGuidanceMedia,
  preloadDisasterMedia,
  subscribeDisasterDashboardMedia,
  type DisasterDashboardGuidanceMedia,
} from '@/config/disasterDashboardMedia'

const EMPTY_MEDIA: DisasterDashboardGuidanceMedia = {
  imageUrl: '',
  imageCandidates: [],
  videoUrl: '',
  videoCandidates: [],
  audioUrl: '',
  audioCandidates: [],
}

export function useDisasterGuidanceMedia(disasterId: string | undefined): DisasterDashboardGuidanceMedia {
  const safeId = String(disasterId ?? '').trim()
  useEffect(() => {
    if (safeId) preloadDisasterMedia(safeId)
  }, [safeId])

  return useSyncExternalStore(
    subscribeDisasterDashboardMedia,
    () => (safeId ? disasterDashboardGuidanceMedia(safeId) : EMPTY_MEDIA),
    () => (safeId ? disasterDashboardGuidanceMedia(safeId) : EMPTY_MEDIA),
  )
}
