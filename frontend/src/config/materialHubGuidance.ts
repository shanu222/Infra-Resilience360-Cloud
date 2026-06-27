import { localContentUrl } from './localContent'

/**
 * Static Material Hub guidance gallery — direct local content URLs.
 */

export const MATERIAL_HUB_GUIDANCE_IMAGE_BASE = localContentUrl('material-hubs', 'images')

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
