import { localContentUrl } from './localContent'

export const BEST_PRACTICES_BASE = localContentUrl('best-practices', 'images')

export type BestPracticeHazard = 'flood' | 'earthquake'

export type BestPracticeImageConfig = {
  hazard: BestPracticeHazard
  id: string
  title: string
  folder: string
  imageUrl: string
  imageCandidates: string[]
}

function buildBestPracticeImageUrl(hazard: BestPracticeHazard, folder: string): string {
  void hazard
  return `${BEST_PRACTICES_BASE}/${folder}.jpg`
}

function slugifyTitle(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/\+/g, ' and ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildBestPracticeImageCandidates(hazard: BestPracticeHazard, folder: string, title: string): string[] {
  const folderCandidates = [folder, slugifyTitle(title)].filter((item, index, arr) => item && arr.indexOf(item) === index)
  const exts = ['jpg', 'jpeg', 'png', 'webp']
  const out: string[] = []
  for (const folderCandidate of folderCandidates) {
    for (const ext of exts) {
      out.push(`${BEST_PRACTICES_BASE}/${folderCandidate}.${ext}`)
    }
    for (const ext of exts) {
      out.push(`${BEST_PRACTICES_BASE}/${hazard}/${folderCandidate}/${folderCandidate}.${ext}`)
    }
    for (const ext of exts) {
      out.push(`${BEST_PRACTICES_BASE}/${hazard}/${folderCandidate}/image.${ext}`)
    }
  }
  return out
}

function bestPracticeImage(
  hazard: BestPracticeHazard,
  id: string,
  title: string,
  folder: string,
): BestPracticeImageConfig {
  return {
    hazard,
    id,
    title,
    folder,
    imageUrl: buildBestPracticeImageUrl(hazard, folder),
    imageCandidates: buildBestPracticeImageCandidates(hazard, folder, title),
  }
}

export const BEST_PRACTICES_IMAGE_CONFIG: BestPracticeImageConfig[] = [
  bestPracticeImage(
    'flood',
    'flood-raised-plinth',
    'Raised Plinth and Flood-Resistant Envelope',
    'raised-plinth-and-flood-resistant-envelope',
  ),
  bestPracticeImage(
    'flood',
    'flood-backflow-sump',
    'Backflow Prevention + Pump Sump',
    'backflow-prevention-pump-sump',
  ),
  bestPracticeImage(
    'flood',
    'flood-ground-store',
    'Flood-Compatible Ground Storey Strategy',
    'flood-compatible-ground-storey-strategy',
  ),
  bestPracticeImage(
    'flood',
    'flood-embankment-toe',
    'Embankment Toe Protection + Drainage',
    'embankment-toe-protection-drainage',
  ),
  bestPracticeImage(
    'flood',
    'flood-utility-elevation',
    'Critical Utility Elevation Protocol',
    'critical-utility-elevation-protocol',
  ),
  bestPracticeImage(
    'flood',
    'flood-perimeter-detention',
    'Perimeter Detention and Controlled Outflow',
    'perimeter-detention-and-controlled-outflow',
  ),
  bestPracticeImage(
    'flood',
    'flood-amphibious',
    'Amphibious Foundation Retrofit',
    'amphibious-foundation-retrofit',
  ),
  bestPracticeImage(
    'flood',
    'flood-deployable-barrier',
    'Deployable Flood Barrier Gate System',
    'deployable-flood-barrier-gate-system',
  ),
  bestPracticeImage(
    'flood',
    'flood-sponge-streets',
    'Green-Blue Sponge Streets',
    'green-blue-sponge-streets',
  ),
  bestPracticeImage(
    'flood',
    'flood-utility-pods',
    'Floating Emergency Utility Pods',
    'floating-emergency-utility-pods',
  ),
  bestPracticeImage(
    'flood',
    'flood-smart-pump',
    'Smart Pump Station with IoT Gate Control',
    'smart-pump-station-with-iot-gate-control',
  ),
  bestPracticeImage(
    'flood',
    'flood-school-layout',
    'Flood-Resilient School Compound Layout',
    'flood-resilient-school-compound-layout',
  ),
  bestPracticeImage(
    'earthquake',
    'eq-masonry-bands',
    'Masonry Confinement Bands Upgrade',
    'masonry-confinement-bands-upgrade',
  ),
  bestPracticeImage(
    'earthquake',
    'eq-soft-storey',
    'Soft-Storey RC Frame Strengthening',
    'soft-storey-rc-frame-strengthening',
  ),
  bestPracticeImage(
    'earthquake',
    'eq-roof-anchorage',
    'Roof-to-Wall Anchorage and Diaphragm Ties',
    'roof-to-wall-anchorage-and-diaphragm-ties',
  ),
  bestPracticeImage(
    'earthquake',
    'eq-bridge-joint',
    'Bridge Approach Seismic Joint Retrofit',
    'bridge-approach-seismic-joint-retrofit',
  ),
  bestPracticeImage(
    'earthquake',
    'eq-non-structural',
    'Non-Structural Hazard Mitigation Package',
    'non-structural-hazard-mitigation-package',
  ),
  bestPracticeImage(
    'earthquake',
    'eq-performance-based',
    'Performance-Based Retrofit Prioritization',
    'performance-based-retrofit-prioritization',
  ),
  bestPracticeImage(
    'earthquake',
    'eq-base-isolation',
    'Base Isolation for Critical Buildings',
    'base-isolation-for-critical-buildings',
  ),
  bestPracticeImage(
    'earthquake',
    'eq-brb',
    'Buckling-Restrained Braced Frame Retrofit',
    'buckling-restrained-braced-frame-retrofit',
  ),
  bestPracticeImage(
    'earthquake',
    'eq-damper-wall',
    'Steel Damper Wall Retrofit',
    'steel-damper-wall-retrofit',
  ),
  bestPracticeImage(
    'earthquake',
    'eq-rocking-core',
    'Rocking Wall + Post-Tensioned Core System',
    'rocking-wall-post-tensioned-core-system',
  ),
  bestPracticeImage(
    'earthquake',
    'eq-lifeline-restraint',
    'Lifeline Utility Seismic Restraint Package',
    'lifeline-utility-seismic-restraint-package',
  ),
  bestPracticeImage(
    'earthquake',
    'eq-infill-decoupling',
    'Masonry Infill Decoupling Retrofit',
    'masonry-infill-decoupling-retrofit',
  ),
]

export const BEST_PRACTICE_IMAGE_BY_ID: Record<string, BestPracticeImageConfig> = Object.fromEntries(
  BEST_PRACTICES_IMAGE_CONFIG.map((item) => [item.id, item]),
)
