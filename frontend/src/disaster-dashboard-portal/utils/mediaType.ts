export function isVideoLikeMediaUrl(value: string | undefined | null): boolean {
  const url = String(value ?? '').trim().toLowerCase().split('?')[0]
  if (!url) return false
  return /\.(mp4|webm|mov|m4v|ogv)$/.test(url)
}

