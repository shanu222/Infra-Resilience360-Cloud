import '../../material-hubs-portal/styles/portal.css'
import { PortalLanguageProvider } from '../../context/PortalLanguageContext'
import { MaterialHubsPortalApp } from '../../material-hubs-portal/MaterialHubsPortalApp'
import type { Language } from '../../types/sectionKeys'

export function MaterialHubsPage({
  language,
  isAdminMode,
  isEditMode,
}: {
  language: Language
  isAdminMode?: boolean
  isEditMode?: boolean
}) {
  return (
    <div
      className="material-hubs-page-host"
      data-admin-mode={isAdminMode ? 'true' : 'false'}
      data-edit-mode={isEditMode ? 'true' : 'false'}
      dir={language === 'ur' ? 'rtl' : 'ltr'}
    >
      <PortalLanguageProvider language={language}>
        <MaterialHubsPortalApp />
      </PortalLanguageProvider>
    </div>
  )
}
