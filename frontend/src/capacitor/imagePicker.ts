import { normalizeImageFileForUpload } from '../utils/normalizeImageFile'

type CapacitorCoreModule = {
  Capacitor?: {
    convertFileSrc?: (path: string) => string
    isNativePlatform?: () => boolean
  }
}

type CapacitorCameraModule = {
  Camera: {
    getPhoto: (opts: Record<string, unknown>) => Promise<{ path?: string; webPath?: string }>
    pickImages: (opts: Record<string, unknown>) => Promise<{ photos?: Array<{ path?: string; webPath?: string }> }>
  }
  CameraResultType: { Uri: unknown }
  CameraSource: { Camera: unknown; Photos: unknown }
}

async function loadCapacitorCore(): Promise<CapacitorCoreModule | null> {
  const coreModule = '@capacitor/core'
  try {
    return (await import(/* @vite-ignore */ coreModule)) as CapacitorCoreModule
  } catch {
    return null
  }
}

async function loadCapacitorCamera(): Promise<CapacitorCameraModule> {
  const cameraModule = '@capacitor/camera'
  try {
    return (await import(/* @vite-ignore */ cameraModule)) as CapacitorCameraModule
  } catch {
    throw new Error('Native camera module is unavailable in this runtime.')
  }
}

async function uriToFile(uri: string, fallbackName: string): Promise<File> {
  const core = await loadCapacitorCore()
  const convertFileSrc = core?.Capacitor?.convertFileSrc
  const resolved = uri.startsWith('http') ? uri : (typeof convertFileSrc === 'function' ? convertFileSrc(uri) : uri)
  const response = await fetch(resolved)
  if (!response.ok) {
    throw new Error('The requested file could not be read. Please try again.')
  }
  const blob = await response.blob()
  return normalizeImageFileForUpload(new File([blob], fallbackName, { type: blob.type || 'image/jpeg' }), fallbackName)
}

export async function capturePhotoWithCamera(): Promise<File> {
  const camera = await loadCapacitorCamera()
  const { Camera, CameraResultType, CameraSource } = camera
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
    saveToGallery: false,
  })
  const uri = String(photo.path ?? photo.webPath ?? '').trim()
  if (!uri) throw new Error('Camera did not return a photo. Please try again.')
  return uriToFile(uri, `camera-${Date.now()}.jpg`)
}

export async function pickPhotosFromGallery(): Promise<File[]> {
  const camera = await loadCapacitorCamera()
  const { Camera, CameraResultType, CameraSource } = camera
  try {
    const result = await Camera.pickImages({ quality: 90, limit: 12 })
    const photos = result.photos ?? []
    if (photos.length === 0) return []
    const files: File[] = []
    for (let index = 0; index < photos.length; index += 1) {
      const uri = String(photos[index]?.path ?? photos[index]?.webPath ?? '').trim()
      if (!uri) continue
      files.push(await uriToFile(uri, `gallery-${Date.now()}-${index + 1}.jpg`))
    }
    return files
  } catch {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    })
    const uri = String(photo.path ?? photo.webPath ?? '').trim()
    if (!uri) return []
    return [await uriToFile(uri, `gallery-${Date.now()}.jpg`)]
  }
}
