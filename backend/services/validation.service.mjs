import { z } from 'zod'

/** Known CMS read query keys; unknown keys are preserved on the request object. */
export const cmsQuerySchema = z.object({
  page: z.string().optional(),
  slug: z.string().optional(),
  section: z.string().optional(),
})

function queryValueInvalid(v) {
  if (v === undefined || v === null) return false
  if (Array.isArray(v)) return v.some(queryValueInvalid)
  return !(typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
}

function toOptionalQueryString(v) {
  if (v === undefined || v === null) return undefined
  const x = Array.isArray(v) ? v[0] : v
  if (x === undefined || x === null) return undefined
  return String(x)
}

/**
 * Lenient validation: coerce page/slug/section to strings when sane; otherwise return `query` unchanged.
 * Never throws — avoids rejecting odd but previously tolerated inputs.
 */
export function validateCmsQuery(query) {
  const raw = query && typeof query === 'object' && !Array.isArray(query) ? query : {}
  if (queryValueInvalid(raw.page) || queryValueInvalid(raw.slug) || queryValueInvalid(raw.section)) {
    return raw
  }
  const narrowed = {
    page: toOptionalQueryString(raw.page),
    slug: toOptionalQueryString(raw.slug),
    section: toOptionalQueryString(raw.section),
  }
  const result = cmsQuerySchema.safeParse(narrowed)
  if (!result.success) return raw
  return { ...raw, ...result.data }
}
