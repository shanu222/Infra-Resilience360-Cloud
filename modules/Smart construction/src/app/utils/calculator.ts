export type RoomCategory = 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'lounge' | 'store' | 'stair' | 'other';

export type FloorType = 'tiles' | 'concrete' | 'masonry';
export type CeilingType = 'rcc_slab' | 't_beam_girder' | 'wooden';
export type FootingType = 'strip' | 'isolated' | 'raft';
export type WallMaterialType = 'brick' | 'block' | 'stone';
export type WaterproofingType = 'bitumen' | 'plastic_sheet' | 'chemical' | 'membrane';
export type DoorType = 'wooden' | 'steel' | 'aluminum';
export type WindowType = 'aluminum' | 'wooden' | 'glass';

export interface FootingConfig {
  type: FootingType;
  depthFt: number;
  widthFt: number;
  concreteGrade: string;
}

export interface FinishingConfig {
  plasterEnabled: boolean;
  wallTilesHeightFt: number;
  waterproofingEnabled: boolean;
  waterproofingType?: WaterproofingType;
}

export interface BeamConfig {
  enabled: boolean;
  widthIn: number;
  depthIn: number;
  steelBars: 2 | 4 | 6;
  stirrupSpacingIn: number;
}

export interface ColumnConfig {
  enabled: boolean;
  columnSize: '9x9' | '12x12';
  steelBars: 4 | 6 | 8;
  stirrupSpacingIn: number;
}

export interface OpeningInput {
  id: string;
  label: string;
  openingType?: DoorType | WindowType;
  widthFt: number;
  heightFt: number;
  count: number;
  roomCategory?: RoomCategory | 'boundary';
}

export interface RoomTemplateInput {
  id: string;
  roomType: string;
  spaceType?: 'room' | 'kitchen' | 'bathroom' | 'store';
  spaceNumber?: number;
  category?: RoomCategory;
  lengthFt: number;
  widthFt: number;
  count: number;
  adjacencyMode?: 'adjacent' | 'separate';
  bathroomPlacement?: 'inside' | 'separate';
  parentSpaceId?: string;
  adjacentToPrevious?: boolean;
  wallHeightFt?: number;
  wallThicknessIn?: number;
  wallMaterial?: WallMaterialType;
  footing?: FootingConfig;
  finishing?: FinishingConfig;
  rccBeam?: BeamConfig;
  rccColumns?: ColumnConfig;
  floorConfig?: FloorConfig;
  ceilingConfig?: CeilingConfig;
  doors?: OpeningInput[];
  windows?: OpeningInput[];
  waterproofing?: boolean;
  rccBeamAboveOpenings?: boolean;
  rccColumnsEnabled?: boolean;
  plaster?: boolean;
  beam?: {
    width: number;
    depth: number;
    steelBars: number;
  };
  column?: {
    size: '9x9' | '12x12';
    steelBars: number;
  };
}

export interface BoundaryWallConfig {
  enabled: boolean;
  plotLengthFt: number;
  plotWidthFt: number;
  heightFt: number;
  thicknessIn: number;
  foundationDepthFt: number;
  foundationWidthFt?: number;
  materialType: 'masonry' | 'block' | 'rcc';
  gateWidthFt: number;
  gateHeightFt: number;
  gatesCount?: number;
  footing?: FootingConfig;
  plasterEnabled?: boolean;
  boundaryDoors?: OpeningInput[];
  boundaryWindows?: OpeningInput[];
}

export interface FloorConfig {
  floorType: FloorType;
  finishThicknessIn: number;
  tileLengthMm: number;
  tileWidthMm: number;
  tileWastagePercent: number;
}

export interface CeilingConfig {
  ceilingType: CeilingType;
  ceilingHeightFt: number;
  slabThicknessIn: number;
  steelGrade: string;
  barDiameterMm: number;
  barSpacingIn: number;
  gaderCount?: number;
  stripSpacingFt?: number;
  gaderMaterial?: 'steel' | 'precast_concrete' | 'timber';
  woodenBeamCount?: number;
  woodenBeamSpacingFt?: number;
}

export interface ConstructionInput {
  constructionType: string;
  rooms: number;
  roomSize: { length: number; width: number };
  totalPlotAreaSqFt?: number;
  totalRooms?: number;
  kitchens?: number;
  bathrooms?: number;
  lounges?: number;
  stores?: number;
  otherRooms?: number;
  roomTemplates?: RoomTemplateInput[];
  livingSpaces?: RoomTemplateInput[];
  kitchenSpaces?: RoomTemplateInput[];
  bathroomSpaces?: RoomTemplateInput[];
  loungeSpaces?: RoomTemplateInput[];
  otherSpaces?: RoomTemplateInput[];
  wallHeightFt?: number;
  ceilingHeightFt?: number;
  wallThicknessIn?: number;
  doors?: OpeningInput[];
  windows?: OpeningInput[];
  openingDefaultsLocked?: boolean;
  boundaryWall?: BoundaryWallConfig;
  floorConfig?: FloorConfig;
  ceilingConfig?: CeilingConfig;
  soil: string;
  hazards: string[];
  location: {
    country: string;
    province: string;
    district: string;
  };
  rates?: ProvinceRateCard;
}

export interface ProvinceRateCard {
  province: string;
  country: string;
  currency: string;
  source: string;
  fetchedAt: string;
  materialRates: {
    brickPerPiece: number;
    cementPerBag: number;
    sandPerCft: number;
    aggregatePerCft: number;
    steelPerKg: number;
    tilePerSqFt: number;
    doorPerSqFt: number;
    windowPerSqFt: number;
    woodPerCft: number;
    plasterPerSqFt: number;
    beamPerRft: number;
    concretePerCft: number;
    paintPerSqFt: number;
    doorWoodPerUnit: number;
    windowAluminumPerUnit: number;
    waterproofPerSqFt: number;
    gaderPerPiece: number;
    beamConcretePerCft: number;
    columnConcretePerCft: number;
  };
  laborRates: {
    dailyWageMason: number;
    dailyWageHelper: number;
    workersPer100SqFt: number;
    productivitySqFtPerWorkerDay: number;
  };
  notes: string[];
}

const DEFAULT_PROVINCE_RATES: ProvinceRateCard = {
  province: 'Punjab',
  country: 'Pakistan',
  currency: 'PKR',
  source: 'Default baseline',
  fetchedAt: new Date().toISOString(),
  materialRates: {
    brickPerPiece: 15,
    cementPerBag: 800,
    sandPerCft: 50,
    aggregatePerCft: 60,
    steelPerKg: 150,
    tilePerSqFt: 380,
    doorPerSqFt: 650,
    windowPerSqFt: 540,
    woodPerCft: 4200,
    plasterPerSqFt: 65,
    beamPerRft: 450,
    concretePerCft: 180,
    paintPerSqFt: 28,
    doorWoodPerUnit: 18000,
    windowAluminumPerUnit: 14500,
    waterproofPerSqFt: 42,
    gaderPerPiece: 5200,
    beamConcretePerCft: 220,
    columnConcretePerCft: 240,
  },
  laborRates: {
    dailyWageMason: 2500,
    dailyWageHelper: 1800,
    workersPer100SqFt: 2.4,
    productivitySqFtPerWorkerDay: 11,
  },
  notes: [],
};

export interface GeometryEstimate {
  builtUpAreaSqFt: number;
  floorAreaSqFt: number;
  ceilingAreaSqFt: number;
  circulationAreaSqFt: number;
  sharedWallReductionCft: number;
  plasterAreaSqFt: number;
  footingConcreteVolumeCft: number;
  houseWallVolumeCft: number;
  boundaryWallVolumeCft: number;
  boundaryFoundationVolumeCft: number;
  openingsAreaSqFt: number;
  openingsVolumeCft: number;
  netHouseWallVolumeCft: number;
  netBoundaryWallVolumeCft: number;
  netTotalMasonryVolumeCft: number;
  concreteVolumeCft: number;
}

export interface TileEstimate {
  tileLengthMm: number;
  tileWidthMm: number;
  tileAreaSqFt: number;
  tilesRequired: number;
  tiledAreaSqFt: number;
  wastagePercent: number;
}

export interface OpeningsSummary {
  totalDoors: number;
  totalWindows: number;
  doorAreaSqFt: number;
  windowAreaSqFt: number;
  boundaryDoorCount: number;
  boundaryWindowCount: number;
}

export interface MaterialEstimate {
  bricks: number;
  cementBags: number;
  sand: number;
  aggregate: number;
  steel: number;
  woodCft: number;
  beamRft: number;
  woodenBeamRft: number;
  plasterAreaSqFt: number;
  paintSqFt: number;
  tilesSqFt: number;
  tileCount: number;
  doorsCount: number;
  windowsCount: number;
  waterproofAreaSqFt: number;
  concreteCft: number;
  gaderCount: number;
  beamConcreteCft: number;
  columnConcreteCft: number;
  gravelCft: number;
  bitumenSqFt: number;
  insulationSqFt: number;
  mortarM3: number;
  mortarCft: number;
  masonryVolumeM3: number;
}

export interface CostBreakdown {
  brickCost: number;
  cementCost: number;
  sandCost: number;
  aggregateCost: number;
  steelCost: number;
  tileCost: number;
  doorsCost: number;
  windowsCost: number;
  woodCost: number;
  plasterCost: number;
  structuralCost: number;
  laborCost: number;
  foundationCost: number;
  contractorMarginCost: number;
  total: number;
}

export interface SpaceCostBreakdown {
  id: string;
  title: string;
  roomType: string;
  number: number;
  perimeterFt: number;
  wallVolumeCft: number;
  openingsVolumeCft: number;
  netWallVolumeCft: number;
  footingVolumeCft: number;
  slabVolumeCft: number;
  beamVolumeCft: number;
  columnVolumeCft: number;
  rccVolumeCft: number;
  doorAreaSqFt: number;
  windowAreaSqFt: number;
  plasterAreaSqFt: number;
  floorAreaSqFt: number;
  waterproofAreaSqFt: number;
  bricksQty: number;
  cementQty: number;
  sandQty: number;
  steelQty: number;
  footingCost: number;
  brickCost: number;
  cementCost: number;
  sandCost: number;
  aggregateCost: number;
  steelCost: number;
  plasterCost: number;
  tileCost: number;
  doorsCost: number;
  windowsCost: number;
  structuralCost: number;
  total: number;
}

export interface BoundaryWallBreakdown {
  enabled: boolean;
  sideFt: number;
  perimeterFt: number;
  wallVolumeCft: number;
  bricksQty: number;
  mortarQty: number;
  cementQty: number;
  sandQty: number;
  gateCost: number;
  brickCost: number;
  cementCost: number;
  sandCost: number;
  total: number;
}

