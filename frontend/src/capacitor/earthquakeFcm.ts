import { loadCapacitorCore, loadCapacitorPushNotifications } from './plugins'

type EarthquakeFcmApi = {
  getToken: () => Promise<{ token?: string }>
  subscribeAlerts: () => Promise<{ ok?: boolean; topic?: string }>
  unsubscribeAlerts: () => Promise<{ ok?: boolean; topic?: string }>
}

async function loadFcmPlugin(): Promise<EarthquakeFcmApi | null> {
  try {
    const core = (await loadCapacitorCore()) as unknown as {
      Capacitor?: {
        isNativePlatform?: () => boolean
        isPluginAvailable?: (name: string) => boolean
      }
      registerPlugin?: <T>(name: string) => T
    }
    if (!core?.Capacitor?.isNativePlatform?.()) return null
    if (core.Capacitor.isPluginAvailable?.('EarthquakeFcm') === false) return null
    if (typeof core.registerPlugin !== 'function') return null
    return core.registerPlugin<EarthquakeFcmApi>('EarthquakeFcm')
  } catch {
    return null
  }
}

/**
 * Registers for FCM, creates the default channel via PushNotifications, and
 * subscribes to the {@code earthquake-alerts} topic so closed-app pushes work
 * when Firebase Console / your backend sends to that topic.
 */
export async function enableFirebaseEarthquakePush(): Promise<{ token: string | null; subscribed: boolean }> {
  try {
    const pushMod = (await loadCapacitorPushNotifications()) as unknown as {
      PushNotifications: {
        requestPermissions: () => Promise<{ receive?: string }>
        checkPermissions: () => Promise<{ receive?: string }>
        register: () => Promise<void>
        createChannel?: (opts: Record<string, unknown>) => Promise<void>
        addListener: (event: string, cb: (data: Record<string, unknown>) => void) => Promise<{ remove: () => void }>
      }
    }
    const Push = pushMod.PushNotifications

    try {
      await Push.createChannel?.({
        id: 'earthquake-alerts',
        name: 'Earthquake Alerts',
        description: 'Live earthquake alerts (Firebase + local backup)',
        importance: 5,
        visibility: 1,
        vibration: true,
      })
    } catch {
      /* channel may already exist */
    }

    const perm = await Push.requestPermissions()
    if (perm.receive !== 'granted') {
      return { token: null, subscribed: false }
    }

    await Push.register()

    const fcm = await loadFcmPlugin()
    let token: string | null = null
    let subscribed = false
    if (fcm) {
      try {
        const tokenResult = await fcm.getToken()
        token = String(tokenResult.token || '').trim() || null
      } catch {
        token = null
      }
      try {
        const sub = await fcm.subscribeAlerts()
        subscribed = Boolean(sub.ok)
      } catch {
        subscribed = false
      }
    }

    if (token) {
      try {
        localStorage.setItem('r360-fcm-token', token)
      } catch {
        /* ignore */
      }
    }

    return { token, subscribed }
  } catch {
    return { token: null, subscribed: false }
  }
}

export async function disableFirebaseEarthquakePush(): Promise<void> {
  try {
    const fcm = await loadFcmPlugin()
    await fcm?.unsubscribeAlerts()
  } catch {
    /* ignore */
  }
}

export function getCachedFcmToken(): string | null {
  try {
    return localStorage.getItem('r360-fcm-token')
  } catch {
    return null
  }
}
