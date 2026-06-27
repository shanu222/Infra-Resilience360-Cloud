import { normalizeType } from './media'
import type { MediaType } from './media'

export type { MediaType, MediaItem } from './media'
export { normalizeType } from './media'

/** Stored Mongo `type` includes layout bucket `background`. */
export type CmsMediaLibraryRowType = MediaType | 'background'

export function normalizeCmsLibraryRowType(v: unknown): CmsMediaLibraryRowType {
  const t = typeof v === 'string' ? v.toLowerCase().trim() : ''
  if (t === 'background') return 'background'
  return normalizeType(v)
}

/** Row from Mongo `cms_media_library` (S3-backed assets indexed per section). */
export type CmsMediaLibraryItem = {
  id: string
  url: string
  type: CmsMediaLibraryRowType
  mediaType?: MediaType
  /** Logical CMS page (e.g. learn, homepage). */
  page?: string
  /** Sub-area under the page (path segment under `{page}/...` S3 grouping). */
  section: string
  s3Key: string
  contentType?: string
  /** Learn card id slug (e.g. `flood-barriers`) when keyed under resilience360/learn/{file}. */
  folder?: string
  /** Learn card id for CMS-priority mapping (same as folder for video rows when set). */
  matchedId?: string
  /** Original filename for strict UI catalog matching */
  fileName?: string
  /** Optional display title from Mongo (smart match against catalog title). */
  title?: string
  /** Optional stable key when `matchedId` is absent (e.g. card id). */
  externalKey?: string
  createdAt: string | null
  updatedAt?: string | null
  isActive?: boolean
  source?: string
}

/** Coerce API / cache payloads toward valid `type` / `mediaType` fields. */
export function normalizeCmsMediaLibraryItem(row: CmsMediaLibraryItem): CmsMediaLibraryItem {
  return {
    ...row,
    type: normalizeCmsLibraryRowType(row.type),
    mediaType: row.mediaType !== undefined && row.mediaType !== null ? normalizeType(row.mediaType) : undefined,
  }
}
