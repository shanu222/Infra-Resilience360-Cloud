import { useEffect, useState } from 'react'
import { persistLanguage } from '../../i18n'
import type { Language } from '../../types/sectionKeys'
import { usePortalHashRoute } from '../../hooks/usePortalHashRoute'
import { useIframeAutoHeight } from '../../hooks/useIframeAutoHeight'

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

  useEffect(() => {
    persistLanguage(language)
  }, [language])

  usePortalHashRoute('retrofit-calculator')

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
    </div>
  )
}
