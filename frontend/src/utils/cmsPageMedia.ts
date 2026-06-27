import { cmsMediaPrimaryUrl } from '../cms/universalDom'
import type { UniversalElementPayload } from '../types/universalElement'

/**
 * Resolve a media URL from Mongo page_config for a stable element id.
 * When `media === null`, returns `undefined` (explicit clear). Otherwise prefers Mongo `src`/`url`, then `fallback`.
 */
export function resolveCmsMediaUrl(
  elements: Record<string, UniversalElementPayload> | undefined,
  elementId: string,
  fallback?: string,
): string | undefined {
  try {
    const row = elements?.[elementId]
    if (row?.media === null) return undefined
    const u = cmsMediaPrimaryUrl(row?.media ?? undefined)
    if (u) return u
  } catch {
    /* */
  }
  return fallback
}