export interface SpaceEstimate {
  id: string;
  roomType: string;
  category: RoomCategory;
  areaSqFt: number;
  openingAreaSqFt: number;
  netPlasterAreaSqFt: number;
  footingConcreteCft: number;
}

export interface FoundationRecommendation {
  type: string;
  depth: string;
  description: string;
}

export interface LaborEstimate {
  workers: string;
  days: string;
  workerCount: number;
  durationDays: number;
  totalLaborCost: number;
}

export interface CalculationResult {
  totalArea: number;
  roomCountSummary: {
    /** Habitable rooms only — excludes kitchens, washrooms and stores. */
    totalRooms: number;
    /** Every configured space, including kitchens, washrooms and stores. */
    totalSpaces: number;
    kitchens: number;
    bathrooms: number;
    lounges: number;
    stores: number;
    others: number;
  };
  openings: OpeningsSummary;
  tile: TileEstimate;
  spaces: SpaceEstimate[];
  spaceCosts: SpaceCostBreakdown[];
  materials: MaterialEstimate;
  geometry: GeometryEstimate;
  foundation: FoundationRecommendation;
  labor: LaborEstimate;
  costBreakdown: CostBreakdown;
  estimatedCost: number;
  constructionSteps: string[];
  resilienceTips: {
    [key: string]: string[];
  };
  appliedRates: ProvinceRateCard;
  boundaryWallCost: number;
  loungeCost: number;
  boundaryBreakdown: BoundaryWallBreakdown;
}

const FT3_TO_M3 = 0.0283168;
const M3_TO_FT3 = 35.3147;
const CEMENT_BAG_VOLUME_M3 = 0.0347;
/** Pakistan field practice: ~550–600 bricks/m³ of masonry (midpoint 575). */
const BRICK_DENSITY_PER_M3 = 575;
/** Mortar volume as share of gross masonry volume (typical 0.30–0.35 on site). */
const MORTAR_SHARE = 0.32;
const MASONRY_MIX_CEMENT_PART = 1;
const MASONRY_MIX_SAND_PART = 6;
/** Dry-volume factor for site concrete batching (1.6–1.65). */
const CONCRETE_DRY_FACTOR = 1.62;
/** 1:2:4 concrete — aggregate share of the seven dry parts. */
const CONCRETE_AGGREGATE_SHARE = 4 / 7;
/** Labor inefficiency (supervision gaps, re-starts, weather). */
const LABOR_SITE_INEFFICIENCY_FACTOR = 1.2;
/** Screed thickness for tiled circulation floors (inches). */
const CIRCULATION_SCREED_THICKNESS_IN = 1.5;
/** Productivity band for Pakistan residential sites (sq ft equivalent per worker-day). */
const LABOR_PRODUCTIVITY_MIN_SQFT = 60;
const LABOR_PRODUCTIVITY_MAX_SQFT = 80;

const DEFAULT_FOOTING: FootingConfig = {
  type: 'strip',
  depthFt: 2.5,
  widthFt: 1.75,
  concreteGrade: 'M20',
};

const DEFAULT_BEAM: BeamConfig = {
  enabled: false,
  widthIn: 9,
  depthIn: 12,
  steelBars: 4,
  stirrupSpacingIn: 6,
};

const DEFAULT_COLUMNS: ColumnConfig = {
  enabled: false,
  columnSize: '9x9',
  steelBars: 4,
  stirrupSpacingIn: 6,
};

const asPositiveNumber = (value: unknown, fallback: number): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return numeric;
};

const safe = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || Number.isNaN(numeric)) return 0;
  return numeric;
};

/** Coerce any intermediate calculation to a finite number (prevents NaN in totals). */
const finiteOrZero = (value: number): number => (Number.isFinite(value) && !Number.isNaN(value) ? value : 0);

/**
 * Reinforcement intensity (kg steel / ft² built-up) aligned with Pakistan residential practice.
 * Ranges: RCC slab 2.5–4, full RCC frame 3–5, confined masonry 2–3 kg/ft².
 */
const steelKgPerSqFtForConstruction = (input: ConstructionInput): number => {
  const t = String(input.constructionType ?? '')
  if (t === 'rcc_frame') return 4
  if (t === 'masonry_confined') return 2.5
  if (t === 'masonry_gader') return 3.25
  if (t === 'mud_house') return 1
  return input.ceilingConfig?.ceilingType === 'rcc_slab' ? 3.25 : 3
};

const BRICKS_PER_CFT_NET_WALL = BRICK_DENSITY_PER_M3 / M3_TO_FT3;

const normalizeRoomCategory = (roomType: string, category?: RoomCategory): RoomCategory => {
  if (category) return category;
  const value = String(roomType).toLowerCase();
  if (value.includes('kitchen')) return 'kitchen';
  if (value.includes('bath')) return 'bathroom';
  if (value.includes('lounge')) return 'lounge';
  if (value.includes('store')) return 'store';
  if (value.includes('stair')) return 'stair';
  if (value.includes('living')) return 'living';
  if (value.includes('bed')) return 'bedroom';
  return 'other';
};

const defaultFootingForCategory = (category: RoomCategory): FootingConfig => {
  if (category === 'bathroom' || category === 'kitchen') {
    return {
      ...DEFAULT_FOOTING,
      depthFt: 3,
      widthFt: 2,
    };
  }
  if (category === 'store') {
    return {
      ...DEFAULT_FOOTING,
      depthFt: 2.75,
    };
  }
  return { ...DEFAULT_FOOTING };
};

const defaultFinishingForCategory = (category: RoomCategory): FinishingConfig => {
  if (category === 'bathroom') {
    return {
      plasterEnabled: true,
      wallTilesHeightFt: 7,
      waterproofingEnabled: true,
      waterproofingType: 'chemical',
    };
  }
  if (category === 'kitchen') {
    return {
      plasterEnabled: true,
      wallTilesHeightFt: 3,
      waterproofingEnabled: true,
      waterproofingType: 'bitumen',
    };
  }
  return {
    plasterEnabled: true,
    wallTilesHeightFt: 0,
    waterproofingEnabled: false,
    waterproofingType: 'bitumen',
  };
};

const openingAreaTotal = (openings?: OpeningInput[]): number => {
  const normalized = Array.isArray(openings) ? openings : [];
  return normalized.reduce((sum, opening) => {
    const width = Math.max(0, Number(opening.widthFt) || 0);
    const height = Math.max(0, Number(opening.heightFt) || 0);
    const count = Math.max(0, Number(opening.count) || 0);
    return sum + width * height * count;
  }, 0);
};

const normalizeDoorType = (value: unknown): DoorType => {
  if (value === 'steel' || value === 'aluminum') return value;
  return 'wooden';
};

const normalizeWindowType = (value: unknown): WindowType => {
  if (value === 'wooden' || value === 'glass') return value;
  return 'aluminum';
};

const withDefaults = (input: ConstructionInput): ConstructionInput => {
  const floorConfig: FloorConfig = {
    floorType: input.floorConfig?.floorType ?? 'tiles',
    finishThicknessIn: asPositiveNumber(input.floorConfig?.finishThicknessIn, 2),
    tileLengthMm: asPositiveNumber(input.floorConfig?.tileLengthMm, 600),
    tileWidthMm: asPositiveNumber(input.floorConfig?.tileWidthMm, 600),
    tileWastagePercent: asPositiveNumber(input.floorConfig?.tileWastagePercent, 10),
  };

  const ceilingConfig: CeilingConfig = {
    ceilingType: input.ceilingConfig?.ceilingType ?? (input.constructionType === 'masonry_gader' ? 't_beam_girder' : 'rcc_slab'),
    ceilingHeightFt: asPositiveNumber(input.ceilingConfig?.ceilingHeightFt ?? input.ceilingHeightFt, 10),
    slabThicknessIn: asPositiveNumber(input.ceilingConfig?.slabThicknessIn, 5),
    steelGrade: String(input.ceilingConfig?.steelGrade ?? 'Grade-60'),
    barDiameterMm: asPositiveNumber(input.ceilingConfig?.barDiameterMm, 12),
    barSpacingIn: asPositiveNumber(input.ceilingConfig?.barSpacingIn, 6),
    gaderCount: asPositiveNumber(input.ceilingConfig?.gaderCount, 4),
    stripSpacingFt: asPositiveNumber(input.ceilingConfig?.stripSpacingFt, 2),
    gaderMaterial: input.ceilingConfig?.gaderMaterial ?? 'steel',
    woodenBeamCount: asPositiveNumber(input.ceilingConfig?.woodenBeamCount, 8),
    woodenBeamSpacingFt: asPositiveNumber(input.ceilingConfig?.woodenBeamSpacingFt, 2.5),
  };

  return {
    ...input,
    wallHeightFt: asPositiveNumber(input.wallHeightFt, 10),
    wallThicknessIn: asPositiveNumber(input.wallThicknessIn, 9),
    doors: Array.isArray(input.doors) ? input.doors : [],
    windows: Array.isArray(input.windows) ? input.windows : [],
    boundaryWall: input.boundaryWall
      ? {
          ...input.boundaryWall,
          footing: {
            ...defaultFootingForCategory('other'),
            ...(input.boundaryWall.footing ?? {}),
          },
          plasterEnabled: input.boundaryWall.plasterEnabled ?? true,
          boundaryDoors: Array.isArray(input.boundaryWall.boundaryDoors) ? input.boundaryWall.boundaryDoors : [],
          boundaryWindows: Array.isArray(input.boundaryWall.boundaryWindows) ? input.boundaryWall.boundaryWindows : [],
        }
      : input.boundaryWall,
    floorConfig,
    ceilingConfig,
  };
};

