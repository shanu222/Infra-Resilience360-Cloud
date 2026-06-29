import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { persistLanguage } from '../../i18n'
import type { Language } from '../../types/sectionKeys'
import { usePortalHashRoute } from '../../hooks/usePortalHashRoute'
import { useIframeAutoHeight } from '../../hooks/useIframeAutoHeight'
import smartConstructionBackground from '../../assets/backgrounds/smart_construction_bg.webp'

export function SmartConstructionPage({
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

  useEffect(() => {
    persistLanguage(language)
  }, [language])

  usePortalHashRoute('smart-construction')

  return (
    <div
      className="portal-page-root portal-page-smart-construction smart-construction-layout"
      data-admin-mode={isAdminMode ? 'true' : 'false'}
      data-edit-mode={isEditMode ? 'true' : 'false'}
      style={
        {
          '--smart-construction-bg-url': `url("${smartConstructionBackground}")`,
        } as CSSProperties
      }
    >
      {!isFrameReady ? <div className="section-shell-fallback"><div className="section-shell-fallback__bar" /><div className="section-shell-fallback__bar is-short" /></div> : null}
      <iframe
        ref={iframeRef}
        className="r360-embedded-portal-frame smart-construction-portal-frame"
        src="/smart-construction/index.html"
        title="Smart Construction Portal"
        loading="lazy"
        referrerPolicy="no-referrer"
        scrolling="no"
        onLoad={() => setIsFrameReady(true)}
        style={{ opacity: isFrameReady ? 1 : 0.01, transition: 'opacity 180ms ease' }}
      />
    </div>
  )
}
