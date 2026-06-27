export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

export function containsSearch(value: string, query: string): boolean {
  if (!query) return true
  return normalizeText(value).includes(normalizeText(query))
}

export function highlightMatch(value: string, query: string): string {
  if (!query.trim()) return value
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return value.replace(new RegExp(`(${escaped})`, 'ig'), '<mark>$1</mark>')
}