const resolveRateCard = (rateCard: ProvinceRateCard | undefined, province: string): ProvinceRateCard => {
  if (!rateCard) {
    return {
      ...DEFAULT_PROVINCE_RATES,
      province: province || DEFAULT_PROVINCE_RATES.province,
      fetchedAt: new Date().toISOString(),
    };
  }

  return {
    ...DEFAULT_PROVINCE_RATES,
    ...rateCard,
    province: String(rateCard.province || province || DEFAULT_PROVINCE_RATES.province),
    country: 'Pakistan',
    currency: 'PKR',
    materialRates: {
      brickPerPiece: asPositiveNumber(rateCard.materialRates?.brickPerPiece, DEFAULT_PROVINCE_RATES.materialRates.brickPerPiece),
      cementPerBag: asPositiveNumber(rateCard.materialRates?.cementPerBag, DEFAULT_PROVINCE_RATES.materialRates.cementPerBag),
      sandPerCft: asPositiveNumber(rateCard.materialRates?.sandPerCft, DEFAULT_PROVINCE_RATES.materialRates.sandPerCft),
      aggregatePerCft: asPositiveNumber(rateCard.materialRates?.aggregatePerCft, DEFAULT_PROVINCE_RATES.materialRates.aggregatePerCft),
      steelPerKg: asPositiveNumber(rateCard.materialRates?.steelPerKg, DEFAULT_PROVINCE_RATES.materialRates.steelPerKg),
      tilePerSqFt: asPositiveNumber((rateCard.materialRates as Record<string, unknown>)?.tilePerSqFt, DEFAULT_PROVINCE_RATES.materialRates.tilePerSqFt),
      doorPerSqFt: asPositiveNumber((rateCard.materialRates as Record<string, unknown>)?.doorPerSqFt, DEFAULT_PROVINCE_RATES.materialRates.doorPerSqFt),
      windowPerSqFt: asPositiveNumber((rateCard.materialRates as Record<string, unknown>)?.windowPerSqFt, DEFAULT_PROVINCE_RATES.materialRates.windowPerSqFt),
      woodPerCft: asPositiveNumber((rateCard.materialRates as Record<string, unknown>)?.woodPerCft, DEFAULT_PROVINCE_RATES.materialRates.woodPerCft),
      plasterPerSqFt: asPositiveNumber((rateCard.materialRates as Record<string, unknown>)?.plasterPerSqFt, DEFAULT_PROVINCE_RATES.materialRates.plasterPerSqFt),
      beamPerRft: asPositiveNumber((rateCard.materialRates as Record<string, unknown>)?.beamPerRft, DEFAULT_PROVINCE_RATES.materialRates.beamPerRft),
      concretePerCft: asPositiveNumber((rateCard.materialRates as Record<string, unknown>)?.concretePerCft, DEFAULT_PROVINCE_RATES.materialRates.concretePerCft),
      paintPerSqFt: asPositiveNumber((rateCard.materialRates as Record<string, unknown>)?.paintPerSqFt, DEFAULT_PROVINCE_RATES.materialRates.paintPerSqFt),
      doorWoodPerUnit: asPositiveNumber((rateCard.materialRates as Record<string, unknown>)?.doorWoodPerUnit, DEFAULT_PROVINCE_RATES.materialRates.doorWoodPerUnit),
      windowAluminumPerUnit: asPositiveNumber((rateCard.materialRates as Record<string, unknown>)?.windowAluminumPerUnit, DEFAULT_PROVINCE_RATES.materialRates.windowAluminumPerUnit),
      waterproofPerSqFt: asPositiveNumber((rateCard.materialRates as Record<string, unknown>)?.waterproofPerSqFt, DEFAULT_PROVINCE_RATES.materialRates.waterproofPerSqFt),
      gaderPerPiece: asPositiveNumber((rateCard.materialRates as Record<string, unknown>)?.gaderPerPiece, DEFAULT_PROVINCE_RATES.materialRates.gaderPerPiece),
      beamConcretePerCft: asPositiveNumber((rateCard.materialRates as Record<string, unknown>)?.beamConcretePerCft, DEFAULT_PROVINCE_RATES.materialRates.beamConcretePerCft),
      columnConcretePerCft: asPositiveNumber((rateCard.materialRates as Record<string, unknown>)?.columnConcretePerCft, DEFAULT_PROVINCE_RATES.materialRates.columnConcretePerCft),
    },
    laborRates: {
      dailyWageMason: asPositiveNumber(rateCard.laborRates?.dailyWageMason, DEFAULT_PROVINCE_RATES.laborRates.dailyWageMason),
      dailyWageHelper: asPositiveNumber(rateCard.laborRates?.dailyWageHelper, DEFAULT_PROVINCE_RATES.laborRates.dailyWageHelper),
      workersPer100SqFt: asPositiveNumber(rateCard.laborRates?.workersPer100SqFt, DEFAULT_PROVINCE_RATES.laborRates.workersPer100SqFt),
      productivitySqFtPerWorkerDay: asPositiveNumber(rateCard.laborRates?.productivitySqFtPerWorkerDay, DEFAULT_PROVINCE_RATES.laborRates.productivitySqFtPerWorkerDay),
    },
    notes: Array.isArray(rateCard.notes) ? rateCard.notes.map((item) => String(item)) : [],
  };
};

const normalizeRoomTemplates = (input: ConstructionInput): RoomTemplateInput[] => {
  const templateList = Array.isArray(input.roomTemplates) ? input.roomTemplates : [];
  const templates = templateList.filter((item) => (Number(item.count) || 0) > 0);

  if (templates.length > 0) {
    return templates.flatMap((item) => {
      const category = normalizeRoomCategory(item.roomType, item.category);
      const doorList = Array.isArray(item.doors) ? item.doors : [];
      const windowList = Array.isArray(item.windows) ? item.windows : [];
      const doors = doorList.map((opening) => ({ ...opening, roomCategory: category, openingType: normalizeDoorType(opening.openingType) }));
      const windows = windowList.map((opening) => ({ ...opening, roomCategory: category, openingType: normalizeWindowType(opening.openingType) }));
      const repeatCount = Math.max(1, Number(item.count) || 1);
      const normalized = {
        ...item,
        category,
        lengthFt: Math.max(4, Number(item.lengthFt) || 10),
        widthFt: Math.max(4, Number(item.widthFt) || 10),
        count: 1,
        adjacencyMode: item.adjacencyMode ?? (item.adjacentToPrevious ? 'adjacent' : 'separate'),
        bathroomPlacement: item.bathroomPlacement ?? 'separate',
        parentSpaceId: item.parentSpaceId,
        adjacentToPrevious: Boolean(item.adjacentToPrevious),
        wallHeightFt: asPositiveNumber(item.wallHeightFt, asPositiveNumber(input.wallHeightFt, 10)),
        wallThicknessIn: asPositiveNumber(item.wallThicknessIn, asPositiveNumber(input.wallThicknessIn, 9)),
        wallMaterial: item.wallMaterial ?? (category === 'bathroom' ? 'block' : 'brick'),
        footing: {
          ...defaultFootingForCategory(category),
          ...(item.footing ?? {}),
        },
        finishing: {
          ...defaultFinishingForCategory(category),
          ...(item.finishing ?? {}),
        },
        rccBeam: {
          ...DEFAULT_BEAM,
          ...(item.rccBeam ?? {}),
        },
        rccColumns: {
          ...DEFAULT_COLUMNS,
          ...(item.rccColumns ?? {}),
        },
        floorConfig: item.floorConfig ?? input.floorConfig,
        ceilingConfig: item.ceilingConfig ?? input.ceilingConfig,
        doors,
        windows,
      };

      return Array.from({ length: repeatCount }).map((_, index) => ({
        ...normalized,
        id: `${normalized.id}-${index + 1}`,
        adjacentToPrevious: index === 0 ? normalized.adjacentToPrevious : true,
        adjacencyMode: index === 0 ? normalized.adjacencyMode : 'adjacent',
      }));
    });
  }

  const rooms = Math.max(1, Number(input.totalRooms ?? input.rooms) || 1);
  const length = Math.max(5, Number(input.roomSize?.length) || 10);
  const width = Math.max(5, Number(input.roomSize?.width) || 12);
  return [
    {
      id: 'main-template-fallback',
      roomType: 'Living Room',
      category: 'living' as RoomCategory,
      lengthFt: length,
      widthFt: width,
      count: 1,
      adjacencyMode: 'separate',
      bathroomPlacement: 'separate' as const,
      adjacentToPrevious: false,
      wallHeightFt: asPositiveNumber(input.wallHeightFt, 10),
      wallThicknessIn: asPositiveNumber(input.wallThicknessIn, 9),
      wallMaterial: 'brick' as WallMaterialType,
      footing: { ...defaultFootingForCategory('living') },
      finishing: { ...defaultFinishingForCategory('living') },
      rccBeam: { ...DEFAULT_BEAM },
      rccColumns: { ...DEFAULT_COLUMNS },
      floorConfig: input.floorConfig,
      ceilingConfig: input.ceilingConfig,
      doors: [{ id: 'living-door', label: 'Living Door', openingType: 'wooden' as DoorType, widthFt: 3, heightFt: 7, count: 1, roomCategory: 'living' as RoomCategory }],
      windows: [{ id: 'living-window', label: 'Living Window', openingType: 'aluminum' as WindowType, widthFt: 4, heightFt: 4, count: 2, roomCategory: 'living' as RoomCategory }],
    },
  ].flatMap((room) =>
    Array.from({ length: rooms }).map((_, index) => ({
      ...room,
      id: `${room.id}-${index + 1}`,
      adjacentToPrevious: index > 0,
      adjacencyMode: index > 0 ? 'adjacent' : 'separate',
    })),
  );
};

const getBoundaryOpenings = (boundary?: BoundaryWallConfig): { boundaryDoors: OpeningInput[]; boundaryWindows: OpeningInput[] } => {
  if (!boundary?.enabled) return { boundaryDoors: [], boundaryWindows: [] };

  const gateCount = Math.max(1, Number(boundary.gatesCount) || 1);
  const defaultGate: OpeningInput = {
    id: 'boundary-gate',
    label: 'Main Gate',
    widthFt: Math.max(0, Number(boundary.gateWidthFt) || 10),
    heightFt: Math.max(0, Number(boundary.gateHeightFt) || 7),
    count: gateCount,
    roomCategory: 'boundary',
  };

  const boundaryDoors = Array.isArray(boundary.boundaryDoors) ? boundary.boundaryDoors : [];
  const boundaryWindows = Array.isArray(boundary.boundaryWindows) ? boundary.boundaryWindows : [];

  return {
    boundaryDoors: boundaryDoors.length > 0 ? boundaryDoors : [defaultGate],
    boundaryWindows,
  };
};

const aggregateOpenings = (
  templates: RoomTemplateInput[],
  legacyDoors: OpeningInput[] | undefined,
  legacyWindows: OpeningInput[] | undefined,
  boundary: BoundaryWallConfig | undefined,
): { roomDoors: OpeningInput[]; roomWindows: OpeningInput[]; boundaryDoors: OpeningInput[]; boundaryWindows: OpeningInput[] } => {
  const roomDoors: OpeningInput[] = [];
  const roomWindows: OpeningInput[] = [];

  for (const room of templates) {
    const roomDoorList = Array.isArray(room.doors) && room.doors.length > 0
      ? room.doors
      : [{ id: `${room.id}-door-default`, label: `${room.roomType} Door`, widthFt: 3, heightFt: 7, count: 1, roomCategory: room.category }];
    const roomWindowList = Array.isArray(room.windows) && room.windows.length > 0
      ? room.windows
      : [{ id: `${room.id}-window-default`, label: `${room.roomType} Window`, widthFt: 4, heightFt: 4, count: room.category === 'bathroom' ? 1 : 2, roomCategory: room.category }];

    roomDoorList.forEach((door) => {
      roomDoors.push({
        ...door,
        roomCategory: room.category,
        count: Math.max(0, Number(door.count) || 0) * room.count,
      });
    });

    roomWindowList.forEach((windowItem) => {
      roomWindows.push({
        ...windowItem,
        roomCategory: room.category,
        count: Math.max(0, Number(windowItem.count) || 0) * room.count,
      });
    });
  }

  const normalizedLegacyDoors = Array.isArray(legacyDoors) ? legacyDoors : [];
  const normalizedLegacyWindows = Array.isArray(legacyWindows) ? legacyWindows : [];

  if (normalizedLegacyDoors.length > 0) {
    return {
      roomDoors: normalizedLegacyDoors.map((door) => ({ ...door, roomCategory: door.roomCategory ?? 'other' })),
      roomWindows: normalizedLegacyWindows.map((windowItem) => ({ ...windowItem, roomCategory: windowItem.roomCategory ?? 'other' })),
      ...getBoundaryOpenings(boundary),
    };
  }

  return {
    roomDoors,
    roomWindows,
    ...getBoundaryOpenings(boundary),
  };
};

