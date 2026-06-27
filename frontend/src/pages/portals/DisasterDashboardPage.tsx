import '../../disaster-dashboard-portal/styles/portal.css'
import { PortalLanguageProvider } from '../../context/PortalLanguageContext'
import { DisasterDashboardPortalApp } from '../../disaster-dashboard-portal/DisasterDashboardPortalApp'
import type { Language } from '../../types/sectionKeys'

export function DisasterDashboardPage({
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
      className="disaster-dashboard-page-host"
      data-admin-mode={isAdminMode ? 'true' : 'false'}
      data-edit-mode={isEditMode ? 'true' : 'false'}
      dir={language === 'ur' ? 'rtl' : 'ltr'}
    >
      <PortalLanguageProvider language={language}>
        <DisasterDashboardPortalApp />
      </PortalLanguageProvider>
    </div>
  )
}
