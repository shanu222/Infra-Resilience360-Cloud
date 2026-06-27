import { useLanguage } from '../context/useLanguage'
import type { AppLocaleStrings } from '../i18n'

/**
 * Returns the active language, setter, and localized string tree for the main shell.
 */
export function useTranslation(): {
  language: 'en' | 'ur'
  setLanguage: (lang: 'en' | 'ur') => void
  t: AppLocaleStrings
  isUrdu: boolean
} {
  return useLanguage()
}
