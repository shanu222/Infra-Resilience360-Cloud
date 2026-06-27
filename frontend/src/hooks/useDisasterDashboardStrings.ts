import { useMemo } from 'react'
import { usePortalLanguage } from '../context/PortalLanguageContext'
import { getDisasterDashboardStrings } from '../i18n/disasterDashboardLocale'

export function useDisasterDashboardStrings() {
  const lang = usePortalLanguage()
  return useMemo(() => getDisasterDashboardStrings(lang), [lang])
}
