import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './context/LanguageContext.tsx'
import { API_BASE_URL } from './config/apiBase'

const SW_UPDATE_CHECK_INTERVAL_MS = 60 * 1000
const DEFAULT_R2_MEDIA_BASE_URL = 'https://pub-e38210c9c2ff4bf3a45338616cd43df2.r2.dev'
const MEDIA_BASE_URL = String(import.meta.env.VITE_MEDIA_BASE_URL ?? import.meta.env.VITE_PUBLIC_MEDIA_BASE_URL ?? '')
  .trim()
  .replace(/\/+$/, '') || DEFAULT_R2_MEDIA_BASE_URL

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
  if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
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

void setupServiceWorkerBootstrap()
ensureMediaPreconnect()
ensureMediaDnsPrefetch()

root.render(
  <LanguageProvider>
    <div className="app-container">
      <App />
    </div>
  </LanguageProvider>,
)
