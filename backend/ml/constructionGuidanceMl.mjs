import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const bestPracticeAssetsDir = path.resolve(__dirname, '../../src/assets/best-practices')

const structureDefaults = {
  'Masonry House': {
    materials: [
      'PCC 1:2:4 for plinth and drainage apron',
      'Fe500 reinforcement for bands and ties',
      'Waterproof render with polymer additive',
      'Backflow valve and damp-proof course',
      'Anchor bolts for roof-to-wall ties',
      'Graded aggregate for drainage trench',
    ],
    baselineSafety: [
      'Use PPE and isolate inhabited zones during retrofit.',
      'Inspect foundation moisture and crack progression before each stage.',
      'Close each stage only after engineer/site supervisor sign-off.',
    ],
  },
  'RC Frame': {
    materials: [
      'M25 concrete with controlled water-cement ratio',
      'Fe500 bars with ductile detailing at joints',
      'Polymer-modified jacketing mortar',
      'Anti-corrosion treatment for exposed reinforcement',
      'Seismic anchors for non-structural elements',
      'Non-shrink grout for critical interfaces',
    ],
    baselineSafety: [
      'Provide temporary shoring and staged load transfer.',
      'Restrict demolition near critical columns/joints without approval.',
      'Document QA records for rebar, cover, and curing compliance.',
    ],
  },
  'School Block': {
    materials: [
      'Confinement band reinforcement package',
      'Column/beam jacketing materials',
      'Parapet and ceiling restraint hardware',
      'Emergency route signs and assembly markers',
      'Impact-safe glazing retrofit package',
      'Utility restraint and isolation kit',
    ],
    baselineSafety: [
      'Sequence high-risk works outside student hours.',
      'Maintain two clear evacuation paths throughout works.',
      'Run daily safety briefing for contractor and school teams.',
    ],
  },
  'Bridge Approach': {
    materials: [
      'Gabion/riprap toe protection modules',
      'Geotextile and geogrid reinforcement layers',
      'Subsurface perforated drainage lines',
      'Joint restrainers and bearing retrofit parts',
      'Slope-protection concrete blocks',
      'Approach slab transition strengthening package',
    ],
    baselineSafety: [
      'Implement traffic diversion and reflective safety control.',
      'Monitor settlement and scour indicators at each phase.',
      'Lock equipment access until embankment stability checks pass.',
    ],
  },
}

const provinceProfiles = {
  Punjab: { floodRisk: 0.72, monsoonIndex: 0.64, seismicZone: 2.3, soilInstability: 0.43, logistics: 0.28 },
  Sindh: { floodRisk: 0.9, monsoonIndex: 0.76, seismicZone: 2.1, soilInstability: 0.51, logistics: 0.34 },
  Balochistan: { floodRisk: 0.38, monsoonIndex: 0.33, seismicZone: 4.4, soilInstability: 0.56, logistics: 0.57 },
  KP: { floodRisk: 0.67, monsoonIndex: 0.58, seismicZone: 4.1, soilInstability: 0.54, logistics: 0.46 },
  GB: { floodRisk: 0.42, monsoonIndex: 0.4, seismicZone: 4.8, soilInstability: 0.62, logistics: 0.63 },
}

const cityProfiles = {
  Lahore: { province: 'Punjab', laborIndex: 0.78, materialIndex: 0.84, exposureBias: 0.52 },
  Rawalpindi: { province: 'Punjab', laborIndex: 0.74, materialIndex: 0.8, exposureBias: 0.57 },
  Faisalabad: { province: 'Punjab', laborIndex: 0.67, materialIndex: 0.74, exposureBias: 0.49 },
  Multan: { province: 'Punjab', laborIndex: 0.66, materialIndex: 0.73, exposureBias: 0.56 },
  Karachi: { province: 'Sindh', laborIndex: 0.86, materialIndex: 0.89, exposureBias: 0.74 },
  Hyderabad: { province: 'Sindh', laborIndex: 0.69, materialIndex: 0.75, exposureBias: 0.7 },
  Sukkur: { province: 'Sindh', laborIndex: 0.67, materialIndex: 0.72, exposureBias: 0.66 },
  Quetta: { province: 'Balochistan', laborIndex: 0.71, materialIndex: 0.76, exposureBias: 0.61 },
  Gwadar: { province: 'Balochistan', laborIndex: 0.74, materialIndex: 0.79, exposureBias: 0.58 },
  Turbat: { province: 'Balochistan', laborIndex: 0.63, materialIndex: 0.69, exposureBias: 0.54 },
  Peshawar: { province: 'KP', laborIndex: 0.72, materialIndex: 0.77, exposureBias: 0.67 },
  Mardan: { province: 'KP', laborIndex: 0.65, materialIndex: 0.71, exposureBias: 0.61 },
  Swat: { province: 'KP', laborIndex: 0.67, materialIndex: 0.73, exposureBias: 0.64 },
  Gilgit: { province: 'GB', laborIndex: 0.75, materialIndex: 0.8, exposureBias: 0.62 },
  Skardu: { province: 'GB', laborIndex: 0.78, materialIndex: 0.84, exposureBias: 0.66 },
  Hunza: { province: 'GB', laborIndex: 0.76, materialIndex: 0.82, exposureBias: 0.64 },
}

