import { fetchApi } from './apiBase'
import { EARTHQUAKE_ALERT_SOUND_DATA_URI } from '../assets/audio/earthquakeAlertSound'
import {
  ensureEarthquakeNotificationChannel,
  getNativeNotificationPermission,
  isNativeEarthquakeNotificationsAvailable,
  markEarthquakeSeenInApp,
  preloadNativeNotificationPlugin,
  requestNativeNotificationPermission,
  showNativeEarthquakeTestNotification,
} from './earthquakeNativeNotifications'
import {
  disableEarthquakeBackgroundAlerts,
  enableEarthquakeBackgroundAlerts,
  pollEarthquakeBackgroundNow,
} from '../capacitor/earthquakeBackgroundAlerts'
import {
  disableFirebaseEarthquakePush,
  enableFirebaseEarthquakePush,
} from '../capacitor/earthquakeFcm'
import { warmCapacitorPushNotifications } from '../capacitor/plugins'

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

export type EarthquakePermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported'

class EarthquakePushNotificationService {
  private initialized = false
  private readonly settingsKey = 'r360-earthquake-alert-settings'
  private readonly promptKey = 'r360-earthquake-notify-prompt-state'
  private readonly promptTsKey = 'r360-earthquake-notify-prompt-ts'
  private readonly permissionKey = 'r360-earthquake-notify-permission'
  private audio: HTMLAudioElement | null = null

  async initialize(): Promise<void> {
    if (this.initialized) return
    this.initialized = true
    if (isNativeEarthquakeNotificationsAvailable()) {
      // Warm the plugin before any "Allow" tap so requestPermissions() is not
      // blocked behind a dynamic import (which drops the Android user gesture).
      preloadNativeNotificationPlugin()
      warmCapacitorPushNotifications()
      await ensureEarthquakeNotificationChannel()
      await this.syncBackgroundAlerts()
    }
  }

  /**
   * Mirrors the current preferences onto the native background poll.
   *
   * On Android the worker — not this class — posts earthquake notifications, so
   * that alerts arrive while the app is closed. Keeping the two in sync here
   * means the user's threshold and on/off choice survive a restart.
   */
  private async syncBackgroundAlerts(): Promise<void> {
    if (!isNativeEarthquakeNotificationsAvailable()) return
    const settings = this.getSettings()
    const permission = await getNativeNotificationPermission()
    if (settings.enabled && permission === 'granted') {
      await enableEarthquakeBackgroundAlerts(settings.threshold)
      // Do not wait for the 15-minute periodic window — check the live feed now.
      void pollEarthquakeBackgroundNow()
      // FCM topic + token so Firebase / backend can push while the app is closed.
      void enableFirebaseEarthquakePush()
      return
    }
    await disableEarthquakeBackgroundAlerts()
    void disableFirebaseEarthquakePush()
  }

  isNativeRuntime(): boolean {
    return isNativeEarthquakeNotificationsAvailable()
  }

  isSupported(): boolean {
    if (isNativeEarthquakeNotificationsAvailable()) return true
    return typeof window !== 'undefined' && typeof Notification !== 'undefined'
  }

  getPermissionState(): EarthquakePermissionState {
    if (isNativeEarthquakeNotificationsAvailable()) {
      try {
        const cached = localStorage.getItem(this.permissionKey)
        if (cached === 'granted' || cached === 'denied' || cached === 'prompt') {
          return cached
        }
      } catch {
        /* ignore */
      }
      return 'prompt'
    }
    if (!this.isSupported()) return 'unsupported'
    return Notification.permission
  }

  async refreshPermissionState(): Promise<EarthquakePermissionState> {
    if (isNativeEarthquakeNotificationsAvailable()) {
      const live = await getNativeNotificationPermission()
      try {
        localStorage.setItem(this.permissionKey, live)
      } catch {
        /* ignore */
      }
      return live
    }
    return this.getPermissionState()
  }

  getSettings(): { enabled: boolean; soundEnabled: boolean; threshold: number } {
    try {
      const raw = localStorage.getItem(this.settingsKey)
      const parsed = raw ? JSON.parse(raw) : {}
      const thresholdValue = Number(parsed?.threshold)
      return {
        enabled: parsed?.enabled !== false,
        soundEnabled: parsed?.soundEnabled !== false,
        threshold: thresholdValue >= 6 ? 6 : 5,
      }
    } catch {
      return { enabled: true, soundEnabled: true, threshold: 5 }
    }
  }

