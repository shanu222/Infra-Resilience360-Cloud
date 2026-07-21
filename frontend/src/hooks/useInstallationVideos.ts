import { useEffect, useState } from 'react'
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
 * Resolves installation videos from R2.
 *
 * Each candidate in MATERIAL_HUB_INSTALLATION_VIDEO_CANDIDATES is probed with a
 * HEAD request. Candidates that resolve to HTTP 200 are included; 404s are
 * silently skipped so the UI never shows a broken player.
 *
 * Candidates whose filename contains "...._" (R2-truncated names) are included
 * without probing because we cannot derive the exact key — they will gracefully
 * fail to load in the video player if the name is wrong, and the player shows
 * a friendly error.
 */
export function useInstallationVideos(): UseInstallationVideosResult {
  const [videos, setVideos] = useState<MaterialHubInstallationVideo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function probe(
      candidate: (typeof MATERIAL_HUB_INSTALLATION_VIDEO_CANDIDATES)[number],
    ): Promise<MaterialHubInstallationVideo | null> {
      const url = materialHubInstallationVideoUrl(candidate.fileName)

      // Filenames that contain "...._" are R2 console-truncated display names.
      // We cannot probe them because the true key is unknown; include them
      // unconditionally and let the HTML5 player surface errors naturally.
      const hasTruncation = candidate.fileName.includes('....')
      if (hasTruncation) {
        return { ...candidate, url }
      }

      try {
        const res = await fetch(url, { method: 'HEAD', mode: 'cors', cache: 'no-store' })
        if (res.ok) return { ...candidate, url }
        return null
      } catch {
        // Network error — include the video optimistically (user might be offline during probe).
        return { ...candidate, url }
      }
    }

    ;(async () => {
      const results = await Promise.all(
        MATERIAL_HUB_INSTALLATION_VIDEO_CANDIDATES.map(probe),
      )
      if (cancelled) return
      setVideos(results.filter((v): v is MaterialHubInstallationVideo => v !== null))
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return { videos, loading }
}
