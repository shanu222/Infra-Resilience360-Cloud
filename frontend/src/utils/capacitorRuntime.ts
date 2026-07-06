import { Capacitor } from '@capacitor/core'

/** True when running inside the Capacitor Android/iOS shell (not the web browser). */
export function isCapacitorNativeRuntime(): boolean {
  try {
    if (Capacitor.isNativePlatform()) return true
    if (typeof window !== 'undefined' && window.top !== window) {
      const top = window.top as Window & { Capacitor?: Pick<typeof Capacitor, 'isNativePlatform'> }
      return Boolean(top?.Capacitor?.isNativePlatform?.())
    }
  } catch {
    /* embedded cross-origin frame */
  }
  return false
}

/** Settings drawer label — never show "Web" on native builds. */
export function getAppVersionLabel(): string {
  if (isCapacitorNativeRuntime()) {
    return Capacitor.getPlatform() === 'ios' ? 'iOS' : 'Android'
  }
  return 'Web'
}

/** Human-readable version string for settings UI. */
export function getAppVersionDisplay(): string {
  if (isCapacitorNativeRuntime()) {
    return `Version 1.0.2`
  }
  return 'Web'
}
