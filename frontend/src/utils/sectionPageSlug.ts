import type { SectionKey } from '../types/sectionKeys'

const SECTION_TO_SLUG: Record<SectionKey, string> = {
  bestPractices: 'best-practices',
  riskMaps: 'risk-maps',
  liveEarthquakeMap: 'live-earthquake-map',
  designToolkit: 'design-toolkit',
  infraModels: 'infra-models',
  disasterDashboard: 'disaster-dashboard',
  materialHubs: 'material-hubs',
  pgbc: 'pgbc',
  retrofitCalculator: 'retrofit-calculator',
  applyRegion: 'apply-region',
  readiness: 'readiness',
  retrofit: 'retrofit',
  smartConstruction: 'smart-construction',
  learn: 'learn',
  helpCenter: 'how-to-use',
  settings: 'settings',
}

export function sectionKeyToPageSlug(section: SectionKey | null): string {
  if (section === null) return 'homepage'
  return SECTION_TO_SLUG[section] ?? 'unknown-section'
}

export function cmsQuerySectionToPageSlug(raw: string): string {
  const s = String(raw ?? '').trim()
  if (!s || s.toLowerCase() === 'homepage' || s.toLowerCase() === 'home') return 'homepage'
  const lower = s.toLowerCase()
  const byValue = (Object.entries(SECTION_TO_SLUG) as [SectionKey, string][]).find(([, slug]) => slug === lower)
  if (byValue) return byValue[1]
  if (Object.prototype.hasOwnProperty.call(SECTION_TO_SLUG, s)) {
    return SECTION_TO_SLUG[s as SectionKey]
  }
  return lower.replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'homepage'
}