const templateBank = {
  flood: [
    {
      id: 'flood-plinth-envelope',
      title: 'Raise Plinth and Flood-Resistant Envelope',
      description: 'Raise usable floor/plinth above local design flood level and retrofit lower envelope with flood-compatible detailing.',
      keyChecks: ['Finished floor elevation benchmarked', 'Damp-proof course continuous', 'Flood-compatible lower finishes applied'],
      tags: ['masonry', 'rc', 'school'],
      category: 'structure-hardening',
      visualCandidates: ['raised-plinth-and-flood-resistant-envelope', 'flood-compatible-ground-storey-strategy'],
      baseScore: 0.95,
    },
    {
      id: 'flood-backflow-sump',
      title: 'Install Backflow Protection and Pump Sump',
      description: 'Prevent reverse sewer/water entry using backflow valves with sump-pump redundancy for high-intensity rain windows.',
      keyChecks: ['Backflow valves pressure-tested', 'Sump discharge path clear', 'Backup power for pump verified'],
      tags: ['masonry', 'rc', 'school'],
      category: 'drainage-control',
      visualCandidates: ['backflow-prevention-pump-sump', 'smart-pump-station-with-iot-gate-control'],
      baseScore: 0.91,
    },
    {
      id: 'flood-ground-storey',
      title: 'Adopt Flood-Compatible Ground Storey Strategy',
      description: 'Configure lower level as flood-tolerant service zone while relocating critical occupancy and systems to safer elevations.',
      keyChecks: ['Critical spaces moved above flood line', 'Ground storey finishes flood-tolerant', 'Vertical evacuation route marked'],
      tags: ['masonry', 'rc'],
      category: 'layout-adaptation',
      visualCandidates: ['flood-compatible-ground-storey-strategy', 'critical-utility-elevation-protocol'],
      baseScore: 0.89,
    },
    {
      id: 'flood-embankment-drainage',
      title: 'Strengthen Embankment Toe and Subsurface Drainage',
      description: 'Stabilize toe zones and install subsurface drainage to reduce erosion, undercutting, and approach instability.',
      keyChecks: ['Toe protection compacted and locked', 'Subsurface drainage gradient verified', 'Scour-prone edges treated'],
      tags: ['bridge'],
      category: 'slope-protection',
      visualCandidates: ['embankment-toe-protection-drainage', 'bridge-approach-seismic-joint-retrofit'],
      baseScore: 0.93,
    },
    {
      id: 'flood-utility-elevation',
      title: 'Elevate Utilities and Protect Lifelines',
      description: 'Lift electrical/control systems above flood depth and isolate critical services for fast recovery after inundation.',
      keyChecks: ['Panels and controls elevated', 'Utility isolation points accessible', 'Restart protocol tested'],
      tags: ['masonry', 'rc', 'school', 'bridge'],
      category: 'utility-resilience',
      visualCandidates: ['critical-utility-elevation-protocol', 'floating-emergency-utility-pods'],
      baseScore: 0.9,
    },
    {
      id: 'flood-retention-outflow',
      title: 'Add Perimeter Detention and Controlled Outflow',
      description: 'Use local retention pockets and controlled outflow to cut peak on-site flooding and reduce repeated damage cycles.',
      keyChecks: ['Retention pockets sized correctly', 'Outflow controls calibrated', 'Sediment maintenance schedule defined'],
      tags: ['masonry', 'rc', 'school'],
      category: 'water-management',
      visualCandidates: ['perimeter-detention-and-controlled-outflow', 'green-blue-sponge-streets'],
      baseScore: 0.88,
    },
    {
      id: 'flood-deployable-barrier',
      title: 'Pre-Position Deployable Flood Barriers',
      description: 'Pre-stage modular barriers for rapid sealing of vulnerable entrances and service corridors during flood alerts.',
      keyChecks: ['Barrier kit inventory complete', 'Deployment drill passed', 'Critical openings mapped and tagged'],
      tags: ['masonry', 'rc', 'school', 'bridge'],
      category: 'operational-readiness',
      visualCandidates: ['deployable-flood-barrier-gate-system', 'critical-utility-elevation-protocol'],
      baseScore: 0.86,
    },
    {
      id: 'flood-school-layout',
      title: 'Reconfigure School Compound for Flood Safety',
      description: 'Zone school blocks by elevation and preserve protected evacuation circulation to sustain operations post-event.',
      keyChecks: ['High-value functions at safer elevations', 'Evacuation path protected', 'WASH and power nodes flood-protected'],
      tags: ['school'],
      category: 'facility-continuity',
      visualCandidates: ['flood-resilient-school-compound-layout', 'raised-plinth-and-flood-resistant-envelope'],
      baseScore: 0.9,
    },
  ],
  earthquake: [
    {
      id: 'eq-confinement-bands',
      title: 'Install Masonry Confinement Bands and Ties',
      description: 'Add plinth/lintel/roof bands with corner ties to reduce brittle wall failures and out-of-plane collapse risk.',
      keyChecks: ['Band continuity verified', 'Corner ties anchored', 'Openings retrofitted with confinement'],
      tags: ['masonry', 'school'],
      category: 'wall-confinement',
      visualCandidates: ['masonry-confinement-bands-upgrade', 'roof-to-wall-anchorage-and-diaphragm-ties'],
      baseScore: 0.94,
    },
    {
      id: 'eq-soft-storey',
      title: 'Strengthen Soft Storey and Critical Bays',
      description: 'Apply targeted jacketing/shear enhancement at weak storeys and critical frame bays for drift control.',
      keyChecks: ['Weak bays identified and retrofitted', 'Column jacketing QA passed', 'Story drift checks documented'],
      tags: ['rc', 'school'],
      category: 'frame-strengthening',
      visualCandidates: ['soft-storey-rc-frame-strengthening', 'steel-damper-wall-retrofit'],
      baseScore: 0.95,
    },
    {
      id: 'eq-roof-wall-ties',
      title: 'Improve Roof-to-Wall Anchorage and Diaphragm Ties',
      description: 'Establish reliable load transfer from roof/diaphragm to vertical elements using robust anchorage details.',
      keyChecks: ['Anchorage continuity validated', 'Connector spacing compliant', 'Diaphragm-to-wall transfer verified'],
      tags: ['masonry', 'rc', 'school'],
      category: 'load-path',
      visualCandidates: ['roof-to-wall-anchorage-and-diaphragm-ties', 'masonry-infill-decoupling-retrofit'],
      baseScore: 0.9,
    },
    {
      id: 'eq-bridge-joints',
      title: 'Retrofit Bridge Approach Joints and Bearings',
      description: 'Upgrade restrainers and movement interfaces to prevent unseating and approach discontinuity during shaking.',
      keyChecks: ['Restrainer installation inspected', 'Bearing upgrade acceptance test complete', 'Movement envelope validated'],
      tags: ['bridge'],
      category: 'transport-resilience',
      visualCandidates: ['bridge-approach-seismic-joint-retrofit', 'lifeline-utility-seismic-restraint-package'],
      baseScore: 0.93,
    },
    {
      id: 'eq-nonstructural',
      title: 'Secure Non-Structural Life-Safety Components',
      description: 'Anchor parapets, ceilings, equipment, and service systems to reduce injury and downtime after moderate to strong events.',
      keyChecks: ['Parapets/ceilings restrained', 'Equipment anchorage pull-tested', 'Utility supports verified'],
      tags: ['masonry', 'rc', 'school'],
      category: 'life-safety',
      visualCandidates: ['non-structural-hazard-mitigation-package', 'lifeline-utility-seismic-restraint-package'],
      baseScore: 0.89,
    },
    {
      id: 'eq-performance-priority',
      title: 'Execute Performance-Based Retrofit Prioritization',
      description: 'Prioritize interventions by collapse prevention and functionality continuity to optimize phased budgets.',
      keyChecks: ['Critical risk zones scored', 'Phased retrofit package approved', 'Post-stage compliance tracked'],
      tags: ['masonry', 'rc', 'school', 'bridge'],
      category: 'planning-priority',
      visualCandidates: ['performance-based-retrofit-prioritization', 'rocking-wall-post-tensioned-core-system'],
      baseScore: 0.87,
    },
    {
      id: 'eq-energy-dissipation',
      title: 'Integrate Supplemental Seismic Energy Dissipation',
      description: 'Introduce dampers/BRB-type systems where feasible to improve drift and residual damage performance.',
      keyChecks: ['Dissipation elements installed at target bays', 'Connections inspected', 'Dynamic response verification completed'],
      tags: ['rc', 'school', 'bridge'],
      category: 'advanced-strengthening',
      visualCandidates: ['buckling-restrained-braced-frame-retrofit', 'steel-damper-wall-retrofit'],
      baseScore: 0.91,
    },
    {
      id: 'eq-low-damage-system',
      title: 'Adopt Low-Damage Self-Centering Elements',
      description: 'Where project context allows, use low-damage self-centering approaches to reduce residual drift and downtime.',
      keyChecks: ['Self-centering demand model validated', 'Element anchorage inspected', 'Post-event recentering criteria defined'],
      tags: ['rc', 'bridge'],
      category: 'advanced-strengthening',
      visualCandidates: ['rocking-wall-post-tensioned-core-system', 'base-isolation-for-critical-buildings'],
      baseScore: 0.88,
    },
  ],
}

