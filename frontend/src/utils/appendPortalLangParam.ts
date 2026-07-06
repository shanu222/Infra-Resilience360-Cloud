/**
 * Appends `r360_api_base` so embedded static bundles (Retrofit, Disaster Dashboard, …) can call
 * an explicit backend endpoint when required by legacy bundles.
 */
export function appendPortalApiBaseHint(url: string, apiBase: string): string {
  const b = apiBase.trim().replace(/\/+$/, '')
  if (!b || !url || url.startsWith('file:')) return url
  try {
    const base =
      typeof window !== 'undefined' ? window.location.href : 'https://infra-resilience360-cloud-production.up.railway.app/'
    const resolved = new URL(url, base)
    resolved.searchParams.set('r360_api_base', b)
    if (/^https?:\/\//i.test(url)) {
      return resolved.href
    }
    return resolved.pathname + resolved.search + resolved.hash
  } catch {
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}r360_api_base=${encodeURIComponent(b)}`
  }
}

/** Language + optional API base hint for embedded portals. */
export function appendPortalLangAndApiHint(
  url: string,
  language: 'en' | 'ur',
  apiBaseHint?: string,
): string {
  const hint = (apiBaseHint ?? '').trim().replace(/\/+$/, '')
  const withApi = hint ? appendPortalApiBaseHint(url, hint) : url
  return appendPortalLangParam(withApi, language)
}

/**
 * Appends `lang=en|ur` to same-origin portal URLs so embedded static apps can
 * read the selected language. Skips `file:` URLs (local dev fallbacks).
 */
export function appendPortalLangParam(url: string, language: 'en' | 'ur'): string {
  if (!url || url.startsWith('file:')) return url
  const lang = language === 'ur' ? 'ur' : 'en'
  try {
    const base =
      typeof window !== 'undefined' ? window.location.href : 'https://infra-resilience360-cloud-production.up.railway.app/'
    const resolved = new URL(url, base)
    resolved.searchParams.set('lang', lang)
    if (/^https?:\/\//i.test(url)) {
      return resolved.href
    }
    return resolved.pathname + resolved.search + resolved.hash
  } catch {
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}lang=${encodeURIComponent(lang)}`
  }
}
