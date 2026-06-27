/**
 * Earthquake push notifications — web-only stub (native mobile removed).
 */
import { fetchApi } from './apiBase'

export type EarthquakeNotificationPayload = {
  magnitude: number
  location: string
  latitude: number
  longitude: number
  depth: number
  timestamp: string
  eventId: string
  url?: string
}

class EarthquakePushNotificationService {
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return
    this.initialized = true
  }

  async registerDeviceToken(_token: string): Promise<void> {
    /* no-op on web */
  }

  async unregisterDevice(): Promise<void> {
    /* no-op on web */
  }

  async notifyServerOfEarthquake(payload: EarthquakeNotificationPayload): Promise<void> {
    try {
      await fetchApi('/api/earthquake-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {
      /* optional server hook */
    }
  }
}

export const earthquakePushNotificationService = new EarthquakePushNotificationService()
