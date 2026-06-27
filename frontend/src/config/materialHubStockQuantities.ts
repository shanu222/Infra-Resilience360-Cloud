import type { Material } from './materialHubCatalog'

/** Canonical material list order — matches stock status sheet. */
export const MATERIAL_HUB_STOCK_MATERIAL_NAMES = [
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
] as const

const MATERIAL_UNITS: Record<(typeof MATERIAL_HUB_STOCK_MATERIAL_NAMES)[number], string> = {
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
  'Pallets': 'units',
  'Wheelbarrows': 'units',
  'Shovels': 'units',
  'Pickaxes': 'units',
}

/** Stock quantities per hub from Material Hubs stock status sheet. */
export const MATERIAL_HUB_STOCK_BY_HUB: Record<string, readonly number[]> = {
  gb1: [1080, 2540, 1070, 1750, 141, 13, 35, 400, 171, 168, 345, 200, 0, 0, 0],
  mzg1: [1070, 2530, 1070, 870, 130, 14, 30, 200, 170, 170, 330, 200, 0, 0, 0],
  sukkur1: [1060, 2530, 1060, 860, 130, 13, 35, 0, 160, 160, 330, 200, 0, 0, 0],
  jalozai1: [1227, 2914, 1227, 7360, 154, 16, 39, 230, 192, 192, 39, 300, 50, 100, 100],
}

export function buildHubStockMaterials(_hubId: string, quantities: readonly number[]): Material[] {
  return MATERIAL_HUB_STOCK_MATERIAL_NAMES.map((name, index) => {
    const closing = quantities[index] ?? 0
    return {
      id: `m${index + 1}`,
      name,
      unit: MATERIAL_UNITS[name],
      opening: closing,
      received: 0,
      issued: 0,
      closing,
      damaged: 0,
      percentageRemaining: 100,
    }
  })
}

/** Display label for simplified stock view (Material + Quantity only). */
export function formatMaterialStockQuantity(material: Material, hubId: string): string {
  if (material.name === 'Cotton Rope') {
    return `${material.closing} Kg`
  }
  if (material.closing === 0) {
    if (material.name === 'CGI Sheets' && hubId === 'sukkur1') return '-'
    if (
      (material.name === 'Wheelbarrows' ||
        material.name === 'Shovels' ||
        material.name === 'Pickaxes') &&
      hubId !== 'jalozai1'
    ) {
      return '-'
    }
  }
  return material.closing.toLocaleString('en-US')
}
