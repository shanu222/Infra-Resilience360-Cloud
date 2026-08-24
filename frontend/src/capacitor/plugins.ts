/**
 * Central lazy loaders for the Capacitor plugin packages.
 *
 * The specifier MUST be a literal inside `import()` so Vite can pre-bundle each
 * plugin into its own chunk. A variable specifier (or `/* @vite-ignore *\/`)
 * leaves a bare module request in the output, which the Android WebView cannot
 * resolve at runtime — the import rejects and every native feature silently
 * degrades to its web fallback.
 */

export type CapacitorPluginLoadError = Error

async function load<T>(loader: () => Promise<T>, label: string): Promise<T> {
  try {
    return await loader()
  } catch {
    throw new Error(`Native ${label} module is unavailable in this runtime.`)
  }
}

export function loadCapacitorCore() {
  return load(() => import('@capacitor/core'), 'core')
}

export function loadCapacitorApp() {
  return load(() => import('@capacitor/app'), 'app')
}

export function loadCapacitorCamera() {
  return load(() => import('@capacitor/camera'), 'camera')
}

export function loadCapacitorGeolocation() {
  return load(() => import('@capacitor/geolocation'), 'geolocation')
}

export function loadCapacitorLocalNotifications() {
  return load(() => import('@capacitor/local-notifications'), 'notification')
}

export function loadCapacitorScreenOrientation() {
  return load(() => import('@capacitor/screen-orientation'), 'screen orientation')
}
