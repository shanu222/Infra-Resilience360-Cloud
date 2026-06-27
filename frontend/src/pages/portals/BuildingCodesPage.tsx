import { useState } from 'react'
import type { Language } from '../../types/sectionKeys'
import { useIframeAutoHeight } from '../../hooks/useIframeAutoHeight'

export function BuildingCodesPage({
  language,
  isAdminMode,
  isEditMode,
}: {
  language: Language
  isAdminMode?: boolean
  isEditMode?: boolean
}) {
  const isUrdu = language === 'ur'
  const iframeSrc = `/pgbc/library.html?lang=${isUrdu ? 'ur' : 'en'}`
  const iframeRef = useIframeAutoHeight(0)
  const [isFrameReady, setIsFrameReady] = useState(false)

  return (
    <div
      className="portal-page-root portal-page-pgbc"
      data-admin-mode={isAdminMode ? 'true' : 'false'}
      data-edit-mode={isEditMode ? 'true' : 'false'}
      dir={isUrdu ? 'rtl' : 'ltr'}
    >
      {!isFrameReady ? <div className="section-shell-fallback"><div className="section-shell-fallback__bar" /><div className="section-shell-fallback__bar is-short" /></div> : null}
      <iframe
        ref={iframeRef}
        className="r360-embedded-portal-frame pgbc-portal-frame"
        src={iframeSrc}
        title="Building Codes Portal"
        loading="lazy"
        referrerPolicy="no-referrer"
        scrolling="no"
        onLoad={() => setIsFrameReady(true)}
        style={{ opacity: isFrameReady ? 1 : 0.01, transition: 'opacity 180ms ease' }}
      />
    </div>
  )
}
