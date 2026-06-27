const structureCode = { 'Masonry House': 0, 'RC Frame': 1, 'School Block': 2, 'Bridge Approach': 3 }
const provinceCode = { Punjab: 0, Sindh: 1, Balochistan: 2, KP: 3, GB: 4 }

const provinceHazardFactor = {
  Punjab: 1.06,
  Sindh: 1.1,
  Balochistan: 1.14,
  KP: 1.16,
  GB: 1.2,
}

const structureBase = {
  'Masonry House': { baseRate: 520, baseDuration: 5 },
  'RC Frame': { baseRate: 640, baseDuration: 7 },
  'School Block': { baseRate: 720, baseDuration: 12 },
  'Bridge Approach': { baseRate: 960, baseDuration: 10 },
}

const deriveEquipmentIndex = ({ materialIndex = 1, logisticsIndex = 1 }) => {
  const derived = materialIndex * 0.4 + logisticsIndex * 0.6
  return Math.max(0.95, Math.min(1.35, Number(derived.toFixed(2))))
}

const cityProfiles = {
  Punjab: {
    Lahore: { laborDaily: 3200, materialIndex: 1.1, logisticsIndex: 1.02 },
    Rawalpindi: { laborDaily: 3050, materialIndex: 1.08, logisticsIndex: 1.03 },
    Faisalabad: { laborDaily: 2800, materialIndex: 1.03, logisticsIndex: 1.01 },
    Multan: { laborDaily: 2750, materialIndex: 1.02, logisticsIndex: 1.01 },
  },
  Sindh: {
    Karachi: { laborDaily: 3500, materialIndex: 1.16, logisticsIndex: 1.04 },
    Hyderabad: { laborDaily: 2900, materialIndex: 1.07, logisticsIndex: 1.03 },
    Sukkur: { laborDaily: 2850, materialIndex: 1.05, logisticsIndex: 1.04 },
  },
  Balochistan: {
    Quetta: { laborDaily: 3150, materialIndex: 1.12, logisticsIndex: 1.12 },
    Gwadar: { laborDaily: 3300, materialIndex: 1.17, logisticsIndex: 1.18 },
    Turbat: { laborDaily: 3000, materialIndex: 1.1, logisticsIndex: 1.15 },
  },
  KP: {
    Peshawar: { laborDaily: 3050, materialIndex: 1.09, logisticsIndex: 1.08 },
    Mardan: { laborDaily: 2850, materialIndex: 1.04, logisticsIndex: 1.06 },
    Swat: { laborDaily: 2950, materialIndex: 1.07, logisticsIndex: 1.11 },
  },
  GB: {
    Gilgit: { laborDaily: 3250, materialIndex: 1.15, logisticsIndex: 1.2 },
    Skardu: { laborDaily: 3350, materialIndex: 1.18, logisticsIndex: 1.23 },
    Hunza: { laborDaily: 3320, materialIndex: 1.17, logisticsIndex: 1.24 },
  },
}

const inferCityTier = (city = '') => {
  const value = city.trim().toLowerCase()
  if (!value) return 1
  if (/karachi|lahore|islamabad|rawalpindi|peshawar|quetta/.test(value)) return 2
  if (/gilgit|skardu|chitral|hunza/.test(value)) return 3
  return 1.5
}

const buildSyntheticHistoricalCases = () => {
  const rows = []
  const severityBands = [35, 55, 75]
  const areaBands = [22, 36, 48]
  const urgencyBands = [45, 63, 82]

  for (const [province, cities] of Object.entries(cityProfiles)) {
    for (const [city, cityRate] of Object.entries(cities)) {
      for (const [structureType, structure] of Object.entries(structureBase)) {
        for (let index = 0; index < severityBands.length; index += 1) {
          const severity = severityBands[index]
          const affectedArea = areaBands[index]
          const urgency = urgencyBands[index]
          const scope = severity >= 70 ? 'comprehensive' : severity >= 50 ? 'standard' : 'basic'
          const damage = severity >= 70 ? 'high' : severity >= 50 ? 'medium' : 'low'
          const laborFactor = cityRate.laborDaily / 2600
          const equipmentIndex = deriveEquipmentIndex(cityRate)
          const locationMultiplier = laborFactor * 0.38 + cityRate.materialIndex * 0.34 + equipmentIndex * 0.18 + cityRate.logisticsIndex * 0.1
          const scopeMultiplier = scope === 'comprehensive' ? 1.42 : scope === 'standard' ? 1.18 : 0.98
          const severityMultiplier = 0.86 + severity / 150
          const riskMultiplier = provinceHazardFactor[province] ?? 1

          const costPerSqft =
            structure.baseRate * locationMultiplier * scopeMultiplier * severityMultiplier * riskMultiplier
          const durationWeeks = Math.round(
            structure.baseDuration * (scope === 'comprehensive' ? 1.55 : scope === 'standard' ? 1.2 : 0.9) * (0.9 + urgency / 130),
          )

          rows.push({
            structureType,
            province,
            city,
            cityTier: inferCityTier(city),
            severity,
            affectedArea,
            urgency,
            area: structureType === 'School Block' ? 5200 : structureType === 'Bridge Approach' ? 2600 : structureType === 'RC Frame' ? 2200 : 1200,
            costPerSqft,
            durationWeeks,
            scope,
            damage,
          })
        }
      }
    }
  }
  return rows
}

