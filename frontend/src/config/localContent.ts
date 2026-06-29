import { getMediaUrl } from '../utils/mediaUrl'
import { BUNDLED_BACKGROUND_VIDEO_URL } from './localAssets'

/** Local content URL builders for filesystem-backed runtime media. */

export const RESILIENCE360_LOCAL_BASE = getMediaUrl('')
export const RESILIENCE360_STATIC_LOCAL_BASE = getMediaUrl('')

export function localContentUrl(...pathSegments: string[]): string {
  const parts = pathSegments
    .flatMap((seg) => String(seg ?? '').split('/'))
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
  return getMediaUrl(parts.join('/'))
}

export function localResilience360Url(...pathSegments: string[]): string {
  return localContentUrl(...pathSegments)
}

export function localStaticMediaUrl(s3Key: string): string {
  const key = String(s3Key ?? '')
    .trim()
    .replace(/^\/+/, '')
  const encoded = key
    .split('/')
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join('/')
  return getMediaUrl(encoded)
}

/** Rewrite legacy absolute media URLs to local proxy paths. */
export function rewriteLegacyS3Url(raw: string): string {
  const s = String(raw ?? '').trim()
  if (!s) return s
  const normalized = s.startsWith('/') ? s.slice(1) : s
  if (s.startsWith('/static/media/local/')) {
    return getMediaUrl(s.replace(/^\/static\/media\/local\//, ''))
  }
  if (normalized.startsWith('storage/content/')) {
    return getMediaUrl(normalized.slice('storage/content/'.length))
  }
  if (s.startsWith('/data/')) {
    return s
  }
  try {
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s)
      const key = decodeURIComponent(u.pathname.replace(/^\/+/, ''))
      if (key.startsWith('resilience360/')) return localStaticMediaUrl(key)
    }
  } catch {
    /* keep original */
  }
  return s
}

export const LOCAL_BACKGROUND_VIDEO_URL = BUNDLED_BACKGROUND_VIDEO_URL
export const LOCAL_BACKGROUND_IMAGE_URL = localContentUrl('home', 'images', 'home.png')