const slugExtCache = new Map()
const imageDataUrlCache = new Map()

const safeProvince = (value = '') => (provinceProfiles[value] ? value : 'Punjab')
const safeHazard = (value = '') => (value === 'earthquake' ? 'earthquake' : 'flood')

const normalizeStructure = (raw = '') => {
  if (structureDefaults[raw]) return raw
  const value = raw.toLowerCase()
  if (/bridge|embank|approach/.test(value)) return 'Bridge Approach'
  if (/school|college|campus/.test(value)) return 'School Block'
  if (/rc|frame|concrete/.test(value)) return 'RC Frame'
  return 'Masonry House'
}

const inferCityProfile = (province, city) => {
  const direct = cityProfiles[city]
  if (direct) return direct

  const profiles = Object.values(cityProfiles).filter((profile) => profile.province === province)
  if (!profiles.length) return { province, laborIndex: 0.68, materialIndex: 0.74, exposureBias: 0.58 }

  const aggregate = profiles.reduce(
    (acc, profile) => ({
      laborIndex: acc.laborIndex + profile.laborIndex,
      materialIndex: acc.materialIndex + profile.materialIndex,
      exposureBias: acc.exposureBias + profile.exposureBias,
    }),
    { laborIndex: 0, materialIndex: 0, exposureBias: 0 },
  )

  return {
    province,
    laborIndex: aggregate.laborIndex / profiles.length,
    materialIndex: aggregate.materialIndex / profiles.length,
    exposureBias: aggregate.exposureBias / profiles.length,
  }
}

