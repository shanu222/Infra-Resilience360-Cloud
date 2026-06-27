import { useMemo } from 'react'
import { usePortalLanguage } from '../context/PortalLanguageContext'
import { getMaterialHubStrings } from '../i18n/materialHubLocale'

export function useMaterialHubStrings() {
  const lang = usePortalLanguage()
  return useMemo(() => getMaterialHubStrings(lang), [lang])
}
