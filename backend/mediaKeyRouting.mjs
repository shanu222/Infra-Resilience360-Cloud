import path from 'node:path'

const slugify = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const extFromName = (name) => {
  const ext = path.extname(String(name || '')).toLowerCase().replace(/[^a-z0-9.]/g, '')
  return ext && ext.length <= 8 ? ext : ''
}

export function inferMediaKind({ mimeType, explicitType, originalName }) {
  const t = String(explicitType || '').toLowerCase()
  if (t === 'pdf') return 'pdf'
  if (t === 'audio') return 'audio'
  if (t === 'image') return 'image'
  if (t === 'video') return 'video'

  const m = String(mimeType || '').toLowerCase()
  const ext = extFromName(originalName)
  if (m.includes('pdf') || ext === '.pdf') return 'pdf'
  if (m.startsWith('audio/') || ['.m4a', '.mp3', '.wav', '.aac', '.ogg'].includes(ext)) return 'audio'
  if (m.startsWith('video/') || ['.mp4', '.webm', '.mov', '.m4v'].includes(ext)) return 'video'
  if (m.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) return 'image'
  return 'document'
}

/**
 * Build canonical S3 key for managed media contexts.
 * Returns '' when context cannot be resolved, so callers can keep legacy behavior.
 */
export function buildManagedS3Key({
  contextType,
  contextName,
  mediaKind,
  originalName,
  fallbackSection = 'content',
  fallbackId = '',
}) {
  const cType = String(contextType || '').trim().toLowerCase()
  const cName = slugify(contextName || fallbackId)
  const ext = extFromName(originalName)

  const imageExt = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext) ? ext : '.jpeg'

  if (cType === 'model' && cName) {
    if (mediaKind === 'image') return `resilient-infra-models/${cName}/image${imageExt}`
    if (mediaKind === 'pdf') return `resilient-infra-models/${cName}/model.pdf`
    if (mediaKind === 'video') return `resilient-infra-models/${cName}/video.mp4`
    if (mediaKind === 'audio') return `resilient-infra-models/${cName}/audio.m4a`
  }

  if (cType === 'disaster' && cName) {
    if (mediaKind === 'video') return `disaster-dashboard/${cName}/video.mp4`
    if (mediaKind === 'audio') return `disaster-dashboard/${cName}/audio.m4a`
    if (mediaKind === 'image') return `disaster-dashboard/${cName}/image${imageExt}`
    if (mediaKind === 'pdf') return `disaster-dashboard/${cName}/document.pdf`
  }

  if (cType === 'learn') {
    const base = cName || slugify(String(originalName || '').replace(/\.[^.]+$/, '')) || 'training-video'
    if (mediaKind === 'video') return `learn-and-train/${base}.mp4`
    if (mediaKind === 'audio') return `learn-and-train/${base}.m4a`
  }

  if (cType === 'homepage') {
    if (mediaKind === 'image') return `homepage/background-image${imageExt}`
    if (mediaKind === 'video') return 'homepage/background-video.mp4'
  }

  if (cType === 'pgbc') {
    const base = cName || slugify(String(originalName || '').replace(/\.[^.]+$/, '')) || 'code'
    if (mediaKind === 'pdf') return `PGBC/${base}.pdf`
  }

  return ''
}