const stringHash = (value = '') => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

const featureVector = ({ province, cityProfile, hazard, structureType }) => {
  const provinceProfile = provinceProfiles[province]
  const hazardFactor = hazard === 'flood' ? provinceProfile.floodRisk * 0.7 + provinceProfile.monsoonIndex * 0.3 : provinceProfile.seismicZone / 5
  const structureFactor = structureType === 'Bridge Approach' ? 0.82 : structureType === 'School Block' ? 0.74 : structureType === 'RC Frame' ? 0.66 : 0.58

  return {
    hazardFactor,
    structureFactor,
    severity: Math.max(0.3, Math.min(0.96, hazardFactor * 0.62 + cityProfile.exposureBias * 0.24 + provinceProfile.soilInstability * 0.14)),
    logisticsPenalty: provinceProfile.logistics,
    laborMaterialStrength: (cityProfile.laborIndex + cityProfile.materialIndex) / 2,
  }
}

const scoreTemplate = ({ template, hazard, structureType, province, city, features }) => {
  const provinceProfile = provinceProfiles[province]
  const cityVariance = (stringHash(`${city}:${template.id}`) % 17) / 200
  const structureMatch = template.tags.includes(structureType === 'Masonry House' ? 'masonry' : structureType === 'RC Frame' ? 'rc' : structureType === 'School Block' ? 'school' : 'bridge') ? 0.12 : 0.02
  const hazardExposure = hazard === 'flood' ? provinceProfile.floodRisk * 0.11 + provinceProfile.monsoonIndex * 0.08 : (provinceProfile.seismicZone / 5) * 0.14 + provinceProfile.soilInstability * 0.06
  const complexityLift = features.severity * 0.1 + features.structureFactor * 0.06

  return template.baseScore + structureMatch + hazardExposure + complexityLift + cityVariance
}

