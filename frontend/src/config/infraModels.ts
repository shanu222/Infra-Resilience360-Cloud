import { localContentUrl } from '../config/localContent'

export const INFRA_MODELS_IMAGE_BASE = `${localContentUrl('resilience-models', 'images')}/`
export const INFRA_MODELS_PDF_BASE = `${localContentUrl('resilience-models', 'pdfs')}/`
export const INFRA_MODELS_OFFICIAL_VIDEO_URL = localContentUrl('resilience-models', 'videos', 'official-video.mp4')

export type InfraModelCatalogEntry = {
  id: string
  title: string
  description: string
  features: string[]
  advantagesPakistan: string[]
  imageFileName: string
  pdfFileName: string
  imageUrl: string
  pdfUrl: string
  imageCandidates: string[]
  pdfCandidates: string[]
}

function buildMediaObjectUrl(base: string, fileName: string): string {
  return `${base}${encodeURIComponent(String(fileName ?? '').trim())}`
}

function uniq(values: string[]): string[] {
  const out: string[] = []
  for (const value of values) {
    const s = String(value ?? '').trim()
    if (!s || out.includes(s)) continue
    out.push(s)
  }
  return out
}

function modelEntry(args: {
  id: string,
  title: string,
  description: string,
  features: string[],
  advantagesPakistan: string[],
  imageFileName: string,
  pdfFileName: string,
  imageFileNameCandidates?: string[],
  pdfFileNameCandidates?: string[],
}): InfraModelCatalogEntry {
  const imageCandidates = uniq([args.imageFileName, ...(args.imageFileNameCandidates ?? [])]).map((name) =>
    buildMediaObjectUrl(INFRA_MODELS_IMAGE_BASE, name),
  )
  const pdfCandidates = uniq([args.pdfFileName, ...(args.pdfFileNameCandidates ?? [])]).map((name) =>
    buildMediaObjectUrl(INFRA_MODELS_PDF_BASE, name),
  )
  return {
    id: args.id,
    title: args.title,
    description: args.description,
    features: args.features,
    advantagesPakistan: args.advantagesPakistan,
    imageFileName: args.imageFileName,
    pdfFileName: args.pdfFileName,
    imageUrl: imageCandidates[0] ?? '',
    pdfUrl: pdfCandidates[0] ?? '',
    imageCandidates,
    pdfCandidates,
  }
}

