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

export function rewriteMediaUrl(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return s
  if (s.startsWith('/static/media/local/')) {
    return s.replace(/^\/static\/media\/local\//, '/storage/content/')
  }
  if (s.startsWith('/storage/content/') || s.startsWith('/data/')) {
    return s
  }
  const key = extractMediaKeyFromUrl(s)
  if (key) return mediaKeyToLocalMediaUrl(key)
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

