import type { SectionKey } from '../types/sectionKeys'

export const roleOptions = [
  'Engineer / Planner',
  'Contractor / Builder',
  'Homeowner / Resident',
  'Admin (Full Access)',
] as const

export type RoleOption = (typeof roleOptions)[number]

/** Admin role: all 11 homepage tiles eligible (subject to CMS `enabled`). */
export const adminFullAccessSectionKeys: SectionKey[] = [
  'retrofit',
  'infraModels',
  'designToolkit',
  'smartConstruction',
  'materialHubs',
  'pgbc',
  'bestPractices',
  'readiness',
  'learn',
  'riskMaps',
  'disasterDashboard',
]

/** Which home tiles appear for each navbar role (subset of the 11 default CMS cards). */
export const homeSectionKeysByRole: Record<RoleOption, SectionKey[]> = {
  'Engineer / Planner': [
    'retrofit',
    'infraModels',
    'designToolkit',
    'smartConstruction',
    'materialHubs',
    'pgbc',
    'bestPractices',
  ],
  'Contractor / Builder': ['retrofit', 'materialHubs', 'smartConstruction', 'bestPractices', 'learn'],
  'Homeowner / Resident': [
    'retrofit',
    'readiness',
    'smartConstruction',
    'bestPractices',
    'learn',
    'riskMaps',
    'disasterDashboard',
  ],
  'Admin (Full Access)': adminFullAccessSectionKeys,
}

/** Visual-only metadata for home grid cards; titles come from locale / CMS. */
export const homeCardMeta: Record<SectionKey, { icon: string; tone: string }> = {
  bestPractices: { icon: '📘', tone: 'tone-a' },
  riskMaps: { icon: '🌍', tone: 'tone-b' },
  /** In-app embed for live earthquake alerts (not a home-grid tile). */
  liveEarthquakeMap: { icon: '🌍', tone: 'tone-b' },
  designToolkit: { icon: '🏗️', tone: 'tone-c' },
  infraModels: { icon: '🧱', tone: 'tone-d' },
  disasterDashboard: { icon: '🚨', tone: 'tone-g' },
  materialHubs: { icon: '🏗️', tone: 'tone-b' },
  pgbc: { icon: '🏛️', tone: 'tone-c' },
  retrofitCalculator: { icon: '🧮', tone: 'tone-f' },
  applyRegion: { icon: '📍', tone: 'tone-d' },
  readiness: { icon: '📊', tone: 'tone-e' },
  retrofit: { icon: '🧰', tone: 'tone-f' },
  smartConstruction: { icon: '📐', tone: 'tone-h' },
  learn: { icon: '📚', tone: 'tone-h' },
  helpCenter: { icon: '📖', tone: 'tone-e' },
  settings: { icon: '⚙️', tone: 'tone-e' },
}

export const isHomeSectionKey = (s: string): s is SectionKey =>
  Object.prototype.hasOwnProperty.call(homeCardMeta, s)
