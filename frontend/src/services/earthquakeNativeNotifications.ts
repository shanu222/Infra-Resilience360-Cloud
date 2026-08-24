import { loadCapacitorLocalNotifications } from '../capacitor/plugins'
import type { EarthquakeNotificationPayload } from './earthquakePushNotifications'

const NOTIFIED_IDS_KEY = 'r360-native-eq-notified-ids'

function hashNotificationId(eventId: string): number {
  let hash = 0
  for (let i = 0; i < eventId.length; i += 1) {
    hash = (hash << 5) - hash + eventId.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % 2147480000 || 1
}

function readNotifiedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_IDS_KEY)
    const parsed = raw ? (JSON.parse(raw) as string[]) : []
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function writeNotifiedIds(ids: Set<string>): void {
  try {
    const trimmed = [...ids].slice(-200)
    localStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify(trimmed))
  } catch {
    /* ignore */
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

export async function notifyNativeEarthquakeIfNeeded(
  payload: EarthquakeNotificationPayload,
  threshold: number,
): Promise<boolean> {
  if (!isNativeEarthquakeNotificationsAvailable()) return false
  if (payload.magnitude < threshold) return false

  const permission = await getNativeNotificationPermission()
  if (permission !== 'granted') return false

  const notified = readNotifiedIds()
  if (notified.has(payload.eventId)) return false

  notified.add(payload.eventId)
  writeNotifiedIds(notified)

  const LocalNotifications = await loadLocalNotifications()
  await LocalNotifications.schedule({
    notifications: [
      {
        id: hashNotificationId(payload.eventId),
        title: `Earthquake M${payload.magnitude.toFixed(1)}`,
        body: payload.location,
        channelId: 'earthquake-alerts',
        smallIcon: 'ic_launcher_foreground',
        extra: {
          eventId: payload.eventId,
          targetUrl: '/view/live-earthquake-map',
        },
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