const featureFor = (sample) => [
  structureCode[sample.structureType] ?? 0,
  provinceCode[sample.province] ?? 0,
  sample.cityTier,
  sample.severity,
  sample.affectedArea,
  sample.urgency,
  Math.log(Math.max(200, sample.area)),
]

const syntheticTrainingSet = buildSyntheticHistoricalCases()
let trainingSet = [...syntheticTrainingSet]
let featureMin = []
let featureMax = []

const rebuildTrainingStats = () => {
  if (trainingSet.length === 0) {
    trainingSet = [...syntheticTrainingSet]
  }

  const allFeatures = trainingSet.map(featureFor)
  featureMin = allFeatures[0].map((_, index) => Math.min(...allFeatures.map((row) => row[index])))
  featureMax = allFeatures[0].map((_, index) => Math.max(...allFeatures.map((row) => row[index])))
}

const mapUrgencyToScore = (urgencyLevel) => {
  if (urgencyLevel === 'critical') return 85
  if (urgencyLevel === 'priority') return 62
  return 38
}

const mapUserTrainingSample = (sample) => {
  const structureType = String(sample.structureType ?? 'Masonry House')
  const province = String(sample.province ?? 'Punjab')
  const city = String(sample.city ?? '')

  if (!structureBase[structureType]) return null

  const base = structureBase[structureType]
  const severity = Math.max(0, Math.min(100, Number(sample.severityScore) || 40))
  const affectedArea = Math.max(5, Math.min(100, Number(sample.affectedAreaPercent) || 25))
  const urgency = mapUrgencyToScore(String(sample.urgencyLevel ?? 'priority'))
  const area = Math.max(200, Math.min(200000, Number(sample.areaSqft) || 1200))
  const cityRate = cityProfiles[province]?.[city] ?? { laborDaily: 2600, materialIndex: 1, logisticsIndex: 1 }

  const laborDaily = Number(sample.laborDaily) || cityRate.laborDaily
  const materialIndex = Number(sample.materialIndex) || cityRate.materialIndex
  const logisticsIndex = Number(sample.logisticsIndex) || cityRate.logisticsIndex
  const equipmentIndex = Number(sample.equipmentIndex) || deriveEquipmentIndex({ materialIndex, logisticsIndex })

  const laborFactor = Math.max(0.85, Math.min(1.5, laborDaily / 2600))
  const materialFactor = Math.max(0.9, Math.min(1.4, materialIndex))
  const logisticsFactor = Math.max(0.9, Math.min(1.4, logisticsIndex))
  const equipmentFactor = Math.max(0.9, Math.min(1.4, equipmentIndex))
  const locationMultiplier = laborFactor * 0.38 + materialFactor * 0.34 + equipmentFactor * 0.18 + logisticsFactor * 0.1

  const scope = severity >= 70 ? 'comprehensive' : severity >= 50 ? 'standard' : 'basic'
  const damage = severity >= 70 ? 'high' : severity >= 50 ? 'medium' : 'low'
  const scopeMultiplier = scope === 'comprehensive' ? 1.42 : scope === 'standard' ? 1.18 : 0.98
  const severityMultiplier = 0.86 + severity / 150
  const riskMultiplier = provinceHazardFactor[province] ?? 1
  const costPerSqft = base.baseRate * locationMultiplier * scopeMultiplier * severityMultiplier * riskMultiplier
  const durationWeeks = Math.max(
    2,
    Math.round(base.baseDuration * (scope === 'comprehensive' ? 1.55 : scope === 'standard' ? 1.2 : 0.9) * (0.9 + urgency / 130)),
  )

  return {
    structureType,
    province,
    city,
    cityTier: inferCityTier(city),
    severity,
    affectedArea,
    urgency,
    area,
    costPerSqft,
    durationWeeks,
    scope,
    damage,
  }
}

export const retrainRetrofitMlModel = (samples = []) => {
  const userRows = samples.map(mapUserTrainingSample).filter(Boolean)
  trainingSet = [...syntheticTrainingSet, ...userRows]
  rebuildTrainingStats()

  return {
    message: 'ML retrofit model updated with training data.',
    syntheticRows: syntheticTrainingSet.length,
    userRows: userRows.length,
    totalRows: trainingSet.length,
    modelVersion: `R360-kNN-v2+u${userRows.length}`,
  }
}

