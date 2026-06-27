import type { UniversalElementPayload } from '../types/universalElement'

/**
 * Safe lookup for a universal CMS element by id (Mongo `page_config.elements[id]`).
 * Use when binding UI to CMS data; always provide fallbacks for missing keys.
 *
 * Ids are stable strings (e.g. `card.retrofit.title`, `hero.background`) matching `data-cms-id`.
 */
export function getCmsElement(
  elements: Record<string, UniversalElementPayload> | null | undefined,
  id: string,
): UniversalElementPayload | null {
  return elements?.[id] ?? null
}