export const INFRA_MODELS: InfraModelCatalogEntry[] = [
  modelEntry({
    id: 'bamboo-frame-wattle-daub',
    title: 'Bamboo Frame with Wattle and Daub',
    description: 'Traditional bamboo framing with wattle-daub infill for resilient, low-cost housing.',
    features: ['Lightweight structural response', 'Locally buildable construction method', 'Repair-friendly envelope'],
    advantagesPakistan: ['Suitable for rural adoption', 'Affordable upgrade path', 'Uses local skills and materials'],
    imageFileName: 'bamboo-frame-wattle-daub.jpeg',
    pdfFileName: 'bamboo-frame-wattle-daub.pdf',
  }),
  modelEntry({
    id: 'cement-bamboo-frame-structure',
    title: 'Cement Bamboo Frame Structure',
    description: 'Hybrid bamboo-cement framed structure for improved durability and weather resistance.',
    features: ['Hybrid frame system', 'Improved moisture resistance', 'Fast assembly workflow'],
    advantagesPakistan: ['Low-to-mid cost implementation', 'Good climate adaptability', 'Scalable for district housing programs'],
    imageFileName: 'cement-bamboo-frame-structure.jpeg',
    pdfFileName: 'cement-bamboo-frame-structure.pdf',
  }),
  modelEntry({
    id: 'confined-concrete-block-masonry-structure',
    title: 'Confined Concrete Block Masonry Structure',
    description: 'Concrete block walls with confinement members for improved seismic behavior.',
    features: ['Confined masonry detailing', 'Enhanced lateral stability', 'Durable wall system'],
    advantagesPakistan: ['Supports safer peri-urban construction', 'Good service life', 'Aligned with resilient retrofit goals'],
    imageFileName: 'confined-concrete-block-masonry-structure.jpeg',
    pdfFileName: 'confined-concrete-block-masonry-structure.pdf',
  }),
  modelEntry({
    id: 'earthbag-masonry-structure',
    title: 'Earthbag Masonry Structure',
    description: 'Compacted earthbag system for low-cost, thermally comfortable resilient structures.',
    features: ['Compacted earthen walling', 'Simple construction workflow', 'Thermally efficient massing'],
    advantagesPakistan: ['Cost-effective in resource constrained areas', 'Community-build friendly', 'Climate responsive performance'],
    imageFileName: 'earthbag-masonry-structure.jpeg',
    pdfFileName: 'earthbag-masonry-structure.pdf',
  }),
  modelEntry({
    id: 'elevated-flood-resilient-house-structure',
    title: 'Elevated Flood Resilient House Structure',
    description: 'Elevated housing model for flood-prone settlements with protected services.',
    features: ['Raised plinth strategy', 'Flood-adapted access paths', 'Utility protection layout'],
    advantagesPakistan: ['Reduces flood damage', 'Improves re-occupancy speed', 'Highly relevant for riverine districts'],
    imageFileName: 'elevated-flood-resilient-house-structure.jpeg',
    pdfFileName: 'elevated-flood-resilient-house-structure.pdf',
  }),
  modelEntry({
    id: 'floating-amphibious-structure',
    title: 'Floating Amphibious Structure',
    description: 'Amphibious housing concept designed to adapt to changing flood levels.',
    features: ['Buoyant adaptive base', 'Anchored guidance system', 'Flexible utility strategy'],
    advantagesPakistan: ['Useful in recurring inundation belts', 'Supports adaptive resilience', 'Reduces prolonged displacement'],
    imageFileName: 'floating-amphibious-structure.jpeg',
    pdfFileName: 'floating-amphibious-structure.pdf',
  }),
  modelEntry({
    id: 'fly-ash-masonry-structure',
    title: 'Fly Ash Masonry Structure',
    description: 'Fly-ash masonry alternative focused on efficient, lower-impact wall construction.',
    features: ['Consistent masonry units', 'Efficient material use', 'Standard construction compatibility'],
    advantagesPakistan: ['Supports cleaner construction practice', 'Potentially lower cost variability', 'Scalable implementation'],
    imageFileName: 'fly-ash-masonry-structure.jpeg',
    pdfFileName: 'fly-ash-masonry-structure.pdf',
  }),
  modelEntry({
    id: 'geogrid-reinforced-retaining-wall-structure',
    title: 'Geogrid Reinforced Retaining Wall Structure',
    description: 'Retaining wall system reinforced with geogrid for slope and embankment stability.',
    features: ['Reinforced soil layers', 'Improved slope performance', 'Drainage-integrated retaining approach'],
    advantagesPakistan: ['Relevant for hilly corridors', 'Improves transport resilience', 'Reduces failure risk'],
    imageFileName: 'geogrid-reinforced-retaining-wall-structure.jpeg',
    pdfFileName: 'geogrid-reinforced-retaining-wall-structure.pdf',
  }),
  modelEntry({
    id: 'interlocking-brick-masonry-structure',
    title: 'Interlocking Brick Masonry Structure',
    description: 'Interlocking brick masonry solution for faster assembly and improved block alignment.',
    features: ['Interlocking block system', 'Reduced mortar dependency', 'Fast construction sequence'],
    advantagesPakistan: ['Suitable for rapid reconstruction', 'Lower execution complexity', 'Consistent wall quality'],
    imageFileName: 'interlocking-brick-masonry-structure.jpeg',
    pdfFileName: 'interlocking-brick-masonry-structure.pdf',
  }),
  modelEntry({
    id: 'light-gauge-steel-house-structure',
    title: 'Light Gauge Steel House Structure',
    description: 'Light gauge steel framed housing for rapid and resilient deployment.',
    features: ['Factory-ready steel sections', 'Dry, fast assembly', 'Repeatable quality control'],
    advantagesPakistan: ['Supports fast post-disaster housing', 'Reduced onsite time', 'Consistent structural performance'],
    imageFileName: 'light-gauge-steel-house-structure.jpeg',
    pdfFileName: 'light-gauge-steel-house-structure.pdf',
  }),
  modelEntry({
    id: 'loh-kaat-timber-house-structure',
    title: 'Loh-Kaat Timber House Structure',
    description: 'Timber-focused vernacular structural system with improved resilient detailing.',
    features: ['Timber frame joints', 'Lower structural mass', 'Context-compatible envelope'],
    advantagesPakistan: ['Builds on local tradition', 'Potentially better seismic response', 'Suitable for incremental upgrades'],
    imageFileName: 'loh-kaat-timber-house-structure.jpeg',
    pdfFileName: 'loh-kaat-timber-house-structure.pdf',
  }),
  modelEntry({
    id: 'pre-fabricated-house-structure',
    title: 'Pre-Fabricated House Structure',
    description: 'Prefabricated modular housing model for rapid deployment and repeatable quality.',
    features: ['Modular prefabricated components', 'Reduced onsite complexity', 'Scalable layout strategy'],
    advantagesPakistan: ['Ideal for rapid rehousing', 'Improves delivery speed', 'Supports phased settlement rebuilding'],
    imageFileName: 'pre-fabricated-house-structure.jpeg',
    pdfFileName: 'pre-fabricated-house-structure.pdf',
  }),
  modelEntry({
    id: 'raised-plinth-flood-resilient-house',
    title: 'Raised Plinth Flood Resilient House',
    description: 'Raised plinth housing typology for frequent flood exposure zones.',
    features: ['Elevated foundation approach', 'Flood-safe ingress strategy', 'Protected critical services'],
    advantagesPakistan: ['Reduces recurring inundation losses', 'Relevant in flood plains', 'Improves household safety'],
    imageFileName: 'raised-plinth-flood-resilient-house.jpeg',
    pdfFileName: 'raised-plinth-flood-resilient-house.pdf',
  }),
  modelEntry({
    id: 'rat-trap-bond-masonry-structure',
    title: 'Rat Trap Bond Masonry Structure',
    description: 'Material-efficient rat-trap bond masonry model with cavity wall benefits.',
    features: ['Material-efficient walling', 'Reduced brick usage', 'Thermal cavity performance'],
    advantagesPakistan: ['Lower walling costs', 'Climate responsive envelope', 'Suitable for widespread adoption'],
    imageFileName: 'rat-trap-bond-masonry-structure.jpeg',
    pdfFileName: 'rat-trap-bond-masonry-structure.pdf',
  }),
  modelEntry({
    id: 'reinforced-adobe-brick-structure',
    title: 'Reinforced Adobe Brick Structure',
    description: 'Adobe brick system upgraded with reinforcement and confinement for resilience.',
    features: ['Reinforced earthen wall approach', 'Confinement detailing', 'Locally available materials'],
    advantagesPakistan: ['Affordable rural option', 'Safer traditional construction', 'Improved earthen durability'],
    imageFileName: 'reinforced-adobe-brick-structure.jpeg',
    pdfFileName: 'reinforced-adobe-brick-structure.pdf',
  }),
  modelEntry({
    id: 'timber-frame-lath-plaster',
    title: 'Timber Frame with Lath and Plaster',
    description: 'Light timber frame with lath-plaster infill for resilient lightweight construction.',
    features: ['Lightweight frame-infill system', 'Maintainable wall assembly', 'Repairable components'],
    advantagesPakistan: ['Lower seismic inertial demand', 'Familiar local methods', 'Supports resilient upgrades'],
    imageFileName: 'timber-frame-lath-plaster.jpeg',
    pdfFileName: 'timber-frame-lath-plaster.pdf',
  }),
]

export const INFRA_MODELS_BY_ID: Record<string, InfraModelCatalogEntry> = Object.fromEntries(
  INFRA_MODELS.map((model) => [model.id, model]),
)
