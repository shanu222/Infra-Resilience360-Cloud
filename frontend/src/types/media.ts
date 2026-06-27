/** Single source of truth for CMS / API asset kinds (excludes layout bucket `background`). */
export type MediaType = 'image' | 'video' | 'audio' | 'pdf' | 'other'

/** Generic media document (API or UI); Mongo rows may use {@link import('./cmsMedia').CmsMediaLibraryRowType} for `type`. */
export interface MediaItem {
  _id?: string
  id?: string
  url: string
  s3Key?: string
  type: MediaType
  section?: string
  createdAt?: string
  updatedAt?: string
}

/** Normalize unknown API values to a valid {@link MediaType}. */
export function normalizeType(type: unknown): MediaType {
  const t = typeof type === 'string' ? type.toLowerCase().trim() : ''
  if (t === 'image' || t === 'video' || t === 'audio' || t === 'pdf') return t
  return 'other'
}
