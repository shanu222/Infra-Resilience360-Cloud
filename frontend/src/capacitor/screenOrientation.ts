import { loadCapacitorScreenOrientation } from './plugins'

type ScreenOrientationApi = {
  lock: (opts: { orientation: string }) => Promise<void>
  unlock: () => Promise<void>
}

type LockableWebOrientation = ScreenOrientation & {
  lock?: (orientation: string) => Promise<void>
  unlock?: () => void
}

async function loadNativeOrientation(): Promise<ScreenOrientationApi | null> {
  try {
    const mod = (await loadCapacitorScreenOrientation()) as unknown as {
      ScreenOrientation?: ScreenOrientationApi
    }
    return mod.ScreenOrientation ?? null
  } catch {
    return null
  }
}

/** True when the viewport is currently wider than it is tall. */
export function isLandscapeViewport(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(orientation: landscape)').matches
    }
  } catch {
    /* fall through to a dimension comparison */
  }
  return window.innerWidth > window.innerHeight
}

/** Subscribes to orientation flips. Returns an unsubscribe function. */
export function onOrientationChange(handler: (isLandscape: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const notify = () => handler(isLandscapeViewport())
  window.addEventListener('resize', notify)
  window.addEventListener('orientationchange', notify)
  return () => {
    window.removeEventListener('resize', notify)
    window.removeEventListener('orientationchange', notify)
  }
}

/**
 * Rotates the device to landscape.
 *
 * The native plugin is authoritative on Android. The Web Screen Orientation API
 * is only a courtesy fallback: browsers reject `lock()` outside fullscreen, so a
 * false return tells the caller to offer a manual "rotate your device" prompt.
 */
export async function lockLandscape(): Promise<boolean> {
  const native = await loadNativeOrientation()
  if (native) {
    try {
      await native.lock({ orientation: 'landscape' })
      return true
    } catch {
      /* fall through to the web API */
    }
  }

  try {
    const orientation = screen?.orientation as LockableWebOrientation | undefined
    if (orientation && typeof orientation.lock === 'function') {
      await orientation.lock('landscape')
      return true
    }
  } catch {
    /* locking is not permitted here */
  }
  return false
}

/** Releases any lock so the rest of the app follows the device again. */
export async function unlockOrientation(): Promise<void> {
  const native = await loadNativeOrientation()
  if (native) {
    try {
      await native.unlock()
      return
    } catch {
      /* fall through to the web API */
    }
  }

  try {
    const orientation = screen?.orientation as LockableWebOrientation | undefined
    orientation?.unlock?.()
  } catch {
    /* nothing to release */
  }
}
