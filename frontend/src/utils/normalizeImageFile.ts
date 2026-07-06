const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'])

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
}

export function isLikelyImageFile(file: File | Blob, fileName = ''): boolean {
  const type = String(file.type ?? '').toLowerCase()
  if (type.startsWith('image/')) return true
  const ext = String(fileName || (file instanceof File ? file.name : ''))
    .split('.')
    .pop()
    ?.toLowerCase()
  return Boolean(ext && IMAGE_EXTENSIONS.has(ext))
}

function resolveMimeType(file: File, fileName: string): string {
  const type = String(file.type ?? '').trim().toLowerCase()
  if (type.startsWith('image/')) return type
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return MIME_BY_EXTENSION[ext] ?? 'image/jpeg'
}

async function readFileBytes(file: File | Blob): Promise<ArrayBuffer> {
  if (file instanceof File && file.size > 0) {
    try {
      const direct = await file.arrayBuffer()
      if (direct.byteLength > 0) return direct
    } catch {
      /* Android content:// URIs often fail direct arrayBuffer reads */
    }
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const response = await fetch(objectUrl)
    if (!response.ok) {
      throw new Error('The requested file could not be read. Please choose another image.')
    }
    const buffer = await response.arrayBuffer()
    if (buffer.byteLength === 0) {
      throw new Error('The selected image is empty. Please choose another photo.')
    }
    return buffer
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/**
 * Produces a web-identical File for vision multipart upload.
 * Android gallery/camera URIs often lack MIME type or reject arrayBuffer() until normalized.
 */
export async function normalizeImageFileForUpload(
  source: File | Blob,
  fallbackName = 'upload.jpg',
): Promise<File> {
  const sourceName = source instanceof File && source.name ? source.name : fallbackName
  const safeName = sourceName.trim() || fallbackName
  const mime = resolveMimeType(source instanceof File ? source : new File([], safeName), safeName)
  const bytes = await readFileBytes(source instanceof File ? source : new File([source], safeName, { type: mime }))
  const normalizedName = /\.[a-z0-9]+$/i.test(safeName)
    ? safeName
    : mime === 'image/jpeg'
      ? `${safeName.replace(/\.[^.]+$/, '') || 'upload'}.jpg`
      : safeName
  return new File([bytes], normalizedName, { type: mime, lastModified: Date.now() })
}
