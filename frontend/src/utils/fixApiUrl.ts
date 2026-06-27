import { RESOLVED_API_ORIGIN } from '../config/api'

export const fixApiUrl = (url?: string | null): string | undefined => {
  if (!url) return url ?? undefined
  if (url.startsWith('http')) return url

  const base = String(RESOLVED_API_ORIGIN ?? '').trim().replace(/\/+$/, '')

  if (!base) {
    return url.startsWith('/') ? url : `/${url}`
  }

  return `${base}${url.startsWith('/') ? url : `/${url}`}`
}

