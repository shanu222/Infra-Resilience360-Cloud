type CapacitorLike = {
  isNativePlatform?: () => boolean
  getPlatform?: () => string
}

function getGlobalCapacitor(): CapacitorLike | null {
  try {
    const current = (globalThis as { Capacitor?: CapacitorLike }).Capacitor
    if (current) return current
    if (typeof window !== 'undefined' && window.top && window.top !== window) {
      return (window.top as Window & { Capacitor?: CapacitorLike }).Capacitor ?? null
    }
  } catch {
    /* embedded cross-origin frame */
  }
  return null
}

/** True when running inside the Capacitor Android/iOS shell (not the web browser). */
export function isCapacitorNativeRuntime(): boolean {
  try {
    return Boolean(getGlobalCapacitor()?.isNativePlatform?.())
  } catch {
    /* embedded cross-origin frame */
  }
  return false
}

/** Settings drawer label — never show "Web" on native builds. */
export function getAppVersionLabel(): string {
  if (isCapacitorNativeRuntime()) {
    return getGlobalCapacitor()?.getPlatform?.() === 'ios' ? 'iOS' : 'Android'
  }
  return 'Web'
}

/** Human-readable version string for settings UI. */
export function getAppVersionDisplay(): string {
  if (isCapacitorNativeRuntime()) {
    return `Version 1.0.1`
  }
  return 'Web'
}
