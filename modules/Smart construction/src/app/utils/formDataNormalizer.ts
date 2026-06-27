import { ConstructionInput, ProvinceRateCard, RoomTemplateInput } from './calculator';

export const ensureArray = <T,>(val: T[] | undefined | null): T[] => (Array.isArray(val) ? val : []);

const toNumber = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

type NormalizedSpace = {
  id: string;
  roomType: string;
  category: RoomTemplateInput['category'];
  count: number;
  length: number;
  width: number;
  height: number;
  thickness: number;
  doors: unknown[];
  windows: unknown[];
};

export type NormalizedConstructionInput = Partial<ConstructionInput> & {
  totalArea: number;
  spaces: NormalizedSpace[];
};

const DEFAULT_MATERIAL_RATES: ProvinceRateCard['materialRates'] & {
  doorAvgCost: number;
  windowAvgCost: number;
} = {
  brickPerPiece: 15,
  cementPerBag: 800,
  sandPerCft: 40,
  aggregatePerCft: 50,
  steelPerKg: 200,
  tilePerSqFt: 150,
  plasterPerSqFt: 25,
  doorAvgCost: 8000,
  windowAvgCost: 5000,
  doorPerSqFt: 650,
  windowPerSqFt: 540,
  woodPerCft: 4200,
  beamPerRft: 450,
  concretePerCft: 180,
  paintPerSqFt: 28,
  doorWoodPerUnit: 18000,
  windowAluminumPerUnit: 14500,
  waterproofPerSqFt: 42,
  gaderPerPiece: 5200,
  beamConcretePerCft: 220,
  columnConcretePerCft: 240,
};

const DEFAULT_LABOR_RATES: ProvinceRateCard['laborRates'] = {
  dailyWageMason: 2500,
  dailyWageHelper: 1800,
  workersPer100SqFt: 2.4,
  productivitySqFtPerWorkerDay: 11,
};

const ROOM_CATEGORY_FALLBACK: Record<string, RoomTemplateInput['category']> = {
  living: 'living',
  bedroom: 'bedroom',
  kitchen: 'kitchen',
  bathroom: 'bathroom',
  lounge: 'lounge',
  store: 'store',
  stair: 'stair',
  other: 'other',
};

