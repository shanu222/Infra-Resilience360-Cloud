export async function openExternalUrl(url: string): Promise<void> {
  const href = String(url ?? '').trim()
  if (!href) return

  const isNative = Boolean((globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.())
  if (isNative) {
    try {
      const capacitorAppModule = '@capacitor/app'
      const mod = (await import(/* @vite-ignore */ capacitorAppModule)) as {
        App?: { openUrl?: (payload: { url: string }) => Promise<void> }
      }
      if (typeof mod?.App?.openUrl === 'function') {
        await mod.App.openUrl({ url: href })
        return
      }
    } catch {
      // Fall through to browser fallback.
    }
  }

  if (typeof window !== 'undefined') {
    window.open(href, '_blank', 'noopener,noreferrer')
  }
}
