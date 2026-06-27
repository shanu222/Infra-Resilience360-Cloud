const safeString = (v) => String(v ?? '').trim()

/**
 * Turn a storage filename into a short display title (no extension, readable words).
 */
export function filenameToDisplayTitle(fileName) {
  const base = safeString(fileName).split(/[/\\]/).pop() || ''
  const stem = base.replace(/\.[^.]+$/i, '').replace(/[_]+/g, ' ').trim()
  if (!stem) return ''
  const words = stem.split(/[-\s]+/).filter(Boolean)
  if (words.length === 0) return ''
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}
