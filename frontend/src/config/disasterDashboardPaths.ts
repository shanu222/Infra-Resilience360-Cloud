import { RESILIENCE360_LOCAL_BASE } from './localContent'

export const RESILIENCE360_BASE = `${RESILIENCE360_LOCAL_BASE}/`
export const DISASTER_DASHBOARD_BASE = `${RESILIENCE360_BASE}disaster-dashboard/`

export function disasterDashboardContentUrl(relativePath: string): string {
  const segments = String(relativePath || '')
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
  return `${DISASTER_DASHBOARD_BASE}${segments.join('/')}`
}

/** Backward-compatible alias (legacy name retained for existing imports). */
export const s3DisasterDashboardUrl = disasterDashboardContentUrl

export const DISASTER_DASHBOARD_BRAND = {
  backgroundImageUrl: disasterDashboardContentUrl('images/disaster-dashboard-bg.png'),
}
