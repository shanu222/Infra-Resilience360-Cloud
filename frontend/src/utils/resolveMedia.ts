import { resolveContentMediaUrl, type MediaLike } from './contentMediaResolver'

export type { MediaLike } from './contentMediaResolver'

export function resolveMedia(item?: MediaLike | null, fallback = ''): string {
  const url = String(item?.url ?? item?.src ?? '').trim()
  const s3Key = String(item?.s3Key ?? '').trim()
  if (s3Key || url) {
    return resolveContentMediaUrl({ url, s3Key })
  }
  if (fallback) {
    return resolveContentMediaUrl(fallback)
  }
  return ''
}
