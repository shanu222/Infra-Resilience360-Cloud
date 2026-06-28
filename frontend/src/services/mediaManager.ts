const DEFAULT_R2_MEDIA_BASE_URL = 'https://pub-e38210c9c2ff4bf3a45338616cd43df2.r2.dev'

function trimTrailingSlash(value: string): string {
  return String(value ?? '').trim().replace(/\/+$/, '')
}

function normalizeRelativePath(value: string): string {
  return String(value ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
}

class MediaManager {
  private resolvedUrlCache = new Map<string, string>()
  private imageWarmCache = new Map<string, Promise<void>>()
  private videoMetadataWarmCache = new Map<string, Promise<void>>()

  getMediaBaseUrl(): string {
    if (typeof window !== 'undefined') {
      const windowBase = trimTrailingSlash(
        String(
          (window as Window & { __R360_MEDIA_BASE_URL?: string }).__R360_MEDIA_BASE_URL ??
            (window as Window & { __ENV__?: { VITE_MEDIA_BASE_URL?: string } }).__ENV__?.VITE_MEDIA_BASE_URL ??
            '',
        ),
      )
      if (windowBase) return windowBase
    }

    const envBase = trimTrailingSlash(String(import.meta.env.VITE_MEDIA_BASE_URL ?? ''))
    return envBase || DEFAULT_R2_MEDIA_BASE_URL
  }

  resolveRuntimeMediaUrl(rawPath: string): string {
    const input = String(rawPath ?? '').trim()
    if (!input) return `${this.getMediaBaseUrl()}/content`

    const cacheHit = this.resolvedUrlCache.get(input)
    if (cacheHit) return cacheHit

    if (/^https?:\/\//i.test(input)) {
      try {
        const parsed = new URL(input)
        const path = normalizeRelativePath(parsed.pathname)
        if (path.toLowerCase().startsWith('storage/content/')) {
          const resolved = `${this.getMediaBaseUrl()}/content/${path.slice('storage/content/'.length)}`
          this.resolvedUrlCache.set(input, resolved)
          return resolved
        }
        if (path.toLowerCase().startsWith('content/')) {
          const resolved = `${this.getMediaBaseUrl()}/content/${path.slice('content/'.length)}`
          this.resolvedUrlCache.set(input, resolved)
          return resolved
        }
      } catch {
        /* keep original URL if parsing fails */
      }
      this.resolvedUrlCache.set(input, input)
      return input
    }

    const normalized = normalizeRelativePath(input)
      .replace(/^storage\/content\/?/i, '')
      .replace(/^content\/?/i, '')
      .replace(/^static\/media\/local\/?/i, '')

    const resolved = `${this.getMediaBaseUrl()}/content/${normalized}`
    this.resolvedUrlCache.set(input, resolved)
    return resolved
  }

  preloadImage(url: string): Promise<void> {
    const resolved = this.resolveRuntimeMediaUrl(url)
    const cached = this.imageWarmCache.get(resolved)
    if (cached) return cached
    const promise = new Promise<void>((resolve) => {
      if (typeof Image === 'undefined') {
        resolve()
        return
      }
      const img = new Image()
      img.decoding = 'async'
      img.loading = 'lazy'
      img.onload = () => resolve()
      img.onerror = () => resolve()
      img.src = resolved
    })
    this.imageWarmCache.set(resolved, promise)
    return promise
  }

  preloadVideoMetadata(url: string): Promise<void> {
    const resolved = this.resolveRuntimeMediaUrl(url)
    const cached = this.videoMetadataWarmCache.get(resolved)
    if (cached) return cached
    const promise = new Promise<void>((resolve) => {
      if (typeof document === 'undefined') {
        resolve()
        return
      }
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.playsInline = true
      video.muted = true
      video.onloadedmetadata = () => resolve()
      video.onerror = () => resolve()
      video.src = resolved
      video.load()
    })
    this.videoMetadataWarmCache.set(resolved, promise)
    return promise
  }
}

export const mediaManager = new MediaManager()