const openingTotals = (openings: OpeningInput[], wallThicknessFt: number): { areaSqFt: number; volumeCft: number; count: number } =>
  openings.reduce(
    (acc, opening) => {
      const width = Math.max(0, Number(opening.widthFt) || 0);
      const height = Math.max(0, Number(opening.heightFt) || 0);
      const count = Math.max(0, Number(opening.count) || 0);
      acc.areaSqFt += width * height * count;
      acc.volumeCft += width * height * wallThicknessFt * count;
      acc.count += count;
      return acc;
    },
    { areaSqFt: 0, volumeCft: 0, count: 0 },
  );

const getSpaceAreaSqFt = (room: RoomTemplateInput): number => {
  const area = Math.max(0, room.lengthFt) * Math.max(0, room.widthFt);
  return Math.max(0, area * Math.max(1, Number(room.count) || 1));
};

const calculateAreas = (input: ConstructionInput, templates: RoomTemplateInput[]): { floorAreaSqFt: number; ceilingAreaSqFt: number; circulationAreaSqFt: number } => {
  const insideBathroomByParent = templates.reduce<Record<string, number>>((acc, room) => {
    if (room.category !== 'bathroom' || room.bathroomPlacement !== 'inside' || !room.parentSpaceId) {
      return acc;
    }
    acc[room.parentSpaceId] = (acc[room.parentSpaceId] || 0) + getSpaceAreaSqFt(room);
    return acc;
  }, {});

  const floorAreaSqFt = templates.reduce((sum, room) => {
    if (room.category === 'bathroom' && room.bathroomPlacement === 'inside') {
      return sum;
    }

    const deducted = insideBathroomByParent[room.id] || 0;
    return sum + Math.max(0, getSpaceAreaSqFt(room) - deducted);
  }, 0);
  const plotArea = Math.max(0, Number(input.totalPlotAreaSqFt) || 0);
  const circulationAreaSqFt = plotArea > 0 ? Math.max(0, plotArea - floorAreaSqFt) : 0;
  return { floorAreaSqFt, ceilingAreaSqFt: floorAreaSqFt, circulationAreaSqFt };
};

const buildSpaceEstimates = (templates: RoomTemplateInput[], defaultWallHeightFt: number): SpaceEstimate[] =>
  templates.map((room) => {
    const areaSqFt = Math.max(0, room.lengthFt) * Math.max(0, room.widthFt);
    const roomWallHeight = Math.max(8, Number(room.wallHeightFt) || defaultWallHeightFt);
    const perimeterFt = 2 * (Math.max(0, room.lengthFt) + Math.max(0, room.widthFt));
    const openingAreaSqFt = openingAreaTotal(room.doors) + openingAreaTotal(room.windows);
    const finishing = room.finishing ?? defaultFinishingForCategory(room.category ?? normalizeRoomCategory(room.roomType));
    const grossWallAreaSqFt = perimeterFt * roomWallHeight;
    const netPlasterAreaSqFt = finishing.plasterEnabled ? Math.max(0, grossWallAreaSqFt - openingAreaSqFt) : 0;
    const footing = room.footing ?? defaultFootingForCategory(room.category ?? normalizeRoomCategory(room.roomType));
    const footingConcreteCft = perimeterFt * Math.max(0, footing.depthFt) * Math.max(0, footing.widthFt);

    return {
      id: room.id,
      roomType: room.roomType,
      category: room.category ?? normalizeRoomCategory(room.roomType),
      areaSqFt: Number(areaSqFt.toFixed(1)),
      openingAreaSqFt: Number(openingAreaSqFt.toFixed(1)),
      netPlasterAreaSqFt: Number(netPlasterAreaSqFt.toFixed(1)),
      footingConcreteCft: Number(footingConcreteCft.toFixed(1)),
    };
  });

const estimateGeometry = (
  input: ConstructionInput,
  templates: RoomTemplateInput[],
  allOpenings: { roomDoors: OpeningInput[]; roomWindows: OpeningInput[]; boundaryDoors: OpeningInput[]; boundaryWindows: OpeningInput[] },
  spaces: SpaceEstimate[],
): GeometryEstimate => {
  const wallHeightFt = Math.max(8, Number(input.wallHeightFt) || 10);
  const wallThicknessFt = Math.max(4.5, Number(input.wallThicknessIn) || 9) / 12;
  const floorConfig = input.floorConfig!;
  const ceilingConfig = input.ceilingConfig!;
  const { floorAreaSqFt, ceilingAreaSqFt, circulationAreaSqFt } = calculateAreas(input, templates);

  const rawHouseWallVolumeCft = templates.reduce((sum, room) => {
    if (room.category === 'bathroom' && room.bathroomPlacement === 'inside') {
      return sum;
    }
    const roomWallHeight = Math.max(8, Number(room.wallHeightFt) || wallHeightFt);
    const roomWallThicknessFt = Math.max(4.5, Number(room.wallThicknessIn) || input.wallThicknessIn || 9) / 12;
    const perimeter = 2 * (room.lengthFt + room.widthFt);
    return sum + perimeter * roomWallHeight * roomWallThicknessFt;
  }, 0);

  const sharedWallReductionCft = templates.reduce((sum, room, index) => {
    const mode = room.adjacencyMode ?? (room.adjacentToPrevious ? 'adjacent' : 'separate');
    if (index === 0 || mode !== 'adjacent') return sum;
    if (room.category === 'bathroom' && room.bathroomPlacement === 'inside') return sum;
    const previous = templates[index - 1];
    if (previous.category === 'bathroom' && previous.bathroomPlacement === 'inside') return sum;
    const sharedLengthFt = Math.max(0, Math.min(previous.widthFt, room.widthFt));
    const avgHeightFt = (Math.max(8, Number(previous.wallHeightFt) || wallHeightFt) + Math.max(8, Number(room.wallHeightFt) || wallHeightFt)) / 2;
    const avgThicknessFt = (
      Math.max(4.5, Number(previous.wallThicknessIn) || input.wallThicknessIn || 9) +
      Math.max(4.5, Number(room.wallThicknessIn) || input.wallThicknessIn || 9)
    ) / 24;
    return sum + sharedLengthFt * avgHeightFt * avgThicknessFt;
  }, 0);

  const houseWallVolumeCft = Math.max(0, rawHouseWallVolumeCft - sharedWallReductionCft);

  const roomOpeningsCombined = [...allOpenings.roomDoors, ...allOpenings.roomWindows];
  const roomOpeningTotals = openingTotals(roomOpeningsCombined, wallThicknessFt);
  const netHouseWallVolumeCft = Math.max(0, houseWallVolumeCft - roomOpeningTotals.volumeCft);

  let boundaryWallVolumeCft = 0;
  let boundaryFoundationVolumeCft = 0;
  let netBoundaryWallVolumeCft = 0;
  let boundaryPlasterAreaSqFt = 0;

  if (input.boundaryWall?.enabled) {
    const boundary = input.boundaryWall;
    const totalAreaSqFt = Math.max(300, Number(input.totalPlotAreaSqFt) || 300);
    const side = Math.sqrt(totalAreaSqFt);
    const perimeter = 4 * side;
    const boundaryHeightFt = Math.max(5, boundary.heightFt);
    const boundaryThicknessFt = Math.max(4.5, boundary.thicknessIn) / 12;
    const boundaryOpenings = [...allOpenings.boundaryDoors, ...allOpenings.boundaryWindows];
    const boundaryOpeningTotals = openingTotals(boundaryOpenings, boundaryThicknessFt);

    boundaryWallVolumeCft = perimeter * boundaryHeightFt * boundaryThicknessFt;
    netBoundaryWallVolumeCft = Math.max(0, boundaryWallVolumeCft - boundaryOpeningTotals.volumeCft);

    const foundationDepthFt = Math.max(1.5, boundary.foundationDepthFt);
    const foundationWidthFt = Math.max(boundaryThicknessFt * 1.5, asPositiveNumber(boundary.foundationWidthFt, boundaryThicknessFt * 1.5));
    boundaryFoundationVolumeCft = perimeter * foundationDepthFt * foundationWidthFt;
    boundaryPlasterAreaSqFt = boundary.plasterEnabled === false ? 0 : Math.max(0, perimeter * boundaryHeightFt - boundaryOpeningTotals.areaSqFt);
  }

  const roomFootingConcreteVolumeCft = spaces.reduce((sum, space) => sum + Math.max(0, space.footingConcreteCft), 0);
  const roomPlasterAreaSqFt = spaces.reduce((sum, space) => sum + Math.max(0, space.netPlasterAreaSqFt), 0);

  const floorConcreteVolumeCft = templates.reduce((sum, room) => {
    const roomFloor = room.floorConfig ?? floorConfig;
    const thicknessFt = Math.max(0.5, roomFloor.finishThicknessIn) / 12;
    const area = room.lengthFt * room.widthFt;
    return sum + (roomFloor.floorType === 'tiles' ? area * thicknessFt * 0.45 : area * thicknessFt);
  }, 0);
  const circulationFloorThicknessFt = Math.max(0.5, floorConfig.finishThicknessIn) / 12;
  const circulationConcreteVolumeCft = floorConfig.floorType === 'tiles'
    ? circulationAreaSqFt * circulationFloorThicknessFt * 0.45
    : circulationAreaSqFt * circulationFloorThicknessFt;
  const ceilingConcreteVolumeCft = templates.reduce((sum, room) => {
    const roomCeiling = room.ceilingConfig ?? ceilingConfig;
    if (roomCeiling.ceilingType === 'wooden') return sum;
    const slabThicknessFt = Math.max(3, roomCeiling.slabThicknessIn) / 12;
    return sum + room.lengthFt * room.widthFt * slabThicknessFt;
  }, 0);
  const concreteVolumeCft = floorConcreteVolumeCft + ceilingConcreteVolumeCft + boundaryFoundationVolumeCft + roomFootingConcreteVolumeCft;

  return {
    builtUpAreaSqFt: floorAreaSqFt,
    floorAreaSqFt,
    ceilingAreaSqFt,
    circulationAreaSqFt,
    sharedWallReductionCft,
    plasterAreaSqFt: Number((roomPlasterAreaSqFt + boundaryPlasterAreaSqFt).toFixed(1)),
    footingConcreteVolumeCft: Number((roomFootingConcreteVolumeCft + boundaryFoundationVolumeCft).toFixed(1)),
    houseWallVolumeCft,
    boundaryWallVolumeCft,
    boundaryFoundationVolumeCft,
    openingsAreaSqFt: roomOpeningTotals.areaSqFt,
    openingsVolumeCft: roomOpeningTotals.volumeCft,
    netHouseWallVolumeCft,
    netBoundaryWallVolumeCft,
    netTotalMasonryVolumeCft: netHouseWallVolumeCft + netBoundaryWallVolumeCft,
    concreteVolumeCft: concreteVolumeCft + circulationConcreteVolumeCft,
  };
};

