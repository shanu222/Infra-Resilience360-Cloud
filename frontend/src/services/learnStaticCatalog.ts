/**
 * Static Learn & Train catalog from `src/config/learnTrainVideos.ts`.
 * Learn playback never depends on CMS/media-library URLs.
 */
import { getStaticLearnSeeds } from './staticContent'
import type { CmsMediaLibraryItem } from '../types/cmsMedia'
import { normalizeCmsMediaLibraryItem } from '../types/cmsMedia'
import type { LearnVideoSeed } from './cmsSectionSeedAdapter'

export function getStaticLearnVideoSeeds(): LearnVideoSeed[] {
  const { videos } = getStaticLearnSeeds()
  return Array.isArray(videos) ? videos : []
}

/** Shape compatible with {@link buildSectionPayloadFromMedia} for legacy section-content consumers. */
export function staticLearnItemsAsMediaLibrary(): CmsMediaLibraryItem[] {
  return getStaticLearnVideoSeeds().map((v) =>
    normalizeCmsMediaLibraryItem({
      id: v.id,
      section: 'learn',
      page: 'learn',
      type: 'video',
      matchedId: v.id,
      title: v.title,
      fileName: v.fileName,
      url: String(v.url ?? ''),
      s3Key: String(v.s3Key ?? ''),
      createdAt: null,
      isActive: true,
    }),
  )
}
