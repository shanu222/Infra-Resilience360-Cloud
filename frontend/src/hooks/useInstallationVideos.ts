import {
  MATERIAL_HUB_INSTALLATION_VIDEO_CANDIDATES,
  materialHubInstallationVideoUrl,
  type MaterialHubInstallationVideo,
} from '../config/materialHubGuidance'

type UseInstallationVideosResult = {
  videos: MaterialHubInstallationVideo[]
  loading: boolean
}

/**
 * Resolves installation videos from R2 via direct media URLs.
 * No HEAD/fetch probing — R2 public buckets often omit CORS headers, which
 * would block fetch while still allowing native <video src> playback.
 */
export function useInstallationVideos(): UseInstallationVideosResult {
  const videos: MaterialHubInstallationVideo[] = MATERIAL_HUB_INSTALLATION_VIDEO_CANDIDATES.map(
    (candidate) => ({
      ...candidate,
      url: materialHubInstallationVideoUrl(candidate.fileName),
    }),
  )

  return { videos, loading: false }
}
