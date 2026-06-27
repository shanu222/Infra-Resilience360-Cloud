/**
 * Normalize admin/legacy section keys to stable page slugs used by the SPA
 * (`sectionKeyToPageSlug` in `src/admin/sectionPageSlug.ts`).
 */
const LEGACY_TO_SLUG = {
  homepage: 'homepage',
  home: 'homepage',
  learn: 'learn',
  retrofit: 'retrofit',
  inframodels: 'infra-models',
  'infra-models': 'infra-models',
  disasterdashboard: 'disaster-dashboard',
  'disaster-dashboard': 'disaster-dashboard',
  pgbc: 'pgbc',
  materialhubs: 'material-hubs',
  'material-hubs': 'material-hubs',
  retrofitcalculator: 'retrofit-calculator',
  'retrofit-calculator': 'retrofit-calculator',
  smartconstruction: 'smart-construction',
  'smart-construction': 'smart-construction',
  readiness: 'readiness',
  'apply-region': 'apply-region',
  applyregion: 'apply-region',
  riskmaps: 'risk-maps',
  'risk-maps': 'risk-maps',
  liveearthquakemap: 'live-earthquake-map',
  'live-earthquake-map': 'live-earthquake-map',
  designtoolkit: 'design-toolkit',
  'design-toolkit': 'design-toolkit',
  bestpractices: 'best-practices',
  'best-practices': 'best-practices',
  settings: 'settings',
  global: 'global',
}

export function normalizeRealtimeSlug(raw) {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
  if (!s) return ''
  if (LEGACY_TO_SLUG[s]) return LEGACY_TO_SLUG[s]
  return s
}

export function canonicalRealtimePayload({ page, section, source }) {
  const p = normalizeRealtimeSlug(page)
  const sec = normalizeRealtimeSlug(section)
  const slug = p || sec || 'global'
  return { page: slug, section: slug, source }
}
