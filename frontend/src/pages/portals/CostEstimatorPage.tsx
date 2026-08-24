import { useCallback, useEffect, useRef, useState } from 'react'
import { persistLanguage } from '../../i18n'
import type { Language } from '../../types/sectionKeys'
import { usePortalHashRoute } from '../../hooks/usePortalHashRoute'
import { useIframeAutoHeight } from '../../hooks/useIframeAutoHeight'
import { ImageUploadBottomSheet } from '../../components/capacitor/ImageUploadBottomSheet'
import { capturePhotoWithCamera, isPickerCancellation, pickPhotosFromGallery } from '../../capacitor/imagePicker'
import { isCapacitorNativeRuntime } from '../../utils/capacitorRuntime'
import { normalizeImageFileForUpload } from '../../utils/normalizeImageFile'
import { analyzeBuildingWithVision } from '../../services/vision'

/**
 * Retrofit Calculator portal — static bundle at `/retrofit-calculator/index.html`.
 *
 * ─── Native Android image-pick flow ────────────────────────────────────────────
 * iframe Dashboard.tsx shows a standalone <button> (NOT inside a <label>).
 * button-inside-label on Android WebView routes the touch to the hidden file
 * input instead of onClick, causing "does nothing". The standalone button fires
 * onClick reliably every time.
 *
 * Button click → requestEmbeddedNativeImagePick() in iframe
 *   → posts r360-native-image-pick-sheet to parent (this component)
 *   → parent listener opens ImageUploadBottomSheet
 *   → capturePhotoWithCamera() / pickPhotosFromGallery() in main-app context
 *     (CapacitorHttp is guaranteed available here — not inside an iframe)
 *   → normalise file → read as base64
 *   → post r360-native-image-pick-result to iframe via iframeRef.current.contentWindow
 *     (avoids event.source instanceof Window unreliability on some Android WebViews)
 *   → requestEmbeddedNativeImagePick() resolves → updateSelectedFile() in Dashboard
 *
 * ─── Native Android AI analysis flow ──────────────────────────────────────────
 * The Retrofit Calculator runs inside an iframe. On Android, same-origin iframes
 * do NOT inherit the main frame's CapacitorHttp-patched window.fetch — they use
 * the native WebView fetch which may hang on cross-origin POST with FormData
 * (CORS preflight timeout when CapacitorHttp bypass is unavailable inside iframes).
 *
 * Fix: when Analyze Image is tapped on Android, Dashboard.tsx sends the image
 * as base64 + analysis params to THIS parent (r360-retrofit-analyze-request).
 * CostEstimatorPage calls analyzeBuildingWithVision() directly in the main-app
 * context where CapacitorHttp is guaranteed to intercept fetch, then posts the
 * result back as r360-retrofit-analyze-result.
 *
 * Web behaviour: unchanged. Dashboard.tsx calls analyzeBuildingWithVision()
 * directly from the iframe (regular browser fetch works fine in web context).
 */
