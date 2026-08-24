import { normalizeImageFileForUpload } from '../utils/normalizeImageFile'
import { loadCapacitorCamera, loadCapacitorCore } from './plugins'

type CapturedPhoto = { path?: string; webPath?: string; format?: string }

type CapacitorCameraModule = {
  Camera: {
    getPhoto: (opts: Record<string, unknown>) => Promise<CapturedPhoto>
    pickImages: (opts: Record<string, unknown>) => Promise<{ photos?: CapturedPhoto[] }>
    checkPermissions?: () => Promise<{ camera?: string; photos?: string }>
    requestPermissions?: (opts?: Record<string, unknown>) => Promise<{ camera?: string; photos?: string }>
  }
  CameraResultType: { Uri: unknown }
  CameraSource: { Camera: unknown; Photos: unknown }
}

async function loadCamera(): Promise<CapacitorCameraModule> {
  return (await loadCapacitorCamera()) as unknown as CapacitorCameraModule
}

/**
 * Turns whatever the Camera plugin handed back into a URL the WebView can read.
 * `webPath` is already a `http://localhost/_capacitor_file_/…` URL; a bare `path`
 * is a filesystem path that only becomes readable after `convertFileSrc`.
 */
async function resolveReadableUrl(photo: CapturedPhoto): Promise<string> {
  const webPath = String(photo.webPath ?? '').trim()
  if (webPath) return webPath

  const rawPath = String(photo.path ?? '').trim()
  if (!rawPath) return ''
  if (/^(https?|blob|data):/i.test(rawPath)) return rawPath

  try {
    const core = (await loadCapacitorCore()) as {
      Capacitor?: { convertFileSrc?: (path: string) => string }
    }
    const convert = core?.Capacitor?.convertFileSrc
    if (typeof convert === 'function') return convert(rawPath)
  } catch {
    /* core unavailable — fall through */
  }
  return rawPath
}

async function photoToFile(photo: CapturedPhoto, fallbackName: string): Promise<File> {
  const url = await resolveReadableUrl(photo)
  if (!url) throw new Error('The selected photo could not be read. Please try again.')

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('The selected photo could not be read. Please try again.')
  }
  const blob = await response.blob()
  if (blob.size === 0) {
    throw new Error('The selected photo is empty. Please choose another image.')
  }
  const type = blob.type || (photo.format ? `image/${photo.format}` : 'image/jpeg')
  return normalizeImageFileForUpload(new File([blob], fallbackName, { type }), fallbackName)
}

/**
 * The Camera plugin reports a dismissed picker as a rejection, so callers need to
 * tell "user changed their mind" apart from a genuine failure worth surfacing.
 */
export function isPickerCancellation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /cancel|dismiss|no image (picked|selected)|user denied/i.test(message)
}

/** Ask up-front so the OS dialog is tied to the user's tap rather than a later async step. */
async function ensurePermission(
  camera: CapacitorCameraModule,
  kind: 'camera' | 'photos',
): Promise<void> {
  const { Camera } = camera
  if (typeof Camera.checkPermissions !== 'function' || typeof Camera.requestPermissions !== 'function') {
    return
  }
  try {
    const status = await Camera.checkPermissions()
    if (status?.[kind] === 'granted' || status?.[kind] === 'limited') return
    await Camera.requestPermissions({ permissions: [kind] })
  } catch {
    /* Let the plugin surface its own error when the actual call runs. */
  }
}

export async function capturePhotoWithCamera(): Promise<File> {
  const camera = await loadCamera()
  const { Camera, CameraResultType, CameraSource } = camera
  await ensurePermission(camera, 'camera')

  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    correctOrientation: true,
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
    saveToGallery: false,
  })
  return photoToFile(photo, `camera-${Date.now()}.jpg`)
}

export async function pickPhotosFromGallery(): Promise<File[]> {
  const camera = await loadCamera()
  const { Camera, CameraResultType, CameraSource } = camera
  await ensurePermission(camera, 'photos')

  try {
    const result = await Camera.pickImages({ quality: 90, limit: 12, correctOrientation: true })
    const photos = result.photos ?? []
    const files: File[] = []
    for (let index = 0; index < photos.length; index += 1) {
      files.push(await photoToFile(photos[index], `gallery-${Date.now()}-${index + 1}.jpg`))
    }
    return files
  } catch (error) {
    // Reopening the picker after a deliberate dismissal would trap the user in a loop.
    if (isPickerCancellation(error)) return []
    /* Multi-select unsupported on this OS version — fall back to single pick below. */
  }

  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    correctOrientation: true,
    resultType: CameraResultType.Uri,
    source: CameraSource.Photos,
  })
  return [await photoToFile(photo, `gallery-${Date.now()}.jpg`)]
}
