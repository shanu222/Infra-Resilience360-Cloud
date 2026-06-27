import { useEffect } from 'react'
import { persistLanguage } from '../../i18n'
import type { Language } from '../../types/sectionKeys'
import { usePortalHashRoute } from '../../hooks/usePortalHashRoute'
import { useIframeAutoHeight } from '../../hooks/useIframeAutoHeight'

export function SmartConstructionPage({
  language,
  isAdminMode,
  isEditMode,
}: {
  language: Language
  isAdminMode?: boolean
  isEditMode?: boolean
}) {
  const iframeRef = useIframeAutoHeight(820)

  useEffect(() => {
    persistLanguage(language)
  }, [language])

  usePortalHashRoute('smart-construction')

  return (
    <div
      className="portal-page-root portal-page-smart-construction"
      data-admin-mode={isAdminMode ? 'true' : 'false'}
      data-edit-mode={isEditMode ? 'true' : 'false'}
    >
      <iframe
        ref={iframeRef}
        className="r360-embedded-portal-frame smart-construction-portal-frame"
        src="/smart-construction/index.html"
        title="Smart Construction Portal"
        loading="eager"
        referrerPolicy="no-referrer"
        scrolling="no"
      />
    </div>
  )
}