const estimateTiles = (input: ConstructionInput, templates: RoomTemplateInput[], geometry: GeometryEstimate): TileEstimate => {
  const floorConfig = input.floorConfig!;
  let tiledAreaSqFt = 0;
  let tilesRequired = 0;
  for (const room of templates) {
    const roomFloor = room.floorConfig ?? floorConfig;
    if (roomFloor.floorType !== 'tiles') continue;
    const area = room.lengthFt * room.widthFt;
    const areaPerTile = (roomFloor.tileLengthMm / 304.8) * (roomFloor.tileWidthMm / 304.8);
    tiledAreaSqFt += area;
    if (areaPerTile > 0) {
      tilesRequired += Math.ceil((area / areaPerTile) * (1 + roomFloor.tileWastagePercent / 100));
    }
  }

  if (floorConfig.floorType === 'tiles' && geometry.circulationAreaSqFt > 0) {
    const areaPerTile = (floorConfig.tileLengthMm / 304.8) * (floorConfig.tileWidthMm / 304.8);
    tiledAreaSqFt += geometry.circulationAreaSqFt;
    if (areaPerTile > 0) {
      tilesRequired += Math.ceil((geometry.circulationAreaSqFt / areaPerTile) * (1 + floorConfig.tileWastagePercent / 100));
    }
  }

  const tileAreaSqFt = (floorConfig.tileLengthMm / 304.8) * (floorConfig.tileWidthMm / 304.8);

  return {
    tileLengthMm: floorConfig.tileLengthMm,
    tileWidthMm: floorConfig.tileWidthMm,
    tileAreaSqFt: Number(tileAreaSqFt.toFixed(3)),
    tilesRequired,
    tiledAreaSqFt: Number(tiledAreaSqFt.toFixed(1)),
    wastagePercent: floorConfig.tileWastagePercent,
  };
};

const estimateMaterials = (
  input: ConstructionInput,
  templates: RoomTemplateInput[],
  geometry: GeometryEstimate,
  tiles: TileEstimate,
): MaterialEstimate => {
  const masonryVolumeM3 = geometry.netTotalMasonryVolumeCft * FT3_TO_M3;
  const mortarM3 = masonryVolumeM3 * MORTAR_SHARE;
  const mortarCft = mortarM3 * M3_TO_FT3;

  const mixTotal = MASONRY_MIX_CEMENT_PART + MASONRY_MIX_SAND_PART;
  const cementVolumeFromMortarM3 = mortarM3 * (MASONRY_MIX_CEMENT_PART / mixTotal);
  const sandVolumeFromMortarM3 = mortarM3 * (MASONRY_MIX_SAND_PART / mixTotal);

  const concreteM3 = geometry.concreteVolumeCft * FT3_TO_M3;
  const concreteDryM3 = concreteM3 * CONCRETE_DRY_FACTOR;
  const cementVolumeFromConcreteM3 = concreteDryM3 * (1 / 7);
  const sandVolumeFromConcreteM3 = concreteDryM3 * (2 / 7);
  const aggregateVolumeFromConcreteM3 = concreteDryM3 * (4 / 7);

  let bricks = Math.ceil(masonryVolumeM3 * BRICK_DENSITY_PER_M3);
  if (input.boundaryWall?.enabled && input.boundaryWall.materialType === 'block') {
    bricks = Math.ceil(bricks * 0.7);
  }
  if (input.constructionType === 'mud_house') {
    bricks = Math.ceil(bricks * 0.3);
  }

  const ceiling = input.ceilingConfig!;
  const builtUpSqFt = Math.max(0, finiteOrZero(geometry.builtUpAreaSqFt));
  const kgPerSqft = steelKgPerSqFtForConstruction(input);
  let steelFromShellKg = finiteOrZero(builtUpSqFt * kgPerSqft);

  const beamSteelKg = templates.reduce((sum, room) => {
    const beamEnabled = Boolean(room.rccBeam?.enabled ?? room.rccBeamAboveOpenings ?? false);
    if (!beamEnabled) return sum;
    const beamWidthIn = safe(room.rccBeam?.widthIn) || safe(room.beam?.width) || 9;
    const beamDepthIn = safe(room.rccBeam?.depthIn) || safe(room.beam?.depth) || 12;
    const beamBars = safe(room.rccBeam?.steelBars) || safe(room.beam?.steelBars) || 4;
    const openingCount = (room.doors ?? []).reduce((s, item) => s + (Number(item.count) || 0), 0) + (room.windows ?? []).reduce((s, item) => s + (Number(item.count) || 0), 0);
    const avgSpanFt = Math.max(3, Math.max(room.lengthFt, room.widthFt) * 0.45);
    return sum + openingCount * avgSpanFt * beamBars * 0.4 + (beamWidthIn + beamDepthIn) * 0.2;
  }, 0);

  const columnSteelKg = templates.reduce((sum, room) => {
    const columnsEnabled = Boolean(room.rccColumns?.enabled ?? room.rccColumnsEnabled ?? false);
    if (!columnsEnabled) return sum;
    const columnBars = safe(room.rccColumns?.steelBars) || safe(room.column?.steelBars) || 4;
    const columns = 4;
    const heightFt = Math.max(8, Number(room.wallHeightFt) || 10);
    return sum + columns * heightFt * columnBars * 0.45;
  }, 0);

  const supplementalSteelKg =
    finiteOrZero(beamSteelKg) * 0.35 + finiteOrZero(columnSteelKg) * 0.35 + finiteOrZero(
      input.boundaryWall?.materialType === 'rcc' ? geometry.boundaryFoundationVolumeCft * FT3_TO_M3 * 35 : 0,
    );

  const steel = Math.ceil(
    finiteOrZero(steelFromShellKg + supplementalSteelKg),
  );

  const beamRft = Math.ceil(templates.reduce((sum, room) => {
    const beamEnabled = Boolean(room.rccBeam?.enabled ?? room.rccBeamAboveOpenings ?? false);
    if (!beamEnabled) return sum;
    const openingCount = (room.doors ?? []).reduce((s, item) => s + (Number(item.count) || 0), 0) + (room.windows ?? []).reduce((s, item) => s + (Number(item.count) || 0), 0);
    const avgSpanFt = Math.max(3, Math.max(room.lengthFt, room.widthFt) * 0.45);
    return sum + openingCount * avgSpanFt;
  }, 0));

  const woodenBeamRft = Math.ceil(templates.reduce((sum, room) => {
    const roomCeiling = room.ceilingConfig ?? ceiling;
    if (roomCeiling.ceilingType !== 'wooden') return sum;
    const count = Math.max(1, Number(roomCeiling.woodenBeamCount) || 0);
    return sum + count * Math.max(room.lengthFt, room.widthFt);
  }, 0));

  const woodCft = Math.ceil(templates.reduce((sum, room) => {
    const roomCeiling = room.ceilingConfig ?? ceiling;
    return sum + (roomCeiling.ceilingType === 'wooden' ? room.lengthFt * room.widthFt * 0.06 : 0) + (roomCeiling.ceilingType === 'wooden' ? Math.max(room.lengthFt, room.widthFt) * 0.02 : 0);
  }, 0)) + Math.ceil(woodenBeamRft * 0.08);

  const doorsCount = templates.reduce((sum, room) => sum + (room.doors ?? []).reduce((s, d) => s + (Number(d.count) || 0), 0), 0);
  const windowsCount = templates.reduce((sum, room) => sum + (room.windows ?? []).reduce((s, w) => s + (Number(w.count) || 0), 0), 0);
  const waterproofAreaSqFt = templates.reduce((sum, room) => {
    const area = room.lengthFt * room.widthFt;
    const waterproofEnabled = Boolean(room.finishing?.waterproofingEnabled ?? room.waterproofing ?? false);
    return sum + (waterproofEnabled ? area : 0);
  }, 0);
  const gaderCount = templates.reduce((sum, room) => {
    const ceilingCfg = room.ceilingConfig ?? input.ceilingConfig!;
    return sum + (ceilingCfg.ceilingType === 't_beam_girder' ? Math.max(0, Number(ceilingCfg.gaderCount) || 0) : 0);
  }, 0);
  const beamConcreteCft = templates.reduce((sum, room) => {
    const beamEnabled = Boolean(room.rccBeam?.enabled ?? room.rccBeamAboveOpenings ?? false);
    if (!beamEnabled) return sum;
    const beamWidthIn = safe(room.rccBeam?.widthIn) || safe(room.beam?.width) || 9;
    const beamDepthIn = safe(room.rccBeam?.depthIn) || safe(room.beam?.depth) || 12;
    const openingCount = (room.doors ?? []).reduce((s, item) => s + (Number(item.count) || 0), 0) + (room.windows ?? []).reduce((s, item) => s + (Number(item.count) || 0), 0);
    const spanFt = Math.max(3, Math.max(room.lengthFt, room.widthFt) * 0.45);
    const beamWidthFt = Math.max(6, beamWidthIn) / 12;
    const beamDepthFt = Math.max(9, beamDepthIn) / 12;
    return sum + openingCount * spanFt * beamWidthFt * beamDepthFt;
  }, 0);
  const columnConcreteCft = templates.reduce((sum, room) => {
    const columnsEnabled = Boolean(room.rccColumns?.enabled ?? room.rccColumnsEnabled ?? false);
    if (!columnsEnabled) return sum;
    const size = (room.rccColumns?.columnSize ?? room.column?.size) === '12x12' ? 1 : 0.75;
    const height = Math.max(8, Number(room.wallHeightFt) || 10);
    return sum + 4 * size * size * height;
  }, 0);
  const plasterAreaSqFt = Number(geometry.plasterAreaSqFt.toFixed(1));

  return {
    bricks,
    cementBags: Math.ceil((cementVolumeFromMortarM3 + cementVolumeFromConcreteM3) / CEMENT_BAG_VOLUME_M3),
    sand: Math.ceil((sandVolumeFromMortarM3 + sandVolumeFromConcreteM3) * M3_TO_FT3),
    // Aggregate only from the concrete that was actually measured — no floor of
    // "tiled area × 0.15", which invented tonnes of stone for houses with little RCC.
    aggregate: Math.ceil(Math.max(0, aggregateVolumeFromConcreteM3 * M3_TO_FT3)),
    steel,
    woodCft,
    beamRft,
    woodenBeamRft,
    plasterAreaSqFt,
    paintSqFt: Math.ceil(plasterAreaSqFt),
    tilesSqFt: Math.ceil(tiles.tiledAreaSqFt),
    tileCount: Math.ceil(tiles.tilesRequired),
    doorsCount,
    windowsCount,
    waterproofAreaSqFt: Math.ceil(waterproofAreaSqFt),
    concreteCft: Math.ceil(geometry.concreteVolumeCft),
    gaderCount: Math.ceil(gaderCount),
    beamConcreteCft: Math.ceil(beamConcreteCft),
    columnConcreteCft: Math.ceil(columnConcreteCft),
    // Kept for type compatibility; no longer inventing gravel/bitumen/insulation lines.
    gravelCft: 0,
    bitumenSqFt: 0,
    insulationSqFt: 0,
    masonryVolumeM3: Number(masonryVolumeM3.toFixed(2)),
    mortarM3: Number(mortarM3.toFixed(2)),
    mortarCft: Math.ceil(mortarCft),
  };
};

