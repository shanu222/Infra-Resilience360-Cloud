export function inferVideoMime(src: string): string | undefined {
  const p = String(src || '').split(/[?#]/)[0].toLowerCase()
  if (p.endsWith('.webm')) return 'video/webm'
  if (p.endsWith('.mp4') || p.endsWith('.m4v')) return 'video/mp4'
  if (p.endsWith('.mov')) return 'video/quicktime'
  if (p.endsWith('.ogg') || p.endsWith('.ogv')) return 'video/ogg'
  if (p.endsWith('.mkv')) return 'video/x-matroska'
  return undefined
}

export function inferAudioMime(src: string): string | undefined {
  const p = String(src || '').split(/[?#]/)[0].toLowerCase()
  if (p.endsWith('.mp3')) return 'audio/mpeg'
  if (p.endsWith('.m4a')) return 'audio/mp4'
  if (p.endsWith('.wav')) return 'audio/wav'
  if (p.endsWith('.ogg')) return 'audio/ogg'
  if (p.endsWith('.aac')) return 'audio/aac'
  return undefined
}
