import type { CmsMappedSectionDocument } from '../services/cmsReadAdapter'
import { resolveSectionMediaUrl } from './sectionMediaUrl'
import { isValidS3VideoSource } from './videoSourceValidation'

/**
 * Normalize CMS learn rows to { matchedId, url, s3Key?, title?, summary?, fileName? }.
 * Accepts matchedId or id; url or src; optional s3Key from Mongo.
 */
export function normalizeLearnVideoCmsRows(
  videos: unknown,
): Array<{
  matchedId: string
  url: string
  s3Key?: string
  title?: string
  summary?: string
  fileName?: string
}> {
  if (!Array.isArray(videos)) return []
  const out: Array<{
    matchedId: string
    url: string
    s3Key?: string
    title?: string
    summary?: string
    fileName?: string
  }> = []
  for (const item of videos) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const matchedId = String(o.matchedId ?? o.id ?? '').trim()
    const url = String(o.url ?? o.src ?? '').trim()
    const s3Key = String(o.s3Key ?? '').trim()
    const title = String(o.title ?? '').trim()
    const summary = String(o.summary ?? '').trim()
    const fileName = String(o.fileName ?? '').trim()
    if (!matchedId || !url) continue
    const row: (typeof out)[0] = s3Key ? { matchedId, url, s3Key } : { matchedId, url }
    if (title) row.title = title
    if (summary) row.summary = summary
    if (fileName) row.fileName = fileName
    out.push(row)
  }
  return out
}

/**
 * Strict CMS-priority validation: videos array, matchedId must be a known catalog card id,
 * unique matchedIds, each url must pass video source validation after resolveSectionMediaUrl.
 */
export function validateLearnPayloadForCmsPriority(
  raw: Record<string, unknown>,
  allowedCardIds: Set<string>,
): boolean {
  if (!raw || typeof raw !== 'object') return false
  const rows = normalizeLearnVideoCmsRows(raw.videos)
  if (rows.length === 0) return false
  const seen = new Set<string>()
  for (const row of rows) {
    if (!allowedCardIds.has(row.matchedId)) return false
    if (seen.has(row.matchedId)) return false
    seen.add(row.matchedId)
    const resolved = resolveSectionMediaUrl(row.url).trim()
    if (!resolved) return false
    if (!isValidS3VideoSource(resolved)) return false
  }
  return true
}

/**
 * Mongo-only learn catalog: each row must include display fields and a validated playback URL.
 * No dependency on bundled static card ids.
 */
export function validateLearnPayloadMongoAuthoritative(raw: Record<string, unknown>): boolean {
  if (!raw || typeof raw !== 'object') return false
  const rows = normalizeLearnVideoCmsRows(raw.videos)
  if (rows.length === 0) return false
  const seen = new Set<string>()
  for (const row of rows) {
    if (seen.has(row.matchedId)) return false
    seen.add(row.matchedId)
    const resolved = resolveSectionMediaUrl(row.url).trim()
    if (!resolved) return false
    if (!isValidS3VideoSource(resolved)) return false
  }
  return true
}

export function extractLearnSeedPayloadFromSectionDocument(doc: CmsMappedSectionDocument): Record<string, unknown> {
  if (doc.defaults && typeof doc.defaults === 'object') {
    const d = doc.defaults as Record<string, unknown>
    const vids = d.videos ?? d.cards
    if (Array.isArray(vids) || vids) {
      return {
        videos: vids,
        iconMap: d.iconMap,
      }
    }
  }
  const catalog = doc.elements?.find((e) => e?.meta?.matchedId === 'learn-video-catalog')
  const icon = doc.elements?.find((e) => e?.meta?.matchedId === 'learn-card-icons')
  const content = (catalog?.content ?? {}) as Record<string, unknown>
  return {
    videos: content.videos ?? content.cards,
    iconMap: icon?.media?.iconMap,
  }
}
