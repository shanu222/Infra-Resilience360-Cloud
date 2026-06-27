import {
  RESILIENCE360_LOCAL_BASE,
  localContentUrl,
} from './localContent'

export const RESILIENCE360_BASE = RESILIENCE360_LOCAL_BASE
/** Canonical Material Hubs portal prefix on local content. */
export const MATERIAL_HUBS_PORTAL_S3_PREFIX = localContentUrl('material-hubs', 'images')
export const MATERIAL_HUB_GUIDANCE_IMAGES_BASE = localContentUrl('material-hubs', 'images')

/** @deprecated Use MATERIAL_HUBS_PORTAL_S3_PREFIX — kept for imports that expect MATERIAL_HUBS_BASE. */
export const MATERIAL_HUBS_BASE = MATERIAL_HUBS_PORTAL_S3_PREFIX

export function s3MaterialHubPortalUrl(...pathSegments: string[]): string {
  const parts = pathSegments
    .flatMap((seg) => String(seg || '').split('/'))
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
  return `${MATERIAL_HUBS_PORTAL_S3_PREFIX}/${parts.join('/')}`
}

/** Legacy helper: accepts a single relative path string. */
export function s3MaterialHubUrl(relativePath: string): string {
  return s3MaterialHubPortalUrl(relativePath)
}

export function s3MaterialHubGuidanceUrl(_guidanceFolder: string, fileName: string): string {
  const normalizedFile = encodeURIComponent(String(fileName ?? '').trim().replace(/^\/+/, ''))
  if (!normalizedFile) return ''
  return `${MATERIAL_HUB_GUIDANCE_IMAGES_BASE}/${normalizedFile}`
}

export const MATERIAL_HUB_LOCAL_HUBS_BASE = localContentUrl('material-hubs', 'images')

export function s3MaterialHubAssetFolderUrl(_folderName: string, fileName: string): string {
  const normalizedFile = String(fileName ?? '').trim().replace(/^\/+/, '')
  if (!normalizedFile) return ''
  return `${MATERIAL_HUB_LOCAL_HUBS_BASE}/${encodeURIComponent(normalizedFile)}`
}

export type MaterialHubAsset = {
  id: string
  title: string
  description: string
  imageUrl: string
}

function materialAsset(
  id: string,
  title: string,
  description: string,
  folderName: string,
  fileName: string,
): MaterialHubAsset {
  return {
    id,
    title,
    description,
    imageUrl: s3MaterialHubAssetFolderUrl(folderName, fileName),
  }
}

export const MATERIAL_HUB_LOCATIONS: MaterialHubAsset[] = [
  materialAsset('gilgit', 'Gilgit Hub', 'Northern logistics and resilient materials distribution point.', 'gilgit', 'gilgit-hub.jpg'),
  materialAsset(
    'muzaffargarh',
    'Muzaffargarh Hub',
    'Central flood-response and reconstruction supply hub.',
    'muzaffargarh',
    'muzaffargarh-hub.jpg',
  ),
  materialAsset('sukkur', 'Sukkur Hub', 'Sindh-region emergency stock and dispatch center.', 'sukkur', 'sukkur-hub.jpg'),
]

export const MATERIAL_HUB_MATERIALS: MaterialHubAsset[] = [
  materialAsset('bamboo', 'Bamboo', 'Lightweight structural framing material.', 'bamboo', 'Bamboo.jpg'),
  materialAsset(
    'wooden-stick-chick-mat',
    'Wooden Stick Chick Mat',
    'Traditional paneling and envelope material.',
    'wooden-stick-chick-mat',
    'Wooden-Stick-Chick-Mat.jpg',
  ),
  materialAsset('polythene-sheet', 'Polythene Sheet', 'Waterproofing and temporary shelter layer.', 'polythene-sheet', 'Polythene-Sheet.jpg'),
  materialAsset('cotton-rope', 'Cotton Rope', 'Lashing and fixing support for rapid assembly.', 'cotton-rope', 'Cotton-Rope.jpg'),
  materialAsset('steel-girder', 'Steel Girder', 'Primary structural support member.', 'steel-girder', 'Steel-Girder.jpg'),
  materialAsset('cgi-sheet', 'CGI Sheet', 'Corrugated roofing and cladding element.', 'cgi-sheet', 'CGI-Sheet.jpg'),
  materialAsset('wooden-plank', 'Wooden Plank', 'Decking and framing component.', 'wooden-plank', 'Wooden-Plank.jpg'),
  materialAsset('eps-panel', 'EPS Panel', 'Insulated lightweight wall/roof panel.', 'eps-panel', 'EPS-Panel.jpg'),
  materialAsset('pallet', 'Pallet', 'Base platform for modular and raised layouts.', 'pallet', 'Pallet.jpg'),
]

function guidanceAsset(
  id: string,
  title: string,
  description: string,
  guidanceFolder: string,
  fileName: string,
): MaterialHubAsset {
  return {
    id,
    title,
    description,
    imageUrl: s3MaterialHubGuidanceUrl(guidanceFolder, fileName),
  }
}

export const MATERIAL_HUB_GUIDES: MaterialHubAsset[] = [
  guidanceAsset(
    'bamboo-installation-guide',
    'Bamboo Installation Guide',
    'Stepwise bamboo installation reference.',
    'bamboo-installation',
    'bamboo-installation-guide.png',
  ),
  guidanceAsset('cgi-sheet-roofing', 'CGI Sheet Roofing', 'CGI roofing installation guidance.', 'cgi-sheet-roofing', 'cgi-sheet-roofing.png'),
  guidanceAsset(
    'rope-tying-methods',
    'Disaster-Resilient Rope Tying Methods',
    'Rope tying patterns for resilient assembly.',
    'rope-tying',
    'disaster-resilient-rope-tying-methods.png',
  ),
  guidanceAsset(
    'wooden-plank-assembly',
    'Durable Wooden Plank Assembly Guide',
    'Assembly sequence for wooden plank systems.',
    'wooden-plank',
    'durable-wooden-plank-assembly-guide.png',
  ),
  guidanceAsset(
    'eps-panel-fitting-guide',
    'EPS Panel Fitting Guide',
    'Best-practice EPS panel fitting method.',
    'eps-panel',
    'eps-panel-fitting-guide.png',
  ),
  guidanceAsset(
    'pallet-handling-storage',
    'Pallet Handling and Storage',
    'Safe pallet handling and storage workflow.',
    'pallet',
    'pallet-handling-and-storage.png',
  ),
  guidanceAsset(
    'polythene-sheet-installation',
    'Polythene Sheet Installation Guide',
    'Installation details for sheet waterproofing.',
    'polythene-sheet',
    'polythene-sheet-installation-guide.png',
  ),
  guidanceAsset(
    'steel-girder-placement-guide',
    'Steel Girder Placement Guide',
    'Correct girder placement and support checks.',
    'steel-girder',
    'steel-girder-placement-guide.png',
  ),
  guidanceAsset(
    'chick-mat-application',
    'Wooden Stick Chick Mat Application',
    'Field application procedure for chick mat.',
    'chick-mat',
    'wooden-stick-chick-mat-application.png',
  ),
]

export const MATERIAL_HUB_BRAND_ASSETS = {
  backgroundImageUrl: localContentUrl('material-hubs', 'images', 'material_hub_bg.png'),
  mapUrl: localContentUrl('material-hubs', 'images', 'pakistan-map.png'),
  logoUrl: '/assets/branding/ndma-logo.png',
}
