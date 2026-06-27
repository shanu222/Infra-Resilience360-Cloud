import { createContext, useContext, type ReactNode } from 'react'
import type { UniversalElementPayload } from '../types/universalElement'
import type { Language } from '../types/sectionKeys'

export type PageConfigLoadStatus = 'loading' | 'ready' | 'error'

export type PageConfigElementsContextValue = {
  pageSlug: string
  elements: Record<string, UniversalElementPayload>
  reload: () => Promise<void>
  language: Language
  /** Mongo `page_config` fetch state for this slug (no static copy). */
  loadStatus: PageConfigLoadStatus
  loadError: string | null
}

const PageConfigElementsContext = createContext<PageConfigElementsContextValue | null>(null)

export function PageConfigElementsProvider({
  value,
  children,
}: {
  value: PageConfigElementsContextValue
  children: ReactNode
}) {
  return <PageConfigElementsContext.Provider value={value}>{children}</PageConfigElementsContext.Provider>
}

export function usePageConfigElementsContext(): PageConfigElementsContextValue | null {
  return useContext(PageConfigElementsContext)
}
