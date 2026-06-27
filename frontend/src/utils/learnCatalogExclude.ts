/**
 * Filters junk / accidental CMS uploads out of Learn & Train catalog lists.
 * (Rows may still exist in Mongo until an admin deletes or deactivates them.)
 */
export function isExcludedLearnCatalogRow(fields: {
  id?: string
  title?: string
  summary?: string
  fileName?: string
  url?: string
  s3Key?: string
  externalKey?: string
}): boolean {
  const blob = [
    fields.id,
    fields.title,
    fields.summary,
    fields.fileName,
    fields.url,
    fields.s3Key,
    fields.externalKey,
  ]
    .map((s) => String(s ?? ''))
    .join('\n')

  const lower = blob.toLowerCase()
  if (lower.includes('01kpqfnpnzennbn6hqtnk3xk8c')) return true
  if (/\bsimple\s+compose\b/i.test(blob)) return true
  const t = String(fields.title ?? '').trim()
  const f = String(fields.fileName ?? '').trim()
  if (/^\d+\s+\d{8}\s+\d+\s+new\s+video\b/i.test(t) || /^\d+\s+\d{8}\s+\d+\s+new\s+video\b/i.test(f)) return true
  return false
}
