import { isHomeSectionKey } from '../constants/homepageGrid'
import type { SectionKey } from '../types/sectionKeys'
import { sectionKeyToPageSlug } from '../utils/sectionPageSlug'

/** Kebab-case slugs → SectionKey (homepage cards, admin links, deep links). */
export const SECTION_VIEW_ALIASES: Record<string, SectionKey> = {
  'disaster-dashboard': 'disasterDashboard',
  'material-hubs': 'materialHubs',
  'infra-models': 'infraModels',
  'design-toolkit': 'designToolkit',
  'smart-construction': 'smartConstruction',
  'building-codes': 'pgbc',
  pgbc: 'pgbc',
  'best-practices': 'bestPractices',
  'readiness-calculator': 'readiness',
  readiness: 'readiness',
  'learn-train': 'learn',
  learn: 'learn',
  'how-to-use': 'helpCenter',
  'help-center': 'helpCenter',
  help: 'helpCenter',
  'live-earthquake': 'liveEarthquakeMap',
  'live-earthquake-alerts': 'liveEarthquakeMap',
  'live-earthquake-map': 'liveEarthquakeMap',
  'retrofit-guide': 'retrofit',
  retrofit: 'retrofitCalculator',
  'resilience-models': 'infraModels',
  'resilience-infra-models': 'infraModels',
  'risk-maps': 'riskMaps',
  'retrofit-calculator': 'retrofitCalculator',
  'apply-region': 'applyRegion',
  'disaster-dashboard-portal': 'disasterDashboard',
  models: 'infraModels',
  settings: 'settings',
}

export const HISTORY_APP_SECTION_KEY = 'r360AppSection'

export function normalizeSectionViewSlug(raw: string | null): SectionKey | null {
  if (!raw) return null
  const t = raw.trim()
  if (!t) return null
  const alias = SECTION_VIEW_ALIASES[t.toLowerCase().replace(/_/g, '-')]
  if (alias) return alias
  if (isHomeSectionKey(t) && t !== 'settings') return t as SectionKey
  return null
}

function readViewSlugFromPathname(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, '') || '/'
  const nestedMatch = path.match(/\/view\/([a-z0-9-]+)(?:\/.*)?$/i)
  if (nestedMatch?.[1]) return nestedMatch[1]
  const slashMatch = path.match(/\/view\/([a-z0-9-]+)$/i)
  if (slashMatch?.[1]) return slashMatch[1]
  const hyphenMatch = path.match(/\/view-([a-z0-9-]+)$/i)
  if (hyphenMatch?.[1]) return hyphenMatch[1]
  return null
}

/** In-portal hash route segment from URLs like `/view/smart-construction/planner`. */
export function readPortalSubpathFromUrl(href = typeof window !== 'undefined' ? window.location.href : ''): string | null {
  try {
    const u = new URL(href, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    const match = u.pathname.replace(/\/+$/, '').match(/\/view\/[a-z0-9-]+\/(.+)$/i)
    if (!match?.[1]) return null
    const sub = match[1].replace(/^\/+|\/+$/g, '')
    return sub || null
  } catch {
    return null
  }
}

export function readPublicViewSectionFromUrl(href = typeof window !== 'undefined' ? window.location.href : ''): SectionKey | null {
  try {
    const u = new URL(href, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    const fromPath = readViewSlugFromPathname(u.pathname)
    if (fromPath) {
      const fromPathSection = normalizeSectionViewSlug(fromPath)
      if (fromPathSection) return fromPathSection
    }
    return normalizeSectionViewSlug(u.searchParams.get('view'))
  } catch {
    return null
  }
}

export function historyStateWithAppSection(prev: unknown, section: SectionKey | null): Record<string, unknown> {
  const base =
    prev !== null && typeof prev === 'object' && !Array.isArray(prev) ? { ...(prev as Record<string, unknown>) } : {}
  base[HISTORY_APP_SECTION_KEY] = section
  return base
}

function stripViewPath(pathname: string): string {
  const stripped = pathname
    .replace(/\/view\/[a-z0-9-]+(?:\/.*)?$/i, '')
    .replace(/\/view-[a-z0-9-]+$/i, '')
    .replace(/\/(planner|results|detection|cost-breakdown|final-report|location-rate-setup)(?:\/.*)?$/i, '')
    .replace(/\/+$/, '')
  return stripped || '/'
}

export function buildHrefWithAppSection(currentHref: string, nextSection: SectionKey | null): string {
  const u = new URL(currentHref, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
  u.searchParams.delete('view')
  u.searchParams.delete('section')
  u.searchParams.delete('adminEdit')

  const basePath = stripViewPath(u.pathname)

  if (nextSection === null) {
    u.pathname = basePath
    // Home should never retain in-portal hash routes like "#/planner".
    u.hash = ''
    return `${u.pathname}${u.search}${u.hash}`
  }

  const slug = sectionKeyToPageSlug(nextSection)
  if (slug && slug !== 'homepage') {
    u.pathname = `${basePath === '/' ? '' : basePath}/view/${slug}`.replace(/\/{2,}/g, '/')
    if (!u.pathname.startsWith('/')) u.pathname = `/${u.pathname}`
  } else {
    u.pathname = basePath
  }

  return `${u.pathname}${u.search}${u.hash}`
}

export function readSectionFromLocationHref(href: string): SectionKey | null {
  return readPublicViewSectionFromUrl(href)
}

export function readActiveSectionFromHistoryState(state: unknown, href: string): SectionKey | null {
  if (state !== null && typeof state === 'object' && HISTORY_APP_SECTION_KEY in state) {
    const v = (state as Record<string, unknown>)[HISTORY_APP_SECTION_KEY]
    if (v === null) return null
    if (typeof v === 'string' && isHomeSectionKey(v) && v !== 'settings') return v as SectionKey
    return readSectionFromLocationHref(href)
  }
  return readSectionFromLocationHref(href)
}