  updateSettings(patch: Partial<{ enabled: boolean; soundEnabled: boolean; threshold: number }>): {
    enabled: boolean
    soundEnabled: boolean
    threshold: number
  } {
    const current = this.getSettings()
    const next = {
      enabled: patch.enabled !== undefined ? Boolean(patch.enabled) : current.enabled,
      soundEnabled: patch.soundEnabled !== undefined ? Boolean(patch.soundEnabled) : current.soundEnabled,
      threshold:
        patch.threshold !== undefined
          ? Number(patch.threshold) >= 6
            ? 6
            : 5
          : current.threshold,
    }
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(next))
    } catch {
      /* ignore storage write errors */
    }
    // Callers treat this as a synchronous setter, so the native poll is
    // re-targeted in the background.
    void this.syncBackgroundAlerts()
    return next
  }

  shouldShowPrompt(): boolean {
    const permission = this.getPermissionState()
    if (permission === 'granted' || permission === 'denied') return false
    if (!this.isSupported()) return false
    try {
      const state = String(localStorage.getItem(this.promptKey) || '').trim()
      if (state === 'accepted' || state === 'declined') return false
      return state !== 'later'
    } catch {
      return false
    }
  }

  markPromptLater(): void {
    try {
      localStorage.setItem(this.promptKey, 'later')
      localStorage.setItem(this.promptTsKey, String(Date.now()))
    } catch {
      /* ignore storage write errors */
    }
  }

  async requestPermissionFromUserGesture(): Promise<EarthquakePermissionState> {
    if (isNativeEarthquakeNotificationsAvailable()) {
      let permission: EarthquakePermissionState = 'prompt'
      try {
        permission = await requestNativeNotificationPermission()
      } catch {
        permission = 'denied'
      }
      try {
        localStorage.setItem(this.permissionKey, permission)
        localStorage.setItem(this.promptKey, permission === 'granted' ? 'accepted' : 'declined')
        localStorage.setItem(this.promptTsKey, String(Date.now()))
      } catch {
        /* ignore */
      }
      await this.syncBackgroundAlerts()
      if (permission === 'granted') {
        // Immediate tray entry so the user knows the grant stuck — do not wait
        // for the next earthquake.
        void showNativeEarthquakeTestNotification()
        void pollEarthquakeBackgroundNow()
        void enableFirebaseEarthquakePush()
      }
      return permission
    }

    if (!this.isSupported()) return 'unsupported'
    try {
      const permission = await Notification.requestPermission()
      localStorage.setItem(this.permissionKey, permission)
      localStorage.setItem(this.promptKey, permission === 'granted' ? 'accepted' : 'declined')
      localStorage.setItem(this.promptTsKey, String(Date.now()))
      return permission
    } catch {
      return Notification.permission
    }
  }

  async showTestNotification(): Promise<boolean> {
    if (isNativeEarthquakeNotificationsAvailable()) {
      return showNativeEarthquakeTestNotification()
    }

    if (!this.isSupported() || Notification.permission !== 'granted') return false
    const title = 'Infra Resilience360 Alert Test'
    const options: NotificationOptions = {
      body: 'Browser notifications are enabled for live earthquake alerts.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'r360-eq-test',
      data: {
        eventId: 'r360-eq-test',
        targetUrl: '/view/live-earthquake-map',
      },
    }
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration()
        if (reg?.showNotification) {
          await reg.showNotification(title, options)
          return true
        }
      }
      const n = new Notification(title, options)
      n.onclick = () => {
        try {
          window.focus()
        } catch {
          /* ignore focus failures */
        }
        window.location.assign('/view/live-earthquake-map')
      }
      return true
    } catch {
      return false
    }
  }

  async playTestSound(): Promise<boolean> {
    try {
      if (!this.audio) {
        this.audio = new Audio(EARTHQUAKE_ALERT_SOUND_DATA_URI)
        this.audio.preload = 'auto'
      }
      this.audio.currentTime = 0
      await this.audio.play()
      return true
    } catch {
      return false
    }
  }

  async notifyEarthquake(payload: EarthquakeNotificationPayload): Promise<boolean> {
    const settings = this.getSettings()
    if (!settings.enabled) return false

    if (isNativeEarthquakeNotificationsAvailable()) {
      // The background worker owns the notification shade on Android. Raising a
      // notification from here as well would mean the user is handed a stack of
      // alerts as a side effect of opening the app, on top of the copy the
      // worker already delivered when the event actually happened. The in-app
      // map and alert list still surface the event; only the tray entry is left
      // to the worker.
      if (payload.magnitude < settings.threshold) return false
      const isNew = markEarthquakeSeenInApp(payload.eventId)
      if (isNew && settings.soundEnabled) {
        void this.playTestSound()
      }
      return false
    }

    if (!this.isSupported() || Notification.permission !== 'granted') return false
    if (payload.magnitude < settings.threshold) return false

    try {
      const n = new Notification(`Earthquake M${payload.magnitude.toFixed(1)}`, {
        body: payload.location,
        icon: '/icon-192.png',
        tag: `earthquake_${payload.eventId}`,
      })
      n.onclick = () => {
        window.location.assign('/view/live-earthquake-map')
      }
      if (settings.soundEnabled) {
        void this.playTestSound()
      }
      return true
    } catch {
      return false
    }
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
