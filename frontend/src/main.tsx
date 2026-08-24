import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './context/LanguageContext.tsx'
import { API_BASE_URL } from './config/apiBase'
import { mediaManager } from './services/mediaManager'
import { initAndroidBackButton } from './capacitor/androidBackButton'
import { LegalStandaloneApp } from './legal/LegalStandaloneApp'
import { isLegalPath } from './legal/legalPages'
import { isCapacitorNativeRuntime } from './utils/capacitorRuntime'

const SW_UPDATE_CHECK_INTERVAL_MS = 60 * 1000
const MEDIA_BASE_URL = mediaManager.getMediaBaseUrl()

if (typeof window !== 'undefined') {
  ;(window as Window & { __R360_API_BASE_URL?: string; __R360_MEDIA_BASE_URL?: string }).__R360_API_BASE_URL = API_BASE_URL
  if (MEDIA_BASE_URL) {
    ;(window as Window & { __R360_API_BASE_URL?: string; __R360_MEDIA_BASE_URL?: string }).__R360_MEDIA_BASE_URL =
      MEDIA_BASE_URL
  }
}

function ensureMediaPreconnect() {
  if (typeof document === 'undefined' || !MEDIA_BASE_URL) return
  try {
    const origin = new URL(MEDIA_BASE_URL).origin
    if (document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) return
    const preconnect = document.createElement('link')
    preconnect.rel = 'preconnect'
    preconnect.href = origin
    preconnect.crossOrigin = 'anonymous'
    document.head.appendChild(preconnect)
  } catch {
    /* ignore malformed media base URL */
  }
}

function ensureApiPreconnect() {
  if (typeof document === 'undefined' || !API_BASE_URL) return
  try {
    const origin = new URL(API_BASE_URL).origin
    if (document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) return
    const preconnect = document.createElement('link')
    preconnect.rel = 'preconnect'
    preconnect.href = origin
    preconnect.crossOrigin = 'anonymous'
    document.head.appendChild(preconnect)
    const dnsPrefetch = document.createElement('link')
    dnsPrefetch.rel = 'dns-prefetch'
    dnsPrefetch.href = origin
    document.head.appendChild(dnsPrefetch)
  } catch {
    /* ignore */
  }
}

function ensureMediaDnsPrefetch() {
  if (typeof document === 'undefined' || !MEDIA_BASE_URL) return
  try {
    const origin = new URL(MEDIA_BASE_URL).origin
    if (document.querySelector(`link[rel="dns-prefetch"][href="${origin}"]`)) return
    const dnsPrefetch = document.createElement('link')
    dnsPrefetch.rel = 'dns-prefetch'
    dnsPrefetch.href = origin
    document.head.appendChild(dnsPrefetch)
  } catch {
    /* ignore malformed media base URL */
  }
}

const root = createRoot(document.getElementById('root')!)

function setupFastSwUpdateChecks() {
  if (!('serviceWorker' in navigator)) {
    return
  }

  const runUpdateCheck = () => {
    void navigator.serviceWorker
      .getRegistration()
      .then((registration) => {
        if (!registration) return
        return registration.update()
      })
      .catch(() => {
        /* ignore transient update check failures */
      })
  }

  // Check shortly after bootstrap and then poll while app is active.
  window.setTimeout(runUpdateCheck, 2000)
  window.setInterval(runUpdateCheck, SW_UPDATE_CHECK_INTERVAL_MS)
  window.addEventListener('focus', runUpdateCheck)
  window.addEventListener('online', runUpdateCheck)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      runUpdateCheck()
    }
  })
}

async function setupServiceWorkerBootstrap() {
  if (!('serviceWorker' in navigator)) return

  // Local bootstrap should never be blocked by stale SW caches.
  if (import.meta.env.DEV) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    } catch {
      /* ignore cleanup failures */
    }
    return
  }

  const { registerSW } = await import('virtual:pwa-register')
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateSW(true)
    },
  })

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (sessionStorage.getItem('r360_sw_reloaded') === '1') {
      return
    }
    sessionStorage.setItem('r360_sw_reloaded', '1')
    window.location.reload()
  })

  setupFastSwUpdateChecks()
}

if (typeof document !== 'undefined' && isCapacitorNativeRuntime()) {
  document.documentElement.classList.add('capacitor-native')
}
ensureApiPreconnect()
ensureMediaPreconnect()
ensureMediaDnsPrefetch()

// Android hardware back — registered from App via context ref; bootstrap native listener once.
initAndroidBackButton(() => {
  const bridge = (window as Window & { __R360_ANDROID_BACK__?: () => import('./capacitor/androidBackButton').AndroidBackContext }).__R360_ANDROID_BACK__
  return bridge?.() ?? {
    activeSection: null,
    hasOpenOverlay: () => false,
    closeTopOverlay: () => {},
    navigateToSection: () => {},
  }
})

root.render(
  <LanguageProvider>
    <div className="app-container">
      {isLegalPath(window.location.pathname) ? <LegalStandaloneApp pathname={window.location.pathname} /> : <App />}
    </div>
  </LanguageProvider>,
)
