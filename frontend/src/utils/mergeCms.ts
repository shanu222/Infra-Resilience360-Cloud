import type { CmsMediaPayload, UniversalElementPayload } from '../types/universalElement'
import { mergeBilingual } from './bilingualText'

/**
 * Shallow CMS override: defaults stay complete; partial `cmsData` only fills/overrides fields.
 * `media: null` is explicit clear (same as Mongo).
 */
export function mergeCms(
  defaultData: UniversalElementPayload,
  cmsData: UniversalElementPayload | null | undefined,
): UniversalElementPayload {
  if (!cmsData) {
    return { ...defaultData }
  }
  return {
    cmsType: cmsData.cmsType ?? defaultData.cmsType,
    tag: cmsData.tag ?? defaultData.tag,
    text: mergeBilingual(cmsData.text, defaultData.text),
    placeholder: mergeBilingual(cmsData.placeholder, defaultData.placeholder),
    styles: { ...(defaultData.styles ?? {}), ...(cmsData.styles ?? {}) },
    media: mergeCmsMedia(cmsData.media, defaultData.media),
  }
}

function mergeCmsMedia(
  cms: CmsMediaPayload | null | undefined,
  def: CmsMediaPayload | null | undefined,
): CmsMediaPayload | null | undefined {
  if (cms === null) return null
  const base = def && typeof def === 'object' ? { ...def } : {}
  if (cms === undefined) {
    return Object.keys(base).length ? base : def
  }
  if (typeof cms !== 'object') return def
  return { ...base, ...cms }
}
