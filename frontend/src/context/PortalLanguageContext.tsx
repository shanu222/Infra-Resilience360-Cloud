import { createContext, useContext, type ReactNode } from 'react'
import type { AppLanguage } from '../i18n'

const PortalLanguageContext = createContext<AppLanguage>('en')

export function PortalLanguageProvider({
  language,
  children,
}: {
  language: AppLanguage
  children: ReactNode
}) {
  return <PortalLanguageContext.Provider value={language}>{children}</PortalLanguageContext.Provider>
}

export function usePortalLanguage(): AppLanguage {
  return useContext(PortalLanguageContext)
}
