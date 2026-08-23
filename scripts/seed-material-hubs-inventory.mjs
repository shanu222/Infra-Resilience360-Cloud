/**
 * Seeds data/material-hubs.json from the embedded portal static catalog.
 * Run: node scripts/seed-material-hubs-inventory.mjs
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const outputPath = path.join(repoRoot, 'data', 'material-hubs.json')

const MATERIAL_NAMES = [
  'Bamboo for Joist',
  'Bamboo for Purlins & Walls',
  'Bamboo for Ring Beams',
  'Wooden Stick Chick Mat',
  'Polythene Sheet',
  'Cotton Rope',
  'Steel Girder',
  'CGI Sheets',
  'Wooden Planks 1x8x1',
  'Wooden Planks 2x8.33',
  'EPS Panels',
  'Pallets',
  'Wheelbarrows',
  'Shovels',
  'Pickaxes',
]

const MATERIAL_UNITS = {
  'Bamboo for Joist': 'units',
  'Bamboo for Purlins & Walls': 'units',
  'Bamboo for Ring Beams': 'units',
  'Wooden Stick Chick Mat': 'mats',
  'Polythene Sheet': 'sheets',
  'Cotton Rope': 'Kg',
  'Steel Girder': 'units',
  'CGI Sheets': 'sheets',
  'Wooden Planks 1x8x1': 'planks',
  'Wooden Planks 2x8.33': 'planks',
  'EPS Panels': 'panels',
  Pallets: 'units',
  Wheelbarrows: 'units',
  Shovels: 'units',
  Pickaxes: 'units',
}

const HUBS = [
  {
    id: 'gb1',
    name: 'Gilgit Material Hub',
    location: 'Gilgit',
    district: 'Gilgit-Baltistan',
    latitude: 35.9208,
    longitude: 74.308,
    capacity: 200,
    status: 'ready',
    stock_percentage: 100,
    damage_percentage: 0,
  },
  {
    id: 'mzg1',
    name: 'Muzaffargarh Material Hub',
    location: 'Muzaffargarh',
    district: 'Muzaffargarh',
    latitude: 30.0704,
    longitude: 71.1932,
    capacity: 200,
    status: 'ready',
    stock_percentage: 100,
    damage_percentage: 0,
  },
  {
    id: 'sukkur1',
    name: 'Sukkur Material Hub',
    location: 'Sukkur',
    district: 'Sukkur',
    latitude: 27.7052,
    longitude: 68.8574,
    capacity: 200,
    status: 'ready',
    stock_percentage: 100,
    damage_percentage: 0,
  },
  {
    id: 'jalozai1',
    name: 'Jalozai Material Hub',
    location: 'Jalozai',
    district: 'Nowshera',
    latitude: 34.0311,
    longitude: 71.775,
    capacity: 200,
    status: 'ready',
    stock_percentage: 100,
    damage_percentage: 0,
  },
]

const STOCK_BY_HUB = {
  gb1: [1080, 2540, 1070, 1750, 141, 13, 35, 400, 171, 168, 345, 200, 0, 0, 0],
  mzg1: [1070, 2530, 1070, 870, 130, 14, 30, 200, 170, 170, 330, 200, 0, 0, 0],
  sukkur1: [1060, 2530, 1060, 860, 130, 13, 35, 0, 160, 160, 330, 200, 0, 0, 0],
  jalozai1: [1227, 2914, 1227, 7360, 154, 16, 39, 230, 192, 192, 39, 300, 50, 100, 100],
}

const nowIso = new Date().toISOString()

const hubs = HUBS.map((hub) => ({
  ...hub,
  created_at: nowIso,
  updated_at: nowIso,
}))

const entries = []
for (const hub of HUBS) {
  const quantities = STOCK_BY_HUB[hub.id] ?? []
  MATERIAL_NAMES.forEach((name, index) => {
    const closing = quantities[index] ?? 0
    entries.push({
      id: `${hub.id}-m${index + 1}`,
      hub_id: hub.id,
      name,
      unit: MATERIAL_UNITS[name] ?? 'units',
      opening: closing,
      received: 0,
      issued: 0,
      damaged: 0,
      closing,
      percentage_remaining: 100,
      created_at: nowIso,
      updated_at: nowIso,
    })
  })
}

const payload = { hubs, entries }
writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
console.log(`Seeded ${hubs.length} hubs and ${entries.length} entries → ${outputPath}`)
