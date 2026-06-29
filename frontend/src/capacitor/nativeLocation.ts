import { Geolocation } from '@capacitor/geolocation'
import { Capacitor } from '@capacitor/core'

export type NativeLocationResult = {
  latitude: number
  longitude: number
}

export async function getNativeLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!Capacitor.isNativePlatform()) return 'prompt'
  const status = await Geolocation.checkPermissions()
  if (status.location === 'granted' || status.coarseLocation === 'granted') return 'granted'
  if (status.location === 'denied') return 'denied'
  return 'prompt'
}

export async function requestNativeLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!Capacitor.isNativePlatform()) return 'prompt'
  const status = await Geolocation.requestPermissions()
  if (status.location === 'granted' || status.coarseLocation === 'granted') return 'granted'
  if (status.location === 'denied') return 'denied'
  return 'prompt'
}

export async function getNativeCurrentPosition(): Promise<NativeLocationResult> {
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
