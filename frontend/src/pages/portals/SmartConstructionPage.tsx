import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { persistLanguage } from '../../i18n'
import type { Language } from '../../types/sectionKeys'
import { usePortalHashRoute } from '../../hooks/usePortalHashRoute'
import { useIframeAutoHeight } from '../../hooks/useIframeAutoHeight'
import { getModuleMediaUrl } from '../../utils/mediaUrl'

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
  const smartConstructionBackgroundUrl = getModuleMediaUrl('smart-construction', 'images', 'smart_construction_bg.png')

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
          '--smart-construction-bg-url': `url("${smartConstructionBackgroundUrl}")`,
        } as CSSProperties
      }
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
