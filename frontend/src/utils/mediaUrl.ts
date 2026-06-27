import { buildApiUrl } from '../services/apiBase'

function normalizeRelativeMediaPath(relativePath: string): string {
  return String(relativePath ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
}

function mediaBaseFromWindow(): string {
  if (typeof window === 'undefined') return ''
  return String(
    (window as Window & { __R360_MEDIA_BASE_URL?: string }).__R360_MEDIA_BASE_URL ??
      (window as Window & { __ENV__?: { VITE_MEDIA_BASE_URL?: string; VITE_PUBLIC_MEDIA_BASE_URL?: string } }).__ENV__
        ?.VITE_MEDIA_BASE_URL ??
      (window as Window & { __ENV__?: { VITE_MEDIA_BASE_URL?: string; VITE_PUBLIC_MEDIA_BASE_URL?: string } }).__ENV__
        ?.VITE_PUBLIC_MEDIA_BASE_URL ??
      '',
  )
    .trim()
    .replace(/\/+$/, '')
}

function mediaBaseFromEnv(): string {
  return String(import.meta.env.VITE_MEDIA_BASE_URL ?? import.meta.env.VITE_PUBLIC_MEDIA_BASE_URL ?? '')
    .trim()
    .replace(/\/+$/, '')
}

function getConfiguredMediaBaseUrl(): string {
  return mediaBaseFromWindow() || mediaBaseFromEnv()
}

function buildDirectMediaUrl(baseUrl: string, cleanPath: string): string {
  if (!cleanPath) return `${baseUrl}/content`
  return `${baseUrl}/content/${cleanPath}`
}

/** Build absolute media URL, preferring direct R2 delivery when configured. */
export function getMediaUrl(relativePath: string): string {
  const raw = String(relativePath ?? '').trim()
  if (/^https?:\/\//i.test(raw)) return raw
  const clean = normalizeRelativeMediaPath(relativePath)
  const mediaBaseUrl = getConfiguredMediaBaseUrl()
  if (mediaBaseUrl) return buildDirectMediaUrl(mediaBaseUrl, clean)
  if (!clean) return buildApiUrl('/storage/content')
  return buildApiUrl(`/storage/content/${clean}`)
}

export function getModuleMediaUrl(moduleId: string, ...segments: string[]): string {
  const moduleKey = normalizeRelativeMediaPath(moduleId)
  const tail = segments.map(normalizeRelativeMediaPath).filter(Boolean).join('/')
  return getMediaUrl([moduleKey, tail].filter(Boolean).join('/'))
}