const openingsSummary = (
  roomDoors: OpeningInput[],
  roomWindows: OpeningInput[],
  boundaryDoors: OpeningInput[],
  boundaryWindows: OpeningInput[],
): OpeningsSummary => {
  const doors = openingTotals([...roomDoors, ...boundaryDoors], 1);
  const windows = openingTotals([...roomWindows, ...boundaryWindows], 1);
  const boundaryDoorCount = openingTotals(boundaryDoors, 1).count;
  const boundaryWindowCount = openingTotals(boundaryWindows, 1).count;

  return {
    totalDoors: doors.count,
    totalWindows: windows.count,
    doorAreaSqFt: Number(doors.areaSqFt.toFixed(1)),
    windowAreaSqFt: Number(windows.areaSqFt.toFixed(1)),
    boundaryDoorCount,
    boundaryWindowCount,
  };
};

const estimateLabor = (
  input: ConstructionInput,
  geometry: GeometryEstimate,
  rooms: number,
  rates: ProvinceRateCard,
): LaborEstimate => {
  const wallThicknessFt = Math.max(0.375, finiteOrZero((Number(input.wallThicknessIn) || 9) / 12))
  const baselineWork = finiteOrZero(
    geometry.floorAreaSqFt +
      geometry.ceilingAreaSqFt +
      finiteOrZero(geometry.netTotalMasonryVolumeCft) / Math.max(0.01, wallThicknessFt),
  )
  const complexityFactor =
    input.ceilingConfig?.ceilingType === 't_beam_girder'
      ? 1.32
      : input.ceilingConfig?.ceilingType === 'wooden'
        ? 1.15
        : 1.25

  const productivity = Math.min(
    LABOR_PRODUCTIVITY_MAX_SQFT,
    Math.max(LABOR_PRODUCTIVITY_MIN_SQFT, rates.laborRates.productivitySqFtPerWorkerDay || 70),
  )
  const personDays = finiteOrZero(baselineWork / Math.max(1, productivity))
  const workers = Math.max(3, Math.ceil(baselineWork / Math.max(1, productivity)));
  const daysRaw = finiteOrZero((personDays / Math.max(1, workers)) * complexityFactor)
  const durationDays = Math.max(8, Math.ceil(daysRaw))
  const averageDailyWage = finiteOrZero((rates.laborRates.dailyWageMason + rates.laborRates.dailyWageHelper) / 2)
  const totalLaborCost = Math.ceil(
    finiteOrZero(workers * durationDays * averageDailyWage * LABOR_SITE_INEFFICIENCY_FACTOR),
  )

  return {
    workers: `${Math.max(2, workers - 1)}-${workers + (rooms > 5 ? 2 : 1)} workers`,
    days: `${Math.max(7, durationDays - Math.ceil(durationDays * 0.15))}-${durationDays + Math.ceil(durationDays * 0.15)} days`,
    workerCount: workers,
    durationDays,
    totalLaborCost,
  };
};

/**
 * Rolls the per-space and boundary line items into the itemized BOQ the Results
 * page already renders. Nothing is invented here: every figure is a sum of
 * quantities already priced at the rate card, plus measured labour.
 */
const buildCostBreakdown = (
  spaceCosts: SpaceCostBreakdown[],
  boundary: BoundaryWallBreakdown,
  loungeCost: number,
  labor: LaborEstimate,
): CostBreakdown => {
  const sumField = (field: keyof SpaceCostBreakdown): number =>
    spaceCosts.reduce((sum, space) => sum + safe(space[field] as number), 0);

  const brickCost = Math.ceil(sumField('brickCost') + safe(boundary.brickCost));
  const cementCost = Math.ceil(sumField('cementCost') + safe(boundary.cementCost));
  const sandCost = Math.ceil(sumField('sandCost') + safe(boundary.sandCost));
  const aggregateCost = Math.ceil(sumField('aggregateCost'));
  const steelCost = Math.ceil(sumField('steelCost'));
  const tileCost = Math.ceil(sumField('tileCost') + loungeCost);
  const doorsCost = Math.ceil(sumField('doorsCost') + safe(boundary.gateCost));
  const windowsCost = Math.ceil(sumField('windowsCost'));
  const plasterCost = Math.ceil(sumField('plasterCost'));
  // Structural concrete covers slabs/beams/columns; footings are listed under
  // foundationCost so the BOQ still shows a foundation line without inventing
  // a percentage on top of volumes already measured.
  const structuralCost = Math.ceil(sumField('structuralCost'));
  const foundationCost = Math.ceil(sumField('footingCost'));
  const laborCost = Math.ceil(finiteOrZero(labor.totalLaborCost));
  // Circulation finish is a real tiled floor for leftover plot area — not a
  // percentage of anything else. Stored as loungeCost for the existing UI.
  const woodCost = 0;
  const contractorMarginCost = 0;

  const spacesAndBoundary = finiteOrZero(
    spaceCosts.reduce((sum, space) => sum + safe(space.total), 0) + safe(boundary.total),
  );
  const total = Math.ceil(finiteOrZero(spacesAndBoundary + loungeCost + laborCost));

  return {
    brickCost,
    cementCost,
    sandCost,
    aggregateCost,
    steelCost,
    tileCost,
    doorsCost,
    windowsCost,
    woodCost,
    plasterCost,
    structuralCost,
    laborCost,
    foundationCost,
    contractorMarginCost,
    total,
  };
};

/** Floor finish for leftover plot area (circulation / lounge). */
const estimateCirculationCost = (
  circulationAreaSqFt: number,
  rates: ProvinceRateCard,
): number => {
  const area = Math.max(0, finiteOrZero(circulationAreaSqFt));
  if (area <= 0) return 0;

  const tileCost = Math.ceil(area * safe(rates.materialRates.tilePerSqFt));
  // Thin cement screed under the tiles — volume → bags, then bag rate.
  const screedCft = area * (CIRCULATION_SCREED_THICKNESS_IN / 12);
  const screedM3 = screedCft * FT3_TO_M3 * CONCRETE_DRY_FACTOR;
  // Screed is cement-rich mortar (1:4); cement is 1/5 of dry volume.
  const cementBags = screedM3 * (1 / 5) / CEMENT_BAG_VOLUME_M3;
  const screedCost = Math.ceil(cementBags * safe(rates.materialRates.cementPerBag));
  return Math.ceil(tileCost + screedCost);
};

