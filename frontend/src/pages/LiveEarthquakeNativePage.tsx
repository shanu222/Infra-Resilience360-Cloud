import { useEffect, useRef } from 'react'
import EarthquakeMonitorMarkup from '../modules/live-earthquake-alerts/EarthquakeMonitorMarkup'
import { loadLiveEarthquakeVendorScripts } from '../modules/live-earthquake-alerts/loadVendorScript'
import { initLiveEarthquakeMonitor } from '../modules/live-earthquake-alerts/liveEarthquakeMonitor.js'
import '../modules/live-earthquake/styles/live-earthquake-alerts.css'
import type { Language } from '../types/sectionKeys'

function ensureLeafletStylesheet() {
  const href = '/vendor/leaflet/leaflet.css'
  if (document.querySelector(`link[href="${href}"]`)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

export default function LiveEarthquakeNativePage({ language = 'en' }: { language?: Language }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      document.documentElement.dataset.r360Lang = language
      sessionStorage.setItem('r360-portal-lang', language)
      window.dispatchEvent(new CustomEvent('r360-eq-lang-change', { detail: { language } }))
    } catch {
      /* ignore */
    }
  }, [language])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let disposed = false
    let cleanupMonitor: (() => void) | undefined

    void (async () => {
      try {
        ensureLeafletStylesheet()
        await loadLiveEarthquakeVendorScripts()
        if (disposed) return
        cleanupMonitor = initLiveEarthquakeMonitor(root)
      } catch {}
    })()

    return () => {
      disposed = true
      cleanupMonitor?.()
    }
  }, [])

  return (
    <div ref={rootRef} className="live-earthquake-native eq-embed" data-lang={language}>
      <EarthquakeMonitorMarkup />
    </div>
  )
}
