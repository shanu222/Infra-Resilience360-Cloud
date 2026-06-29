import { Capacitor } from '@capacitor/core'

/** True when running inside the Capacitor Android/iOS shell (not the web browser). */
export function isCapacitorNativeRuntime(): boolean {
  return Capacitor.isNativePlatform()
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
    return `Version 1.0.1`
  }
  return 'Web'
}
