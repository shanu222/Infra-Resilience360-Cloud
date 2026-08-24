import { loadCapacitorCore, loadCapacitorGeolocation } from './plugins'

export type NativeLocationResult = {
  latitude: number
  longitude: number
}

type CapacitorCoreModule = {
  Capacitor?: {
    isNativePlatform?: () => boolean
  }
}

type CapacitorGeolocationModule = {
  Geolocation: {
    checkPermissions: () => Promise<{ location?: string; coarseLocation?: string }>
    requestPermissions: () => Promise<{ location?: string; coarseLocation?: string }>
    getCurrentPosition: (opts: Record<string, unknown>) => Promise<{ coords: { latitude: number; longitude: number } }>
  }
}

async function isNativePlatform(): Promise<boolean> {
  try {
    const core = (await loadCapacitorCore()) as unknown as CapacitorCoreModule
    return Boolean(core?.Capacitor?.isNativePlatform?.())
  } catch {
    return false
  }
}

async function loadGeolocation() {
  const mod = (await loadCapacitorGeolocation()) as unknown as CapacitorGeolocationModule
  return mod.Geolocation
}

export async function getNativeLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!(await isNativePlatform())) return 'prompt'
  const Geolocation = await loadGeolocation()
  const status = await Geolocation.checkPermissions()
  if (status.location === 'granted' || status.coarseLocation === 'granted') return 'granted'
  if (status.location === 'denied') return 'denied'
  return 'prompt'
}

export async function requestNativeLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!(await isNativePlatform())) return 'prompt'
  const Geolocation = await loadGeolocation()
  const status = await Geolocation.requestPermissions()
  if (status.location === 'granted' || status.coarseLocation === 'granted') return 'granted'
  if (status.location === 'denied') return 'denied'
  return 'prompt'
}

export async function getNativeCurrentPosition(): Promise<NativeLocationResult> {
  const Geolocation = await loadGeolocation()
  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 0,
  })
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  }
}
