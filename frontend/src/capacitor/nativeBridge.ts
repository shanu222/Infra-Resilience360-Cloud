/**
 * Talk to native Capacitor plugins through the injected `window.Capacitor`.
 * Do not dynamic-import `@capacitor/core` on a user tap — that drops the
 * Android permission prompt.
 */

type CapacitorBridge = {
  isNativePlatform?: () => boolean
  registerPlugin?: (name: string) => Record<string, (...args: never[]) => Promise<unknown>>
  Plugins?: Record<string, Record<string, (...args: never[]) => Promise<unknown>>>
}

export function getCapacitorBridge(): CapacitorBridge | null {
  try {
    const cap = (globalThis as { Capacitor?: CapacitorBridge }).Capacitor
    if (!cap?.isNativePlatform?.()) return null
    return cap
  } catch {
    return null
  }
}

export function getNativePlugin<T extends object>(name: string): T | null {
  const cap = getCapacitorBridge()
  if (!cap) return null
  try {
    if (typeof cap.registerPlugin === 'function') {
      return cap.registerPlugin(name) as T
    }
  } catch {
    /* fall through */
  }
  const existing = cap.Plugins?.[name]
  return (existing as T) ?? null
}
