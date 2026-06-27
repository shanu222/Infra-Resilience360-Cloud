import { rewriteLegacyS3Url, localStaticMediaUrl } from '../config/localContent'
import { fixApiUrl } from './fixApiUrl'
import { inferS3KeysFromLocalPath, buildS3ProxyMediaUrl } from './contentMediaResolver'

function decodePathSegment(seg: string): string {
  try {
    return decodeURIComponent(seg)
  } catch {
    return seg
  }
}

function s3ObjectKeyFromParsedUrl(parsed: URL): string | null {
  const host = parsed.hostname.toLowerCase()
  const pathParts = parsed.pathname.replace(/^\/+/, '').split('/').filter(Boolean)
  if (pathParts.length === 0) return null

  const mediaBucket = String(import.meta.env.VITE_S3_MEDIA_BUCKET ?? 'pak-population-data')
    .trim()
    .toLowerCase()

  const isAwsS3Host =
    /(?:^|\.)(?:s3|s3-[a-z0-9-]+)\.[a-z0-9.-]*amazonaws\.com$/i.test(host) || host.endsWith('.amazonaws.com')

  if (!isAwsS3Host) return null

  if (host === 's3.amazonaws.com' || host.startsWith('s3.') || /^s3-[a-z0-9-]+\./i.test(host)) {
    if (mediaBucket && pathParts[0]?.toLowerCase() === mediaBucket && pathParts.length > 1) {
      return pathParts.slice(1).map(decodePathSegment).join('/')
    }
    return pathParts.map(decodePathSegment).join('/')
  }

  return pathParts.map(decodePathSegment).join('/')
}

function enforceHttpsOnSecurePage(url: string): string {
  const raw = String(url ?? '').trim()
  if (!raw) return raw
  if (typeof window === 'undefined') return raw
  if (window.location.protocol !== 'https:') return raw
  if (!/^http:\/\//i.test(raw)) return raw
  try {
    const parsed = new URL(raw)
    const host = parsed.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1') return raw
  } catch {
    return raw
  }
  return raw.replace(/^http:\/\//i, 'https://')
}

function rewriteKnownApiMediaPath(url: string): string | null {
  const raw = String(url ?? '').trim()
  if (!raw) return null

  const normalizedRaw = raw.startsWith('/') ? raw : `/${raw}`

  if (!/^https?:\/\//i.test(normalizedRaw)) return null

  try {
    const parsed = new URL(normalizedRaw)
    const host = parsed.hostname.toLowerCase()
    const path = parsed.pathname.replace(/^\/+/, '')
    const isKnownCmsS3 =
      /(?:^|\.)(?:s3|s3-[a-z0-9-]+)\.[a-z0-9.-]*amazonaws\.com$/i.test(host) &&
      (path.startsWith('resilience360-static/') ||
        path.startsWith('resilience360/') ||
        path.startsWith('resilient-infra-models/') ||
        path.startsWith('resilience360/learn/') ||
        path.startsWith('infra-models/') ||
        path.startsWith('infra-resilience/'))
    if (isKnownCmsS3) {
      const key = s3ObjectKeyFromParsedUrl(parsed) ?? path
      return localStaticMediaUrl(key)
    }
    if (/amazonaws\.com/i.test(host)) {
      const key = s3ObjectKeyFromParsedUrl(parsed)
      if (key) return localStaticMediaUrl(key)
      return rewriteLegacyS3Url(raw)
    }
  } catch {
    return null
  }

  return null
}

/** Resolve relative media paths to backend-routed `/storage/content/*` URLs. */
export function resolveSectionMediaUrl(maybeRelative: string): string {
  const u = String(maybeRelative ?? '').trim()
  if (!u) return ''
  const localS3Keys = inferS3KeysFromLocalPath(u)
  if (localS3Keys.length > 0) {
    const proxied = buildS3ProxyMediaUrl(localS3Keys[0])
    if (proxied) return enforceHttpsOnSecurePage(proxied)
  }
  const rewrittenKnownPath = rewriteKnownApiMediaPath(u)
  if (rewrittenKnownPath) return enforceHttpsOnSecurePage(rewrittenKnownPath)
  if (/^https?:\/\//i.test(u)) return enforceHttpsOnSecurePage(rewriteLegacyS3Url(u))
  const fixed = fixApiUrl(u)
  if (fixed) return enforceHttpsOnSecurePage(fixed)
  const path = u.startsWith('/') ? u.replace(/^\/+/, '') : u
  if (path.startsWith('storage/content/')) {
    return enforceHttpsOnSecurePage(`/${path}`)
  }
  if (path.startsWith('static/media/local/')) {
    return enforceHttpsOnSecurePage(`/${path.replace(/^static\/media\/local\//, 'storage/content/')}`)
  }
  if (path.startsWith('content/')) {
    return enforceHttpsOnSecurePage(`/${path.replace(/^content\//, 'storage/content/')}`)
  }
  return enforceHttpsOnSecurePage(localStaticMediaUrl(path))
}

/**
 * Cache-bust remote media (admin `cv` + playback `t`) for WebView/APK.
 * Same rules as training videos.
 */
/** Stable numeric token for `t=` cache-busting — avoids new URL on every render / poll when content did not change. */
export function stablePlaybackToken(id: string, updatedAt?: string): number {
  const base = `${id}|${updatedAt ?? ''}`
  let h = 2166136261
  for (let i = 0; i < base.length; i++) {
    h ^= base.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) || 1
}

/** Presigned / authenticated URLs must not get extra query params (breaks Sig V4 / CloudFront). */
function isLikelySignedOrAuthenticatedMediaUrl(u: string): boolean {
  const lower = u.toLowerCase()
  if (lower.includes('x-amz-signature') || lower.includes('x-amz-credential') || lower.includes('x-amz-security-token')) {
    return true
  }
  if (lower.includes('x-goog-signature') || lower.includes('goog-signature')) return true
  // CloudFront canned / custom policy URLs
  if (/[?&]signature=[^&]+/i.test(u) && /[?&]key-pair-id=[^&]+/i.test(u)) return true
  if (/[?&]policy=[^&]+/i.test(u) && /[?&]signature=[^&]+/i.test(u)) return true
  // Azure Blob SAS
  if (/[?&]sig=[^&]+/i.test(u) && /[?&]sv=\d{4}/i.test(u)) return true
  return false
}

export function finalizeRemoteMediaUrl(
  url: string,
  playbackTimestamp: number,
  contentUpdatedAt?: string,
): string {
  let u = String(url ?? '').trim()
  if (!u) return u

  if (isLikelySignedOrAuthenticatedMediaUrl(u)) {
    return u
  }

  if (contentUpdatedAt) {
    const sep = u.includes('?') ? '&' : '?'
    u = `${u}${sep}cv=${encodeURIComponent(contentUpdatedAt)}`
  }
  {
    const sep = u.includes('?') ? '&' : '?'
    u = `${u}${sep}t=${playbackTimestamp}`
  }
  return u
}

