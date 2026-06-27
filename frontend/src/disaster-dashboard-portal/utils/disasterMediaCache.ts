const loadedImageUrls = new Set<string>()

export function markDisasterImageLoaded(url: string): void {
  if (url) loadedImageUrls.add(url)
}

export function isDisasterImageLoaded(url: string): boolean {
  return Boolean(url && loadedImageUrls.has(url))
}

/** Warm browser cache for a direct S3 image URL (idempotent). */
export function preloadDisasterImageUrl(url: string): void {
  if (!url || typeof window === 'undefined') return
  if (isDisasterImageLoaded(url)) return

  const img = new Image()
  img.decoding = 'async'
  img.onload = () => markDisasterImageLoaded(url)
  img.onerror = () => {
    /* leave uncached so components can try fallback candidates */
  }
  img.src = url
}

export function preloadDisasterVideoUrl(url: string): void {
  if (!url || typeof document === 'undefined') return
  const linkId = `dd-preload-video:${url}`
  if (document.getElementById(linkId)) return
  const link = document.createElement('link')
  link.id = linkId
  link.rel = 'prefetch'
  link.as = 'video'
  link.href = url
  document.head.appendChild(link)
}
