import type { PgbcCatalog, PgbcChapter } from '../types/pgbc'
import { getMediaUrl, getModuleMediaUrl } from '../../../utils/mediaUrl'

function normalizeBuildingCodePdfUrl(rawPath: string): string {
  const raw = String(rawPath ?? '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw

  const clean = raw.replace(/\\/g, '/').replace(/^\/+/, '')
  if (clean.startsWith('storage/content/')) {
    return getMediaUrl(clean.slice('storage/content/'.length))
  }
  if (clean.startsWith('content/')) {
    const legacyTail = clean.replace(/^content\/(?:resilience360\/)?building-codes\/?/i, '')
    return getModuleMediaUrl('building-codes', legacyTail)
  }
  if (clean.startsWith('building-codes/')) {
    return getMediaUrl(clean)
  }
  return getModuleMediaUrl('building-codes', clean)
}

export async function loadPgbcCatalog(): Promise<PgbcCatalog> {
  const response = await fetch('/data/building-codes/chapters.json', { cache: 'force-cache' })
  if (!response.ok) throw new Error('Unable to load PGBC catalog.')
  const payload = (await response.json()) as PgbcCatalog
  const normalizedCodes = Array.isArray(payload.codes) ?
      payload.codes.map((code) => ({
        ...code,
        pdfPath: normalizeBuildingCodePdfUrl(String(code.pdfPath ?? '')),
      }))
    : []
  return {
    ...payload,
    codes: normalizedCodes,
  }
}

export async function loadCodeHierarchy(path: string): Promise<PgbcChapter[]> {
  const response = await fetch(path, { cache: 'force-cache' })
  if (!response.ok) return []
  const payload = (await response.json()) as PgbcChapter[]
  return Array.isArray(payload) ? payload : []
}