export function CostEstimatorPage({
  language,
  isAdminMode,
  isEditMode,
}: {
  language: Language
  isAdminMode?: boolean
  isEditMode?: boolean
}) {
  const iframeRef = useIframeAutoHeight(0)
  const [isFrameReady, setIsFrameReady] = useState(false)
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false)
  const pendingRequestIdRef = useRef<string | null>(null)
  const isNative = isCapacitorNativeRuntime()

  useEffect(() => {
    persistLanguage(language)
  }, [language])

  usePortalHashRoute('retrofit-calculator')

  // Expose bridge flag so isNativeEmbeddedPortal() fallback check in the iframe works
  useEffect(() => {
    if (!isNative) return
    const win = window as Window & {
      __R360_NATIVE_PORTAL_BRIDGE__?: boolean
      __R360_SAVE_PDF__?: (filename: string, base64: string) => Promise<void>
    }
    win.__R360_NATIVE_PORTAL_BRIDGE__ = true
    win.__R360_SAVE_PDF__ = async (filename: string, base64: string) => {
      const { savePdfBase64Native } = await import('../../utils/savePdfDocument')
      await savePdfBase64Native(filename, base64)
    }
    return () => {
      delete win.__R360_NATIVE_PORTAL_BRIDGE__
      delete win.__R360_SAVE_PDF__
    }
  }, [isNative])

  // ─── Image pick bridge ────────────────────────────────────────────────────────
  // Listen for r360-native-image-pick-sheet from the iframe.
  // We deliberately skip the `event.source instanceof Window` check because
  // WindowProxy instanceof Window is unreliable on some Android WebView builds.
  useEffect(() => {
    if (!isNative) return
    const onMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return
      const data = event.data as { type?: string; requestId?: string }
      if (data.type !== 'r360-native-image-pick-sheet' || !data.requestId) return
      pendingRequestIdRef.current = data.requestId
      setUploadSheetOpen(true)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [isNative])

  /** Post a payload to the iframe using the ref (avoids event.source unreliability). */
  const postToIframe = useCallback(
    (payload: Record<string, unknown>) => {
      const target = (iframeRef.current as HTMLIFrameElement | null)?.contentWindow
      if (!target) return
      try {
        target.postMessage(payload, window.location.origin)
      } catch {
        try {
          target.postMessage(payload, '*')
        } catch {
          /* best-effort */
        }
      }
    },
    [iframeRef],
  )

  const handleNativeCameraCapture = useCallback(async () => {
    const requestId = pendingRequestIdRef.current
    setUploadSheetOpen(false)
    pendingRequestIdRef.current = null
    try {
      const file = await capturePhotoWithCamera()
      const normalized = await normalizeImageFileForUpload(file, file.name || 'upload.jpg')
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = String(reader.result ?? '')
          const comma = result.indexOf(',')
          resolve(comma >= 0 ? result.slice(comma + 1) : result)
        }
        reader.onerror = () => reject(new Error('Could not read the selected image.'))
        reader.readAsDataURL(normalized)
      })
      postToIframe({
        type: 'r360-native-image-pick-result',
        requestId,
        ok: true,
        fileName: normalized.name,
        mimeType: normalized.type || 'image/jpeg',
        base64,
      })
    } catch (error) {
      postToIframe({
        type: 'r360-native-image-pick-result',
        requestId,
        ok: false,
        error: isPickerCancellation(error)
          ? 'Image selection was cancelled.'
          : error instanceof Error ? error.message : 'Camera capture failed.',
      })
    }
  }, [postToIframe])

  const handleNativeGalleryPick = useCallback(async () => {
    const requestId = pendingRequestIdRef.current
    setUploadSheetOpen(false)
    pendingRequestIdRef.current = null
    try {
      const files = await pickPhotosFromGallery()
      const file = files[0]
      if (!file) {
        postToIframe({
          type: 'r360-native-image-pick-result',
          requestId,
          ok: false,
          error: 'No image was selected.',
        })
        return
      }
      const normalized = await normalizeImageFileForUpload(file, file.name || 'upload.jpg')
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = String(reader.result ?? '')
          const comma = result.indexOf(',')
          resolve(comma >= 0 ? result.slice(comma + 1) : result)
        }
        reader.onerror = () => reject(new Error('Could not read the selected image.'))
        reader.readAsDataURL(normalized)
      })
      postToIframe({
        type: 'r360-native-image-pick-result',
        requestId,
        ok: true,
        fileName: normalized.name,
        mimeType: normalized.type || 'image/jpeg',
        base64,
      })
    } catch (error) {
      postToIframe({
        type: 'r360-native-image-pick-result',
        requestId,
        ok: false,
        error: isPickerCancellation(error)
          ? 'Image selection was cancelled.'
          : error instanceof Error ? error.message : 'Gallery selection failed.',
      })
    }
  }, [postToIframe])

  // If the embedded portal requests a direct native pick, still route through
  // the shared bottom-sheet so users always get both options.
  useEffect(() => {
    if (!isNative) return
    const onMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return
      const data = event.data as { type?: string; requestId?: string; source?: 'camera' | 'gallery' }
      if (data.type !== 'r360-native-image-pick' || !data.requestId) return

      pendingRequestIdRef.current = data.requestId
      setUploadSheetOpen(true)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [isNative])

  // ─── AI analysis bridge ───────────────────────────────────────────────────────
  // On Android, iframe fetch cannot go through CapacitorHttp (same-origin iframes
  // don't inherit the patched window.fetch from the main frame). The iframe posts
  // the image + params here; we call analyzeBuildingWithVision() in the main-app
  // context where CapacitorHttp IS available, then post the result back.
  useEffect(() => {
    if (!isNative) return
    const onMessage = async (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return
      const data = event.data as {
        type?: string
        base64?: string
        fileName?: string
        mimeType?: string
        structureType?: string
        province?: string
        location?: string
        riskProfile?: string
      }
      if (data.type !== 'r360-retrofit-analyze-request') return
      if (!data.base64 || !data.fileName) {
        postToIframe({ type: 'r360-retrofit-analyze-result', ok: false, error: 'No image data received.' })
        return
      }

      try {
        // Reconstruct File from base64 (sent by Dashboard.tsx)
        const binary = atob(data.base64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        const file = new File([bytes], data.fileName, {
          type: data.mimeType || 'image/jpeg',
          lastModified: Date.now(),
        })

        // Call analyzeBuildingWithVision() in the main-app context — CapacitorHttp guaranteed
        const result = await analyzeBuildingWithVision({
          image: file,
          structureType: data.structureType ?? 'RC Frame',
          province: data.province ?? 'Punjab',
          location: data.location ?? '',
          riskProfile: data.riskProfile ?? 'Urban retrofit assessment',
        })

        postToIframe({ type: 'r360-retrofit-analyze-result', ok: true, result })
      } catch (error) {
        postToIframe({
          type: 'r360-retrofit-analyze-result',
          ok: false,
          error: error instanceof Error ? error.message : 'AI analysis failed. Please try again.',
        })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [isNative, postToIframe])

  // ─── PDF download bridge ──────────────────────────────────────────────────────
  // Prefer window.__R360_SAVE_PDF__ (same-origin direct call). Chunked postMessage
  // is the fallback when the parent function is unreachable.
  useEffect(() => {
    if (!isNative) return
    const chunks = new Map<string, { filename: string; parts: string[]; total: number }>()

    const onMessage = async (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return
      const data = event.data as {
        type?: string
        requestId?: string
        filename?: string
        base64?: string
        chunk?: string
        chunkIndex?: number
        totalChunks?: number
      }

      const reply = (requestId: string, ok: boolean, error?: string) => {
        postToIframe({
          type: 'r360-pdf-download-result',
          requestId,
          ok,
          error,
        })
      }

      if (data.type === 'r360-pdf-download-request' && data.requestId) {
        if (!data.base64 || !data.filename) {
          reply(data.requestId, false, 'Missing PDF data.')
          return
        }
        try {
          const { savePdfBase64Native } = await import('../../utils/savePdfDocument')
          await savePdfBase64Native(data.filename, data.base64)
          reply(data.requestId, true)
        } catch (error) {
          reply(
            data.requestId,
            false,
            error instanceof Error ? error.message : 'Could not save the PDF report.',
          )
        }
        return
      }

      if (data.type === 'r360-pdf-download-chunk' && data.requestId) {
        const total = Number(data.totalChunks) || 0
        const index = Number(data.chunkIndex)
        if (!data.filename || typeof data.chunk !== 'string' || total < 1 || Number.isNaN(index)) return
        let entry = chunks.get(data.requestId)
        if (!entry) {
          entry = { filename: data.filename, parts: new Array(total).fill(null as unknown as string), total }
          chunks.set(data.requestId, entry)
        }
        entry.parts[index] = data.chunk
        if (entry.parts.some((part) => part == null)) return

        chunks.delete(data.requestId)
        try {
          const { savePdfBase64Native } = await import('../../utils/savePdfDocument')
          await savePdfBase64Native(entry.filename, entry.parts.join(''))
          reply(data.requestId, true)
        } catch (error) {
          reply(
            data.requestId,
            false,
            error instanceof Error ? error.message : 'Could not save the PDF report.',
          )
        }
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [isNative, postToIframe])

  return (
    <div
      className="portal-page-root portal-page-retrofit-calculator"
      data-admin-mode={isAdminMode ? 'true' : 'false'}
      data-edit-mode={isEditMode ? 'true' : 'false'}
    >
      {!isFrameReady ? (
        <div className="section-shell-fallback">
          <div className="section-shell-fallback__bar" />
          <div className="section-shell-fallback__bar is-short" />
        </div>
      ) : null}

      <iframe
        ref={iframeRef}
        className="r360-embedded-portal-frame retrofit-calculator-portal-frame"
        src={isNative ? '/retrofit-calculator/index.html?native=1' : '/retrofit-calculator/index.html'}
        title="Retrofit Calculator Portal"
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setIsFrameReady(true)}
        style={{ opacity: isFrameReady ? 1 : 0.01, transition: 'opacity 180ms ease' }}
      />

      <ImageUploadBottomSheet
        open={uploadSheetOpen}
        onClose={() => {
          const requestId = pendingRequestIdRef.current
          setUploadSheetOpen(false)
          pendingRequestIdRef.current = null
          if (requestId) {
            postToIframe({
              type: 'r360-native-image-pick-result',
              requestId,
              ok: false,
              error: 'Image selection was cancelled.',
            })
          }
        }}
        onTakePhoto={() => void handleNativeCameraCapture()}
        onChooseGallery={() => void handleNativeGalleryPick()}
      />
    </div>
  )
}
