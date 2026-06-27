export type CentralizedMaterialRecord = {
  item_name: string;
  total_quantity: number;
  git_quantity: number;
  mzf_quantity: number;
  skr_quantity: number;
  balance_quantity: number;
};

const BASE_MATERIAL_ROWS: Omit<CentralizedMaterialRecord, 'balance_quantity'>[] = [
  { item_name: 'Bamboos (for Joist)', total_quantity: 3200, git_quantity: 1070, mzf_quantity: 1070, skr_quantity: 1060 },
  { item_name: 'Bamboo (for Purlins & Walls)', total_quantity: 7600, git_quantity: 2540, mzf_quantity: 2530, skr_quantity: 2530 },
  { item_name: 'Bamboo (for Ring Beams)', total_quantity: 3200, git_quantity: 1070, mzf_quantity: 1070, skr_quantity: 1060 },
  { item_name: 'Wooden Stick chick Mat', total_quantity: 2600, git_quantity: 870, mzf_quantity: 870, skr_quantity: 860 },
  { item_name: 'Polythene Sheet', total_quantity: 400, git_quantity: 140, mzf_quantity: 130, skr_quantity: 130 },
  { item_name: 'Cotton rope', total_quantity: 40, git_quantity: 13, mzf_quantity: 14, skr_quantity: 13 },
  { item_name: 'Steel Girder (H Beam)', total_quantity: 100, git_quantity: 35, mzf_quantity: 30, skr_quantity: 35 },
  { item_name: 'CGI', total_quantity: 600, git_quantity: 400, mzf_quantity: 200, skr_quantity: 0 },
  { item_name: 'Wooden Planks 1', total_quantity: 500, git_quantity: 170, mzf_quantity: 170, skr_quantity: 160 },
  { item_name: 'Wooden Planks 2', total_quantity: 500, git_quantity: 170, mzf_quantity: 170, skr_quantity: 160 },
  { item_name: 'EPS Panels', total_quantity: 1000, git_quantity: 340, mzf_quantity: 330, skr_quantity: 330 },
  { item_name: 'Pallets', total_quantity: 600, git_quantity: 200, mzf_quantity: 200, skr_quantity: 200 },
];

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const MATERIAL_HUB_SEED_ROWS: CentralizedMaterialRecord[] = BASE_MATERIAL_ROWS.map((row) => {
  const maxAllocated = Math.max(row.git_quantity, row.mzf_quantity, row.skr_quantity);
  return {
    ...row,
    balance_quantity: Math.max(0, row.total_quantity - maxAllocated),
  };
});

export function mapHubLocationToMaterialKey(location: string): 'git' | 'mzf' | 'skr' | null {
  const key = normalize(location);
  if (key.includes('gilgit') || key.includes('git')) return 'git';
  if (key.includes('muzaffargarh') || key.includes('mzf')) return 'mzf';
  if (key.includes('sukkur') || key.includes('skr')) return 'skr';
  return null;
}

export function getHubSeedQuantity(row: CentralizedMaterialRecord, location: string) {
  const key = mapHubLocationToMaterialKey(location);
  if (key === 'git') return row.git_quantity;
  if (key === 'mzf') return row.mzf_quantity;
  if (key === 'skr') return row.skr_quantity;
  return 0;
}
