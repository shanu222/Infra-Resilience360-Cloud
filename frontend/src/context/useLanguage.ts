import { useContext } from 'react'
import { LanguageContext } from './LanguageContext'
import type { AppLanguage, AppLocaleStrings } from '../i18n'

type LanguageContextValue = {
  language: AppLanguage
  setLanguage: (lang: AppLanguage) => void
  t: AppLocaleStrings
  isUrdu: boolean
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return ctx
}
