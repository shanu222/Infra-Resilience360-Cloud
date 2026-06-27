const normalizeEnvValue = (rawValue, fallback = '') =>
  String(rawValue ?? fallback)
    .trim()
    .replace(/^['\"]|['\"]$/g, '')

const MEDIA_BASE_URL = normalizeEnvValue(process.env.MEDIA_BASE_URL, '').replace(/\/+$/, '')
const R2_PUBLIC_BASE_URL = normalizeEnvValue(process.env.R2_PUBLIC_BASE_URL, '').replace(/\/+$/, '')
const R2_ACCOUNT_ID = normalizeEnvValue(process.env.R2_ACCOUNT_ID, '')
const R2_BUCKET = normalizeEnvValue(process.env.R2_BUCKET, '')
const MEDIA_BASE_STORAGE_SUFFIX = '/storage/content'
const DEFAULT_R2_MEDIA_BASE_URL = 'https://pub-e38210c9c2ff4bf3a45338616cd43df2.r2.dev'

function resolvePublicMediaBaseUrl() {
  if (MEDIA_BASE_URL) return MEDIA_BASE_URL
  if (R2_PUBLIC_BASE_URL) return R2_PUBLIC_BASE_URL
  if (R2_ACCOUNT_ID && R2_BUCKET) {
    return `https://${R2_BUCKET}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  }
  return DEFAULT_R2_MEDIA_BASE_URL
}

function extractMediaKeyFromUrl(url) {
  const s = String(url ?? '').trim()
  if (!s) return ''
  try {
    const u = new URL(s)
    const key = decodeURIComponent(u.pathname.replace(/^\/+/, ''))
    return key.startsWith('resilience360/') ? key : ''
  } catch {
    return ''
  }
}

export function mediaKeyToLocalMediaUrl(key) {
  const k = String(key ?? '')
    .trim()
    .replace(/^\/+/, '')
  if (!k) return ''
  const encoded = k
    .split('/')
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join('/')
  return `/storage/content/${encoded}`
}

function normalizeStorageSuffix(rawPath) {
  return String(rawPath ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^storage\/content\/?/i, '')
}

function buildPublicMediaUrlFromSuffix(suffix) {
  const cleanSuffix = normalizeStorageSuffix(suffix)
  if (!cleanSuffix) return ''
  const rawBase = String(resolvePublicMediaBaseUrl() ?? '').trim().replace(/\/+$/, '')
  if (!rawBase) return `${DEFAULT_R2_MEDIA_BASE_URL}/content/${cleanSuffix}`

  const basePathLower = (() => {
    try {
      return new URL(rawBase).pathname.toLowerCase().replace(/\/+$/, '')
    } catch {
      return ''
    }
  })()
  const hasContentSuffix = basePathLower.endsWith('/content')
  const hasStorageSuffix = basePathLower.endsWith(MEDIA_BASE_STORAGE_SUFFIX)

  if (hasContentSuffix) return `${rawBase}/${cleanSuffix}`
  if (hasStorageSuffix) return `${rawBase.replace(/\/storage\/content$/i, '')}/content/${cleanSuffix}`
  return `${rawBase}/content/${cleanSuffix}`
}

export function mapStorageContentToPublicMediaUrl(rawPath) {
  const clean = String(rawPath ?? '').trim()
  if (!clean) return clean
  if (clean.startsWith('/data/')) return clean
  const normalizedRaw = clean.replace(/\\/g, '/')
  if (normalizedRaw.startsWith('/storage/content/')) {
    return buildPublicMediaUrlFromSuffix(normalizedRaw.slice('/storage/content/'.length))
  }
  if (normalizedRaw.startsWith('storage/content/')) {
    return buildPublicMediaUrlFromSuffix(normalizedRaw.slice('storage/content/'.length))
  }
  return clean
}

export function rewriteMediaUrl(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return s
  if (s.startsWith('/static/media/local/')) {
    return mapStorageContentToPublicMediaUrl(s.replace(/^\/static\/media\/local\//, '/storage/content/'))
  }
  if (s.startsWith('/storage/content/') || s.startsWith('storage/content/')) {
    return mapStorageContentToPublicMediaUrl(s)
  }
  if (s.startsWith('/data/')) {
    return s
  }
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s)
      const p = u.pathname.replace(/\\/g, '/')
      if (p.startsWith('/storage/content/')) {
        return mapStorageContentToPublicMediaUrl(p)
      }
    } catch {
      /* keep original URL */
    }
  }
  const key = extractMediaKeyFromUrl(s)
  if (key) return mapStorageContentToPublicMediaUrl(mediaKeyToLocalMediaUrl(key))
  return s
}

export function rewriteMediaUrlsDeep(value) {
  if (value == null) return value
  if (typeof value === 'string') return rewriteMediaUrl(value)
  if (Array.isArray(value)) return value.map((v) => rewriteMediaUrlsDeep(v))
  if (typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = rewriteMediaUrlsDeep(v)
    }
    return out
  }
  return value
}

