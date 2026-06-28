import { postAdminRegisterMedia } from './cmsMediaApi'
import { sameOriginApiBase } from './cmsApiOrigin'
import { fetchApi } from './apiBase'
import type { CmsMediaLibraryRowType } from '../types/cmsMedia'
import type { MediaType } from '../types/media'

const API = sameOriginApiBase()

function adminKeyHeader(): Record<string, string> {
  return { 'x-admin-key': 'secure-key' }
}

export type CmsUniversalUploadResult = { url: string; mediaId?: string | null; s3Key?: string }
type MediaRegisterOptions = {
  type?: CmsMediaLibraryRowType
  mediaType?: MediaType
  isActive?: boolean
  /** Learn page: card id for Mongo matchedId (auto from data-learn-card-id in editor). */
  matchedId?: string
}

/** Upload media for universal inline CMS; registers row in Mongo `cms_media_library`. */
export async function uploadCmsUniversalMedia(
  file: File,
  pageSlug: string,
  options?: MediaRegisterOptions,
): Promise<CmsUniversalUploadResult> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('page', pageSlug)
  fd.append('section', pageSlug)
  if (options?.type) fd.append('type', options.type)
  if (options?.matchedId) {
    fd.append('matchedId', options.matchedId)
    fd.append('targetId', options.matchedId)
  }

  const url = `${API}/api/upload`
  const res = await fetchApi(url, {
    method: 'POST',
    body: fd,
    credentials: 'include',
    headers: adminKeyHeader(),
  })

  const text = await res.text()
  if (!res.ok) {
    const reason = text || `Upload failed with status ${res.status}.`
    throw new Error(reason)
  }

  let data: { url?: string; mediaId?: string | null; key?: string }
  try {
    data = JSON.parse(text) as { url?: string; mediaId?: string | null; key?: string }
  } catch {
    throw new Error('Upload succeeded but response JSON was invalid.')
  }

  if (typeof data.url === 'string' && data.url) {
    const inferredType =
      file.type?.startsWith('video') ? 'video'
      : file.type?.startsWith('audio') ? 'audio'
      : file.type === 'application/pdf' ? 'pdf'
      : 'image'
    const registerType = options?.type || inferredType
    const registerMediaType = options?.mediaType || (registerType === 'background' ? inferredType : undefined)
    const ok = await postAdminRegisterMedia({
      url: data.url,
      section: pageSlug,
      type: registerType,
      mediaType: registerMediaType,
      isActive: options?.isActive,
      mime: file.type,
      matchedId: options?.matchedId,
    })
    if (!ok) {
      throw new Error('Media uploaded to S3 but MongoDB registration failed.')
    }
    window.dispatchEvent(new Event('cms-updated'))
    const s3Key = typeof data.key === 'string' && data.key.trim() ? data.key.trim() : undefined
    return { url: data.url, mediaId: data.mediaId ?? null, s3Key }
  }
  throw new Error('Upload response did not contain a media URL.')
}
