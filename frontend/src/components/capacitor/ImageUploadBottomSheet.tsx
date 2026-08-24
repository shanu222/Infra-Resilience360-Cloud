import { useEffect } from 'react'
import { createPortal } from 'react-dom'

type ImageUploadBottomSheetProps = {
  open: boolean
  onClose: () => void
  onTakePhoto: () => void
  onChooseGallery: () => void
  title?: string
}

export function ImageUploadBottomSheet({
  open,
  onClose,
  onTakePhoto,
  onChooseGallery,
  title = 'Add a photo',
}: ImageUploadBottomSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // The sheet covers the viewport, so the page behind it must not scroll.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null
  if (typeof document === 'undefined') return null

  // Rendered into <body> so a transformed/filtered ancestor cannot turn the
  // fixed overlay into an in-flow block at the bottom of the page.
  return createPortal(
    <div className="r360-image-upload-sheet-overlay" role="presentation" onClick={onClose}>
      <div
        className="r360-image-upload-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="r360-image-upload-sheet__grabber" aria-hidden="true" />
        <p className="r360-image-upload-sheet__title">{title}</p>
        <button type="button" className="r360-image-upload-sheet__action" onClick={onTakePhoto}>
          <span className="r360-image-upload-sheet__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </span>
          Take Photo
        </button>
        <button type="button" className="r360-image-upload-sheet__action" onClick={onChooseGallery}>
          <span className="r360-image-upload-sheet__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </span>
          Choose from Gallery
        </button>
        <button type="button" className="r360-image-upload-sheet__cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  )
}
