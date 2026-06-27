import { useEffect } from 'react'
import { persistLanguage } from '../../i18n'
import type { Language } from '../../types/sectionKeys'
import { usePortalHashRoute } from '../../hooks/usePortalHashRoute'

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
      <iframe
        className="r360-embedded-portal-frame retrofit-calculator-portal-frame"
        src="/retrofit-calculator/index.html"
        title="Retrofit Calculator Portal"
        loading="eager"
        referrerPolicy="no-referrer"
      />
    </div>
  )
}
