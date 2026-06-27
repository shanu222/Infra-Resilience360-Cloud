/** Display title from Mongo filename (client-side fallback when `title` empty). */
export function filenameToDisplayTitle(fileName: string | undefined): string {
  const base = String(fileName ?? '')
    .trim()
    .split(/[/\\]/)
    .pop() || ''
  const stem = base.replace(/\.[^.]+$/i, '').replace(/[_]+/g, ' ').trim()
  if (!stem) return ''
  const words = stem.split(/[-\s]+/).filter(Boolean)
  if (words.length === 0) return ''
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

/** Last path segment of a URL or key-like string (for deriving a title from S3 URL). */
export function filenameFromMediaUrl(urlOrKey: string | undefined): string {
  const raw = String(urlOrKey ?? '').trim()
  if (!raw) return ''
  try {
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw)
    const parsed = hasScheme ? new URL(raw) : new URL(raw, 'https://placeholder.local')
    const path = parsed.pathname || ''
    const last = path.split('/').filter(Boolean).pop() || ''
    return decodeURIComponent(last.split('?')[0] || '').replace(/\+/g, ' ')
  } catch {
    const noQuery = raw.split('?')[0] || ''
    const last = noQuery.split(/[/\\]/).filter(Boolean).pop() || ''
    return decodeURIComponent(last)
  }
}

function prettifyCatalogId(id: string): string {
  const s = id.trim()
  if (!s) return ''
  const words = s.replace(/[-_]+/g, ' ').split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

const GENERIC_TITLE = /^video$/i

/**
 * Best display title for a learn catalog row: real CMS title first, then file / URL path /
 * s3 key stem / matched id — avoids three identical "Video" labels when Mongo titles are empty.
 */
export function learnRowDisplayTitle(parts: {
  title?: string
  fileName?: string
  url?: string
  s3Key?: string
  id?: string
}): string {
  const t0 = String(parts.title || '').trim()
  if (t0 && !GENERIC_TITLE.test(t0)) return t0

  const fromFile = filenameToDisplayTitle(parts.fileName)
  if (fromFile) return fromFile

  const fromUrl = filenameToDisplayTitle(filenameFromMediaUrl(parts.url))
  if (fromUrl) return fromUrl

  const fromKey = filenameToDisplayTitle(filenameFromMediaUrl(parts.s3Key))
  if (fromKey) return fromKey

  const fromId = prettifyCatalogId(String(parts.id || ''))
  if (fromId) return fromId

  if (t0) return t0

  return 'Training video'
}
