import { useCallback, useEffect, useRef, useState } from 'react'
import { persistLanguage } from '../../i18n'
import type { Language } from '../../types/sectionKeys'
import { usePortalHashRoute } from '../../hooks/usePortalHashRoute'
import { useIframeAutoHeight } from '../../hooks/useIframeAutoHeight'
import { ImageUploadBottomSheet } from '../../components/capacitor/ImageUploadBottomSheet'
import { capturePhotoWithCamera, pickPhotosFromGallery } from '../../capacitor/imagePicker'
import { isCapacitorNativeRuntime } from '../../utils/capacitorRuntime'
import { normalizeImageFileForUpload } from '../../utils/normalizeImageFile'

/**
 * Retrofit Calculator portal — static bundle at `/retrofit-calculator/index.html`.
 *
 * Native Android image-pick flow:
 *   1. iframe (Dashboard.tsx) shows a standalone <button> (NOT inside a <label>).
 *      On Android WebView, button-inside-label causes the touch event to be routed
 *      to the hidden file input instead of onClick — resulting in "does nothing".
 *      The standalone button avoids that entirely.
 *   2. Button calls requestEmbeddedNativeImagePick() which posts
 *      { type: 'r360-native-image-pick-sheet', requestId } to window.parent.
 *   3. THIS component (parent) listens for that message.
 *      Crucially, we do NOT use `event.source instanceof Window` because
 *      on some Android WebView versions WindowProxy instanceof Window is false,
 *      silently dropping the message. Instead we always use
 *      iframeRef.current.contentWindow as the reply target.
 *   4. We open ImageUploadBottomSheet, call capturePhotoWithCamera() /
 *      pickPhotosFromGallery() directly in the native app context, normalise the
 *      file, and post { type: 'r360-native-image-pick-result', requestId, ... }
 *      back to the iframe using iframeRef.current.contentWindow.postMessage().
 *   5. requestEmbeddedNativeImagePick() in the iframe resolves the Promise and
 *      the image flows into updateSelectedFile() normally.
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
    const win = window as Window & { __R360_NATIVE_PORTAL_BRIDGE__?: boolean }
    win.__R360_NATIVE_PORTAL_BRIDGE__ = true
    return () => {
      delete win.__R360_NATIVE_PORTAL_BRIDGE__
    }
  }, [isNative])

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

  /** Post a result payload to the iframe using the ref (not event.source). */
  const postResultToIframe = useCallback(
    (payload: Record<string, unknown>) => {
      const target = (iframeRef.current as HTMLIFrameElement | null)?.contentWindow
      if (!target) return
      // Try same-origin first; fall back to '*' if a WebView quirk blocks same-origin
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
      postResultToIframe({
        type: 'r360-native-image-pick-result',
        requestId,
        ok: true,
        fileName: normalized.name,
        mimeType: normalized.type || 'image/jpeg',
        base64,
      })
    } catch (error) {
      postResultToIframe({
        type: 'r360-native-image-pick-result',
        requestId,
        ok: false,
        error: error instanceof Error ? error.message : 'Camera capture failed.',
      })
    }
  }, [postResultToIframe])

  const handleNativeGalleryPick = useCallback(async () => {
    const requestId = pendingRequestIdRef.current
    setUploadSheetOpen(false)
    pendingRequestIdRef.current = null
    try {
      const files = await pickPhotosFromGallery()
      const file = files[0]
      if (!file) {
        postResultToIframe({
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
      postResultToIframe({
        type: 'r360-native-image-pick-result',
        requestId,
        ok: true,
        fileName: normalized.name,
        mimeType: normalized.type || 'image/jpeg',
        base64,
      })
    } catch (error) {
      postResultToIframe({
        type: 'r360-native-image-pick-result',
        requestId,
        ok: false,
        error: error instanceof Error ? error.message : 'Gallery selection failed.',
      })
    }
  }, [postResultToIframe])

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
            postResultToIframe({
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
