import { mediaManager } from '../services/mediaManager'

function normalizeRelativeMediaPath(relativePath: string): string {
  return String(relativePath ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
}

/** Build absolute media URL, preferring direct R2 delivery when configured. */
export function getMediaUrl(relativePath: string): string {
  const clean = normalizeRelativeMediaPath(relativePath)
  return mediaManager.resolveRuntimeMediaUrl(clean)
}

export function getModuleMediaUrl(moduleId: string, ...segments: string[]): string {
  const moduleKey = normalizeRelativeMediaPath(moduleId)
  const tail = segments.map(normalizeRelativeMediaPath).filter(Boolean).join('/')
  return getMediaUrl([moduleKey, tail].filter(Boolean).join('/'))
}