const pickDiverseTopSteps = ({ hazard, structureType, province, city, features }) => {
  const candidates = (templateBank[hazard] ?? []).map((template) => ({
    ...template,
    score: scoreTemplate({ template, hazard, structureType, province, city, features }),
  }))

  candidates.sort((left, right) => right.score - left.score)

  const selected = []
  const usedCategories = new Set()

  for (const candidate of candidates) {
    if (selected.length >= 5) break
    if (!usedCategories.has(candidate.category) || selected.length < 3) {
      selected.push(candidate)
      usedCategories.add(candidate.category)
    }
  }

  for (const candidate of candidates) {
    if (selected.length >= 5) break
    if (!selected.find((item) => item.id === candidate.id)) selected.push(candidate)
  }

  return selected
}

const buildDeepStepDescription = ({ step, city, province, hazard, structureType, features }) => {
  const localSignal =
    hazard === 'flood'
      ? `Local Pakistan risk signal for ${city}, ${province} indicates flood-monsoon stress index ${Math.round(features.hazardFactor * 100)}/100.`
      : `Local Pakistan risk signal for ${city}, ${province} indicates seismic demand index ${Math.round(features.hazardFactor * 100)}/100.`

  const modelSignal =
    structureType === 'Bridge Approach'
      ? 'Approach continuity, scour resistance, and movement compatibility are treated as primary controls.'
      : structureType === 'School Block'
        ? 'Life-safety continuity, evacuation reliability, and non-structural restraint are treated as primary controls.'
        : structureType === 'RC Frame'
          ? 'Ductility, joint integrity, and drift control are treated as primary controls.'
          : 'Moisture resilience, confinement behavior, and progressive damage control are treated as primary controls.'

  return `${step.description} ${localSignal} ${modelSignal} Execute this stage with measurable QA acceptance before progressing.`
}

const buildSummary = ({ province, city, hazard, structureType, features, topStepTitle }) => {
  const severity = Math.round(features.severity * 100)
  const readiness = Math.round((1 - features.logisticsPenalty * 0.4) * 100)
  const localCostStrength = Math.round(features.laborMaterialStrength * 100)
  const focus = hazard === 'flood' ? 'flood and monsoon resilience' : 'seismic life-safety resilience'

  return `Pakistan-data model generated a location-specific ${focus} plan for ${structureType} in ${city}, ${province}. Local severity index is ${severity}/100, execution readiness index is ${readiness}/100, and labor-material strength index is ${localCostStrength}/100. Start with ${topStepTitle.toLowerCase()}, then execute subsequent stages in sequence with mandatory QA gates and field verification.`
}

const buildExtraSafety = ({ province, hazard }) => {
  const profile = provinceProfiles[province]

  if (hazard === 'flood') {
    return [
      `Schedule pre-monsoon readiness review ${profile.monsoonIndex > 0.65 ? '8' : '6'} weeks before peak season.`,
      'Inspect drainage, backflow, and utility isolation after each extreme rainfall event.',
      'Document moisture ingress findings and remediate before finishing works.',
    ]
  }

  return [
    `Use enhanced seismic inspection protocol for zone index ${profile.seismicZone.toFixed(1)} context.`,
    'Complete non-structural restraint checks before occupancy handover.',
    'Record post-event rapid screening criteria for re-entry decisions.',
  ]
}

const resolveAssetPath = async (slug) => {
  if (slugExtCache.has(slug)) return slugExtCache.get(slug)

  const jpgPath = path.join(bestPracticeAssetsDir, `${slug}.jpg`)
  try {
    await fs.access(jpgPath)
    slugExtCache.set(slug, jpgPath)
    return jpgPath
  } catch {
    const pngPath = path.join(bestPracticeAssetsDir, `${slug}.png`)
    try {
      await fs.access(pngPath)
      slugExtCache.set(slug, pngPath)
      return pngPath
    } catch {
      slugExtCache.set(slug, null)
      return null
    }
  }
}

