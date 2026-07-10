import { capturePhotoWithCamera, pickPhotosFromGallery } from './imagePicker'

export type PortalImagePickResult = {
  requestId: string
  fileName: string
  mimeType: string
  base64: string
}

export type PortalImagePickRequest = {
  type: 'r360-native-image-pick'
  requestId: string
  source: 'camera' | 'gallery'
}

export type PortalImagePickResponse = {
  type: 'r360-native-image-pick-result'
  requestId: string
  ok: boolean
  fileName?: string
  mimeType?: string
  base64?: string
  error?: string
}

export type PortalImagePickSheetRequest = {
  type: 'r360-native-image-pick-sheet'
  requestId: string
}

const PORTAL_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '*'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(new Error('Could not read the selected image.'))
    reader.readAsDataURL(file)
  })
}

export function postPortalImagePickResult(target: Window, payload: PortalImagePickResponse): void {
  target.postMessage(payload, PORTAL_ORIGIN)
}

export function requestPortalImagePickSheet(): Promise<PortalImagePickResult> {
  return new Promise((resolve, reject) => {
    if (window.parent === window) {
      reject(new Error('Image picker bridge is only available inside embedded portals.'))
      return
    }

    const requestId = `pick-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as PortalImagePickResponse | undefined
      if (!data || data.type !== 'r360-native-image-pick-result' || data.requestId !== requestId) return
      window.removeEventListener('message', onMessage)
      if (!data.ok || !data.base64 || !data.fileName) {
        reject(new Error(data.error || 'Image selection was cancelled.'))
        return
      }
      resolve({
        requestId,
        fileName: data.fileName,
        mimeType: data.mimeType || 'image/jpeg',
        base64: data.base64,
      })
    }

    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: 'r360-native-image-pick-sheet', requestId } satisfies PortalImagePickSheetRequest, PORTAL_ORIGIN)
  })
}

export async function portalImagePickResultToFile(result: PortalImagePickResult): Promise<File> {
  const binary = atob(result.base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new File([bytes], result.fileName, { type: result.mimeType, lastModified: Date.now() })
}

export type PortalImagePickerHandlers = {
  onSheetRequest: (requestId: string, source: Window) => void
}

export function installPortalImagePickerBridge(handlers: PortalImagePickerHandlers): () => void {
  const onMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return
    const data = event.data as PortalImagePickSheetRequest | PortalImagePickRequest | undefined
    if (!data?.type) return

    if (data.type === 'r360-native-image-pick-sheet') {
      const source = event.source
      if (source instanceof Window) {
        handlers.onSheetRequest(data.requestId, source)
      }
      return
    }

    if (data.type !== 'r360-native-image-pick') return
    const source = event.source
    if (!(source instanceof Window)) return

    void (async () => {
      try {
        const files =
          data.source === 'camera' ? [await capturePhotoWithCamera()] : await pickPhotosFromGallery()
        const file = files[0]
        if (!file) {
          postPortalImagePickResult(source, {
            type: 'r360-native-image-pick-result',
            requestId: data.requestId,
            ok: false,
            error: 'No image was selected.',
          })
          return
        }
        const base64 = await fileToBase64(file)
        postPortalImagePickResult(source, {
          type: 'r360-native-image-pick-result',
          requestId: data.requestId,
          ok: true,
          fileName: file.name,
          mimeType: file.type || 'image/jpeg',
          base64,
        })
      } catch (error) {
        postPortalImagePickResult(source, {
          type: 'r360-native-image-pick-result',
          requestId: data.requestId,
          ok: false,
          error: error instanceof Error ? error.message : 'Image selection failed.',
        })
      }
    })()
  }

  window.addEventListener('message', onMessage)
  return () => window.removeEventListener('message', onMessage)
}
