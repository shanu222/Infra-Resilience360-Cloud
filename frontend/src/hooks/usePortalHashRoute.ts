import { useEffect } from 'react'
import { readPortalSubpathFromUrl } from '../routing/appSectionRouter'

/** Smart Construction routes that must not be opened under the retrofit-calculator portal. */
const SMART_CONSTRUCTION_SUBPATHS = new Set(['planner', 'results'])

type PortalSlug = 'retrofit-calculator' | 'smart-construction'

/**
 * Syncs `/view/{portal}/{subpath}` shell URLs to in-portal hash routes (`#/planner`, etc.).
 * Redirects known cross-portal mislinks (e.g. retrofit-calculator/planner → smart-construction/planner).
 */
export function usePortalHashRoute(portal: PortalSlug) {
  useEffect(() => {
    const subpath = readPortalSubpathFromUrl()
    if (!subpath) return

    const normalized = subpath.toLowerCase().split('/').filter(Boolean)[0] ?? subpath.toLowerCase()

    if (portal === 'retrofit-calculator' && SMART_CONSTRUCTION_SUBPATHS.has(normalized)) {
      const target = `/view/smart-construction/${subpath}${window.location.search}`
      window.location.replace(target)
      return
    }

    const routePath = `/${subpath.split('/').filter(Boolean).join('/')}`
    const desiredHash = `#${routePath}`
    if (window.location.hash === desiredHash) return

    window.location.replace(`${window.location.pathname}${window.location.search}${desiredHash}`)
  }, [portal])
}
