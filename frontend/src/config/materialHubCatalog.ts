/**
 * Static Material Hub Digital Portal catalog — source of truth for UI data.
 * Media URLs point at resilience360 S3 (no CMS / Mongo / proxy).
 */
import {
  MATERIAL_HUBS_PORTAL_S3_PREFIX,
  s3MaterialHubAssetFolderUrl,
} from './materialHubs'
import { localContentUrl } from './localContent'
import { MATERIAL_HUB_GUIDANCE_ITEMS, materialHubGuidanceImageUrl } from './materialHubGuidance'
import {
  buildHubStockMaterials,
  MATERIAL_HUB_STOCK_BY_HUB,
} from './materialHubStockQuantities'

export type MaterialHub = {
  id: string
  name: string
  location: string
  district: string
  coordinates: [number, number]
  capacity: number
  status: 'ready' | 'moderate' | 'critical'
  stockPercentage: number
  damagePercentage: number
  imageUrl: string
}

export type Material = {
  id: string
  name: string
  unit: string
  opening: number
  received: number
  issued: number
  closing: number
  damaged: number
  percentageRemaining: number
}

export type HubInventory = {
  hubId: string
  hubName: string
  materials: Material[]
  lastUpdated: string
}

export type IssuanceRequest = {
  id: string
  requestNumber: string
  pdmaOffice: string
  district: string
  assessmentType: string
  requestedMaterials: { materialId: string; materialName: string; quantity: number }[]
  status: 'pending' | 'approved' | 'dispatched' | 'completed' | 'rejected'
  requestDate: string
  approvalDate?: string
  dispatchDate?: string
  urgency: 'high' | 'medium' | 'low'
}

export type DamageReport = {
  id: string
  hubId: string
  hubName: string
  materialId: string
  materialName: string
  damagedCount: number
  totalCount: number
  reason: string
  reportDate: string
  photos?: string[]
  financialLoss: number
  urgencyLevel: 'high' | 'medium' | 'low'
}

export type TrainingProgram = {
  id: string
  title: string
  description: string
  duration: string
  location: string
  startDate: string
  capacity: number
  enrolled: number
  topics: string[]
  imageUrl?: string
}

export type Partner = {
  id: string
  name: string
  type: 'CSR' | 'NGO' | 'Government' | 'International'
  contribution: string
  logoUrl?: string
}

export const MATERIAL_HUB_BRAND = {
  logoUrl: '/assets/branding/ndma-logo.png',
  backgroundImageUrl: localContentUrl('material-hubs', 'images', 'material_hub_bg.png'),
  mapImageUrl: localContentUrl('material-hubs', 'images', 'pakistan-map.png'),
  portalBase: MATERIAL_HUBS_PORTAL_S3_PREFIX,
}

export { MATERIAL_HUB_GUIDANCE_ITEMS }

export const mockHubs: MaterialHub[] = [
  {
    id: 'gb1',
    name: 'Gilgit Material Hub',
    location: 'Gilgit',
    district: 'Gilgit-Baltistan',
    coordinates: [35.9208, 74.308],
    capacity: 200,
    status: 'ready',
    stockPercentage: 100,
    damagePercentage: 0,
    imageUrl: s3MaterialHubAssetFolderUrl('gilgit', 'gilgit-hub.jpg'),
  },
  {
    id: 'mzg1',
    name: 'Muzaffargarh Material Hub',
    location: 'Muzaffargarh',
    district: 'Muzaffargarh',
    coordinates: [30.0704, 71.1932],
    capacity: 200,
    status: 'ready',
    stockPercentage: 100,
    damagePercentage: 0,
    imageUrl: s3MaterialHubAssetFolderUrl('muzaffargarh', 'muzaffargarh-hub.jpg'),
  },
  {
    id: 'sukkur1',
    name: 'Sukkur Material Hub',
    location: 'Sukkur',
    district: 'Sukkur',
    coordinates: [27.7052, 68.8574],
    capacity: 200,
    status: 'ready',
    stockPercentage: 100,
    damagePercentage: 0,
    imageUrl: s3MaterialHubAssetFolderUrl('sukkur', 'sukkur-hub.jpg'),
  },
  {
    id: 'jalozai1',
    name: 'Jalozai Material Hub',
    location: 'Jalozai',
    district: 'Nowshera',
    coordinates: [34.0311, 71.775],
    capacity: 200,
    status: 'ready',
    stockPercentage: 100,
    damagePercentage: 0,
    imageUrl: '',
  },
]

export const mockInventory: HubInventory[] = [
  {
    hubId: 'gb1',
    hubName: 'Gilgit Material Hub',
    lastUpdated: '2026-06-01',
    materials: buildHubStockMaterials('gb1', MATERIAL_HUB_STOCK_BY_HUB.gb1),
  },
  {
    hubId: 'mzg1',
    hubName: 'Muzaffargarh Material Hub',
    lastUpdated: '2026-06-01',
    materials: buildHubStockMaterials('mzg1', MATERIAL_HUB_STOCK_BY_HUB.mzg1),
  },
  {
    hubId: 'sukkur1',
    hubName: 'Sukkur Material Hub',
    lastUpdated: '2026-06-01',
    materials: buildHubStockMaterials('sukkur1', MATERIAL_HUB_STOCK_BY_HUB.sukkur1),
  },
  {
    hubId: 'jalozai1',
    hubName: 'Jalozai Material Hub',
    lastUpdated: '2026-06-01',
    materials: buildHubStockMaterials('jalozai1', MATERIAL_HUB_STOCK_BY_HUB.jalozai1),
  },
]