const loadImageDataUrl = async (slug) => {
  if (!slug) return null
  if (imageDataUrlCache.has(slug)) return imageDataUrlCache.get(slug)

  const assetPath = await resolveAssetPath(slug)
  if (!assetPath) {
    imageDataUrlCache.set(slug, null)
    return null
  }

  const buffer = await fs.readFile(assetPath)
  const mime = assetPath.endsWith('.png') ? 'image/png' : 'image/jpeg'
  const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`
  imageDataUrlCache.set(slug, dataUrl)
  return dataUrl
}

const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const buildFallbackSvgDataUrl = ({ province, city, hazard, structureType, stepTitle }) => {
  const title = escapeXml(stepTitle)
  const subtitle = escapeXml(`${structureType} · ${city}, ${province} · ${hazard}`)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750"><rect width="1200" height="750" fill="#f2f7fc"/><rect x="42" y="36" width="1116" height="120" rx="14" fill="#ffffff"/><text x="74" y="92" font-size="42" font-family="Arial" font-weight="700" fill="#183a5b">${title}</text><text x="74" y="132" font-size="24" font-family="Arial" fill="#2d5f88">${subtitle}</text><rect x="70" y="200" width="1060" height="490" rx="14" fill="#dce9f5"/><text x="98" y="262" font-size="30" font-family="Arial" fill="#1d4567">Location-Aware Checks</text></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export const generateConstructionGuidanceMl = ({ province, city, hazard, structureType }) => {
  const normalizedProvince = safeProvince(province)
  const normalizedHazard = safeHazard(hazard)
  const normalizedStructure = normalizeStructure(structureType)
  const structureProfile = structureDefaults[normalizedStructure]
  const cityProfile = inferCityProfile(normalizedProvince, city)
  const features = featureVector({
    province: normalizedProvince,
    cityProfile,
    hazard: normalizedHazard,
    structureType: normalizedStructure,
  })

  const selectedTemplates = pickDiverseTopSteps({
    hazard: normalizedHazard,
    structureType: normalizedStructure,
    province: normalizedProvince,
    city,
    features,
  })

  const steps = selectedTemplates.map((template) => ({
    title: template.title,
    description: buildDeepStepDescription({
      step: template,
      city,
      province: normalizedProvince,
      hazard: normalizedHazard,
      structureType: normalizedStructure,
      features,
    }),
    keyChecks: template.keyChecks,
  }))

  return {
    summary: buildSummary({
      province: normalizedProvince,
      city,
      hazard: normalizedHazard,
      structureType: normalizedStructure,
      features,
      topStepTitle: steps[0]?.title ?? 'priority intervention',
    }),
    materials: structureProfile.materials,
    safety: [...structureProfile.baselineSafety, ...buildExtraSafety({ province: normalizedProvince, hazard: normalizedHazard })],
    steps,
  }
}

export const generateGuidanceStepImagesMl = async ({ province, city, hazard, structureType, steps }) => {
  const normalizedProvince = safeProvince(province)
  const normalizedHazard = safeHazard(hazard)
  const normalizedStructure = normalizeStructure(structureType)
  const cityProfile = inferCityProfile(normalizedProvince, city)
  const features = featureVector({
    province: normalizedProvince,
    cityProfile,
    hazard: normalizedHazard,
    structureType: normalizedStructure,
  })

  const selectedTemplates = pickDiverseTopSteps({
    hazard: normalizedHazard,
    structureType: normalizedStructure,
    province: normalizedProvince,
    city,
    features,
  })

  const requestedSteps = Array.isArray(steps) ? steps.slice(0, 5) : []

  const images = []
  for (let index = 0; index < requestedSteps.length; index += 1) {
    const requested = requestedSteps[index]
    const matchedTemplate =
      selectedTemplates.find((item) => item.title.toLowerCase() === String(requested?.title ?? '').toLowerCase()) ??
      selectedTemplates[index % Math.max(1, selectedTemplates.length)]

    const imageOptions = matchedTemplate?.visualCandidates ?? []
    const cityOffset = stringHash(`${city}:${normalizedProvince}:${normalizedStructure}:${index}`) % Math.max(1, imageOptions.length)
    const chosenSlug = imageOptions[cityOffset] ?? imageOptions[0]
    const realisticImageDataUrl = await loadImageDataUrl(chosenSlug)

    images.push({
      stepTitle: String(requested?.title ?? `Step ${index + 1}`),
      prompt: `Pakistan-data location-aware guidance visual for ${normalizedStructure} in ${city}, ${normalizedProvince} (${normalizedHazard})`,
      imageDataUrl:
        realisticImageDataUrl ??
        buildFallbackSvgDataUrl({
          province: normalizedProvince,
          city,
          hazard: normalizedHazard,
          structureType: normalizedStructure,
          stepTitle: String(requested?.title ?? `Step ${index + 1}`),
        }),
    })
  }

  return images
}
