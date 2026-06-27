import type { UniversalElementPayload } from '../types/universalElement'

/** Normalize API elements field (legacy array or map). */
export function normalizeElementsFromApi(raw: unknown): Record<string, UniversalElementPayload> {
  if (!raw) return {}
  if (Array.isArray(raw)) {
    const o: Record<string, UniversalElementPayload> = {}
    for (const row of raw) {
      if (row && typeof row === 'object' && 'id' in row) {
        const id = String((row as { id: unknown }).id)
        const { id: _drop, ...rest } = row as { id: string } & UniversalElementPayload
        o[id] = rest
      }
    }
    return o
  }
  if (typeof raw === 'object') return raw as Record<string, UniversalElementPayload>
  return {}
}
