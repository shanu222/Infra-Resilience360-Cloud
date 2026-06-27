import { useEffect } from 'react'
import { persistLanguage } from '../../i18n'
import type { Language } from '../../types/sectionKeys'
import SmartConstructionApp from '../../bridges/smartConstructionPortalApp.js'
import { usePortalHashRoute } from '../../hooks/usePortalHashRoute'

export function SmartConstructionPage({
  language,
  isAdminMode,
  isEditMode,
}: {
  language: Language
  isAdminMode?: boolean
  isEditMode?: boolean
}) {
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
      <SmartConstructionApp />
    </div>
  )
}
