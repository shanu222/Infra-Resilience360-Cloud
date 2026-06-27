import type { CmsMediaLibraryItem, CmsMediaLibraryRowType } from '../types/cmsMedia'
import type { MediaType } from '../types/media'
import { fetchApi } from './apiBase'
import { sameOriginApiBase } from './cmsApiOrigin'

const API = sameOriginApiBase()

function adminJsonHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-admin-key': String(import.meta.env.VITE_ADMIN_API_KEY ?? 'secure-key').trim(),
  }
}

/** Reconcile S3 `resilience360-static/` objects with Mongo `cms_media_library`. */
/** Server-only AI: map S3 objects → Mongo `cms_media_library` (matchedId). */
export async function postAdminMediaAiMapFromS3(body?: { force?: boolean; maxKeys?: number }): Promise<{
  ok?: boolean
  scanned?: number
  mapped?: number
  message?: string
  error?: string
} | null> {
  const url = `${API}/api/admin/media/ai-map-from-s3`
  try {
    const res = await fetchApi(url, {
      method: 'POST',
      credentials: 'include',
      headers: adminJsonHeaders(),
      body: JSON.stringify(body ?? {}),
    })
    const text = await res.text()
    if (!res.ok) {
      return null
    }
    return JSON.parse(text) as { ok?: boolean; scanned?: number; mapped?: number; message?: string }
  } catch {
    return null
  }
}

export async function postAdminCmsSyncS3(): Promise<{
  ok?: boolean
  scanned?: number
  added?: number
  error?: string
} | null> {
  const url = `${API}/api/admin/sync-s3`
  try {
    const res = await fetchApi(url, {
      method: 'POST',
      credentials: 'include',
      headers: adminJsonHeaders(),
      body: '{}',
    })
    const text = await res.text()
    if (!res.ok) {
      return null
    }
    return JSON.parse(text) as { ok?: boolean; scanned?: number; added?: number }
  } catch {
    return null
  }
}

/** Static platform: media library API is disabled. */
export async function fetchMediaBySection(section: string): Promise<CmsMediaLibraryItem[]> {
  void section
  return []
}

/** Static platform: media library API is disabled. */
export async function fetchAllMedia(): Promise<CmsMediaLibraryItem[]> {
  return []
}

export type CmsMappingStatus = {
  isCmsFullyMapped: boolean
  sections?: Record<string, { required?: number; mapped?: number; missing?: string[]; isFullyMapped?: boolean }>
}

/** Static platform: bundled content is always considered mapped for public rendering. */
export async function fetchCmsMappingStatus(): Promise<CmsMappingStatus> {
  return { isCmsFullyMapped: true, sections: {} }
}

/** Register an uploaded S3 URL in Mongo (idempotent; server merges by `s3Key`). */
export async function postAdminRegisterMedia(body: {
  url: string
  section: string
  type?: CmsMediaLibraryRowType
  mediaType?: MediaType
  isActive?: boolean
  mime?: string
  /** Learn & Train: card id (required with learn video uploads). */
  matchedId?: string
  /** Display title stored in Mongo. */
  title?: string
}): Promise<boolean> {
  const payload = {
    url: body.url,
    section: body.section,
    type: body.type,
    mediaType: body.mediaType,
    isActive: body.isActive,
    mime: body.mime,
    ...(body.matchedId ? { matchedId: body.matchedId } : {}),
    ...(body.title !== undefined ? { title: body.title } : {}),
  }
  const url = `${API}/api/admin/media`
  const res = await fetchApi(url, {
    method: 'POST',
    credentials: 'include',
    headers: adminJsonHeaders(),
    body: JSON.stringify(payload),
  })

  await res.text()
  if (!res.ok) {
    return false
  }

  return true
}

/** Admin: update media row title and/or canonical `url` (S3-backed). */
export async function patchAdminMedia(
  id: string,
  body: { title?: string; url?: string },
): Promise<{ ok?: boolean; item?: CmsMediaLibraryItem; error?: string } | null> {
  const rawId = String(id).trim()
  if (!rawId) return null
  const reqUrl = `${API}/api/admin/media/${encodeURIComponent(rawId)}`
  try {
    const res = await fetchApi(reqUrl, {
      method: 'PATCH',
      credentials: 'include',
      headers: adminJsonHeaders(),
      body: JSON.stringify(body),
    })
    const text = await res.text()
    let data: { ok?: boolean; item?: CmsMediaLibraryItem; error?: string } = {}
    try {
      data = JSON.parse(text) as { ok?: boolean; item?: CmsMediaLibraryItem; error?: string }
    } catch {
      /* */
    }
    if (!res.ok) {
      return { ok: false, error: data.error || text || `HTTP ${res.status}` }
    }
    return data
  } catch {
    return null
  }
}

/** Mark media inactive in Mongo while retaining S3 object. */
export async function postAdminDeactivateMedia(body: {
  section: string
  type?: CmsMediaLibraryRowType
  mediaType?: MediaType
  url?: string
}): Promise<boolean> {
  const payload = {
    section: body.section,
    type: body.type || 'background',
    mediaType: body.mediaType,
    url: body.url,
  }

  const url = `${API}/api/admin/media/deactivate`
  const res = await fetchApi(url, {
    method: 'POST',
    credentials: 'include',
    headers: adminJsonHeaders(),
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    await res.text().catch(() => '')
    return false
  }
  return true
}

