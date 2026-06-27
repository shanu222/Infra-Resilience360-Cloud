import { buildApiUrl } from '../services/apiBase'

function normalizeRelativeMediaPath(relativePath: string): string {
  return String(relativePath ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
}

/** Build absolute centralized media URL through backend API origin. */
export function getMediaUrl(relativePath: string): string {
  const clean = normalizeRelativeMediaPath(relativePath)
  if (!clean) return buildApiUrl('/storage/content')
  return buildApiUrl(`/storage/content/${clean}`)
}

export function getModuleMediaUrl(moduleId: string, ...segments: string[]): string {
  const moduleKey = normalizeRelativeMediaPath(moduleId)
  const tail = segments.map(normalizeRelativeMediaPath).filter(Boolean).join('/')
  return getMediaUrl([moduleKey, tail].filter(Boolean).join('/'))
}