export const normalizeFormData = (data: Partial<ConstructionInput> & Record<string, unknown>): NormalizedConstructionInput => {
  const baseTemplates = ensureArray((data.roomTemplates ?? data.spaces) as RoomTemplateInput[] | undefined);

  const spaces: NormalizedSpace[] = baseTemplates.map((space, index) => {
    const rawSpace = space as unknown as Record<string, unknown>;
    const roomType = String(rawSpace.roomType ?? rawSpace.type ?? 'Room');
    const category =
      (space.category as RoomTemplateInput['category']) ??
      ROOM_CATEGORY_FALLBACK[String(rawSpace.category ?? '').toLowerCase()] ??
      'other';

    return {
      id: String(rawSpace.id ?? `space-${index + 1}`),
      roomType,
      category,
      count: Math.max(1, toNumber(rawSpace.count, 1)),
      length: Math.max(0, toNumber(rawSpace.lengthFt ?? rawSpace.length, 0)),
      width: Math.max(0, toNumber(rawSpace.widthFt ?? rawSpace.width, 0)),
      height: Math.max(0, toNumber(rawSpace.wallHeightFt ?? rawSpace.height, 10)),
      thickness: Math.max(0, toNumber(rawSpace.wallThicknessIn ?? rawSpace.thickness, 0.75)),
      doors: ensureArray(rawSpace.doors as unknown[] | undefined),
      windows: ensureArray(rawSpace.windows as unknown[] | undefined),
    };
  });

  const roomTemplates: RoomTemplateInput[] = baseTemplates.map((rawOriginal, index) => {
    const space = spaces[index];
    return {
      ...(rawOriginal as RoomTemplateInput),
      id: space.id,
      roomType: space.roomType,
      category: space.category,
      count: space.count,
      lengthFt: space.length,
      widthFt: space.width,
      wallHeightFt: space.height,
      wallThicknessIn: space.thickness,
      doors: space.doors as RoomTemplateInput['doors'],
      windows: space.windows as RoomTemplateInput['windows'],
    };
  });

  const incomingMaterialRates = ((data.rates as ProvinceRateCard | undefined)?.materialRates ?? {}) as Record<string, number>;
  const normalizedMaterialRates = {
    ...DEFAULT_MATERIAL_RATES,
    ...incomingMaterialRates,
  };

  normalizedMaterialRates.doorWoodPerUnit =
    normalizedMaterialRates.doorWoodPerUnit ?? normalizedMaterialRates.doorAvgCost ?? DEFAULT_MATERIAL_RATES.doorWoodPerUnit;
  normalizedMaterialRates.windowAluminumPerUnit =
    normalizedMaterialRates.windowAluminumPerUnit ?? normalizedMaterialRates.windowAvgCost ?? DEFAULT_MATERIAL_RATES.windowAluminumPerUnit;
  normalizedMaterialRates.doorAvgCost =
    normalizedMaterialRates.doorAvgCost ?? normalizedMaterialRates.doorWoodPerUnit ?? DEFAULT_MATERIAL_RATES.doorAvgCost;
  normalizedMaterialRates.windowAvgCost =
    normalizedMaterialRates.windowAvgCost ?? normalizedMaterialRates.windowAluminumPerUnit ?? DEFAULT_MATERIAL_RATES.windowAvgCost;

  const derivedAreaFromSpaces = Math.max(
    0,
    spaces.reduce((sum, space) => sum + Math.max(0, space.length) * Math.max(0, space.width) * Math.max(1, space.count), 0),
  );
  const explicitArea = Math.max(0, toNumber((data.totalArea as number | undefined) ?? data.totalPlotAreaSqFt, 0));
  const totalArea = Math.max(explicitArea, derivedAreaFromSpaces);

  const boundaryRaw = (data.boundaryWall ?? {}) as Record<string, unknown>;

  const normalized = {
    ...data,
    totalArea,
    totalPlotAreaSqFt: Math.max(0, toNumber(data.totalPlotAreaSqFt ?? totalArea, totalArea)),
    spaces,
    roomTemplates,
    doors: ensureArray(data.doors),
    windows: ensureArray(data.windows),
    roomTypes: ensureArray((data as Record<string, unknown>).roomTypes as unknown[] | undefined),
    hazards: ensureArray(data.hazards as string[] | undefined),
    rates: {
      province: ((data.rates as ProvinceRateCard | undefined)?.province ?? String(data.location?.province ?? 'Punjab')),
      country: ((data.rates as ProvinceRateCard | undefined)?.country ?? 'Pakistan'),
      currency: ((data.rates as ProvinceRateCard | undefined)?.currency ?? 'PKR'),
      source: ((data.rates as ProvinceRateCard | undefined)?.source ?? 'Normalized fallback'),
      fetchedAt: ((data.rates as ProvinceRateCard | undefined)?.fetchedAt ?? new Date().toISOString()),
      materialRates: normalizedMaterialRates,
      laborRates: {
        ...DEFAULT_LABOR_RATES,
        ...((data.rates as ProvinceRateCard | undefined)?.laborRates ?? {}),
      },
      notes: ensureArray((data.rates as ProvinceRateCard | undefined)?.notes),
    },
    boundaryWall: {
      ...(data.boundaryWall ?? {}),
      enabled: Boolean(boundaryRaw.enabled ?? false),
      height: toNumber(boundaryRaw.height, toNumber(boundaryRaw.heightFt, 7)),
      thickness: toNumber(boundaryRaw.thickness, toNumber(boundaryRaw.thicknessIn, 0.75)),
      length: toNumber(boundaryRaw.length, toNumber(boundaryRaw.plotLengthFt, 0)),
      heightFt: toNumber(boundaryRaw.heightFt, toNumber(boundaryRaw.height, 7)),
      thicknessIn: toNumber(boundaryRaw.thicknessIn, toNumber(boundaryRaw.thickness, 0.75)),
      plotLengthFt: toNumber(boundaryRaw.plotLengthFt, toNumber(boundaryRaw.length, 0)),
      plotWidthFt: toNumber(boundaryRaw.plotWidthFt, 0),
      boundaryDoors: ensureArray(boundaryRaw.boundaryDoors as unknown[] | undefined),
      boundaryWindows: ensureArray(boundaryRaw.boundaryWindows as unknown[] | undefined),
    },
    location: {
      country: data.location?.country ?? 'Pakistan',
      province: data.location?.province ?? '',
      district: data.location?.district ?? '',
    },
  };

  return normalized as NormalizedConstructionInput;
};
