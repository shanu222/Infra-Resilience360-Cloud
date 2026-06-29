import { Capacitor } from '@capacitor/core'
import { readPortalSubpathFromUrl, buildHrefWithAppSection, historyStateWithAppSection } from '../routing/appSectionRouter'
import type { SectionKey } from '../types/sectionKeys'

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
  if (!Capacitor.isNativePlatform()) return

  void import('@capacitor/app').then(({ App }) => {
    void App.addListener('backButton', () => {
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

      void App.exitApp()
    })
  })
}
