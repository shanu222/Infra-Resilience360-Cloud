import type { SectionMediaItem } from '../services/sectionContent'
import type { LearnVideoLike } from './learnVideoCandidates'

export type LearnPlaybackResolution = {
  urls: string[]
  matchedItems: SectionMediaItem[]
  failureReason: string | null
  detail?: string
}

/** @deprecated Options ignored — Learn uses static S3 config URL only. */
export type ResolveLearnVideoPlaybackOptions = {
  cmsPriority?: boolean
  isCmsFullyMapped?: boolean
}

/**
 * Learn playback: use the catalog card URL from static Learn config only (no path guessing or ranking).
 */
export function resolveLearnVideoPlayback(
  video: LearnVideoLike | null,
  _apiVideos?: SectionMediaItem[],
  _playbackTimestamp?: number,
  _contentUpdatedAt?: string,
  _options?: ResolveLearnVideoPlaybackOptions,
): LearnPlaybackResolution {
  if (!video) {
    return {
      urls: [],
      matchedItems: [],
      failureReason: 'No catalog video selected.',
    }
  }

  const raw = String(video.url ?? '').trim()
  if (!raw) {
    return {
      urls: [],
      matchedItems: [],
      failureReason: 'No video URL on catalog card.',
    }
  }

  return {
    urls: [raw],
    matchedItems: [],
    failureReason: null,
  }
}
