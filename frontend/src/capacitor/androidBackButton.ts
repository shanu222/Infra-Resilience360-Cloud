import { readPortalSubpathFromUrl, buildHrefWithAppSection, historyStateWithAppSection } from '../routing/appSectionRouter'
import type { SectionKey } from '../types/sectionKeys'

/**
 * Component-level Android back-button interceptor.
 * A mounted component (e.g. DisasterDetail) can register a handler that runs
 * BEFORE the global back-button logic. Return true to stop propagation.
 */
let _backInterceptor: (() => boolean) | null = null

export function setAndroidBackInterceptor(fn: (() => boolean) | null): void {
  _backInterceptor = fn
}

export type AndroidBackContext = {
  activeSection: SectionKey | null
  hasOpenOverlay: () => boolean
  closeTopOverlay: () => void
  navigateToSection: (section: SectionKey | null) => void
}

function tryPortalIframeBack(): boolean {
  const iframe = document.querySelector<HTMLIFrameElement>('.r360-embedded-portal-frame')
  if (!iframe?.contentWindow) return false
  try {
    const win = iframe.contentWindow
    if (win.history.length > 1) {
      win.history.back()
      return true
    }
  } catch {
    /* cross-origin */
  }
  return false
}

function stripPortalSubpath(currentHref: string, section: SectionKey | null): string | null {
  const subpath = readPortalSubpathFromUrl(currentHref)
  if (!subpath) return null
  return buildHrefWithAppSection(currentHref, section)
}

export function initAndroidBackButton(getContext: () => AndroidBackContext): void {
  const isNative = Boolean((globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.())
  if (!isNative) return

  const capacitorAppModule = '@capacitor/app'
  void import(/* @vite-ignore */ capacitorAppModule).then(({ App }) => {
    void App.addListener('backButton', () => {
      // Component-level interceptor takes priority (e.g. DisasterDetail in-portal back)
      if (_backInterceptor && _backInterceptor()) return

      const ctx = getContext()

      if (ctx.hasOpenOverlay()) {
        ctx.closeTopOverlay()
        return
      }

      if (tryPortalIframeBack()) {
        return
      }

      const portalRootHref = stripPortalSubpath(window.location.href, ctx.activeSection)
      const subpath = readPortalSubpathFromUrl()
      if (subpath && portalRootHref && portalRootHref !== window.location.href) {
        try {
          history.pushState(historyStateWithAppSection(history.state, ctx.activeSection), '', portalRootHref)
          window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }))
        } catch {
          window.location.assign(portalRootHref)
        }
        return
      }

      if (ctx.activeSection !== null) {
        ctx.navigateToSection(null)
        return
      }

      // Home is the application root — do not exit or minimize.
    })
  }).catch(() => {
    /* Capacitor App plugin unavailable in web builds */
  })
}
