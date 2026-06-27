import { useEffect } from 'react'
import { persistLanguage } from '../../i18n'
import type { Language } from '../../types/sectionKeys'
import RetrofitCalculatorApp from '../../bridges/retrofitPortalApp.js'
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
      <RetrofitCalculatorApp />
    </div>
  )
}
