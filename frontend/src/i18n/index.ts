import type { AppLanguage } from './appLocale'

export { appLocale, type AppLanguage, type AppLocaleStrings, type LocaleStringTree } from './appLocale'
export { retrofitPortalByLang } from './retrofitPortalLocale'
export { bestPracticeUr } from './bestPracticeUr'
export {
  materialHubLocale,
  type MaterialHubStrings,
  getMaterialHubStrings,
} from './materialHubLocale'
export {
  disasterDashboardLocale,
  type DisasterDashboardStrings,
  getDisasterDashboardStrings,
} from './disasterDashboardLocale'

export const LANGUAGE_STORAGE_KEY = 'r360-language'

export function readStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en'
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored === 'ur' || stored === 'en') return stored
  } catch {
    /* ignore */
  }
  return 'en'
}

export function persistLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    sessionStorage.setItem('r360-portal-lang', lang)
  } catch {
    /* ignore */
  }
}
