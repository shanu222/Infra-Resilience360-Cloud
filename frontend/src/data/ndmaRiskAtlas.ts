export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Very High'

export type DistrictRiskProfile = {
  province: 'Punjab' | 'Sindh' | 'Balochistan' | 'KP' | 'GB'
  district: string
  earthquake: RiskLevel
  flood: RiskLevel
  infraRisk: RiskLevel
  dominantStructure: string
  structureScores: {
    earthquake: number
    flood: number
  }
  resilienceActions: string[]
}

export const ndmaDistrictRiskProfiles: DistrictRiskProfile[] = [
  {
    province: 'Punjab',
    district: 'Rajanpur',
    earthquake: 'Medium',
    flood: 'Very High',
    infraRisk: 'High',
    dominantStructure: 'Adobe / Unreinforced Masonry',
    structureScores: { earthquake: 7.14, flood: 7.14 },
    resilienceActions: [
      'Elevate plinths by 2.4m in flood-prone union councils',
      'Avoid adobe for critical walls; use confined masonry with tie beams',
      'Install raised utility sockets and backflow-protected drainage',
    ],
  },
  {
    province: 'Punjab',
    district: 'Lahore',
    earthquake: 'Medium',
    flood: 'Medium',
    infraRisk: 'Medium',
    dominantStructure: 'Brick Masonry + RCC Mix',
    structureScores: { earthquake: 5.1, flood: 4.6 },
    resilienceActions: [
      'Strengthen parapets and non-structural anchorage',
      'Use flood-safe electrical routing in low-lying neighborhoods',
      'Adopt ductile detailing for school/hospital retrofits',
    ],
  },
  {
    province: 'Punjab',
    district: 'Multan',
    earthquake: 'Medium',
    flood: 'High',
    infraRisk: 'High',
    dominantStructure: 'Brick Masonry',
    structureScores: { earthquake: 5.8, flood: 6.9 },
    resilienceActions: [
      'Raise floor levels above local flood benchmark',
      'Use moisture-resistant plasters in base walls',
      'Add emergency drainage channels around compounds',
    ],
  },
  {
    province: 'Punjab',
    district: 'Rawalpindi',
    earthquake: 'High',
    flood: 'Medium',
    infraRisk: 'High',
    dominantStructure: 'RCC Frame + Masonry Infill',
    structureScores: { earthquake: 6.8, flood: 4.9 },
    resilienceActions: [
      'Retrofit soft-story buildings with shear walls',
      'Anchor rooftop tanks and solar systems',
      'Ensure evacuation stair core integrity',
    ],
  },
  {
    province: 'Sindh',
    district: 'Larkana',
    earthquake: 'Low',
    flood: 'Very High',
    infraRisk: 'High',
    dominantStructure: 'Adobe / Brick Hybrid',
    structureScores: { earthquake: 4.2, flood: 7.1 },
    resilienceActions: [
      'Elevate plinth and install perimeter drainage berm',
      'Switch to stabilized masonry for load-bearing walls',
      'Protect handpump and sanitation access from floodwater',
    ],
  },
  {
    province: 'Sindh',
    district: 'Thatta',
    earthquake: 'Low',
    flood: 'Very High',
    infraRisk: 'Very High',
    dominantStructure: 'Adobe / Coastal Masonry',
    structureScores: { earthquake: 4.6, flood: 7.3 },
    resilienceActions: [
      'Use elevated flood-resistant foundation and wind-tied roof',
      'Apply sulfate-resistant cement in saline conditions',
      'Add protected evacuation route to shelter points',
    ],
  },
  {
    province: 'Sindh',
    district: 'Karachi',
    earthquake: 'Medium',
    flood: 'High',
    infraRisk: 'High',
    dominantStructure: 'RCC Frame',
    structureScores: { earthquake: 5.5, flood: 6.3 },
    resilienceActions: [
      'Retrofit vulnerable school/hospital facilities',
      'Elevate critical electrical panels in flood basins',
      'Harden rooftop systems against storm wind uplift',
    ],
  },
  {
    province: 'Sindh',
    district: 'Sukkur',
    earthquake: 'Low',
    flood: 'High',
    infraRisk: 'High',
    dominantStructure: 'Brick Masonry',
    structureScores: { earthquake: 4.1, flood: 6.7 },
    resilienceActions: [
      'Improve plinth freeboard and water barrier layers',
      'Use tied lintel/roof bands for lateral stability',
      'Create emergency drainage and pump fallback',
    ],
  },
  {
    province: 'KP',
    district: 'Peshawar',
    earthquake: 'High',
    flood: 'High',
    infraRisk: 'High',
    dominantStructure: 'Masonry + RCC Mix',
    structureScores: { earthquake: 6.7, flood: 6.2 },
    resilienceActions: [
      'Prioritize seismic confinement in schools and clinics',
      'Elevate base utilities in flood-prone union councils',
      'Anchor non-structural systems and emergency egress routes',
    ],
  },
  {
    province: 'KP',
    district: 'Swat',
    earthquake: 'Very High',
    flood: 'High',
    infraRisk: 'Very High',
    dominantStructure: 'Stone Masonry',
    structureScores: { earthquake: 7.3, flood: 6.1 },
    resilienceActions: [
      'Use confined stone masonry with strong corner reinforcement',
      'Apply slope drainage and retaining support near structures',
      'Harden bridge approach and access corridors',
    ],
  },
  {
    province: 'KP',
    district: 'Chitral',
    earthquake: 'Very High',
    flood: 'Medium',
    infraRisk: 'High',
    dominantStructure: 'Stone / Timber Mixed',
    structureScores: { earthquake: 7.5, flood: 4.8 },
    resilienceActions: [
      'Install roof-to-wall anchorage and diaphragm ties',
      'Use flexible but tied timber detailing for lateral loads',
      'Protect lifeline infrastructure from slope instability',
    ],
  },
  {
    province: 'Balochistan',
    district: 'Quetta',
    earthquake: 'Very High',
    flood: 'Medium',
    infraRisk: 'High',
    dominantStructure: 'URM / Stone Masonry',
    structureScores: { earthquake: 7.2, flood: 4.7 },
    resilienceActions: [
      'Avoid URM in critical occupancy structures',
      'Use confined masonry or ductile RCC frame',
      'Anchor heavy roof elements and parapets',
    ],
  },
  {
    province: 'Balochistan',
    district: 'Gwadar',
    earthquake: 'High',
    flood: 'High',
    infraRisk: 'Very High',
    dominantStructure: 'Coastal RCC + Masonry',
    structureScores: { earthquake: 6.3, flood: 6.8 },
    resilienceActions: [
      'Apply coastal wind/flood hardening package',
      'Use corrosion-resistant reinforcement practices',
      'Elevate emergency communication/power modules',
    ],
  },
  {
    province: 'Balochistan',
    district: 'Khuzdar',
    earthquake: 'High',
    flood: 'Medium',
    infraRisk: 'High',
    dominantStructure: 'Masonry/Adobe Mix',
    structureScores: { earthquake: 6.6, flood: 5.2 },
    resilienceActions: [
      'Replace weak adobe walls in critical rooms',
      'Add seismic bands and tie-beam continuity',
      'Protect drainage outfall to reduce flash-flood impact',
    ],
  },
  {
    province: 'GB',
    district: 'Gilgit',
    earthquake: 'Very High',
    flood: 'Medium',
    infraRisk: 'High',
    dominantStructure: 'Stone Masonry + RCC',
    structureScores: { earthquake: 7.4, flood: 5.1 },
    resilienceActions: [
      'Seismic retrofit schools/clinics with ductile detailing',
      'Use retaining and slope drainage around settlements',
      'Secure critical supply routes and bridge approaches',
    ],
  },
  {
    province: 'GB',
    district: 'Skardu',
    earthquake: 'Very High',
    flood: 'Medium',
    infraRisk: 'High',
    dominantStructure: 'Stone / Masonry',
    structureScores: { earthquake: 7.6, flood: 5.3 },
    resilienceActions: [
      'Strengthen masonry with confinement and anchors',
      'Provide seasonal runoff channels and toe protection',
      'Harden lifeline and shelter structures before winter',
    ],
  },
]

export const listDistrictsByProvince = (province: string): string[] =>
  ndmaDistrictRiskProfiles
    .filter((item) => item.province === province)
    .map((item) => item.district)
    .sort((a, b) => a.localeCompare(b))

export const findDistrictRiskProfile = (province: string, district: string | null): DistrictRiskProfile | null => {
  if (!district) return null
  return (
    ndmaDistrictRiskProfiles.find(
      (item) => item.province === province && item.district.toLowerCase() === district.toLowerCase(),
    ) ?? null
  )
}

export const districtRiskLookupByName = (): Record<string, DistrictRiskProfile> => {
  const lookup: Record<string, DistrictRiskProfile> = {}
  for (const item of ndmaDistrictRiskProfiles) {
    lookup[item.district] = item
  }
  return lookup
}
