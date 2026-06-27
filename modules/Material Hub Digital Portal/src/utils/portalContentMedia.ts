/**
 * Material Hub portal: resolve legacy `./assets/...` paths to local-first canonical media.
 */

const MATERIAL_HUB_GUIDANCE_BASE = '/content/material-hubs/guidance/images'

const EXACT_ASSET_TO_LOCAL: Record<string, string> = {
  'assets/guidance/bamboo-installation-guide.png': `${MATERIAL_HUB_GUIDANCE_BASE}/bamboo-installation-guide.png`,
  'assets/guidance/cgi-sheet-roofing.png': `${MATERIAL_HUB_GUIDANCE_BASE}/cgi-sheet-roofing.png`,
  'assets/guidance/disaster-resilient-rope-tying-methods.png':
    `${MATERIAL_HUB_GUIDANCE_BASE}/disaster-resilient-rope-tying-methods.png`,
  'assets/guidance/durable-wooden-plank-assembly-guide.png':
    `${MATERIAL_HUB_GUIDANCE_BASE}/durable-wooden-plank-assembly-guide.png`,
  'assets/guidance/eps-panel-fitting-guide.png': `${MATERIAL_HUB_GUIDANCE_BASE}/eps-panel-fitting-guide.png`,
  'assets/guidance/pallet-handling-and-storage.png': `${MATERIAL_HUB_GUIDANCE_BASE}/pallet-handling-and-storage.png`,
  'assets/guidance/polythene-sheet-installation-guide.png':
    `${MATERIAL_HUB_GUIDANCE_BASE}/polythene-sheet-installation-guide.png`,
  'assets/guidance/steel-girder-placement-guide.png':
    `${MATERIAL_HUB_GUIDANCE_BASE}/steel-girder-placement-guide.png`,
  'assets/guidance/wooden-stick-chick-mat-application.png':
    `${MATERIAL_HUB_GUIDANCE_BASE}/wooden-stick-chick-mat-application.png`,
}

export const MEDIA_UNAVAILABLE_MESSAGE =
  'Content is temporarily unavailable. Please check your connection and try again.'

function normalizeAssetRef(ref: string): string {
  let s = String(ref ?? '').trim().replace(/\\/g, '/')
  if (s.startsWith('./')) s = s.slice(2)
  if (s.startsWith('/material-hubs/')) s = s.slice('/material-hubs/'.length)
  if (s.startsWith('/')) s = s.slice(1)
  return s
}

export function resolvePortalAssetUrl(localRef: string): string {
  const rel = normalizeAssetRef(localRef)
  const exact = EXACT_ASSET_TO_LOCAL[rel]
  if (exact) return exact
  if (rel.startsWith('content/material-hubs/guidance/images/')) return `/${rel}`
  if (rel.startsWith('/content/material-hubs/guidance/images/')) return rel

  // Same-origin fallback for other non-guidance assets.
  if (typeof window !== 'undefined') {
    const prefix =
      window.location.pathname.startsWith('/material-hubs') ? '/material-hubs' : ''
    try {
      return new URL(`${prefix}/${rel}`, window.location.origin).toString()
    } catch {
      return rel
    }
  }
  return rel
}

export function resolvePortalAssetCandidates(localRef: string): string[] {
  const primary = resolvePortalAssetUrl(localRef)
  const out = [primary]
  const rel = normalizeAssetRef(localRef)
  const exact = EXACT_ASSET_TO_LOCAL[rel]
  if (exact) {
    if (!out.includes(exact)) out.push(exact)
  }
  return out
}
