import { getCmsMappedSection } from './cmsReadAdapter'

export type GlobalShellConfig = {
  logoUrl: string
  adminTitle: string
  adminNavigationModeLabel: string
  adminEditModeLabel: string
  adminSyncLabel: string
}

export const DEFAULT_SHELL_LOGO_URL = `${import.meta.env.BASE_URL}assets/branding/ndma-logo.png`

/** Primary app mark / favicon source (bundled local branding asset). */
export const APP_BRAND_ICON_URL =
  `${import.meta.env.BASE_URL}assets/branding/app-logo.png`

/** Ordered fallbacks for app icon keys used across older/newer uploads. */
export const APP_BRAND_ICON_URL_CANDIDATES = [
  APP_BRAND_ICON_URL,
] as const

const defaults: GlobalShellConfig = {
  logoUrl: DEFAULT_SHELL_LOGO_URL,
  adminTitle: 'Infra Resilience360 Admin',
  adminNavigationModeLabel: 'Navigation mode',
  adminEditModeLabel: 'Edit mode',
  adminSyncLabel: 'Sync',
}

function safeString(v: unknown): string {
  return String(v ?? '').trim()
}

function selectShellFromMappedDoc(doc: {
  defaults?: Record<string, unknown>
  elements?: Array<{
    meta?: { matchedId?: string }
    content?: Record<string, unknown>
    media?: Record<string, unknown>
  }>
}): Record<string, unknown> {
  const fromDefaults =
    doc.defaults && typeof doc.defaults === 'object' ? (doc.defaults as Record<string, unknown>) : null
  if (fromDefaults) return fromDefaults

  const logo = doc.elements?.find((e) => e.meta?.matchedId === 'brand-logo')
  const labels = doc.elements?.find((e) => e.meta?.matchedId === 'admin-shell-labels')
  const labelBag = (labels?.content?.labels as Record<string, unknown> | undefined) ?? {}
  return {
    logoUrl: logo?.media?.image,
    adminTitle: labelBag.title,
    adminNavigationModeLabel: labelBag.navigationMode,
    adminEditModeLabel: labelBag.editMode,
    adminSyncLabel: labelBag.sync,
  }
}

function normalizeGlobalShellFromCms(raw: Record<string, unknown>): GlobalShellConfig {
  return {
    logoUrl: DEFAULT_SHELL_LOGO_URL,
    adminTitle: safeString(raw.adminTitle),
    adminNavigationModeLabel: safeString(raw.adminNavigationModeLabel),
    adminEditModeLabel: safeString(raw.adminEditModeLabel),
    adminSyncLabel: safeString(raw.adminSyncLabel),
  }
}

export function validateGlobalShellForCmsPriority(raw: Record<string, unknown>): boolean {
  if (!raw || typeof raw !== 'object') return false
  return (
    safeString(raw.adminTitle).length > 0 &&
    safeString(raw.adminNavigationModeLabel).length > 0 &&
    safeString(raw.adminEditModeLabel).length > 0 &&
    safeString(raw.adminSyncLabel).length > 0
  )
}

export async function fetchGlobalShellConfig(): Promise<GlobalShellConfig> {
  const doc = await getCmsMappedSection('globalShell')
  const rawFromMapping = doc ? selectShellFromMappedDoc(doc) : null
  if (rawFromMapping && validateGlobalShellForCmsPriority(rawFromMapping)) {
    return { ...defaults, ...normalizeGlobalShellFromCms(rawFromMapping) }
  }
  return { ...defaults }
}


