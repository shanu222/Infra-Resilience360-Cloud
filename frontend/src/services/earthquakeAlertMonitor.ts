import { buildApiTargets, fetchApi } from './apiBase'
import { earthquakePushNotificationService } from './earthquakePushNotifications'
import { isCapacitorNativeRuntime } from '../utils/capacitorRuntime'

type LiveFeature = {
  id?: string
  properties?: {
    mag?: number | null
    place?: string
    time?: number
    url?: string
  }
  geometry?: {
    coordinates?: number[]
  }
}

const POLL_MS = 120_000

export function startNativeEarthquakeAlertMonitor(): () => void {
  if (!isCapacitorNativeRuntime()) return () => undefined

  let stopped = false

  const poll = async () => {
    if (stopped || document.visibilityState === 'hidden') return
    const settings = earthquakePushNotificationService.getSettings()
    if (!settings.enabled) return

    try {
      const targets = buildApiTargets('/api/earthquake/live')
      let payload: { features?: LiveFeature[] } | null = null
      for (const target of targets) {
        try {
          const response = await fetchApi(target, { cache: 'no-store' })
          if (!response.ok) continue
          const body = (await response.json()) as { features?: LiveFeature[] }
          if ((body.features?.length ?? 0) > 0) {
            payload = body
            break
          }
        } catch {
          /* try next */
        }
      }
      if (!payload?.features?.length) return

      for (const feature of payload.features) {
        const magnitude = Number(feature.properties?.mag ?? 0)
        if (!Number.isFinite(magnitude) || magnitude < settings.threshold) continue
        const coords = feature.geometry?.coordinates ?? []
        const eventId = String(feature.id ?? feature.properties?.time ?? '').trim()
        if (!eventId) continue
        await earthquakePushNotificationService.notifyEarthquake({
          magnitude,
          location: String(feature.properties?.place ?? 'Unknown location'),
          latitude: Number(coords[1] ?? 0),
          longitude: Number(coords[0] ?? 0),
          depth: Number(coords[2] ?? 0),
          timestamp: new Date(Number(feature.properties?.time ?? Date.now())).toISOString(),
          eventId,
          url: String(feature.properties?.url ?? ''),
        })
      }
    } catch {
      /* keep polling */
    }
  }

  void poll()
  const timer = window.setInterval(() => {
    void poll()
  }, POLL_MS)

  return () => {
    stopped = true
    window.clearInterval(timer)
  }
}
