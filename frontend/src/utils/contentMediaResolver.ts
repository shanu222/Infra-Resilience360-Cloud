import { MEDIA_PLACEHOLDER_DATA_URL, MEDIA_UNAVAILABLE_MESSAGE } from './contentMediaConstants'
import { EXACT_LOCAL_TO_S3_KEY, LOCAL_PREFIX_RULES } from './contentMediaLocalMap'
import { resolveSectionMediaUrl } from './sectionMediaUrl'

export { MEDIA_UNAVAILABLE_MESSAGE, MEDIA_PLACEHOLDER_DATA_URL } from './contentMediaConstants'

import { localStaticMediaUrl, rewriteLegacyS3Url } from '../config/localContent'

const S3_HOST_RE = /(?:^|\.)(?:s3|s3-[a-z0-9-]+)\.[a-z0-9.-]*amazonaws\.com$/i

const AUDITED_LOCAL_ROOTS = [
  'public/pgbc/',
  'public/material-hubs/',
  'public/disaster-dashboard/',
  'public/assets/pdfs/',
  'public/assets/models/',
  'public/assets/for-disaster-dashboard/',
] as const

export type MediaLike = {
  url?: string | null
  s3Key?: string | null
  src?: string | null
  /** Legacy/alternate S3 keys (e.g. learn catalog flat .mp4 paths). */
  s3KeyAlternates?: string[] | null
}

function uniqueStrings(values: string[]): string[] {
  const out: string[] = []
  for (const v of values) {
    const t = String(v ?? '').trim()
    if (!t || out.includes(t)) continue
    out.push(t)
  }
  return out
}

/** Build local media URL from object key (legacy name retained for imports). */
export function buildS3ProxyMediaUrl(s3Key: string, _apiBaseHint?: string): string {
  const key = String(s3Key ?? '').trim().replace(/^\/+/, '')
  if (!key) return ''
  return localStaticMediaUrl(key)
}

function extractKeyFromDirectS3Url(url: string): string | null {
  const trimmed = String(url ?? '').trim()
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null
  try {
    const parsed = new URL(trimmed)
    if (!S3_HOST_RE.test(parsed.hostname)) return null
    const path = parsed.pathname.replace(/^\/+/, '')
    const bucket = String(import.meta.env.VITE_S3_MEDIA_BUCKET ?? 'pak-population-data').trim().toLowerCase()
    const parts = path.split('/').filter(Boolean)
    if (bucket && parts[0]?.toLowerCase() === bucket && parts.length > 1) {
      return decodeURIComponent(parts.slice(1).join('/'))
    }
    return decodeURIComponent(path)
  } catch {
    return null
  }
}

function normalizeLocalReference(raw: string): string {
  let s = String(raw ?? '').trim().replace(/\\/g, '/')
  if (!s) return ''
  try {
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s)
      if (u.pathname.includes('/pgbc/')) {
        const idx = u.pathname.indexOf('/pgbc/')
        return u.pathname.slice(idx + '/pgbc/'.length) + (u.search || '')
      }
      if (u.pathname.includes('/material-hubs/')) {
        const idx = u.pathname.indexOf('/material-hubs/')
        return u.pathname.slice(idx + '/material-hubs/'.length) + (u.search || '')
      }
      return s
    }
  } catch {
    /* keep */
  }
  s = s.split('?')[0].split('#')[0]
  if (s.startsWith('./')) s = s.slice(2)
  for (const root of AUDITED_LOCAL_ROOTS) {
    const idx = s.toLowerCase().indexOf(root.toLowerCase())
    if (idx >= 0) return s.slice(idx + root.length)
  }
  if (s.startsWith('/pgbc/')) return s.slice('/pgbc/'.length)
  if (s.startsWith('pgbc/')) return s.slice('pgbc/'.length)
  if (s.startsWith('/material-hubs/')) return s.slice('/material-hubs/'.length)
  if (s.startsWith('material-hubs/')) return s.slice('material-hubs/'.length)
  if (s.startsWith('/assets/')) return s.slice(1)
  if (s.startsWith('/')) return s.slice(1)
  return s
}

/** Infer S3 object keys for a legacy local public reference. */
export function inferS3KeysFromLocalPath(localRef: string): string[] {
  const rel = normalizeLocalReference(localRef)
  if (!rel) return []

  const exact = EXACT_LOCAL_TO_S3_KEY[rel] ?? EXACT_LOCAL_TO_S3_KEY[rel.toLowerCase()]
  if (exact) return uniqueStrings([exact])

  const full = rel.startsWith('public/') ? rel : `public/${rel}`
  for (const rule of LOCAL_PREFIX_RULES) {
    const m = full.match(rule.match) ?? rel.match(rule.match)
    if (m) return uniqueStrings(rule.toS3Key(rel, m))
  }

  if (/\.pdf$/i.test(rel) && !rel.includes('/')) {
    return uniqueStrings([`resilience360/pgbc/${rel}`, `PGBC/${rel}`])
  }

  return []
}

