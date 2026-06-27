import { getStaticCmsMappedSection } from './staticContent'

export type CmsMappedElement = {
  meta?: {
    section?: string
    matchedId?: string
    type?: string
    sourceRef?: string
    mappedAt?: string
  }
  content?: Record<string, unknown>
  style?: Record<string, unknown>
  media?: Record<string, unknown>
  visibility?: {
    visible?: boolean
    roleMatrix?: Record<string, boolean>
  }
}

export type CmsMappedSectionDocument = {
  section: string
  docKey: string
  defaults?: Record<string, unknown>
  elements?: CmsMappedElement[]
}

type CmsMappingDefaultsResponse = {
  version?: string
  generatedAt?: string
  sections?: Record<string, CmsMappedSectionDocument>
}

export function invalidateCmsMappingCache() {
  /* static bundles — no network cache */
}

export async function fetchCmsMappingDefaults(): Promise<CmsMappingDefaultsResponse | null> {
  const sections: Record<string, CmsMappedSectionDocument> = {}
  for (const key of ['globalShell', 'homepage', 'learnTrain', 'infraModels', 'riskMapsReadiness', 'retrofit', 'portals']) {
    const doc = getStaticCmsMappedSection(key)
    if (doc) sections[key] = doc
  }
  return { version: 'static', generatedAt: new Date(0).toISOString(), sections }
}

export async function getCmsMappedSection(section: string): Promise<CmsMappedSectionDocument | null> {
  return getStaticCmsMappedSection(section)
}

function isNonEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0
  return true
}

function mergeCmsFirst<T>(cmsValue: T, fallbackValue: T): T {
  if (!isNonEmpty(cmsValue)) return fallbackValue
  if (!isNonEmpty(fallbackValue)) return cmsValue
  if (Array.isArray(cmsValue) || Array.isArray(fallbackValue)) return cmsValue
  if (typeof cmsValue === 'object' && typeof fallbackValue === 'object') {
    const out: Record<string, unknown> = { ...(fallbackValue as Record<string, unknown>) }
    for (const [key, value] of Object.entries(cmsValue as Record<string, unknown>)) {
      const fb = out[key]
      out[key] =
        typeof value === 'object' && value !== null && typeof fb === 'object' && fb !== null ?
          mergeCmsFirst(value as Record<string, unknown>, fb as Record<string, unknown>)
        : isNonEmpty(value) ? value
        : fb
    }
    return out as T
  }
  return isNonEmpty(cmsValue) ? cmsValue : fallbackValue
}

export async function resolveCmsFirst<T>(
  section: string,
  fallbackValue: T,
  selectCmsValue: (doc: CmsMappedSectionDocument) => T | null | undefined,
  _label: string,
): Promise<T> {
  const doc = await getCmsMappedSection(section)
  if (!doc) return fallbackValue
  const picked = selectCmsValue(doc)
  if (!isNonEmpty(picked)) return fallbackValue
  return mergeCmsFirst(picked as T, fallbackValue)
}

export async function resolveCmsPriority<T>(
  section: string,
  fallbackValue: T,
  selectCmsValue: (doc: CmsMappedSectionDocument) => T | null | undefined,
  validate: (value: T) => boolean,
  _label: string,
): Promise<T> {
  const doc = await getCmsMappedSection(section)
  if (!doc) return fallbackValue
  const picked = selectCmsValue(doc)
  if (!isNonEmpty(picked) || !validate(picked as T)) return fallbackValue
  return picked as T
}
