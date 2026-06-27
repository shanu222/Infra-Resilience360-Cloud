import { finalizeRemoteMediaUrl, resolveSectionMediaUrl } from './sectionMediaUrl'

/** Infra layout: no hardcoded proxy path — candidates come from CMS `apiLayoutUrl` / Mongo only. */
export const INFRA_OFFICIAL_OVERVIEW_MEDIA_PATH = ''

/** Catalog card shape; `url` is the canonical playback URL from Mongo when CMS mapping is present. */
export type LearnVideoLike = {
  id: string
  fileName: string
  title?: string
  url?: string
}

export function buildInfraLayoutPlaybackCandidates(
  _normalizedBasePath: string,
  apiLayoutUrl: string | undefined,
  playbackTimestamp: number,
  contentUpdatedAt?: string,
): string[] {
  const officialRaw = INFRA_OFFICIAL_OVERVIEW_MEDIA_PATH.trim()
  const official = officialRaw
    ? finalizeRemoteMediaUrl(
        resolveSectionMediaUrl(INFRA_OFFICIAL_OVERVIEW_MEDIA_PATH),
        playbackTimestamp,
        contentUpdatedAt,
      )
    : ''
  const apiFirst = apiLayoutUrl ? [resolveSectionMediaUrl(apiLayoutUrl)].filter(Boolean) : []
  const raw = apiFirst.filter((u): u is string => typeof u === 'string' && u.length > 0)
  const fromLibrary = raw.map((u) => finalizeRemoteMediaUrl(u, playbackTimestamp, contentUpdatedAt))
  const combined = official ? [official, ...fromLibrary] : fromLibrary
  return [...new Set(combined.filter(Boolean))]
}
