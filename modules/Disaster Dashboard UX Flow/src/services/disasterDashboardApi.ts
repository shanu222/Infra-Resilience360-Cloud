import { buildPortalApiTargets } from './portalApiBase'

export type DisasterPageSummary = {
  pageId: string
  hazardId: string
  title: string
  order: number
  updatedAt: string
  icon?: string
  cardColorClass?: string
  description?: string
  backgroundImage?: string
  /** Resolved S3 (or CMS) URLs for the hazard strip — optional; server fills from CMS + defaults. */
  media?: { video?: string; audio?: string; image?: string }
}

export type DisasterDashboardPageDoc = {
  _id?: string
  section: string
  pageId: string
  hazardId: string
  title: string
  order: number
  content: Record<string, unknown>
  styles: Record<string, unknown>
  updatedAt?: string
}

async function fetchJsonFirstOk(urls: string[]): Promise<Response | null> {
  const seen = new Set<string>()
  for (const url of urls) {
    if (seen.has(url)) continue
    seen.add(url)
    try {
      const attempt = await fetch(url, { cache: 'no-store' })
      if (attempt.ok) return attempt
    } catch {
      // try next candidate (same-origin, then hinted API base)
    }
  }
  return null
}

/**
 * List pages (excludes portal row used only for global background).
 * Returns `null` when every API candidate failed (network / non-OK) so the UI can fall back to bundled hazards.
 * Returns `[]` only when the server responded OK with an empty `pages` array.
 */
export async function fetchDisasterDashboardPages(): Promise<DisasterPageSummary[] | null> {
  const res = await fetchJsonFirstOk(buildPortalApiTargets('/static/disaster-dashboard'))
  if (!res) return null
  const data = (await res.json()) as { pages?: DisasterPageSummary[]; status?: string }
  console.log('Dashboard API response:', data)
  const pages = Array.isArray(data.pages) ? data.pages : []
  const hazards = pages.filter((p) => String(p.hazardId).toLowerCase() !== 'portal')
  console.log('Dashboard API hazard pages:', hazards)
  return hazards
}

export async function fetchDisasterDashboardPage(pageId: string): Promise<DisasterDashboardPageDoc | null> {
  const enc = encodeURIComponent(pageId)
  const res = await fetchJsonFirstOk(buildPortalApiTargets(`/static/disaster-dashboard/${enc}`))
  if (!res) return null
  if (res.status === 404) return null
  return (await res.json()) as DisasterDashboardPageDoc
}

export function defaultPageIdForHazard(hazardId: string): string {
  return `${String(hazardId).trim()}-1`
}

