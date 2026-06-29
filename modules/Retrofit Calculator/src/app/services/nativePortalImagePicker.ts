type PortalImagePickResult = {
  requestId: string
  fileName: string
  mimeType: string
  base64: string
}

type PortalImagePickResponse = {
  type: 'r360-native-image-pick-result'
  requestId: string
  ok: boolean
  fileName?: string
  mimeType?: string
  base64?: string
  error?: string
}

export function isNativeEmbeddedPortal(): boolean {
  if (window.parent === window) return false
  try {
    const parent = window.parent as Window & { __R360_NATIVE_PORTAL_BRIDGE__?: boolean }
    return Boolean(parent.__R360_NATIVE_PORTAL_BRIDGE__)
  } catch {
    return false
  }
}

export function requestEmbeddedNativeImagePick(): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!isNativeEmbeddedPortal()) {
      reject(new Error('Native image picker is unavailable.'))
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
      const binary = atob(data.base64)
      const bytes = new Uint8Array(binary.length)
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
      }
      resolve(
        new File([bytes], data.fileName, {
          type: data.mimeType || 'image/jpeg',
          lastModified: Date.now(),
        }),
      )
    }

    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: 'r360-native-image-pick-sheet', requestId }, window.location.origin)
  })
}

export function isLikelyImageUpload(file: File): boolean {
  const type = String(file.type ?? '').toLowerCase()
  if (type.startsWith('image/')) return true
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext)
}
