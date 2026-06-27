import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  appLocale,
  persistLanguage,
  readStoredLanguage,
  type AppLanguage,
  type AppLocaleStrings,
} from '../i18n'

type LanguageContextValue = {
  language: AppLanguage
  setLanguage: (lang: AppLanguage) => void
  t: AppLocaleStrings
  isUrdu: boolean
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => readStoredLanguage())

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang)
    persistLanguage(lang)
  }, [])

  useEffect(() => {
    persistLanguage(language)
    document.documentElement.lang = language === 'ur' ? 'ur-PK' : 'en-GB'
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr'
  }, [language])

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: appLocale[language],
      isUrdu: language === 'ur',
    }),
    [language, setLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
