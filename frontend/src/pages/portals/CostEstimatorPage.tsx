import { useEffect, useRef, useState } from 'react'
import { persistLanguage } from '../../i18n'
import type { Language } from '../../types/sectionKeys'
import { usePortalHashRoute } from '../../hooks/usePortalHashRoute'
import { useIframeAutoHeight } from '../../hooks/useIframeAutoHeight'
import { ImageUploadBottomSheet } from '../../components/capacitor/ImageUploadBottomSheet'
import { capturePhotoWithCamera, pickPhotosFromGallery } from '../../capacitor/imagePicker'
import { installPortalImagePickerBridge, postPortalImagePickResult } from '../../capacitor/portalImagePickerBridge'
import { isCapacitorNativeRuntime } from '../../utils/capacitorRuntime'
import { normalizeImageFileForUpload } from '../../utils/normalizeImageFile'

/** Retrofit calculator portal — static bundle at `/retrofit-calculator/index.html`. */
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
  const [portalUploadSheetOpen, setPortalUploadSheetOpen] = useState(false)
  const portalPickRequestIdRef = useRef<string | null>(null)
  const portalPickSourceRef = useRef<Window | null>(null)

  useEffect(() => {
    persistLanguage(language)
  }, [language])

  usePortalHashRoute('retrofit-calculator')

  useEffect(() => {
    if (!isCapacitorNativeRuntime()) return
    const bridgeFlag = window as Window & { __R360_NATIVE_PORTAL_BRIDGE__?: boolean }
    bridgeFlag.__R360_NATIVE_PORTAL_BRIDGE__ = true
    const uninstall = installPortalImagePickerBridge({
      onSheetRequest: (requestId, source) => {
        portalPickRequestIdRef.current = requestId
        portalPickSourceRef.current = source
        setPortalUploadSheetOpen(true)
      },
    })
    return () => {
      delete bridgeFlag.__R360_NATIVE_PORTAL_BRIDGE__
      uninstall()
    }
  }, [])

  const respondToPortalPick = async (source: 'camera' | 'gallery') => {
    const requestId = portalPickRequestIdRef.current
    const target = portalPickSourceRef.current
    setPortalUploadSheetOpen(false)
    portalPickRequestIdRef.current = null
    portalPickSourceRef.current = null
    if (!requestId || !target) return

    try {
      const files = source === 'camera' ? [await capturePhotoWithCamera()] : await pickPhotosFromGallery()
      const file = files[0]
      if (!file) {
        postPortalImagePickResult(target, {
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
      postPortalImagePickResult(target, {
        type: 'r360-native-image-pick-result',
        requestId,
        ok: true,
        fileName: normalized.name,
        mimeType: normalized.type || 'image/jpeg',
        base64,
      })
    } catch (error) {
      postPortalImagePickResult(target, {
        type: 'r360-native-image-pick-result',
        requestId,
        ok: false,
        error: error instanceof Error ? error.message : 'Image selection failed.',
      })
    }
  }

  return (
    <div
      className="portal-page-root portal-page-retrofit-calculator"
      data-admin-mode={isAdminMode ? 'true' : 'false'}
      data-edit-mode={isEditMode ? 'true' : 'false'}
    >
      {!isFrameReady ? <div className="section-shell-fallback"><div className="section-shell-fallback__bar" /><div className="section-shell-fallback__bar is-short" /></div> : null}
      <iframe
        ref={iframeRef}
        className="r360-embedded-portal-frame retrofit-calculator-portal-frame"
        src="/retrofit-calculator/index.html"
        title="Retrofit Calculator Portal"
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setIsFrameReady(true)}
        style={{ opacity: isFrameReady ? 1 : 0.01, transition: 'opacity 180ms ease' }}
      />
      <ImageUploadBottomSheet
        open={portalUploadSheetOpen}
        onClose={() => {
          const requestId = portalPickRequestIdRef.current
          const target = portalPickSourceRef.current
          setPortalUploadSheetOpen(false)
          portalPickRequestIdRef.current = null
          portalPickSourceRef.current = null
          if (requestId && target) {
            postPortalImagePickResult(target, {
              type: 'r360-native-image-pick-result',
              requestId,
              ok: false,
              error: 'Image selection was cancelled.',
            })
          }
        }}
        onTakePhoto={() => void respondToPortalPick('camera')}
        onChooseGallery={() => void respondToPortalPick('gallery')}
      />
    </div>
  )
}
