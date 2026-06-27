const PRELOADED = new Set<string>()

function preloadImage(url: string) {
  const src = String(url ?? '').trim()
  if (!src || PRELOADED.has(src)) return
  PRELOADED.add(src)
  const img = new Image()
  img.decoding = 'async'
  img.src = src
}

function preloadVideoMetadata(url: string) {
  const src = String(url ?? '').trim()
  if (!src || PRELOADED.has(`video:${src}`)) return
  PRELOADED.add(`video:${src}`)
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.src = src
  video.load()
}

/** Warm browser cache for shell logos and other always-visible media. */
export function preloadAppMedia(urls: string[]): void {
  for (const url of urls) {
    if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) preloadVideoMetadata(url)
    else preloadImage(url)
  }
}
