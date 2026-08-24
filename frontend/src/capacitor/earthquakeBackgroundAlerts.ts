import { getNativePlugin } from './nativeBridge'

/**
 * Bridge to the native background earthquake poll and POST_NOTIFICATIONS prompt.
 */

export type EarthquakeBackgroundStatus = {
  enabled: boolean
  threshold: number
  notificationsEnabled?: boolean
  display?: string
}

type EarthquakeBackgroundApi = {
  enable: (options: { threshold: number }) => Promise<EarthquakeBackgroundStatus>
  disable: () => Promise<EarthquakeBackgroundStatus>
  status: () => Promise<EarthquakeBackgroundStatus>
  pollNow: () => Promise<EarthquakeBackgroundStatus>
  requestNotificationsPermission: () => Promise<{ display?: string; openedSettings?: boolean }>
  checkNotificationsPermission: () => Promise<{ display?: string }>
  showTestNotification: () => Promise<{ ok?: boolean }>
}

function plugin(): EarthquakeBackgroundApi | null {
  return getNativePlugin<EarthquakeBackgroundApi>('EarthquakeBackground')
}

export function isEarthquakeBackgroundSupported(): boolean {
  return plugin() != null
}

/** Starts (or re-targets) the background poll. Resolves false when unsupported. */
export async function enableEarthquakeBackgroundAlerts(threshold: number): Promise<boolean> {
  const api = plugin()
  if (!api) return false
  try {
    await api.enable({ threshold })
    return true
  } catch {
    return false
  }
}

export async function disableEarthquakeBackgroundAlerts(): Promise<boolean> {
  const api = plugin()
  if (!api) return false
  try {
    await api.disable()
    return true
  } catch {
    return false
  }
}

export async function getEarthquakeBackgroundStatus(): Promise<EarthquakeBackgroundStatus | null> {
  const api = plugin()
  if (!api) return null
  try {
    return await api.status()
  } catch {
    return null
  }
}

export async function pollEarthquakeBackgroundNow(): Promise<boolean> {
  const api = plugin()
  if (!api) return false
  try {
    await api.pollNow()
    return true
  } catch {
    return false
  }
}

/**
 * Must run from a click with no awaits beforehand.
 * Returns the plugin promise immediately so Android can show the system dialog.
 */
export function requestEarthquakeNotificationsPermissionNative(): Promise<
  'granted' | 'denied' | 'prompt'
> {
  const api = plugin()
  if (!api?.requestNotificationsPermission) {
    return Promise.resolve('denied')
  }
  return api
    .requestNotificationsPermission()
    .then((status) => {
      if (status?.display === 'granted') return 'granted' as const
      if (status?.display === 'denied') return 'denied' as const
      return 'prompt' as const
    })
    .catch(() => 'denied' as const)
}

export async function checkEarthquakeNotificationsPermissionNative(): Promise<
  'granted' | 'denied' | 'prompt'
> {
  const api = plugin()
  if (!api) return 'prompt'
  try {
    const status = await api.checkNotificationsPermission()
    if (status.display === 'granted') return 'granted'
    if (status.display === 'denied') return 'denied'
    return 'prompt'
  } catch {
    return 'prompt'
  }
}

export async function showNativeEarthquakeTrayTest(): Promise<boolean> {
  const api = plugin()
  if (!api?.showTestNotification) return false
  try {
    await api.showTestNotification()
    return true
  } catch {
    return false
  }
}
