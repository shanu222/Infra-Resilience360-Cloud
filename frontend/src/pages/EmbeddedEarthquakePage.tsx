import { useEffect } from 'react'
import LiveEarthquakeNativePage from './LiveEarthquakeNativePage'
import type { Language } from '../types/sectionKeys'

type EmbeddedEarthquakePageProps = {
  /** Accessible label for the embedded monitor region. */
  title: string
  language?: Language
}

export default function EmbeddedEarthquakePage({ title, language = 'en' }: EmbeddedEarthquakePageProps) {
  useEffect(() => {
    try {
      sessionStorage.setItem('r360-portal-lang', language)
      document.documentElement.dataset.r360Lang = language
    } catch {
      /* ignore */
    }
  }, [language])

  return (
    <div role="region" aria-label={title} data-lang={language}>
      <LiveEarthquakeNativePage language={language} />
    </div>
  )
}