export const mockIssuanceRequests: IssuanceRequest[] = [
  {
    id: 'req1',
    requestNumber: 'PDMA/GB/2026/001',
    pdmaOffice: 'PDMA Gilgit-Baltistan',
    district: 'Ghizer',
    assessmentType: 'Flood Assessment',
    requestedMaterials: [
      { materialId: 'm1', materialName: 'Bamboo Poles', quantity: 500 },
      { materialId: 'm3', materialName: 'CGI Sheets', quantity: 300 },
    ],
    status: 'approved',
    requestDate: '2026-02-10',
    approvalDate: '2026-02-12',
    urgency: 'high',
  },
  {
    id: 'req2',
    requestNumber: 'PDMA/MZG/2026/015',
    pdmaOffice: 'PDMA Punjab',
    district: 'Muzaffargarh',
    assessmentType: 'Earthquake Relief',
    requestedMaterials: [
      { materialId: 'm2', materialName: 'EPS Panels', quantity: 400 },
      { materialId: 'm4', materialName: 'Chick Mats', quantity: 250 },
    ],
    status: 'pending',
    requestDate: '2026-02-20',
    urgency: 'medium',
  },
  {
    id: 'req3',
    requestNumber: 'PDMA/SKR/2026/008',
    pdmaOffice: 'PDMA Sindh',
    district: 'Sukkur',
    assessmentType: 'Monsoon Damage',
    requestedMaterials: [
      { materialId: 'm1', materialName: 'Bamboo Poles', quantity: 800 },
      { materialId: 'm5', materialName: 'Tarpaulin', quantity: 200 },
    ],
    status: 'dispatched',
    requestDate: '2026-02-05',
    approvalDate: '2026-02-08',
    dispatchDate: '2026-02-15',
    urgency: 'high',
  },
]

export const mockDamageReports: DamageReport[] = [
  {
    id: 'dmg1',
    hubId: 'mzg1',
    hubName: 'Muzaffargarh Material Hub',
    materialId: 'm1',
    materialName: 'Bamboo Poles',
    damagedCount: 450,
    totalCount: 5000,
    reason: 'Deterioration due to humidity and poor storage conditions',
    reportDate: '2026-02-15',
    financialLoss: 45000,
    urgencyLevel: 'high',
  },
  {
    id: 'dmg2',
    hubId: 'sukkur1',
    hubName: 'Sukkur Material Hub',
    materialId: 'm4',
    materialName: 'Chick Mats',
    damagedCount: 350,
    totalCount: 2000,
    reason: 'Water damage and pest infestation',
    reportDate: '2026-02-14',
    financialLoss: 28000,
    urgencyLevel: 'high',
  },
  {
    id: 'dmg3',
    hubId: 'sukkur1',
    hubName: 'Sukkur Material Hub',
    materialId: 'm1',
    materialName: 'Bamboo Poles',
    damagedCount: 600,
    totalCount: 4000,
    reason: 'Termite infestation and weathering',
    reportDate: '2026-02-13',
    financialLoss: 60000,
    urgencyLevel: 'high',
  },
]

export const mockTrainingPrograms: TrainingProgram[] = [
  {
    id: 'tr1',
    title: 'Bamboo Frame Installation Training',
    description: 'Comprehensive training on proper bamboo frame construction techniques for disaster-resilient housing.',
    duration: '3 days',
    location: 'Gilgit Material Hub',
    startDate: '2026-03-05',
    capacity: 30,
    enrolled: 18,
    topics: ['Bamboo selection', 'Frame assembly', 'Foundation preparation', 'Structural integrity'],
    imageUrl: materialHubGuidanceImageUrl('bamboo-installation-guide.png'),
  },
  {
    id: 'tr2',
    title: 'EPS Panel Fitting Workshop',
    description: 'Hands-on workshop for installing EPS panels in bamboo structures.',
    duration: '2 days',
    location: 'Muzaffargarh Material Hub',
    startDate: '2026-03-12',
    capacity: 25,
    enrolled: 22,
    topics: ['Panel sizing', 'Installation methods', 'Insulation techniques', 'Quality control'],
    imageUrl: materialHubGuidanceImageUrl('eps-panel-fitting-guide.png'),
  },
  {
    id: 'tr3',
    title: 'CGI Sheet Roofing Certification',
    description: 'Professional certification program for CGI sheet roofing installation.',
    duration: '4 days',
    location: 'Sukkur Material Hub',
    startDate: '2026-03-18',
    capacity: 20,
    enrolled: 15,
    topics: ['Roof design', 'Sheet installation', 'Weatherproofing', 'Safety measures'],
    imageUrl: materialHubGuidanceImageUrl('cgi-sheet-roofing.png'),
  },
  {
    id: 'tr4',
    title: 'Complete Disaster-Resilient Housing',
    description: 'Full course covering all aspects of building disaster-resilient structures.',
    duration: '7 days',
    location: 'All Hubs (Rotating)',
    startDate: '2026-04-01',
    capacity: 50,
    enrolled: 12,
    topics: ['Site assessment', 'Material selection', 'Construction techniques', 'Maintenance'],
    imageUrl: materialHubGuidanceImageUrl('durable-wooden-plank-assembly-guide.png'),
  },
]

export const mockPartners: Partner[] = [
  { id: 'p1', name: 'National Disaster Management Authority (NDMA)', type: 'Government', contribution: 'Primary coordination and funding' },
  { id: 'p2', name: 'Provincial Disaster Management Authorities', type: 'Government', contribution: 'Regional coordination and assessment' },
  { id: 'p3', name: 'World Bank', type: 'International', contribution: 'Financial support and technical expertise' },
  { id: 'p4', name: 'UNDP Pakistan', type: 'International', contribution: 'Capacity building and training programs' },
  { id: 'p5', name: 'Local CSR Partners', type: 'CSR', contribution: 'Material donations and logistics support' },
]

