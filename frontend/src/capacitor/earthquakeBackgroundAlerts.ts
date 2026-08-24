import { loadCapacitorCore } from './plugins'

/**
 * Bridge to the native background earthquake poll.
 *
 * Notifications raised from JavaScript can only appear while the WebView is
 * alive, so they arrived when the user opened the app rather than when the
 * earthquake happened. The native side runs a periodic worker instead, which
 * keeps delivering alerts with the app closed.
 */

export type EarthquakeBackgroundStatus = {
  enabled: boolean
  threshold: number
  notificationsEnabled?: boolean
}

type EarthquakeBackgroundApi = {
  enable: (options: { threshold: number }) => Promise<EarthquakeBackgroundStatus>
  disable: () => Promise<EarthquakeBackgroundStatus>
  status: () => Promise<EarthquakeBackgroundStatus>
  pollNow: () => Promise<EarthquakeBackgroundStatus>
  requestNotificationsPermission: () => Promise<{ display?: string }>
  checkNotificationsPermission: () => Promise<{ display?: string }>
}

async function loadPlugin(): Promise<EarthquakeBackgroundApi | null> {
  try {
    const core = (await loadCapacitorCore()) as unknown as {
      Capacitor?: {
        isNativePlatform?: () => boolean
        isPluginAvailable?: (name: string) => boolean
      }
      registerPlugin?: <T>(name: string) => T
    }
    if (!core?.Capacitor?.isNativePlatform?.()) return null
    // Older installs run a build without the native plugin; treat it as absent
    // rather than letting every call reject.
    if (core.Capacitor.isPluginAvailable?.('EarthquakeBackground') === false) return null
    if (typeof core.registerPlugin !== 'function') return null
    return core.registerPlugin<EarthquakeBackgroundApi>('EarthquakeBackground')
  } catch {
    return null
  }
}

export function isEarthquakeBackgroundSupported(): boolean {
  return Boolean(
    (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.(),
  )
}

/** Starts (or re-targets) the background poll. Resolves false when unsupported. */
export async function enableEarthquakeBackgroundAlerts(threshold: number): Promise<boolean> {
  const plugin = await loadPlugin()
  if (!plugin) return false
  try {
    await plugin.enable({ threshold })
    return true
  } catch {
    return false
  }
}

export async function disableEarthquakeBackgroundAlerts(): Promise<boolean> {
  const plugin = await loadPlugin()
  if (!plugin) return false
  try {
    await plugin.disable()
    return true
  } catch {
    return false
  }
}

export async function getEarthquakeBackgroundStatus(): Promise<EarthquakeBackgroundStatus | null> {
  const plugin = await loadPlugin()
  if (!plugin) return null
  try {
    return await plugin.status()
  } catch {
    return null
  }
}

/** Kick an immediate USGS poll so the user does not wait up to 15 minutes. */
export async function pollEarthquakeBackgroundNow(): Promise<boolean> {
  const plugin = await loadPlugin()
  if (!plugin) return false
  try {
    await plugin.pollNow()
    return true
  } catch {
    return false
  }
}

export async function requestEarthquakeNotificationsPermissionNative(): Promise<
  'granted' | 'denied' | 'prompt'
> {
  const plugin = await loadPlugin()
  if (!plugin) return 'prompt'
  try {
    const status = await plugin.requestNotificationsPermission()
    if (status.display === 'granted') return 'granted'
    if (status.display === 'denied') return 'denied'
    return 'prompt'
  } catch {
    return 'denied'
  }
}

export async function checkEarthquakeNotificationsPermissionNative(): Promise<
  'granted' | 'denied' | 'prompt'
> {
  const plugin = await loadPlugin()
  if (!plugin) return 'prompt'
  try {
    const status = await plugin.checkNotificationsPermission()
    if (status.display === 'granted') return 'granted'
    if (status.display === 'denied') return 'denied'
    return 'prompt'
  } catch {
    return 'prompt'
  }
}
