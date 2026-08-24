import { useEffect } from 'react'

type ImageUploadBottomSheetProps = {
  open: boolean
  onClose: () => void
  onTakePhoto: () => void
  onChooseGallery: () => void
}

export function ImageUploadBottomSheet({
  open,
  onClose,
  onTakePhoto,
  onChooseGallery,
}: ImageUploadBottomSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="r360-image-upload-sheet-overlay" role="presentation" onClick={onClose}>
      <div
        className="r360-image-upload-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Upload image"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="r360-image-upload-sheet__action" onClick={onTakePhoto}>
          📷 Take Photo
        </button>
        <button type="button" className="r360-image-upload-sheet__action" onClick={onChooseGallery}>
          🖼 Choose from Gallery
        </button>
        <button type="button" className="r360-image-upload-sheet__cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
