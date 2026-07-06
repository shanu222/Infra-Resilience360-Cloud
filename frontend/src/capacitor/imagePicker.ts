import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { normalizeImageFileForUpload } from '../utils/normalizeImageFile'

async function uriToFile(uri: string, fallbackName: string): Promise<File> {
  const resolved = uri.startsWith('http') ? uri : Capacitor.convertFileSrc(uri)
  const response = await fetch(resolved)
  if (!response.ok) {
    throw new Error('The requested file could not be read. Please try again.')
  }
  const blob = await response.blob()
  return normalizeImageFileForUpload(new File([blob], fallbackName, { type: blob.type || 'image/jpeg' }), fallbackName)
}

export async function capturePhotoWithCamera(): Promise<File> {
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
