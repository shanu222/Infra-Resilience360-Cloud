import {
  loadCapacitorLocalNotifications,
  warmCapacitorLocalNotifications,
} from '../capacitor/plugins'
import {
  checkEarthquakeNotificationsPermissionNative,
  requestEarthquakeNotificationsPermissionNative,
} from '../capacitor/earthquakeBackgroundAlerts'

/**
 * Permission, channel and test-notification helpers for Android alerts.
 *
 * Real earthquake alerts are posted by the native `EarthquakeAlertWorker` so
 * they arrive while the app is closed; nothing here schedules them.
 */

const SEEN_IDS_KEY = 'r360-native-eq-notified-ids'
const MAX_SEEN_IDS = 200

/**
 * Records an event as already handled in-app and reports whether it was new.
 *
 * The foreground poll revisits the same feed every couple of minutes, so
 * without this the in-app alert cue would re-fire for an event the user has
 * already been told about.
 */
export function markEarthquakeSeenInApp(eventId: string): boolean {
  const id = String(eventId ?? '').trim()
  if (!id) return false
  try {
    const raw = localStorage.getItem(SEEN_IDS_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    const seen = new Set(Array.isArray(parsed) ? (parsed as string[]) : [])
    if (seen.has(id)) return false
    seen.add(id)
    localStorage.setItem(SEEN_IDS_KEY, JSON.stringify([...seen].slice(-MAX_SEEN_IDS)))
    return true
  } catch {
    return false
  }
}

export function isNativeEarthquakeNotificationsAvailable(): boolean {
  return Boolean((globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.())
}

type LocalNotificationsApi = {
  checkPermissions: () => Promise<{ display?: string }>
  requestPermissions: () => Promise<{ display?: string }>
  schedule: (opts: Record<string, unknown>) => Promise<void>
  createChannel: (opts: Record<string, unknown>) => Promise<void>
}

let cachedLocalNotifications: LocalNotificationsApi | null = null

async function loadLocalNotifications(): Promise<LocalNotificationsApi> {
  if (cachedLocalNotifications) return cachedLocalNotifications
  warmCapacitorLocalNotifications()
  const mod = (await loadCapacitorLocalNotifications()) as unknown as {
    LocalNotifications: LocalNotificationsApi
  }
  cachedLocalNotifications = mod.LocalNotifications
  return cachedLocalNotifications
}

/** Call during app boot so "Allow Notifications" does not await a dynamic import. */
export function preloadNativeNotificationPlugin(): void {
  if (!isNativeEarthquakeNotificationsAvailable()) return
  warmCapacitorLocalNotifications()
  void loadLocalNotifications()
    .then((api) =>
      api.createChannel({
        id: 'earthquake-alerts',
        name: 'Earthquake Alerts',
        description: 'Significant earthquake alerts based on your chosen magnitude threshold',
        importance: 5,
        visibility: 1,
        vibration: true,
      }),
    )
    .catch(() => {
      /* warm-up only */
    })
}

function mapDisplay(display?: string): 'granted' | 'denied' | 'prompt' {
  if (display === 'granted') return 'granted'
  if (display === 'denied') return 'denied'
  return 'prompt'
}

export async function getNativeNotificationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    // Prefer the native Activity permission API — it reflects POST_NOTIFICATIONS
    // accurately and does not depend on the LocalNotifications JS chunk.
    const native = await checkEarthquakeNotificationsPermissionNative()
    if (native !== 'prompt') return native
    const LocalNotifications = await loadLocalNotifications()
    const status = await LocalNotifications.checkPermissions()
    return mapDisplay(status.display)
  } catch {
    return 'prompt'
  }
}

/**
 * Must be invoked directly from a click handler.
 * Uses the native EarthquakeBackground permission prompt first (POST_NOTIFICATIONS),
 * then falls back to LocalNotifications if needed.
 */
export async function requestNativeNotificationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    try {
      const LocalNotifications =
        cachedLocalNotifications ?? (await loadLocalNotifications())
      await LocalNotifications.createChannel({
        id: 'earthquake-alerts',
        name: 'Earthquake Alerts',
        description: 'Significant earthquake alerts based on your chosen magnitude threshold',
        importance: 5,
        visibility: 1,
        vibration: true,
      })
    } catch {
      /* channel may already exist */
    }

    const native = await requestEarthquakeNotificationsPermissionNative()
    if (native === 'granted' || native === 'denied') return native

    const LocalNotifications =
      cachedLocalNotifications ?? (await loadLocalNotifications())
    const status = await LocalNotifications.requestPermissions()
    return mapDisplay(status.display)
  } catch {
    return 'denied'
  }
}

export async function showNativeEarthquakeTestNotification(): Promise<boolean> {
  try {
    const permission = await getNativeNotificationPermission()
    if (permission !== 'granted') return false
    const LocalNotifications = await loadLocalNotifications()
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 900001,
          title: 'Infra Resilience360 Alert Test',
          body: 'Android earthquake notifications are enabled. Live alerts continue while the app is closed.',
          channelId: 'earthquake-alerts',
          schedule: { at: new Date(Date.now() + 800) },
        },
      ],
    })
    return true
  } catch {
    return false
  }
}

export async function ensureEarthquakeNotificationChannel(): Promise<void> {
  if (!isNativeEarthquakeNotificationsAvailable()) return
  try {
    const LocalNotifications = await loadLocalNotifications()
    await LocalNotifications.createChannel({
      id: 'earthquake-alerts',
      name: 'Earthquake Alerts',
      description: 'Significant earthquake alerts based on your chosen magnitude threshold',
      importance: 5,
      visibility: 1,
      vibration: true,
    })
  } catch {
    /* channel may already exist */
  }
}
