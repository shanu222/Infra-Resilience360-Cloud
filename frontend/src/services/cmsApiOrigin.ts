import { API_BASE } from './apiBase'

/**
 * API origin for admin writes and non-CMS helpers (aligned with `API_BASE` in `apiBase.ts`).
 * Prefer `buildApiUrl('/api/...')` for fetches so URLs are always absolute (prod defaults to EC2 when env unset).
 */
export function sameOriginApiBase(): string {
  return API_BASE
}
