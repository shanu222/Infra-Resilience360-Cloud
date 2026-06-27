import type { CmsMediaPayload } from '../types/universalElement'
import { fixApiUrl } from './fixApiUrl'

export function cmsMediaPrimaryUrl(m: CmsMediaPayload | null | undefined): string | undefined {
  if (!m) return undefined
  const u = m.url ?? m.src
  if (!u || !String(u).trim()) return undefined
  return fixApiUrl(String(u).trim())
}