const buildSpaceCosts = (
  spaces: SpaceEstimate[],
  rates: ProvinceRateCard,
  templates: RoomTemplateInput[],
  materials: MaterialEstimate,
  totalFloorAreaSqFt: number,
): SpaceCostBreakdown[] => {
  const allocFloor = Math.max(1e-6, finiteOrZero(totalFloorAreaSqFt));
  const steelPerSqftKg = finiteOrZero(materials.steel) / allocFloor;

  return spaces.map((space, index) => {
    const room = templates.find((item) => item.id === space.id);
    const L = safe(room?.lengthFt);
    const W = safe(room?.widthFt);
    const H = Math.max(8, safe(room?.wallHeightFt) || 10);
    const T = Math.max(0.2, (safe(room?.wallThicknessIn) || 9) / 12);
    const perimeterFt = 2 * (L + W);
    const wallVolumeCft = perimeterFt * H * T;

    const doorAreaSqFt = (room?.doors ?? []).reduce((sum, d) => sum + safe(d.widthFt) * safe(d.heightFt) * Math.max(0, safe(d.count)), 0);
    const windowAreaSqFt = (room?.windows ?? []).reduce((sum, w) => sum + safe(w.widthFt) * safe(w.heightFt) * Math.max(0, safe(w.count)), 0);
    const openingsVolumeCft = (doorAreaSqFt + windowAreaSqFt) * T;
    const netWallVolumeCft = Math.max(0, wallVolumeCft - openingsVolumeCft);

    const bricksQty = Math.max(0, netWallVolumeCft * BRICKS_PER_CFT_NET_WALL);
    const mortarQty = Math.max(0, netWallVolumeCft * MORTAR_SHARE);
    const cementQty = Math.max(0, mortarQty / (MASONRY_MIX_CEMENT_PART + MASONRY_MIX_SAND_PART));
    const sandQty = Math.max(0, mortarQty * (MASONRY_MIX_SAND_PART / (MASONRY_MIX_CEMENT_PART + MASONRY_MIX_SAND_PART)));
    const floorAreaSqFt = Math.max(0, L * W);

    const footingWidthFt = Math.max(0, safe(room?.footing?.widthFt));
    const footingDepthFt = Math.max(0, safe(room?.footing?.depthFt));
    const footingVolumeCft = footingWidthFt * footingDepthFt * perimeterFt;
    const footingAreaSqFt = footingWidthFt * perimeterFt;

    const ceiling = room?.ceilingConfig;
    const slabVolumeCft = (ceiling?.ceilingType ?? 'rcc_slab') === 'rcc_slab'
      ? floorAreaSqFt * (Math.max(3, safe(ceiling?.slabThicknessIn) || 5) / 12)
      : 0;

    const beam = room?.rccBeam;
    const beamEnabled = Boolean(beam?.enabled ?? room?.rccBeamAboveOpenings ?? false);
    const beamWidthIn = safe(beam?.widthIn) || safe(room?.beam?.width) || 9;
    const beamDepthIn = safe(beam?.depthIn) || safe(room?.beam?.depth) || 12;
    const beamVolumeCft = beamEnabled
      ? perimeterFt * (Math.max(6, beamWidthIn) / 12) * (Math.max(9, beamDepthIn) / 12)
      : 0;

    const columns = room?.rccColumns;
    const columnsEnabled = Boolean(columns?.enabled ?? room?.rccColumnsEnabled ?? false);
    const columnSizeFt = (columns?.columnSize ?? room?.column?.size) === '12x12' ? 1 : 0.75;
    const columnVolumeCft = columnsEnabled ? 4 * columnSizeFt * columnSizeFt * H : 0;
    const rccVolumeCft = footingVolumeCft + slabVolumeCft + beamVolumeCft + columnVolumeCft;
    const steelQty = Math.max(0, floorAreaSqFt * steelPerSqftKg);

    const plasterAreaSqFt = Math.max(0, perimeterFt * H - (doorAreaSqFt + windowAreaSqFt));
    const waterproofEnabled = Boolean(room?.finishing?.waterproofingEnabled ?? room?.waterproofing ?? false);
    const waterproofAreaSqFt = waterproofEnabled ? footingAreaSqFt : 0;

    const title = `${space.roomType.toUpperCase()} ${index + 1}`;

    // Every line below is quantity × rate for this space. Nothing is scaled to
    // reconcile against a separately-derived building total: the building total
    // is now the sum of these figures, so the room cards and the final estimate
    // describe the same bill of quantities.
    const concreteRate = safe(rates.materialRates.concretePerCft);
    const brickCost = Math.ceil(bricksQty * safe(rates.materialRates.brickPerPiece));
    const cementCost = Math.ceil(cementQty * safe(rates.materialRates.cementPerBag));
    const sandCost = Math.ceil(sandQty * safe(rates.materialRates.sandPerCft));
    // Coarse aggregate for the concrete actually poured in this space, using the
    // 1:2:4 mix's 4/7 aggregate share rather than a flat guess.
    const concreteVolumeCft = footingVolumeCft + slabVolumeCft + beamVolumeCft + columnVolumeCft;
    const aggregateCost = Math.ceil(
      concreteVolumeCft * CONCRETE_AGGREGATE_SHARE * safe(rates.materialRates.aggregatePerCft),
    );
    const steelCost = Math.ceil(steelQty * safe(rates.materialRates.steelPerKg));
    const plasterCost = Math.ceil(plasterAreaSqFt * safe(rates.materialRates.plasterPerSqFt));
    const tileCost = Math.ceil(floorAreaSqFt * safe(rates.materialRates.tilePerSqFt));
    const doorsCost = Math.ceil(
      (room?.doors ?? []).reduce(
        (sum, door) => sum + Math.max(0, safe(door.count)) * safe(rates.materialRates.doorWoodPerUnit),
        0,
      ),
    );
    const windowsCost = Math.ceil(
      (room?.windows ?? []).reduce(
        (sum, windowItem) =>
          sum + Math.max(0, safe(windowItem.count)) * safe(rates.materialRates.windowAluminumPerUnit),
        0,
      ),
    );
    // Slab, beams and columns. Footings are priced on their own line so the
    // substructure is visible rather than folded into a percentage allowance.
    const structuralCost = Math.ceil((beamVolumeCft + columnVolumeCft + slabVolumeCft) * concreteRate);
    const footingCost = Math.ceil(footingVolumeCft * concreteRate);
    const waterproofCost = Math.ceil(waterproofAreaSqFt * safe(rates.materialRates.waterproofPerSqFt));
    // Waterproofing is finishing work — fold it into plaster for the itemized
    // BOQ so every rupee in the space total also appears on a named line.
    const finishingCost = plasterCost + waterproofCost;
    const total = finiteOrZero(
      brickCost +
        cementCost +
        sandCost +
        aggregateCost +
        steelCost +
        finishingCost +
        tileCost +
        doorsCost +
        windowsCost +
        structuralCost +
        footingCost,
    );

    return {
      id: space.id,
      title,
      roomType: space.roomType,
      number: index + 1,
      perimeterFt: Number(perimeterFt.toFixed(2)),
      wallVolumeCft: Number(wallVolumeCft.toFixed(2)),
      openingsVolumeCft: Number(openingsVolumeCft.toFixed(2)),
      netWallVolumeCft: Number(netWallVolumeCft.toFixed(2)),
      footingVolumeCft: Number(footingVolumeCft.toFixed(2)),
      slabVolumeCft: Number(slabVolumeCft.toFixed(2)),
      beamVolumeCft: Number(beamVolumeCft.toFixed(2)),
      columnVolumeCft: Number(columnVolumeCft.toFixed(2)),
      rccVolumeCft: Number(rccVolumeCft.toFixed(2)),
      doorAreaSqFt: Number(doorAreaSqFt.toFixed(2)),
      windowAreaSqFt: Number(windowAreaSqFt.toFixed(2)),
      plasterAreaSqFt: Number(plasterAreaSqFt.toFixed(2)),
      floorAreaSqFt: Number(floorAreaSqFt.toFixed(2)),
      waterproofAreaSqFt: Number(waterproofAreaSqFt.toFixed(2)),
      bricksQty: Number(bricksQty.toFixed(2)),
      cementQty: Number(cementQty.toFixed(2)),
      sandQty: Number(sandQty.toFixed(2)),
      steelQty: Number(steelQty.toFixed(2)),
      footingCost,
      brickCost,
      cementCost,
      sandCost,
      aggregateCost,
      steelCost,
      plasterCost: finishingCost,
      tileCost,
      doorsCost,
      windowsCost,
      structuralCost,
      total,
    };
  });
};

const buildBoundaryBreakdown = (
  input: ConstructionInput,
  rates: ProvinceRateCard,
): BoundaryWallBreakdown => {
  if (!input.boundaryWall?.enabled) {
    return {
      enabled: false,
      sideFt: 0,
      perimeterFt: 0,
      wallVolumeCft: 0,
      bricksQty: 0,
      mortarQty: 0,
      cementQty: 0,
      sandQty: 0,
      gateCost: 0,
      brickCost: 0,
      cementCost: 0,
      sandCost: 0,
      total: 0,
    };
  }

  const totalArea = Math.max(0, safe(input.totalPlotAreaSqFt));
  const sideFt = totalArea > 0 ? Math.sqrt(totalArea) : 0;
  const perimeterFt = 4 * finiteOrZero(sideFt);
  const thicknessFt = Math.max(0.2, Math.max(4.5, safe(input.boundaryWall.thicknessIn)) / 12);
  const heightFt = Math.max(5, safe(input.boundaryWall.heightFt));
  const wallVolumeCft = finiteOrZero(perimeterFt * heightFt * thicknessFt);

  const bricksQty = wallVolumeCft * BRICKS_PER_CFT_NET_WALL;
  const mortarQty = wallVolumeCft * MORTAR_SHARE;
  const cementQty = mortarQty / (MASONRY_MIX_CEMENT_PART + MASONRY_MIX_SAND_PART);
  const sandQty = mortarQty * (MASONRY_MIX_SAND_PART / (MASONRY_MIX_CEMENT_PART + MASONRY_MIX_SAND_PART));
  const gateCount = Math.max(1, safe(input.boundaryWall.gatesCount));
  const gateCost = Math.ceil(gateCount * safe(rates.materialRates.doorWoodPerUnit));

  const brickCost = Math.ceil(bricksQty * safe(rates.materialRates.brickPerPiece));
  const cementCost = Math.ceil(cementQty * safe(rates.materialRates.cementPerBag));
  const sandCost = Math.ceil(sandQty * safe(rates.materialRates.sandPerCft));
  const total = finiteOrZero(brickCost + cementCost + sandCost + gateCost);

  return {
    enabled: true,
    sideFt: Number(finiteOrZero(sideFt).toFixed(2)),
    perimeterFt: Number(perimeterFt.toFixed(2)),
    wallVolumeCft: Number(wallVolumeCft.toFixed(2)),
    bricksQty: Number(bricksQty.toFixed(2)),
    mortarQty: Number(mortarQty.toFixed(2)),
    cementQty: Number(cementQty.toFixed(2)),
    sandQty: Number(sandQty.toFixed(2)),
    gateCost,
    brickCost,
    cementCost,
    sandCost,
    total,
  };
};

/**
 * Counts spaces by kind.
 *
 * `totalRooms` deliberately covers habitable rooms only. Counting a kitchen, a
 * washroom and a store as "rooms" as well as in their own tallies made the
 * summary read as though the house had far more rooms than were configured, and
 * it inflated the labour baseline that keys off the room count. `totalSpaces`
 * carries the every-space figure for anything that genuinely needs it.
 */
const countRoomTypes = (templates: RoomTemplateInput[]): CalculationResult['roomCountSummary'] => {
  const summary = {
    totalRooms: 0,
    totalSpaces: 0,
    kitchens: 0,
    bathrooms: 0,
    lounges: 0,
    stores: 0,
    others: 0,
  };

  for (const room of templates) {
    const count = Math.max(0, Number(room.count) || 0);
    summary.totalSpaces += count;

    if (room.category === 'kitchen') {
      summary.kitchens += count;
    } else if (room.category === 'bathroom') {
      summary.bathrooms += count;
    } else if (room.category === 'lounge') {
      summary.lounges += count;
      summary.totalRooms += count;
    } else if (room.category === 'store') {
      summary.stores += count;
    } else {
      summary.others += count;
      summary.totalRooms += count;
    }
  }

  return summary;
};

export type CalculationLang = 'en' | 'ur';

