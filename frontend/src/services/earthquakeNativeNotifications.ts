import { loadCapacitorLocalNotifications } from '../capacitor/plugins'

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
    // Without storage we cannot dedupe; staying silent beats repeating the cue.
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

async function loadLocalNotifications(): Promise<LocalNotificationsApi> {
  const mod = (await loadCapacitorLocalNotifications()) as unknown as {
    LocalNotifications: LocalNotificationsApi
  }
  return mod.LocalNotifications
}

export async function getNativeNotificationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  const LocalNotifications = await loadLocalNotifications()
  const status = await LocalNotifications.checkPermissions()
  if (status.display === 'granted') return 'granted'
  if (status.display === 'denied') return 'denied'
  return 'prompt'
}

export async function requestNativeNotificationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  const LocalNotifications = await loadLocalNotifications()
  const status = await LocalNotifications.requestPermissions()
  if (status.display === 'granted') return 'granted'
  if (status.display === 'denied') return 'denied'
  return 'prompt'
}

export async function showNativeEarthquakeTestNotification(): Promise<boolean> {
  const permission = await getNativeNotificationPermission()
  if (permission !== 'granted') return false
  const LocalNotifications = await loadLocalNotifications()
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 900001,
        title: 'Infra Resilience360 Alert Test',
        body: 'Android earthquake notifications are enabled.',
        channelId: 'earthquake-alerts',
        smallIcon: 'ic_launcher_foreground',
      },
    ],
  })
  return true
}

export async function ensureEarthquakeNotificationChannel(): Promise<void> {
  if (!isNativeEarthquakeNotificationsAvailable()) return
  const LocalNotifications = await loadLocalNotifications()
  try {
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