export function inferS3KeysFromMediaInput(input: string | MediaLike | null | undefined): string[] {
  if (!input) return []
  if (typeof input === 'string') {
    const trimmed = input.trim()
    if (!trimmed) return []
    const fromS3Url = extractKeyFromDirectS3Url(trimmed)
    if (fromS3Url) return uniqueStrings([fromS3Url])
    return inferS3KeysFromLocalPath(trimmed)
  }
  const s3Key = String(input.s3Key ?? '').trim()
  const alternates = Array.isArray(input.s3KeyAlternates)
    ? input.s3KeyAlternates.map((k) => String(k ?? '').trim().replace(/^\/+/, '')).filter(Boolean)
    : []
  if (s3Key || alternates.length) {
    return uniqueStrings([s3Key.replace(/^\/+/, ''), ...alternates])
  }
  const url = String(input.url ?? input.src ?? '').trim()
  if (!url) return []
  const fromS3Url = extractKeyFromDirectS3Url(url)
  if (fromS3Url) return uniqueStrings([fromS3Url])
  return inferS3KeysFromLocalPath(url)
}

/**
 * Resolve media URL candidates in priority order:
 * 1) Direct S3 URLs from resolved object keys
 * 2) Legacy/local references mapped to S3 keys
 * 3) Placeholder (images only — caller may omit)
 */
export function resolveContentMediaCandidates(
  input: string | MediaLike | null | undefined,
  options?: { apiBaseHint?: string; includePlaceholder?: boolean },
): string[] {
  const includePlaceholder = options?.includePlaceholder !== false
  const raw =
    typeof input === 'string' ? input.trim() : String(input?.url ?? input?.src ?? '').trim()
  const out: string[] = []

  const add = (url: string) => {
    const v = String(url ?? '').trim()
    if (!v || out.includes(v)) return
    out.push(v)
  }

  for (const key of inferS3KeysFromMediaInput(input)) {
    add(buildS3ProxyMediaUrl(key, options?.apiBaseHint))
  }

  if (raw) {
    const sectionResolved = resolveSectionMediaUrl(raw)
    if (sectionResolved) add(sectionResolved)

    if (/^https?:\/\//i.test(raw)) {
      const key = extractKeyFromDirectS3Url(raw)
      if (key) add(buildS3ProxyMediaUrl(key, options?.apiBaseHint))
      const proxied = rewritePakPopulationDataUrl(raw, options?.apiBaseHint)
      if (proxied) add(proxied)
    } else {
      const localKeys = inferS3KeysFromLocalPath(raw)
      for (const key of localKeys) {
        add(buildS3ProxyMediaUrl(key, options?.apiBaseHint))
      }
      if (typeof window !== 'undefined') {
        const rel = raw.startsWith('/') ? raw.slice(1) : raw
        if (rel) add(localStaticMediaUrl(rel))
      }
    }
  }

  if (includePlaceholder && out.length === 0) {
    add(MEDIA_PLACEHOLDER_DATA_URL)
  }

  return out
}

/** First resolved URL (S3 proxy preferred). */
export function resolveContentMediaUrl(
  input: string | MediaLike | null | undefined,
  options?: { apiBaseHint?: string },
): string {
  const candidates = resolveContentMediaCandidates(input, { ...options, includePlaceholder: true })
  return candidates[0] ?? MEDIA_PLACEHOLDER_DATA_URL
}

function rewritePakPopulationDataUrl(httpsUrl: string, apiBaseHint?: string): string | null {
  const rewritten = rewriteLegacyS3Url(httpsUrl)
  if (rewritten !== httpsUrl) return rewritten
  return buildS3ProxyMediaUrl(extractKeyFromDirectS3Url(httpsUrl) ?? '', apiBaseHint) || null
}

/** Hide raw AWS / HTTP error tokens from UI surfaces. */
export function sanitizeMediaErrorMessage(raw: unknown): string {
  const text = String(raw ?? '').trim()
  if (!text) return MEDIA_UNAVAILABLE_MESSAGE
  const lower = text.toLowerCase()
  if (
    lower.includes('nosuchkey') ||
    lower.includes('accessdenied') ||
    lower.includes('403') ||
    lower.includes('404') ||
    lower.includes('not found') ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror')
  ) {
    return MEDIA_UNAVAILABLE_MESSAGE
  }
  return MEDIA_UNAVAILABLE_MESSAGE
}
