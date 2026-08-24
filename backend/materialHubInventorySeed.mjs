/**
 * Canonical first-boot inventory for the Material Hubs live stock view.
 *
 * These values mirror `frontend/src/config/materialHubStockQuantities.ts` so the
 * public portal renders identical numbers before an administrator makes any edit.
 * Once the store is bootstrapped, this file is no longer consulted.
 */

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
  Pallets: 'units',
  'EPS Panels': 'panels',
  Wheelbarrows: 'units',
  Shovels: 'units',
  Pickaxes: 'units',
}

/** Display order of the stock status sheet. */
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

const HUB_DEFINITIONS = [
  {
    id: 'gb1',
    name: 'Gilgit Material Hub',
    location: 'Gilgit',
    district: 'Gilgit-Baltistan',
    quantities: [1080, 2540, 1070, 1750, 141, 13, 35, 400, 171, 168, 345, 200, 0, 0, 0],
  },
  {
    id: 'mzg1',
    name: 'Muzaffargarh Material Hub',
    location: 'Muzaffargarh',
    district: 'Muzaffargarh',
    quantities: [1070, 2530, 1070, 870, 130, 14, 30, 200, 170, 170, 330, 200, 0, 0, 0],
  },
  {
    id: 'sukkur1',
    name: 'Sukkur Material Hub',
    location: 'Sukkur',
    district: 'Sukkur',
    quantities: [1060, 2530, 1060, 860, 130, 13, 35, 0, 160, 160, 330, 200, 0, 0, 0],
  },
  {
    id: 'jalozai1',
    name: 'Jalozai Material Hub',
    location: 'Jalozai',
    district: 'Nowshera',
    quantities: [1227, 2914, 1227, 7360, 154, 16, 39, 230, 192, 192, 39, 300, 50, 100, 100],
  },
]

const SEED_LAST_UPDATED = '2026-06-01'

export function buildSeedInventory() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    hubs: HUB_DEFINITIONS.map((hub) => ({
      id: hub.id,
      name: hub.name,
      location: hub.location,
      district: hub.district,
      lastUpdated: SEED_LAST_UPDATED,
      materials: MATERIAL_NAMES.map((name, index) => ({
        id: `m${index + 1}`,
        name,
        unit: MATERIAL_UNITS[name] ?? 'units',
        quantity: hub.quantities[index] ?? 0,
      })),
    })),
  }
}
