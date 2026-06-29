import { useCallback, useEffect, useState } from 'react'
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
 * Native Android image-pick flow (mirrors Retrofit Guide exactly):
 *   1. Parent shows "Upload Image" button → opens ImageUploadBottomSheet.
 *   2. Parent calls capturePhotoWithCamera() / pickPhotosFromGallery() directly.
 *   3. Parent normalises the file and pushes it into the iframe via postMessage
 *      (type: 'r360-portal-push-image').
 *   4. Iframe Dashboard.tsx listens for that message and feeds the file into its
 *      own updateSelectedFile() — no bridge, no requestId, no timing dependency.
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
  const isNative = isCapacitorNativeRuntime()

  useEffect(() => {
    persistLanguage(language)
  }, [language])

  usePortalHashRoute('retrofit-calculator')

  /** Push an already-normalised file into the iframe via postMessage. */
  const pushImageToIframe = useCallback(async (rawFile: File) => {
    const iframe = iframeRef.current as HTMLIFrameElement | null
    if (!iframe?.contentWindow) return
    const normalized = await normalizeImageFileForUpload(rawFile, rawFile.name || 'upload.jpg')
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
    iframe.contentWindow.postMessage(
      { type: 'r360-portal-push-image', base64, fileName: normalized.name, mimeType: normalized.type || 'image/jpeg' },
      window.location.origin,
    )
  }, [iframeRef])

  const handleNativeCameraCapture = useCallback(async () => {
    setUploadSheetOpen(false)
    try {
      const file = await capturePhotoWithCamera()
      await pushImageToIframe(file)
    } catch {
      /* user cancelled — no error shown */
    }
  }, [pushImageToIframe])

  const handleNativeGalleryPick = useCallback(async () => {
    setUploadSheetOpen(false)
    try {
      const files = await pickPhotosFromGallery()
      if (files[0]) await pushImageToIframe(files[0])
    } catch {
      /* user cancelled — no error shown */
    }
  }, [pushImageToIframe])

  return (
    <div
      className="portal-page-root portal-page-retrofit-calculator"
      data-admin-mode={isAdminMode ? 'true' : 'false'}
      data-edit-mode={isEditMode ? 'true' : 'false'}
    >
      {/* Native Android upload button — identical pattern to Retrofit Guide */}
      {isNative && (
        <button
          type="button"
          className="retrofit-upload-native-btn"
          onClick={() => setUploadSheetOpen(true)}
        >
          Upload Image
        </button>
      )}

      {!isFrameReady ? <div className="section-shell-fallback"><div className="section-shell-fallback__bar" /><div className="section-shell-fallback__bar is-short" /></div> : null}
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
        onClose={() => setUploadSheetOpen(false)}
        onTakePhoto={() => void handleNativeCameraCapture()}
        onChooseGallery={() => void handleNativeGalleryPick()}
      />
    </div>
  )
}
