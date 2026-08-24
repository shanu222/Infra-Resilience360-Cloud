import {
  checkEarthquakeNotificationsPermissionNative,
  requestEarthquakeNotificationsPermissionNative,
  showNativeEarthquakeTrayTest,
} from '../capacitor/earthquakeBackgroundAlerts'
import { getCapacitorBridge } from '../capacitor/nativeBridge'

/**
 * Permission helpers. Real earthquake alerts are posted by native code
 * (WorkManager + FCM) so they arrive while the app is closed.
 */

const SEEN_IDS_KEY = 'r360-native-eq-notified-ids'
const MAX_SEEN_IDS = 200

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
  return Boolean(getCapacitorBridge()?.isNativePlatform?.())
}

export function preloadNativeNotificationPlugin(): void {
  if (!isNativeEarthquakeNotificationsAvailable()) return
  void checkEarthquakeNotificationsPermissionNative()
}

export async function getNativeNotificationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    return await checkEarthquakeNotificationsPermissionNative()
  } catch {
    return 'prompt'
  }
}

/**
 * Invoke directly from a click. The native Activity shows POST_NOTIFICATIONS.
 * Do not await other work before this call.
 */
export function requestNativeNotificationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  return requestEarthquakeNotificationsPermissionNative()
}

export async function showNativeEarthquakeTestNotification(): Promise<boolean> {
  try {
    const permission = await getNativeNotificationPermission()
    if (permission !== 'granted') return false
    return showNativeEarthquakeTrayTest()
  } catch {
    return false
  }
}

export async function ensureEarthquakeNotificationChannel(): Promise<void> {
  /* Channel is created in MainActivity / native helper. */
}
