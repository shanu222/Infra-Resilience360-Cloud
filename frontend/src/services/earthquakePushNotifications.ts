import { EARTHQUAKE_ALERT_SOUND_DATA_URI } from '../assets/audio/earthquakeAlertSound'
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
  private readonly settingsKey = 'r360-earthquake-alert-settings'
  private readonly promptKey = 'r360-earthquake-notify-prompt-state'
  private readonly promptTsKey = 'r360-earthquake-notify-prompt-ts'
  private readonly permissionKey = 'r360-earthquake-notify-permission'
  private audio: HTMLAudioElement | null = null

  async initialize(): Promise<void> {
    if (this.initialized) return
    this.initialized = true
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && typeof Notification !== 'undefined'
  }

  getPermissionState(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported'
    return Notification.permission
  }

  getSettings(): { enabled: boolean; soundEnabled: boolean; threshold: number } {
    try {
      const raw = localStorage.getItem(this.settingsKey)
      const parsed = raw ? JSON.parse(raw) : {}
      return {
        enabled: parsed?.enabled !== false,
        soundEnabled: parsed?.soundEnabled !== false,
        threshold: Number.isFinite(Number(parsed?.threshold)) ? Math.max(5, Number(parsed?.threshold)) : 5,
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
      threshold: patch.threshold !== undefined ? Math.max(5, Number(patch.threshold) || 5) : current.threshold,
    }
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(next))
    } catch {
      /* ignore storage write errors */
    }
    return next
  }

  shouldShowPrompt(): boolean {
    const permission = this.getPermissionState()
    if (permission === 'unsupported' || permission === 'granted' || permission === 'denied') return false
    try {
      const state = String(localStorage.getItem(this.promptKey) || '').trim()
      if (!state) return true
      if (state === 'accepted' || state === 'declined') return false
      const lastTs = Number(localStorage.getItem(this.promptTsKey) || 0)
      const cooldownMs = 24 * 60 * 60 * 1000
      return !Number.isFinite(lastTs) || Date.now() - lastTs > cooldownMs
    } catch {
      return true
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

  async requestPermissionFromUserGesture(): Promise<NotificationPermission | 'unsupported'> {
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

  async showTestNotification(): Promise<boolean> {
    if (!this.isSupported() || Notification.permission !== 'granted') return false
    const opts: NotificationOptions = {
      body: 'Magnitude 5.8\nLocation: Demo Region\nDepth: 12 km\nOccurred just now',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'r360-eq-test',
    }
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration()
        if (reg) {
          await reg.showNotification('🌍 Significant Earthquake Detected', {
            ...opts,
            data: { eventId: 'r360-eq-test', targetUrl: '/view/live-earthquake-map?eqEventId=r360-eq-test' },
          })
          return true
        }
      }
      const n = new Notification('🌍 Significant Earthquake Detected', opts)
      n.onclick = () => {
        window.focus()
        window.location.assign('/view/live-earthquake-map?eqEventId=r360-eq-test')
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