const getFoundationRecommendation = (
  soil: string,
  hazards: string[],
  lang: CalculationLang = 'en',
): FoundationRecommendation => {
  const hasEarthquake = hazards.includes('earthquake');
  const hasFlood = hazards.includes('flood');

  if (lang === 'ur') {
    if (soil === 'sandy') {
      return {
        type: 'گہرا وسیع فٹنگ',
        depth: hasEarthquake ? '4-5 فٹ' : '3-4 فٹ',
        description:
          'ریتلی مٹی میں بوجھ اچھی طرح پھیلانے کے لیے وسیع اور گہرا فاؤنڈیشن درکار ہے۔',
      };
    }
    if (soil === 'clay') {
      return {
        type: 'تقویت یافتہ فٹنگ',
        depth: hasEarthquake ? '5-6 فٹ' : '4-5 فٹ',
        description:
          'چکنی مٹی میں آر سی فاؤنڈیشن اور نمی کی رکاوٹ ضروری ہے تاکہ بیٹھنا نہ ہو۔',
      };
    }
    if (soil === 'rocky') {
      return {
        type: 'چھوٹی فٹنگ',
        depth: hasFlood ? '3-4 فٹ' : '2-3 فٹ',
        description:
          'چٹانی مٹی میں برداشت اچھی ہوتی ہے؛ نسبتاً کم گہرائی کافی ہو سکتی ہے۔',
      };
    }
    return {
      type: 'مخلوط فاؤنڈیشن',
      depth: hasEarthquake ? '4-5 فٹ' : '3-4 فٹ',
      description: 'مخلوط مٹی کے لیے احتیاط سے تجزیہ اور درمیانی گہرائی والا فاؤنڈیشن۔',
    };
  }

  if (soil === 'sandy') {
    return {
      type: 'Deep wide footing',
      depth: hasEarthquake ? '4-5 ft' : '3-4 ft',
      description: 'Sandy soil requires wider and deeper foundation to distribute load effectively.',
    };
  }
  if (soil === 'clay') {
    return {
      type: 'Reinforced footing',
      depth: hasEarthquake ? '5-6 ft' : '4-5 ft',
      description: 'Clay soil needs reinforced foundation with proper moisture barrier to prevent settling.',
    };
  }
  if (soil === 'rocky') {
    return {
      type: 'Shallow footing',
      depth: hasFlood ? '3-4 ft' : '2-3 ft',
      description: 'Rocky soil provides excellent bearing capacity, allowing for shallower foundation.',
    };
  }
  return {
    type: 'Mixed foundation',
    depth: hasEarthquake ? '4-5 ft' : '3-4 ft',
    description: 'Mixed soil requires careful analysis and moderate depth foundation.',
  };
};

const getConstructionSteps = (input: ConstructionInput, lang: CalculationLang = 'en'): string[] => {
  if (lang === 'ur') {
    const steps: string[] = [
      'سائٹ صاف کرنا — پودے، ملبہ ہٹانا اور زمین ہموار کرنا',
      'لی آؤٹ — پلاٹ، کمرے اور سروس لائنیں نشان زد کرنا',
      'کھدائی — ڈھانچے اور باونڈری کی خندقیں کھودنا',
      'فاؤنڈیشن — کنکریٹ فٹنگ ڈالنا اور ٹھیک گیل کرنا',
      'پلنتھ اور ڈیمپ پروف — پلنتھ اٹھانا اور نمی کی رکاوٹ',
      'دیواریں — کمرے اور باونڈری دیواریں متعین موٹائی سے',
      'لنٹل اور کھڑکیاں — دروازوں/کھڑکیوں کے فریم اور لنٹل',
    ];

    if (input.ceilingConfig?.ceilingType === 't_beam_girder') {
      steps.push('ٹی بیم/گیڈر چھت — گیڈر، اسٹیل کا فاصلہ، پھر سلیب ڈالنا');
    } else if (input.ceilingConfig?.ceilingType === 'wooden') {
      steps.push('لکڑی کی چھت — علاج شدہ جوائسٹ اور شیٹنگ');
    } else {
      steps.push('آر سی سی سلیب — اسٹیل بچھا کر مونولیتھک سلیب ڈالنا');
    }

    steps.push('فرش اور ٹائلز — سکریڈ اور توسیعی جوائنٹس کے ساتھ فرش');
    steps.push('فائنشنگ — پلمبنگ، بجلی، پلاسٹر، رنگ اور کوالٹی چیک');
    return steps;
  }

  const steps: string[] = [
    'Site Clearing - Remove vegetation, debris, and level the ground',
    'Layout Marking - Mark plot boundaries, room grid, and service lines',
    'Excavation - Dig foundation trenches for structure and boundary wall',
    'Foundation - Cast concrete footing with proper curing schedule',
    'Plinth and Damp-Proof Course - Raise plinth and apply moisture barrier',
    'Wall Construction - Build room and boundary walls with specified thickness',
    'Lintels and Openings - Install lintels and frames for doors/windows',
  ];

  if (input.ceilingConfig?.ceilingType === 't_beam_girder') {
    steps.push('T-Beam/Girder Roof - Place girders, set bar spacing, then cast slab with target thickness');
  } else if (input.ceilingConfig?.ceilingType === 'wooden') {
    steps.push('Wooden Ceiling System - Install treated timber joists and sheathing');
  } else {
    steps.push('RCC Slab - Place reinforcement and cast monolithic slab');
  }

  steps.push('Flooring and Tiles - Prepare screed and lay flooring finish with expansion joints');
  steps.push('Finishing - Plumbing, electrical, plaster, paint, and quality checks');

  return steps;
};

const getResilienceTips = (
  hazards: string[],
  soil: string,
  _constructionType: string,
  lang: CalculationLang = 'en',
): { [key: string]: string[] } => {
  if (lang === 'ur') {
    const tips: { [key: string]: string[] } = {};

    if (hazards.includes('earthquake')) {
      tips['زلزلے کی لچک'] = [
        'پلنتھ، لنٹل اور چھت کی سطحوں پر افقی بینڈ',
        'تمام کونوں پر اضافی تقویت',
        'بھاری چھتوں سے گریز اور پاراپٹ محفوظ کریں',
        'متوازن نقشہ تاکہ زلزلی قوتیں بانٹیں',
        'دیواروں اور چھت کے درمیان مناسب اینکر',
      ];
      if (soil === 'clay') {
        tips['زلزلے کی لچک'].push(
          'چکنی مٹی لہریں بڑھا سکتی ہے؛ گہرا تقویت یافتہ فاؤنڈیشن ترجیح دیں',
        );
      }
    }

    if (hazards.includes('flood')) {
      tips['سیلاب سے تحفظ'] = [
        'پلنتھ سڑک سے کم از کم 2 فٹ اونچا',
        'فاؤنڈیشن اور پلنتھ میں واٹر پروف ایڈمکس',
        'عمارت سے باہر نکاسی کا ڈھلوان',
        'بجلی کے پوائنٹ سیلاب سے اوپر',
      ];
    }

    if (hazards.includes('fire')) {
      tips['آگ سے حفاظت'] = [
        'باورچی خانے کے قریب آگ مزاحم دروازے',
        'مناسب وینٹیلیشن اور محفوظ گیس لائن',
        'معیاری تاریں اور محفوظ بریکر',
        'ایمرجنسی نکلنے کے دو راستے',
      ];
    }

    tips['عمومی انجینئرنگ طریقے'] = [
      'تمام کنکریٹ کے لیے گیل کم از کم 7 دن',
      'ہر مرحلے پر سیدھ اور لیول چیک کریں',
      'معیاری کھڑکی/دروازے کے سائز سے ضیاع کم کریں',
      'خرید سے پہلے پیمائش کی حتمی جانچ',
    ];

    return tips;
  }

  const tips: { [key: string]: string[] } = {};

  if (hazards.includes('earthquake')) {
    tips['Earthquake Resilience'] = [
      'Add horizontal bands at plinth, lintel, and roof levels',
      'Provide corner reinforcement at all wall junctions',
      'Avoid heavy roofs and secure all parapet walls',
      'Ensure symmetrical layout to distribute seismic forces',
      'Use proper anchoring between walls and roof',
    ];
    if (soil === 'clay') {
      tips['Earthquake Resilience'].push('Clay soil can amplify seismic waves; prioritize deeper reinforced foundation');
    }
  }

  if (hazards.includes('flood')) {
    tips['Flood Protection'] = [
      'Raise plinth level by at least 2 ft above road level',
      'Use waterproof additives for foundation and plinth',
      'Install drainage slope away from building and boundary wall',
      'Place electrical outlets above flood-prone heights',
    ];
  }

  if (hazards.includes('fire')) {
    tips['Fire Safety'] = [
      'Use fire-resistant doors near kitchen areas',
      'Provide dedicated ventilation and safe gas routing',
      'Use certified electrical cabling and load-safe breakers',
      'Plan two-way emergency evacuation paths',
    ];
  }

  tips['General Civil Engineering Practices'] = [
    'Keep strict curing schedule for all concrete elements (minimum 7 days)',
    'Confirm plumbness and levelness at each stage',
    'Use standardized opening sizes to control waste and cost',
    'Run final measurement-based quantity check before procurement',
  ];

  return tips;
};

export function calculateConstructionPlan(
  rawInput: ConstructionInput,
  options?: { lang?: CalculationLang },
): CalculationResult {
  const lang = options?.lang ?? 'en';
  const input = withDefaults(rawInput);
  const templates = normalizeRoomTemplates(input);
  const rates = resolveRateCard(input.rates, input.location?.province || DEFAULT_PROVINCE_RATES.province);
  const spaces = buildSpaceEstimates(templates, Math.max(8, Number(input.wallHeightFt) || 10));

  const openings = aggregateOpenings(templates, input.doors, input.windows, input.boundaryWall);
  const geometry = estimateGeometry(input, templates, openings, spaces);
  const tile = estimateTiles(input, templates, geometry);
  const materials = estimateMaterials(input, templates, geometry, tile);
  const roomCountSummary = countRoomTypes(templates);
  const openingsSummaryData = openingsSummary(openings.roomDoors, openings.roomWindows, openings.boundaryDoors, openings.boundaryWindows);
  const foundation = getFoundationRecommendation(input.soil, input.hazards, lang);
  // Labour keys off habitable rooms only — kitchens/washrooms/stores no longer
  // inflate the worker count as if they were extra bedrooms.
  const labor = estimateLabor(input, geometry, roomCountSummary.totalRooms, rates);

  const spaceCosts = buildSpaceCosts(spaces, rates, templates, materials, geometry.floorAreaSqFt);
  const boundaryBreakdown = buildBoundaryBreakdown(input, rates);
  const loungeCost = estimateCirculationCost(geometry.circulationAreaSqFt, rates);
  const costBreakdown = buildCostBreakdown(spaceCosts, boundaryBreakdown, loungeCost, labor);
  const resilienceTips = getResilienceTips(input.hazards, input.soil, input.constructionType, lang);

  const plotArea = Math.max(0, Number(input.totalPlotAreaSqFt) || 0);
  const totalArea = plotArea > 0 ? Math.min(plotArea, geometry.floorAreaSqFt) : geometry.floorAreaSqFt;
  const boundaryWallCost = boundaryBreakdown.total;

  return {
    totalArea: Number(totalArea.toFixed(1)),
    roomCountSummary,
    openings: openingsSummaryData,
    tile,
    spaces,
    spaceCosts,
    materials,
    geometry,
    foundation,
    labor,
    costBreakdown,
    // One final figure: spaces + boundary + circulation + labour.
    estimatedCost: costBreakdown.total,
    constructionSteps: getConstructionSteps(input, lang),
    resilienceTips,
    appliedRates: rates,
    boundaryWallCost,
    loungeCost,
    boundaryBreakdown,
  };
}
