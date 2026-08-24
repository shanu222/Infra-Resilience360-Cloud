import { localContentUrl } from './localContent'

/**
 * Static Material Hub guidance gallery — direct local content URLs.
 */

export const MATERIAL_HUB_GUIDANCE_IMAGE_BASE = localContentUrl('material-hubs', 'images')

/**
 * Full Guidance images folder in R2: content/material-hubs/Full Guidance images/
 * These are high-resolution field guidance images uploaded on 21 Jul 2026.
 */
export const MATERIAL_HUB_FULL_GUIDANCE_IMAGE_BASE = localContentUrl(
  'material-hubs',
  'Full Guidance images',
)

export function materialHubFullGuidanceImageUrl(fileName: string): string {
  const safe = String(fileName ?? '').trim().replace(/^\/+/, '')
  return safe ? `${MATERIAL_HUB_FULL_GUIDANCE_IMAGE_BASE}/${safe}` : ''
}

/**
 * Installation Videos folder in R2: content/material-hubs/Installation videos for material/
 */
export const MATERIAL_HUB_INSTALLATION_VIDEO_BASE = localContentUrl(
  'material-hubs',
  'Installation videos for material',
)

export function materialHubInstallationVideoUrl(fileName: string): string {
  const safe = String(fileName ?? '').trim().replace(/^\/+/, '')
  return safe ? `${MATERIAL_HUB_INSTALLATION_VIDEO_BASE}/${safe}` : ''
}

export type MaterialHubInstallationVideo = {
  id: string
  fileName: string
  title: string
  description: string
  /** Thumbnail image URL — falls back to the matched guidance image */
  posterUrl?: string
  url: string
}

/**
 * Known installation videos in R2 at
 * content/material-hubs/Installation videos for material/
 *
 * Note: several object keys literally contain a Unicode ellipsis (U+2026 `…`),
 * not ASCII dots — that is how they were uploaded to R2.
 */
const ELLIPSIS = '\u2026'

export const MATERIAL_HUB_INSTALLATION_VIDEO_CANDIDATES: Omit<MaterialHubInstallationVideo, 'url'>[] = [
  {
    id: 'bamboo-install',
    fileName: `Bamboo_disaster-resilient_house_${ELLIPSIS}_202607211139.mp4`,
    title: 'Bamboo Installation',
    description: 'Disaster-resilient bamboo house construction walkthrough.',
  },
  {
    id: 'cgi-sheet-roofing',
    fileName: `CGI_sheet_roofing_installation_d${ELLIPSIS}_202607211148.mp4`,
    title: 'CGI Sheet Roofing',
    description: 'CGI sheet roofing installation for disaster-resilient shelter.',
  },
  {
    id: 'eps-panel',
    fileName: `EPS_Panel_Construction_Disaster-${ELLIPSIS}_202607211316.mp4`,
    title: 'EPS Panel Construction',
    description: 'EPS panel fitting and construction for disaster-resilient builds.',
  },
  {
    id: 'pallets',
    fileName: 'Pallets.mp4',
    title: 'Pallet Handling',
    description: 'Safe handling, storage, and deployment of pallet platforms.',
  },
  {
    id: 'polythene-sheet',
    fileName: `Polythene_sheet_installation_dis${ELLIPSIS}_202607211216.mp4`,
    title: 'Polythene Sheet Installation',
    description: 'Waterproofing layer installation using polythene sheets.',
  },
  {
    id: 'rope',
    fileName: 'Rope.mp4',
    title: 'Rope Tying Methods',
    description: 'Rope lashing patterns for structural bracing and assembly.',
  },
  {
    id: 'steel-girder',
    fileName: `Steel_girder_construction_disast${ELLIPSIS}_202607211205.mp4`,
    title: 'Steel Girder Placement',
    description: 'Placement, support, and alignment checks for steel girders.',
  },
  {
    id: 'wooden-plank',
    fileName: `Wooden_plank_construction_disast${ELLIPSIS}_202607211228.mp4`,
    title: 'Wooden Plank Assembly',
    description: 'Assembly sequence and fastening for wooden plank systems.',
  },
  {
    id: 'wooden-stick-chick-mat',
    fileName: 'Wooden_stick_chick_mat_construction_202607211159.mp4',
    title: 'Wooden Stick Chick Mat',
    description: 'Field application and fixing of wooden stick chick mat panels.',
  },
]

export type MaterialHubFullGuidanceImage = {
  id: string
  fileName: string
  title: string
  description: string
  url: string
}

/**
 * Full Guidance images — high-resolution field guidance photos uploaded to R2
 * at content/material-hubs/Full Guidance images/  (confirmed 200 OK 21 Jul 2026).
 */