rebuildTrainingStats()

const normalize = (vector) =>
  vector.map((value, index) => {
    const min = featureMin[index]
    const max = featureMax[index]
    if (max === min) return 0
    return (value - min) / (max - min)
  })

const distance = (left, right) => {
  let sum = 0
  for (let index = 0; index < left.length; index += 1) {
    const diff = left[index] - right[index]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

const weightedVote = (items, key) => {
  const tally = new Map()
  for (const item of items) {
    const label = item.sample[key]
    const score = (tally.get(label) ?? 0) + item.weight
    tally.set(label, score)
  }
  return [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
}

const weightedAverage = (items, key) => {
  let weightedSum = 0
  let totalWeight = 0
  for (const item of items) {
    weightedSum += item.sample[key] * item.weight
    totalWeight += item.weight
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0
}

const generateDetailedGuidance = ({ predictedScope, predictedDamage, defectProfile, province }) => {
  const actions = []

  if ((defectProfile.crack ?? 0) > 0 || predictedDamage === 'high') {
    actions.push({
      priority: 'P1',
      action: 'Stitch and inject major cracks with epoxy/grout before global strengthening.',
      rationale: 'Open structural cracks accelerate stiffness loss and collapse risk under seismic loading.',
      estimatedImpact: 'Reduces immediate failure risk by stabilizing primary load paths.',
    })
  }

  if ((defectProfile.corrosion ?? 0) > 0 || (defectProfile.spalling ?? 0) > 0) {
    actions.push({
      priority: 'P1',
      action: 'Remove delaminated concrete, passivate steel, and apply polymer-modified repair mortar.',
      rationale: 'Corrosion and spalling reduce section capacity and bond strength.',
      estimatedImpact: 'Improves durability and restores member capacity for retrofit overlays.',
    })
  }

  if ((defectProfile.moisture ?? 0) > 0 || province === 'Sindh') {
    actions.push({
      priority: 'P2',
      action: 'Install damp-proofing, drainage correction, and waterproof protective coatings.',
      rationale: 'Moisture ingress drives reinforcement corrosion and masonry deterioration.',
      estimatedImpact: 'Lowers long-term maintenance cost and avoids repeated patch failures.',
    })
  }

  if ((defectProfile.deformation ?? 0) > 0 || predictedScope === 'comprehensive') {
    actions.push({
      priority: 'P1',
      action: 'Add lateral-load system upgrades (jacketing/shear walls/bracing) with ductile detailing.',
      rationale: 'Visible deformation often indicates inadequate lateral resistance.',
      estimatedImpact: 'Substantial reduction in seismic drift and life-safety risk.',
    })
  }

  actions.push({
    priority: 'P3',
    action: 'Implement staged QA/QC with engineer sign-off after each intervention package.',
    rationale: 'Execution quality controls retrofit performance as much as design choice.',
    estimatedImpact: 'Improves expected performance reliability of retrofit investments.',
  })

  return actions.slice(0, 5)
}

const formatLabel = (value = '') =>
  String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()

const hasDefect = (defectProfile, key) => Number(defectProfile?.[key] ?? 0) > 0

const classifyDamage = ({ defectProfile, predictedDamage, severityScore, structureType }) => {
  const classes = []

  if (hasDefect(defectProfile, 'crack')) {
    if (hasDefect(defectProfile, 'deformation') || severityScore >= 70) {
      classes.push('Diagonal/shear cracking in load-bearing walls or frame infill')
    } else {
      classes.push('Flexural and shrinkage cracking in masonry/plaster zones')
    }
  }

  if (hasDefect(defectProfile, 'deformation')) {
    classes.push('Settlement-induced distortion and local out-of-plumb behavior')
  }

  if (hasDefect(defectProfile, 'corrosion') || hasDefect(defectProfile, 'spalling')) {
    classes.push('Section loss due to reinforcement corrosion and cover spalling')
  }

  if (hasDefect(defectProfile, 'moisture')) {
    classes.push('Moisture ingress and dampness-driven durability deterioration')
  }

  if (classes.length === 0) {
    classes.push(
      predictedDamage === 'high'
        ? `${structureType}: generalized structural distress requiring immediate stabilization`
        : `${structureType}: localized non-ductile damage requiring targeted rehabilitation`,
    )
  }

  return classes
}

const severityBand = ({ predictedDamage, severityScore, defectProfile }) => {
  const hasMajorDistortion = hasDefect(defectProfile, 'deformation') && hasDefect(defectProfile, 'crack')
  if (predictedDamage === 'high' || severityScore >= 80 || hasMajorDistortion) {
    return {
      level: 'Critical',
      rationale:
        'Load path integrity may be compromised. Temporary shoring and staged structural retrofit should begin before re-occupancy.',
    }
  }
  if (predictedDamage === 'medium' || severityScore >= 55) {
    return {
      level: 'High',
      rationale:
        'Damage is structurally relevant and likely to propagate under aftershocks, seasonal moisture, or live loads without intervention.',
    }
  }
  if (severityScore >= 35) {
    return {
      level: 'Moderate',
      rationale: 'Damage is currently localized but should be repaired to avoid future structural and durability escalation.',
    }
  }
  return {
    level: 'Low',
    rationale: 'Damage appears minor with preventive strengthening and monitoring recommended.',
  }
}

const buildProbableCauses = ({ defectProfile, structureType, province }) => {
  const causes = [
    `${structureType} likely has weak detailing continuity at wall-floor and wall-roof junctions.`,
    'Construction joints and workmanship variability are likely concentrating stress at openings and corners.',
  ]

  if (hasDefect(defectProfile, 'crack')) {
    causes.push('In-plane/out-of-plane seismic demand exceeded local masonry tensile capacity.')
  }
  if (hasDefect(defectProfile, 'deformation')) {
    causes.push('Differential foundation settlement or subgrade softening may be inducing tilt and stepped cracking.')
  }
  if (hasDefect(defectProfile, 'corrosion') || hasDefect(defectProfile, 'spalling')) {
    causes.push('Carbonation/chloride ingress likely initiated reinforcement corrosion and cover delamination.')
  }
  if (hasDefect(defectProfile, 'moisture') || province === 'Sindh') {
    causes.push('Persistent moisture and poor drainage are accelerating mortar/concrete deterioration.')
  }

  return causes.slice(0, 6)
}

const buildRiskAssessment = ({ severity, predictedDamage, defectProfile }) => {
  const lifeSafety =
    severity.level === 'Critical'
      ? 'High risk: possible local collapse mechanisms in cracked/distorted elements under additional loading.'
      : severity.level === 'High'
        ? 'Elevated risk: structural reliability is reduced, especially during seismic events and heavy rain periods.'
        : 'Manageable risk with timely repair and quality-controlled execution.'

  const serviceability =
    hasDefect(defectProfile, 'moisture') || hasDefect(defectProfile, 'corrosion')
      ? 'Serviceability impacted by leakage, falling cover/plaster, and rapid deterioration if untreated.'
      : 'Serviceability primarily affected by cracks and deformation-related usability issues.'

  const progressionRisk =
    predictedDamage === 'high'
      ? 'Rapid deterioration expected within months if retrofit is delayed.'
      : predictedDamage === 'medium'
        ? 'Progressive deterioration expected over seasonal cycles.'
        : 'Slow deterioration expected; preventive retrofit still recommended.'

  const occupancyRecommendation =
    severity.level === 'Critical'
      ? 'Restrict occupancy in affected bays/zones until temporary stabilization and engineer inspection are complete.'
      : severity.level === 'High'
        ? 'Conditional occupancy allowed with barricading of damaged zones and no overload/storage near distressed members.'
        : 'Occupancy can continue with periodic monitoring and planned repair schedule.'

  return {
    lifeSafety,
    serviceability,
    progressionRisk,
    occupancyRecommendation,
  }
}

const roundQty = (value, decimals = 1) => Number(value.toFixed(decimals))

const buildRetrofitMeasures = ({
  structureType,
  predictedScope,
  predictedDamage,
  defectProfile,
  affectedAreaSqft,
  crackLengthM,
  settlementLengthM,
  jacketAreaSqft,
}) => {
  const measures = []
  let step = 1

  if (hasDefect(defectProfile, 'crack') || predictedDamage !== 'low') {
    measures.push({
      step: step++,
      title: 'Crack Mapping, Stitching, and Epoxy/Grout Injection',
      objective: 'Restore continuity across structural cracks and arrest crack propagation.',
      method: 'Crack stitching with anchor bars at regular spacing followed by low-viscosity epoxy or cementitious grout injection.',
      applicability: 'For structural wall/beam cracks, stepped masonry cracks, and diagonal distress near openings.',
      materials: [
        {
          name: 'Epoxy injection resin',
          specification: '2-component low-viscosity structural grade',
          unit: 'kg',
          estimatedQty: roundQty(Math.max(6, crackLengthM * 0.22), 1),
        },
        {
          name: 'Stitching bars',
          specification: '8-10 mm deformed bars, 300-450 mm long',
          unit: 'nos',
          estimatedQty: Math.max(20, Math.round(crackLengthM / 0.35)),
        },
        {
          name: 'Non-shrink grout',
          specification: 'Flowable, repair grade',
          unit: 'bags (25 kg)',
          estimatedQty: Math.max(3, Math.round(crackLengthM / 6)),
        },
      ],
      tools: ['Angle grinder/chaser', 'Injection pump', 'Air blower', 'Crack width gauge', 'Hand drill', 'PPE kit'],
      execution: [
        'Map and tag active cracks with width and length; prioritize >0.3 mm structural cracks.',
        'Chase crack line, clean thoroughly, and install injection ports at 200-300 mm spacing.',
        'Drill and install stitching bars across crack plane with epoxy anchoring adhesive.',
        'Inject epoxy/grout from lowest port upward until refusal, then cap and finish surface.',
      ],
      qualityChecks: [
        'Verify crack fill continuity by refusal and rebound checks.',
        'Confirm stitch spacing and embedment depth against layout.',
      ],
    })
  }

  if (hasDefect(defectProfile, 'deformation') || predictedScope === 'comprehensive') {
    measures.push({
      step: step++,
      title: 'RC/Steel Jacketing of Critical Members',
      objective: 'Increase axial, shear, and confinement capacity of distressed structural members.',
      method: 'Prepare substrate, install shear connectors and rebar cage/mesh, then apply micro-concrete or shotcrete jacket.',
      applicability: 'For severely cracked piers/columns/walls, soft-storey behavior, or high seismic deficiency.',
      materials: [
        {
          name: 'Micro-concrete / non-shrink repair concrete',
          specification: '25-35 MPa with admixture for pumpability',
          unit: 'm3',
          estimatedQty: roundQty(Math.max(0.35, jacketAreaSqft * 0.022), 2),
        },
        {
          name: 'Reinforcement steel',
          specification: '10-16 mm bars + 8 mm ties',
          unit: 'kg',
          estimatedQty: Math.max(70, Math.round(jacketAreaSqft * 3.8)),
        },
        {
          name: 'Bonding agent',
          specification: 'Epoxy/polymer modified bonding slurry',
          unit: 'kg',
          estimatedQty: Math.max(8, Math.round(jacketAreaSqft * 0.12)),
        },
      ],
      tools: ['Rotary hammer drill', 'Rebar cutter-bender', 'Needle vibrator', 'Formwork set', 'Total station/level'],
      execution: [
        'Chip weak cover and roughen substrate to sound base; clean and pre-wet as required.',
        'Install dowels/connectors and retrofit cage with required clear cover and ties.',
        'Apply jacket material in lifts, compact properly, and maintain curing protocol.',
        'Reconnect diaphragms and edge restraints where required for global behavior.',
      ],
      qualityChecks: [
        'Rebar spacing, anchorage, and cover checks before concreting.',
        'Cube/slump checks and hammer/tap test for voids after curing.',
      ],
    })
  }

  if (hasDefect(defectProfile, 'deformation') && predictedDamage !== 'low') {
    measures.push({
      step: step++,
      title: 'Localized Underpinning and Foundation Stabilization',
      objective: 'Reduce differential settlement and restore foundation support continuity.',
      method: 'Segmental underpinning in short bays with controlled excavation and sequential load transfer.',
      applicability: 'For stepped cracks, wall tilt, and settlements near corners/plinth zone.',
      materials: [
        {
          name: 'Lean concrete for blinding',
          specification: '1:4:8 nominal mix',
          unit: 'm3',
          estimatedQty: roundQty(Math.max(0.4, settlementLengthM * 0.08), 2),
        },
        {
          name: 'RC underpin block concrete',
          specification: '20-25 MPa',
          unit: 'm3',
          estimatedQty: roundQty(Math.max(0.8, settlementLengthM * 0.16), 2),
        },
        {
          name: 'Reinforcement steel for underpin blocks',
          specification: '12 mm main bars with stirrups',
          unit: 'kg',
          estimatedQty: Math.max(95, Math.round(settlementLengthM * 22)),
        },
      ],
      tools: ['Trench supports', 'Hydraulic jacks', 'Concrete mixer', 'Laser level', 'Compaction rammer'],
      execution: [
        'Set out short underpinning segments (typically 1.0-1.2 m) and avoid adjacent simultaneous excavation.',
        'Excavate, blind, reinforce, cast underpin blocks, and cure before next segment.',
        'Pack dry-pack/non-shrink grout at interface for full bearing transfer.',
      ],
      qualityChecks: [
        'Monitor vertical movement with datum points during sequence.',
        'Verify no distress increase in adjacent wall panels.',
      ],
    })
  }

  if (hasDefect(defectProfile, 'corrosion') || hasDefect(defectProfile, 'spalling') || hasDefect(defectProfile, 'moisture')) {
    measures.push({
      step: step++,
      title: 'Durability Rehabilitation and Surface Reinforcement',
      objective: 'Restore durability envelope and improve in-plane integrity of wall surfaces.',
      method: 'Corrosion treatment, repair mortar patching, welded mesh/FRCM overlay, and waterproof coating.',
      applicability: 'For damp walls, delaminated cover, and repeated weather-driven deterioration.',
      materials: [
        {
          name: 'Corrosion inhibitor/passivator',
          specification: 'Zinc-rich or equivalent steel passivation system',
          unit: 'L',
          estimatedQty: roundQty(Math.max(4, affectedAreaSqft * 0.03), 1),
        },
        {
          name: 'Polymer-modified repair mortar',
          specification: 'High-bond structural repair grade',
          unit: 'bags (25 kg)',
          estimatedQty: Math.max(6, Math.round(affectedAreaSqft / 45)),
        },
        {
          name: 'Welded wire mesh / FRP fabric',
          specification: 'Corrosion resistant reinforcement layer',
          unit: 'sq ft',
          estimatedQty: Math.max(120, Math.round(affectedAreaSqft * 0.55)),
        },
      ],
      tools: ['Needle scaler', 'Wire brush', 'Trowel set', 'Rollers/sprayer', 'Moisture meter'],
      execution: [
        'Remove unsound material, clean exposed steel, and apply passivation coat.',
        'Rebuild profile using repair mortar in controlled layer thickness.',
        'Install mesh/fabric with anchorage at corners and around openings.',
        'Apply breathable waterproof coating and rectify external drainage pathways.',
      ],
      qualityChecks: ['Pull-off/bond checks on repaired patches.', 'Verify moisture readings trend down after drainage corrections.'],
    })
  }

  return measures.slice(0, predictedScope === 'basic' ? 3 : 4)
}

const buildSafetyPrecautions = ({ severity, predictedDamage }) => {
  const precautions = [
    'Install temporary shoring/props before chipping, cutting, or opening structural cracks in load-bearing zones.',
    'Barricade affected bays and control access during injection, jacketing, and underpinning activities.',
    'Use certified PPE: helmet, gloves, eye protection, respirator (during grinding/chipping), and fall protection where needed.',
    'Conduct daily toolbox talk and permit-to-work checks for excavation, hot work, and elevated tasks.',
    'Do not overload slabs/roofs with stacked materials during retrofit staging.',
    'Keep firefighting and first-aid kits at workface; maintain incident log and emergency contact board.',
  ]

  if (severity.level === 'Critical' || predictedDamage === 'high') {
    precautions.unshift('Implement restricted occupancy or temporary evacuation for zones with active structural distress.')
  }

  return precautions
}

const buildLocationCostEstimation = ({
  province,
  city,
  structureType,
  areaSqft,
  affectedAreaPercent,
  predictedScope,
  predictedCostPerSqft,
  locationMultiplier,
  laborDaily,
  materialIndex,
  logisticsIndex,
  equipmentIndex,
  crackLengthM,
  jacketAreaSqft,
  settlementLengthM,
  defectProfile,
}) => {
  const scopeFactor = predictedScope === 'comprehensive' ? 1.18 : predictedScope === 'standard' ? 1.06 : 0.94
  const total = Math.round(predictedCostPerSqft * areaSqft * scopeFactor)

  const ratio =
    predictedScope === 'comprehensive'
      ? { labor: 0.32, materials: 0.46, equipment: 0.12, contingency: 0.1 }
      : predictedScope === 'standard'
        ? { labor: 0.34, materials: 0.44, equipment: 0.1, contingency: 0.12 }
        : { labor: 0.36, materials: 0.42, equipment: 0.07, contingency: 0.15 }

  const labor = Math.round(total * ratio.labor)
  const materials = Math.round(total * ratio.materials)
  const equipment = Math.round(total * ratio.equipment)
  const contingency = total - labor - materials - equipment

  const lineItems = [
    {
      item: 'Crack stitching + epoxy injection',
      quantity: `${Math.max(8, Math.round(crackLengthM))} m`,
      unitRate: Math.round(1280 * locationMultiplier),
      cost: Math.round(Math.max(8, crackLengthM) * 1280 * locationMultiplier),
      note: 'Rate includes chasing, ports, anchor bars, and consumables.',
    },
    {
      item: 'RC/mesh jacketing and confinement',
      quantity: `${Math.max(100, Math.round(jacketAreaSqft))} sq ft`,
      unitRate: Math.round(940 * locationMultiplier),
      cost: Math.round(Math.max(100, jacketAreaSqft) * 940 * locationMultiplier),
      note: 'Includes substrate prep, reinforcement, and jacket application.',
    },
    {
      item: 'Foundation underpinning (localized)',
      quantity: `${Math.max(3, Math.round(settlementLengthM))} m`,
      unitRate: Math.round(4800 * locationMultiplier),
      cost: Math.round(Math.max(3, settlementLengthM) * 4800 * locationMultiplier),
      note: 'Applied when settlement/deformation indicators are present.',
    },
    {
      item: 'Waterproofing and durability treatment',
      quantity: `${Math.max(120, Math.round((areaSqft * affectedAreaPercent) / 100 * 0.55))} sq ft`,
      unitRate: Math.round(310 * locationMultiplier),
      cost: Math.round(Math.max(120, (areaSqft * affectedAreaPercent) / 100 * 0.55) * 310 * locationMultiplier),
      note: 'Includes damp-proof coating, crack seal, and drainage corrections.',
    },
  ]

  if (!hasDefect(defectProfile, 'deformation')) {
    lineItems[2].note = 'Provision kept as allowance; execute after level survey confirms settlement.'
    lineItems[2].cost = Math.round(lineItems[2].cost * 0.4)
  }

  return {
    currency: 'PKR',
    region: formatLabel(province),
    city: formatLabel(city || 'Local district'),
    structureType,
    assumptions: [
      `Labor baseline: PKR ${Math.round(laborDaily)} per mason/day (location factor ${locationMultiplier.toFixed(2)}x).`,
      `Material index: ${materialIndex.toFixed(2)}, logistics index: ${logisticsIndex.toFixed(2)}, equipment index: ${equipmentIndex.toFixed(2)}.`,
      'Rates assume standard market access and normal transport conditions for Pakistan urban/peri-urban works.',
    ],
    breakdown: {
      labor,
      materials,
      equipment,
      contingency,
      total,
      ratePerSqft: Math.round(total / Math.max(200, areaSqft)),
    },
    lineItems,
  }
}

const buildEngineeringGuidance = ({
  structureType,
  province,
  city,
  areaSqft,
  severityScore,
  affectedAreaPercent,
  predictedScope,
  predictedDamage,
  predictedCostPerSqft,
  locationMultiplier,
  laborDaily,
  materialIndex,
  logisticsIndex,
  equipmentIndex,
  defectProfile,
}) => {
  const damageClassification = classifyDamage({ defectProfile, predictedDamage, severityScore, structureType })
  const severity = severityBand({ predictedDamage, severityScore, defectProfile })
  const probableCauses = buildProbableCauses({ defectProfile, structureType, province })
  const riskAssessment = buildRiskAssessment({ severity, predictedDamage, defectProfile })

  const affectedAreaSqft = Math.max(120, (areaSqft * affectedAreaPercent) / 100)
  const crackLengthM = Math.max(8, affectedAreaSqft * (predictedDamage === 'high' ? 0.18 : 0.12))
  const settlementLengthM = Math.max(3, affectedAreaSqft * (hasDefect(defectProfile, 'deformation') ? 0.045 : 0.02))
  const jacketAreaSqft = Math.max(100, affectedAreaSqft * (predictedScope === 'comprehensive' ? 0.7 : 0.45))

  const retrofitMeasures = buildRetrofitMeasures({
    structureType,
    predictedScope,
    predictedDamage,
    defectProfile,
    affectedAreaSqft,
    crackLengthM,
    settlementLengthM,
    jacketAreaSqft,
  })

  const safetyPrecautions = buildSafetyPrecautions({ severity, predictedDamage })

  const locationBasedCostEstimation = buildLocationCostEstimation({
    province,
    city,
    structureType,
    areaSqft,
    affectedAreaPercent,
    predictedScope,
    predictedCostPerSqft,
    locationMultiplier,
    laborDaily,
    materialIndex,
    logisticsIndex,
    equipmentIndex,
    crackLengthM,
    jacketAreaSqft,
    settlementLengthM,
    defectProfile,
  })

  return {
    damageClassification: {
      primary: damageClassification[0],
      detected: damageClassification,
      basis: [
        `Defect profile: ${Object.entries(defectProfile)
          .filter(([, count]) => Number(count) > 0)
          .map(([key, count]) => `${formatLabel(key)}(${count})`)
          .join(', ') || 'visual distress indicators'}`,
        `Structure type: ${structureType}`,
      ],
    },
    severityLevel: {
      level: severity.level,
      score: Math.round(severityScore),
      rationale: severity.rationale,
    },
    probableCauses,
    riskAssessment,
    retrofitMeasures,
    safetyPrecautions,
    locationBasedCostEstimation,
    fieldImplementationNotes: [
      'Sequence works from stabilization to strengthening to durability protection; avoid cosmetic-first execution.',
      'All interventions should be validated by a licensed structural engineer before execution on occupied buildings.',
      'Recheck crack gauges and level marks after 2-4 weeks to confirm movement is arrested post-retrofit.',
    ],
  }
}

export const predictRetrofitMl = ({
  structureType,
  province,
  city,
  areaSqft,
  severityScore,
  affectedAreaPercent,
  urgencyLevel,
  laborDaily,
  materialIndex,
  equipmentIndex,
  logisticsIndex,
  defectProfile,
  imageQuality,
}) => {
  const urgencyScore = urgencyLevel === 'critical' ? 85 : urgencyLevel === 'priority' ? 62 : 38
  const sample = {
    structureType,
    province,
    cityTier: inferCityTier(city),
    severity: Math.max(0, Math.min(100, Number(severityScore) || 40)),
    affectedArea: Math.max(5, Math.min(100, Number(affectedAreaPercent) || 25)),
    urgency: urgencyScore,
    area: Math.max(200, Math.min(200000, Number(areaSqft) || 1200)),
  }

  const sampleVector = normalize(featureFor(sample))

  const neighbors = trainingSet
    .map((row) => {
      const vector = normalize(featureFor(row))
      const dist = distance(sampleVector, vector)
      return {
        sample: row,
        dist,
        weight: 1 / (dist + 0.03),
      }
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 5)

  const predictedCostPerSqft = weightedAverage(neighbors, 'costPerSqft')
  const predictedDuration = weightedAverage(neighbors, 'durationWeeks')
  const predictedScope = weightedVote(neighbors, 'scope')
  const predictedDamage = weightedVote(neighbors, 'damage')

  const meanDistance = neighbors.reduce((sum, row) => sum + row.dist, 0) / neighbors.length
  const qualityPenalty = imageQuality === 'poor' ? 0.12 : imageQuality === 'fair' ? 0.07 : imageQuality === 'excellent' ? -0.02 : 0
  const confidence = Math.max(0.45, Math.min(0.95, 1 - meanDistance / 1.8 - qualityPenalty))

  const laborFactor = laborDaily ? Math.max(0.85, Math.min(1.5, laborDaily / 2600)) : 1
  const materialFactor = materialIndex ? Math.max(0.9, Math.min(1.4, materialIndex)) : 1
  const logisticsFactor = logisticsIndex ? Math.max(0.9, Math.min(1.4, logisticsIndex)) : 1
  const equipmentFactor = equipmentIndex
    ? Math.max(0.9, Math.min(1.4, equipmentIndex))
    : deriveEquipmentIndex({ materialIndex: materialFactor, logisticsIndex: logisticsFactor })
  const locationMultiplier = laborFactor * 0.38 + materialFactor * 0.34 + equipmentFactor * 0.18 + logisticsFactor * 0.1

  const guidance = [
    predictedScope === 'comprehensive'
      ? 'Adopt full structural retrofit package with staged execution.'
      : predictedScope === 'standard'
        ? 'Use targeted structural upgrades for critical members.'
        : 'Use localized defect repair and preventive strengthening.',
    predictedDamage === 'high'
      ? 'Prioritize life-safety interventions before cosmetic repairs.'
      : predictedDamage === 'medium'
        ? 'Sequence repairs zone-wise to reduce operational disruption.'
        : 'Run preventive retrofit with waterproofing and joint strengthening.',
  ]

  const guidanceDetailed = generateDetailedGuidance({
    predictedScope,
    predictedDamage,
    defectProfile: defectProfile ?? {},
    province,
  })

  const cityRate = cityProfiles[province]?.[city] ?? { laborDaily: 2600, materialIndex: 1, logisticsIndex: 1 }
  const normalizedLaborDaily = laborDaily ? Math.max(1800, laborDaily) : cityRate.laborDaily
  const normalizedMaterialIndex = materialIndex ? Math.max(0.9, materialIndex) : cityRate.materialIndex
  const normalizedLogisticsIndex = logisticsIndex ? Math.max(0.9, logisticsIndex) : cityRate.logisticsIndex
  const normalizedEquipmentIndex = equipmentIndex
    ? Math.max(0.9, equipmentIndex)
    : deriveEquipmentIndex({
        materialIndex: normalizedMaterialIndex,
        logisticsIndex: normalizedLogisticsIndex,
      })
  const adjustedCostPerSqft = Math.max(250, Math.min(1800, predictedCostPerSqft * locationMultiplier))

  const engineeringGuidance = buildEngineeringGuidance({
    structureType,
    province,
    city,
    areaSqft: sample.area,
    severityScore: sample.severity,
    affectedAreaPercent: sample.affectedArea,
    predictedScope,
    predictedDamage,
    predictedCostPerSqft: adjustedCostPerSqft,
    locationMultiplier,
    laborDaily: normalizedLaborDaily,
    materialIndex: normalizedMaterialIndex,
    logisticsIndex: normalizedLogisticsIndex,
    equipmentIndex: normalizedEquipmentIndex,
    defectProfile: defectProfile ?? {},
  })

  return {
    model: 'R360-kNN-v2',
    predictedScope,
    predictedDamage,
    predictedCostPerSqft: adjustedCostPerSqft,
    predictedDurationWeeks: Math.max(2, Math.round(predictedDuration)),
    confidence,
    guidance,
    guidanceDetailed,
    engineeringGuidance,
    assumptions: [
      'Model is calibrated with Pakistan location rate profiles (labor, material, equipment, logistics) and synthetic historical retrofit cases.',
      'Guidance confidence depends on image quality and defect visibility.',
    ],
  }
}
