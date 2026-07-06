import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

export async function openExternalUrl(url: string): Promise<void> {
  const href = String(url ?? '').trim()
  if (!href) return

  if (Capacitor.isNativePlatform()) {
    try {
      await CapacitorApp.openUrl({ url: href })
      return
    } catch {
      // Fall through to browser fallback.
    }
  }

  if (typeof window !== 'undefined') {
    window.open(href, '_blank', 'noopener,noreferrer')
  }
}