export const MATERIAL_HUB_FULL_GUIDANCE_IMAGES: MaterialHubFullGuidanceImage[] = [
  {
    id: 'full-bamboos',
    fileName: 'Bamboos.png',
    title: 'Bamboo Installation Guide',
    description: 'Full-resolution bamboo pole installation guidance for disaster-resilient frames.',
    url: materialHubFullGuidanceImageUrl('Bamboos.png'),
  },
  {
    id: 'full-cgi-sheets',
    fileName: 'CGI Sheets.png',
    title: 'CGI Sheet Roofing',
    description: 'Corrugated galvanized iron sheet roofing installation — full guidance.',
    url: materialHubFullGuidanceImageUrl('CGI Sheets.png'),
  },
  {
    id: 'full-eps-panels',
    fileName: 'EPS Panels.png',
    title: 'EPS Panel Fitting',
    description: 'EPS panel sizing, fitting, and insulation installation — full guidance.',
    url: materialHubFullGuidanceImageUrl('EPS Panels.png'),
  },
  {
    id: 'full-pallets',
    fileName: 'Pallets.png',
    title: 'Pallet Handling and Storage',
    description: 'Pallet deployment and stacking standards — full guidance.',
    url: materialHubFullGuidanceImageUrl('Pallets.png'),
  },
  {
    id: 'full-polythene-sheets',
    fileName: 'Polythene Sheets.png',
    title: 'Polythene Sheet Installation',
    description: 'Waterproofing layer installation using polythene sheets — full guidance.',
    url: materialHubFullGuidanceImageUrl('Polythene Sheets.png'),
  },
  {
    id: 'full-rope',
    fileName: 'Rope.png',
    title: 'Rope Tying Methods',
    description: 'Rope lashing patterns for structural bracing — full guidance.',
    url: materialHubFullGuidanceImageUrl('Rope.png'),
  },
  {
    id: 'full-steel-girder',
    fileName: 'Steel Girder.png',
    title: 'Steel Girder Placement',
    description: 'Placement and alignment checks for steel girders — full guidance.',
    url: materialHubFullGuidanceImageUrl('Steel Girder.png'),
  },
  {
    id: 'full-wooden-plank',
    fileName: 'Wooden Plank.png',
    title: 'Wooden Plank Assembly',
    description: 'Assembly sequence and fastening for wooden plank systems — full guidance.',
    url: materialHubFullGuidanceImageUrl('Wooden Plank.png'),
  },
  {
    id: 'full-wooden-sticks',
    fileName: 'Wooden Sticks.png',
    title: 'Wooden Stick Chick Mat',
    description: 'Application and fixing of wooden stick chick mat panels — full guidance.',
    url: materialHubFullGuidanceImageUrl('Wooden Sticks.png'),
  },
]

export function materialHubGuidanceImageUrl(fileName: string): string {
  const safe = String(fileName ?? '').trim().replace(/^\/+/, '')
  return safe ? `${MATERIAL_HUB_GUIDANCE_IMAGE_BASE}/${safe}` : ''
}

export type MaterialHubGuidanceMedia = {
  image: string
  preview: string
  thumbnail: string
  poster: string
  /** Set when a known video object exists in the guidance folder on S3. */
  video?: string
}

export type MaterialHubGuidanceItem = {
  id: string
  title: string
  description: string
  guidanceFolder: string
  primaryImageFile: string
  /** Optional video filename in the same S3 folder (e.g. video.mp4). */
  videoFile?: string
  media: MaterialHubGuidanceMedia
}

function buildGuidanceMedia(
  _folder: string,
  primaryImageFile: string,
  videoFile?: string,
): MaterialHubGuidanceMedia {
  const image = materialHubGuidanceImageUrl(primaryImageFile)
  const media: MaterialHubGuidanceMedia = {
    image,
    preview: image,
    thumbnail: image,
    poster: image,
  }
  if (videoFile?.trim()) {
    media.video = materialHubGuidanceImageUrl(videoFile.trim())
  }
  return media
}

function guidanceItem(
  id: string,
  title: string,
  description: string,
  guidanceFolder: string,
  primaryImageFile: string,
  videoFile?: string,
): MaterialHubGuidanceItem {
  return {
    id,
    title,
    description,
    guidanceFolder,
    primaryImageFile,
    videoFile,
    media: buildGuidanceMedia(guidanceFolder, primaryImageFile, videoFile),
  }
}

export const MATERIAL_HUB_GUIDANCE_ITEMS: MaterialHubGuidanceItem[] = [
  guidanceItem(
    'bamboo-installation',
    'Bamboo Installation Guide',
    'Stepwise bamboo installation and jointing for disaster-resilient frames.',
    'bamboo-installation',
    'bamboo-installation-guide.png',
  ),
  guidanceItem(
    'chick-mat',
    'Wooden Stick Chick Mat Application',
    'Field application and fixing of wooden stick chick mat panels.',
    'chick-mat',
    'wooden-stick-chick-mat-application.png',
  ),
  guidanceItem(
    'polythene-sheet',
    'Polythene Sheet Installation Guide',
    'Waterproofing layer installation and sealing best practices.',
    'polythene-sheet',
    'polythene-sheet-installation-guide.png',
  ),
  guidanceItem(
    'rope-tying',
    'Disaster-Resilient Rope Tying Methods',
    'Rope lashing patterns for structural bracing and assembly.',
    'rope-tying',
    'disaster-resilient-rope-tying-methods.png',
  ),
  guidanceItem(
    'steel-girder',
    'Steel Girder Placement Guide',
    'Placement, support, and alignment checks for steel girders.',
    'steel-girder',
    'steel-girder-placement-guide.png',
  ),
  guidanceItem(
    'cgi-sheet-roofing',
    'CGI Sheet Roofing',
    'Corrugated galvanized iron sheet roofing installation guidance.',
    'cgi-sheet-roofing',
    'cgi-sheet-roofing.png',
  ),
  guidanceItem(
    'wooden-plank',
    'Durable Wooden Plank Assembly Guide',
    'Assembly sequence and fastening for wooden plank systems.',
    'wooden-plank',
    'durable-wooden-plank-assembly-guide.png',
  ),
  guidanceItem(
    'eps-panel',
    'EPS Panel Fitting Guide',
    'EPS panel sizing, fitting, and insulation installation.',
    'eps-panel',
    'eps-panel-fitting-guide.png',
  ),
  guidanceItem(
    'pallet',
    'Pallet Handling and Storage',
    'Safe handling, storage, and deployment of pallet platforms.',
    'pallet',
    'pallet-handling-and-storage.png',
  ),
]

export const MATERIAL_HUB_GUIDANCE_COUNT = MATERIAL_HUB_GUIDANCE_ITEMS.length
