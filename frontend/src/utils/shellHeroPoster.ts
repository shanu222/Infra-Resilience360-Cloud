import { fixApiUrl } from './fixApiUrl'
import { localResilience360Url } from '../config/localContent'

/**
 * Poster URL for the home shell background video: prefer a real still image from
 * shell styles when present; otherwise local background still or WebP hero.
 */
export function resolveShellVideoPoster(shellBackgroundImage: string): string {
  const raw = String(shellBackgroundImage ?? '').trim()
  if (raw) {
    const resolved = fixApiUrl(raw) ?? raw
    const path = resolved.split(/[?#]/)[0].toLowerCase()
    if (!/\.(mp4|webm|mov|m4v)(\?|$)/.test(path) && /\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/.test(path)) {
      return resolved
    }
  }
  return localResilience360Url('background', 'home.jpg')
}

