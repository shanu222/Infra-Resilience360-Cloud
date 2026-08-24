import { useEffect, useMemo, useRef, useState } from 'react';
import { Home, Plus, Trash2 } from 'lucide-react';
import { useSmartConstructionStrings } from '../../i18n/smartConstructionStrings';
import type {
  BeamConfig,
  BoundaryWallConfig,
  CeilingConfig,
  ColumnConfig,
  DoorType,
  FinishingConfig,
  FloorConfig,
  FootingConfig,
  OpeningInput,
  RoomCategory,
  RoomTemplateInput,
  WaterproofingType,
  WallMaterialType,
  WindowType,
} from '../utils/calculator';

type FormData = {
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
};

interface ConstructionFormProps {
  data: FormData;
  onChange: (data: Partial<FormData>) => void;
}

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const catalog: Record<'room' | 'kitchen' | 'bathroom' | 'store', { category: RoomCategory; roomType: string; lengthFt: number; widthFt: number }> = {
  room: { category: 'bedroom', roomType: 'Bedroom', lengthFt: 10, widthFt: 12 },
  kitchen: { category: 'kitchen', roomType: 'Kitchen', lengthFt: 8, widthFt: 10 },
  bathroom: { category: 'bathroom', roomType: 'Bathroom', lengthFt: 5, widthFt: 7 },
  store: { category: 'store', roomType: 'Store', lengthFt: 6, widthFt: 8 },
};

const defaultFloor = (): FloorConfig => ({
  floorType: 'tiles',
  finishThicknessIn: 2,
  tileLengthMm: 600,
  tileWidthMm: 600,
  tileWastagePercent: 10,
});

const defaultCeiling = (constructionType: string): CeilingConfig => ({
  ceilingType: constructionType === 'masonry_gader' ? 't_beam_girder' : 'rcc_slab',
  ceilingHeightFt: 10,
  slabThicknessIn: 5,
  steelGrade: 'Grade-60',
  barDiameterMm: 12,
  barSpacingIn: 6,
  gaderCount: 4,
  stripSpacingFt: 2,
  gaderMaterial: 'steel',
  woodenBeamCount: 8,
  woodenBeamSpacingFt: 2.5,
});

const defaultFooting = (category: RoomCategory): FootingConfig => {
  if (category === 'bathroom' || category === 'kitchen') {
    return { type: 'strip', depthFt: 3, widthFt: 2, concreteGrade: 'M20' };
  }
  if (category === 'store') {
    return { type: 'strip', depthFt: 2.75, widthFt: 1.75, concreteGrade: 'M20' };
  }
  return { type: 'strip', depthFt: 2.5, widthFt: 1.75, concreteGrade: 'M20' };
};

const defaultFinishing = (category: RoomCategory): FinishingConfig => {
  if (category === 'bathroom') {
    return { plasterEnabled: true, wallTilesHeightFt: 7, waterproofingEnabled: true, waterproofingType: 'chemical' };
  }
  if (category === 'kitchen') {
    return { plasterEnabled: true, wallTilesHeightFt: 3, waterproofingEnabled: true, waterproofingType: 'bitumen' };
  }
  return { plasterEnabled: true, wallTilesHeightFt: 0, waterproofingEnabled: false, waterproofingType: 'bitumen' };
};

const defaultBeam = (): BeamConfig => ({
  enabled: false,
  widthIn: 9,
  depthIn: 12,
  steelBars: 4,
  stirrupSpacingIn: 6,
});

const defaultColumns = (): ColumnConfig => ({
  enabled: false,
  columnSize: '9x9',
  steelBars: 4,
  stirrupSpacingIn: 6,
});

const getSquarePlotDimensions = (plotAreaSqFt: number): { sideFt: number; perimeterFt: number } => {
  const area = Math.max(300, Number(plotAreaSqFt) || 1200);
  const sideFt = Math.sqrt(area);
  return {
    sideFt,
    perimeterFt: 4 * sideFt,
  };
};

const defaultBoundary = (plotAreaSqFt: number, mainGateLabel: string): BoundaryWallConfig => {
  const { sideFt } = getSquarePlotDimensions(plotAreaSqFt);
  return {
    enabled: false,
    plotLengthFt: Number(sideFt.toFixed(1)),
    plotWidthFt: Number(sideFt.toFixed(1)),
    heightFt: 7,
    thicknessIn: 9,
    foundationDepthFt: 3,
    foundationWidthFt: 1.5,
    materialType: 'masonry',
    gateWidthFt: 10,
    gateHeightFt: 7,
    gatesCount: 1,
    footing: { type: 'strip', depthFt: 2.5, widthFt: 1.75, concreteGrade: 'M20' },
    plasterEnabled: true,
    boundaryDoors: [{ id: createId('boundary-gate'), label: mainGateLabel, widthFt: 10, heightFt: 7, count: 1, roomCategory: 'boundary' }],
    boundaryWindows: [],
  };
};

const getSpaceTitle = (space: RoomTemplateInput, index: number, f: Record<string, string>): string => {
  const number = Math.max(1, Number(space.spaceNumber) || index + 1);
  if (space.spaceType === 'kitchen' || space.category === 'kitchen') return f.cf_space_kitchen.replace('{n}', String(number));
  if (space.spaceType === 'bathroom' || space.category === 'bathroom') return f.cf_space_bath.replace('{n}', String(number));
  if (space.spaceType === 'store' || space.category === 'store') return f.cf_space_store.replace('{n}', String(number));
  return f.cf_space_room.replace('{n}', String(number));
};

function doorLabelForCategory(category: string | undefined, f: Record<string, string>): string {
  switch (category) {
    case 'bedroom':
    case 'living':
      return f.cf_door_bedroom;
    case 'kitchen':
      return f.cf_door_kitchen;
    case 'bathroom':
      return f.cf_door_bathroom;
    case 'store':
      return f.cf_door_store;
    default:
      return f.cf_door;
  }
}

function windowLabelForCategory(category: string | undefined, f: Record<string, string>): string {
  switch (category) {
    case 'bedroom':
    case 'living':
      return f.cf_win_bedroom;
    case 'kitchen':
      return f.cf_win_kitchen;
    case 'bathroom':
      return f.cf_win_bathroom;
    case 'store':
      return f.cf_win_store;
    default:
      return f.cf_window;
  }
}

const ensureArray = <T,>(value: T[] | undefined): T[] => (Array.isArray(value) ? value : []);

const cardClass = 'rounded-2xl border border-[#E7EAF8] bg-white p-5 shadow-[0_8px_20px_rgba(0,0,0,0.08)]';
const inputClass = 'mt-1 w-full rounded-xl border border-[#DDE3F0] bg-white px-3 py-2.5 text-sm text-[#2C2C2C] transition-all duration-200 placeholder:text-[#9AA5BD] focus:border-[#6C63FF] focus:outline-none focus:ring-2 focus:ring-[#6C63FF33]';
const selectClass = `${inputClass} pr-8`;
const readonlyClass = 'mt-1 w-full rounded-xl border border-[#E6EBF7] bg-[#F8FAFF] px-3 py-2.5 text-sm text-[#61708F]';
const sectionTitleClass = 'mb-3 flex items-center gap-2 text-sm font-semibold text-[#2C2C2C]';

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-xs font-medium text-[#3D4A66]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span className="relative h-6 w-11 rounded-full bg-[#CBD5EA] transition peer-checked:bg-[#6C63FF]">
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
      {label}
    </label>
  );
}

const calcSpaceArea = (space: RoomTemplateInput): number => Math.max(0, space.lengthFt) * Math.max(0, space.widthFt);

const toCounts = (spaces: RoomTemplateInput[]) => {
  let kitchens = 0;
  let bathrooms = 0;
  let lounges = 0;
  let stores = 0;
  let others = 0;

  spaces.forEach((space) => {
    if (space.category === 'kitchen') kitchens += 1;
    else if (space.category === 'bathroom') bathrooms += 1;
    else if (space.category === 'lounge') lounges += 1;
    else if (space.category === 'store') stores += 1;
    else others += 1;
  });

  return {
    kitchens,
    bathrooms,
    lounges,
    stores,
    others,
    /** Habitable rooms only — kitchens / washrooms / stores stay in their own fields. */
    total: lounges + others,
    totalSpaces: spaces.length,
  };
};

export default function ConstructionForm({ data, onChange }: ConstructionFormProps) {
  const { form: f } = useSmartConstructionStrings();
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [areaError, setAreaError] = useState('');
  const countersRef = useRef<{ room: number; kitchen: number; bathroom: number; store: number }>({
    room: 0,
    kitchen: 0,
    bathroom: 0,
    store: 0,
  });

  const spaces = useMemo(() => ensureArray(data.roomTemplates), [data.roomTemplates]);

  useEffect(() => {
    const next = { room: 0, kitchen: 0, bathroom: 0, store: 0 };
    spaces.forEach((space) => {
      const key = (space.spaceType ?? (space.category === 'kitchen' ? 'kitchen' : space.category === 'bathroom' ? 'bathroom' : space.category === 'store' ? 'store' : 'room')) as 'room' | 'kitchen' | 'bathroom' | 'store';
      next[key] = Math.max(next[key], Number(space.spaceNumber) || 0);
    });
    countersRef.current = next;
  }, [spaces]);

  useEffect(() => {
    const updates: Partial<FormData> = {};

    if (!data.totalPlotAreaSqFt) updates.totalPlotAreaSqFt = 1200;
    if (!data.wallThicknessIn) updates.wallThicknessIn = 9;
    if (!data.floorConfig) updates.floorConfig = defaultFloor();
    if (!data.ceilingConfig) updates.ceilingConfig = defaultCeiling(data.constructionType || '');
    if (!data.boundaryWall)
      updates.boundaryWall = defaultBoundary(updates.totalPlotAreaSqFt ?? data.totalPlotAreaSqFt ?? 1200, f.cf_mainGate);
    if (!Array.isArray(data.roomTemplates)) updates.roomTemplates = [];

    if (Object.keys(updates).length > 0) onChange(updates);
  }, [data, onChange, f.cf_mainGate]);

  const usedArea = useMemo(
    () =>
      spaces.reduce((sum, space) => {
        if (space.category === 'bathroom' && space.bathroomPlacement === 'inside') return sum;
        return sum + calcSpaceArea(space);
      }, 0),
    [spaces],
  );

  const totalArea = Number(data.totalPlotAreaSqFt ?? 0);
  const remainingArea = Math.max(0, totalArea - usedArea);

  const nonBathroomSpaces = useMemo(
    () => spaces.filter((space) => space.category !== 'bathroom'),
    [spaces],
  );

  const applySpaces = (nextSpaces: RoomTemplateInput[]) => {
    const counts = toCounts(nextSpaces);
    onChange({
      roomTemplates: nextSpaces,
      livingSpaces: nextSpaces.filter((space) => space.category === 'living' || space.category === 'bedroom'),
      kitchenSpaces: nextSpaces.filter((space) => space.category === 'kitchen'),
      bathroomSpaces: nextSpaces.filter((space) => space.category === 'bathroom'),
      loungeSpaces: nextSpaces.filter((space) => space.category === 'lounge'),
      otherSpaces: nextSpaces.filter((space) => !['living', 'bedroom', 'kitchen', 'bathroom', 'lounge'].includes(space.category ?? 'other')),
      totalRooms: counts.total,
      rooms: counts.total,
      kitchens: counts.kitchens,
      bathrooms: counts.bathrooms,
      lounges: counts.lounges,
      stores: counts.stores,
      otherRooms: counts.others,
    });
  };

  const validateAreaAndApply = (nextSpaces: RoomTemplateInput[]) => {
    const nextUsed = nextSpaces.reduce((sum, space) => {
      if (space.category === 'bathroom' && space.bathroomPlacement === 'inside') return sum;
      return sum + calcSpaceArea(space);
    }, 0);

    if (totalArea > 0 && nextUsed > totalArea) {
      setAreaError(f.cf_areaErr);
      return;
    }

    setAreaError('');
    applySpaces(nextSpaces);
  };

  const addSpace = (kind: 'room' | 'kitchen' | 'bathroom' | 'store') => {
    const def = catalog[kind];
    const id = createId(`space-${kind}`);
    countersRef.current[kind] += 1;

    const space: RoomTemplateInput = {
      id,
      roomType: def.roomType,
      spaceType: kind,
      spaceNumber: countersRef.current[kind],
      category: def.category,
      lengthFt: def.lengthFt,
      widthFt: def.widthFt,
      count: 1,
      adjacencyMode: spaces.length > 0 ? 'adjacent' : 'separate',
      adjacentToPrevious: spaces.length > 0,
      bathroomPlacement: kind === 'bathroom' ? 'separate' : undefined,
      parentSpaceId: undefined,
      wallHeightFt: 10,
      wallThicknessIn: 9,
      wallMaterial: (kind === 'bathroom' ? 'block' : 'brick') as WallMaterialType,
      footing: defaultFooting(def.category),
      finishing: {
        ...defaultFinishing(def.category),
        plasterEnabled: true,
        waterproofingEnabled: true,
      },
      rccBeam: {
        ...defaultBeam(),
        enabled: true,
      },
      rccColumns: {
        ...defaultColumns(),
        enabled: true,
      },
      floorConfig: defaultFloor(),
      ceilingConfig: defaultCeiling(data.constructionType || ''),
      doors: [
        {
          id: createId('door'),
          label: doorLabelForCategory(def.category, f),
          openingType: 'wooden',
          widthFt: 3,
          heightFt: 7,
          count: 1,
          roomCategory: def.category,
        },
      ],
      windows: [
        {
          id: createId('window'),
          label: windowLabelForCategory(def.category, f),
          openingType: 'aluminum',
          widthFt: 4,
          heightFt: 4,
          count: kind === 'bathroom' ? 1 : 2,
          roomCategory: def.category,
        },
      ],
      waterproofing: true,
      rccBeamAboveOpenings: true,
      rccColumnsEnabled: true,
      plaster: true,
      beam: {
        width: 9,
        depth: 12,
        steelBars: 4,
      },
      column: {
        size: '9x9',
        steelBars: 4,
      },
    };

    const nextSpaces = [...spaces, space];
    validateAreaAndApply(nextSpaces);
    setActiveSpaceId(id);
  };

  const removeSpace = (spaceId: string) => {
    const nextSpaces = spaces.filter((space) => space.id !== spaceId);
    validateAreaAndApply(nextSpaces);
    if (activeSpaceId === spaceId) {
      setActiveSpaceId(nextSpaces[0]?.id ?? null);
    }
  };

  const updateSpace = (spaceId: string, updater: (space: RoomTemplateInput) => RoomTemplateInput) => {
    const nextSpaces = spaces.map((space) => (space.id === spaceId ? updater(space) : space));
    validateAreaAndApply(nextSpaces);
  };

  const updateSpaceField = (spaceId: string, field: keyof RoomTemplateInput, value: string | number | boolean) => {
    updateSpace(spaceId, (space) => {
      const updated = { ...space } as RoomTemplateInput;
      if (field === 'roomType') updated.roomType = String(value);
      else if (field === 'adjacencyMode') {
        updated.adjacencyMode = value as 'adjacent' | 'separate';
        updated.adjacentToPrevious = updated.adjacencyMode === 'adjacent';
      } else if (field === 'bathroomPlacement') {
        updated.bathroomPlacement = value as 'inside' | 'separate';
        if (updated.bathroomPlacement === 'separate') updated.parentSpaceId = undefined;
      } else if (field === 'parentSpaceId') {
        updated.parentSpaceId = String(value);
      } else if (field === 'lengthFt') {
        updated.lengthFt = Number(value) || 0;
      } else if (field === 'widthFt') {
        updated.widthFt = Number(value) || 0;
      } else if (field === 'count') {
        updated.count = Number(value) || 1;
      } else if (field === 'wallHeightFt') {
        updated.wallHeightFt = Number(value) || 10;
      } else if (field === 'wallThicknessIn') {
        updated.wallThicknessIn = Number(value) || 9;
      } else if (field === 'wallMaterial') {
        updated.wallMaterial = value as WallMaterialType;
      }
      return updated;
    });
  };

  const updateSpaceFooting = (spaceId: string, field: keyof FootingConfig, value: string) => {
    updateSpace(spaceId, (space) => {
      const category = space.category ?? 'other';
      const footing = space.footing ?? defaultFooting(category);
      return {
        ...space,
        footing: {
          ...footing,
          [field]: field === 'type' || field === 'concreteGrade' ? value : Number(value) || 0,
        } as FootingConfig,
      };
    });
  };

  const updateSpaceFinishing = (spaceId: string, field: keyof FinishingConfig, value: string | boolean) => {
    updateSpace(spaceId, (space) => {
      const category = space.category ?? 'other';
      const finishing = space.finishing ?? defaultFinishing(category);
      const nextFinishing = {
        ...finishing,
        [field]: field === 'waterproofingType' ? value : typeof value === 'boolean' ? value : Number(value) || 0,
      } as FinishingConfig;
      return {
        ...space,
        finishing: nextFinishing,
        waterproofing: nextFinishing.waterproofingEnabled,
        plaster: nextFinishing.plasterEnabled,
      };
    });
  };

  const updateSpaceBeam = (spaceId: string, field: keyof BeamConfig, value: string | boolean) => {
    updateSpace(spaceId, (space) => {
      const beam = space.rccBeam ?? defaultBeam();
      const nextBeam = {
        ...beam,
        [field]: typeof value === 'boolean' ? value : Number(value) || 0,
      } as BeamConfig;
      return {
        ...space,
        rccBeam: nextBeam,
        rccBeamAboveOpenings: nextBeam.enabled,
        beam: {
          width: nextBeam.widthIn,
          depth: nextBeam.depthIn,
          steelBars: nextBeam.steelBars,
        },
      };
    });
  };

  const updateSpaceColumns = (spaceId: string, field: keyof ColumnConfig, value: string | boolean) => {
    updateSpace(spaceId, (space) => {
      const columns = space.rccColumns ?? defaultColumns();
      const nextColumns = {
        ...columns,
        [field]: field === 'columnSize' ? value : typeof value === 'boolean' ? value : Number(value) || 0,
      } as ColumnConfig;
      return {
        ...space,
        rccColumns: nextColumns,
        rccColumnsEnabled: nextColumns.enabled,
        column: {
          size: nextColumns.columnSize,
          steelBars: nextColumns.steelBars,
        },
      };
    });
  };

  const updateSpaceOpening = (spaceId: string, type: 'doors' | 'windows', openingId: string, field: keyof OpeningInput, value: string) => {
    updateSpace(spaceId, (space) => {
      const list = ensureArray(space[type]);
      return {
        ...space,
        [type]: list.map((item) => {
          if (item.id !== openingId) return item;
          if (field === 'label') return { ...item, label: value };
          if (field === 'openingType') return { ...item, openingType: value as DoorType | WindowType };
          return { ...item, [field]: Number(value) || 0 };
        }),
      } as RoomTemplateInput;
    });
  };

  const addSpaceOpening = (spaceId: string, type: 'doors' | 'windows') => {
    updateSpace(spaceId, (space) => {
      const list = ensureArray(space[type]);
      const opening: OpeningInput =
        type === 'doors'
          ? {
              id: createId('door'),
              label: doorLabelForCategory(space.category, f),
              openingType: 'wooden',
              widthFt: 3,
              heightFt: 7,
              count: 1,
              roomCategory: space.category,
            }
          : {
              id: createId('window'),
              label: windowLabelForCategory(space.category, f),
              openingType: 'aluminum',
              widthFt: 4,
              heightFt: 4,
              count: 1,
              roomCategory: space.category,
            };
      return { ...space, [type]: [...list, opening] } as RoomTemplateInput;
    });
  };

  const removeSpaceOpening = (spaceId: string, type: 'doors' | 'windows', openingId: string) => {
    updateSpace(spaceId, (space) => {
      const list = ensureArray(space[type]).filter((item) => item.id !== openingId);
      return { ...space, [type]: list } as RoomTemplateInput;
    });
  };

  const updateSpaceFloor = (spaceId: string, field: keyof FloorConfig, value: string) => {
    updateSpace(spaceId, (space) => {
      const floor = space.floorConfig ?? defaultFloor();
      return {
        ...space,
        floorConfig: {
          ...floor,
          [field]: field === 'floorType' ? value : Number(value) || 0,
        } as FloorConfig,
      };
    });
  };

  const updateSpaceCeiling = (spaceId: string, field: keyof CeilingConfig, value: string) => {
    updateSpace(spaceId, (space) => {
      const ceiling = space.ceilingConfig ?? defaultCeiling(data.constructionType || '');
      return {
        ...space,
        ceilingConfig: {
          ...ceiling,
          [field]: field === 'ceilingType' || field === 'steelGrade' || field === 'gaderMaterial' ? value : Number(value) || 0,
        } as CeilingConfig,
      };
    });
  };

  const updateBoundary = (field: keyof BoundaryWallConfig, value: string | boolean) => {
    const boundary = data.boundaryWall ?? defaultBoundary(totalArea || 1200, f.cf_mainGate);
    const nextBoundary: BoundaryWallConfig = {
      ...boundary,
      [field]: typeof value === 'boolean' ? value : field === 'materialType' ? value : Number(value) || 0,
    } as BoundaryWallConfig;
    onChange({ boundaryWall: nextBoundary });
  };

  const updateBoundaryFooting = (field: keyof FootingConfig, value: string) => {
    const boundaryData = data.boundaryWall ?? defaultBoundary(totalArea || 1200, f.cf_mainGate);
    const footing = boundaryData.footing ?? { type: 'strip', depthFt: 3, widthFt: 2, concreteGrade: 'M20' };
    onChange({
      boundaryWall: {
        ...boundaryData,
        footing: {
          ...footing,
          [field]: field === 'type' || field === 'concreteGrade' ? value : Number(value) || 0,
        } as FootingConfig,
      },
    });
  };

  const boundary = data.boundaryWall ?? defaultBoundary(totalArea || 1200, f.cf_mainGate);
  const boundaryFooting = boundary.footing ?? { type: 'strip', depthFt: 3, widthFt: 2, concreteGrade: 'M20' };
  const squareBoundary = getSquarePlotDimensions(totalArea || 1200);

  return (
    <div className="space-y-5 text-[#2C2C2C]">
      <style>{`@keyframes scFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0);} }`}</style>
      <div className="rounded-2xl border border-[#DCE3F6] bg-[#F5F7FB] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8FBF8]">
            <Home className="h-6 w-6 text-[#00BFA6]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#2C2C2C]">{f.cf_title}</h2>
            <p className="text-sm text-[#60708F]">{f.cf_subtitle}</p>
          </div>
        </div>

        <div className={cardClass}>
          <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">{f.cf_totalPlot}</label>
          <input
            type="number"
            min="300"
            value={data.totalPlotAreaSqFt ?? 1200}
            placeholder={f.cf_plotPh}
            onChange={(e) => {
              const next = Math.max(300, Number(e.target.value) || 1200);
              onChange({ totalPlotAreaSqFt: next, boundaryWall: defaultBoundary(next, f.cf_mainGate) });
            }}
            className={inputClass}
          />
          <p className="mt-2 text-xs text-[#6B7894]">{f.cf_plotTip}</p>
        </div>
      </div>

      <div className="rounded-xl border-l-4 border-[#6C63FF] bg-[#EEF2FF] p-4 text-sm text-[#40507A]">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <div>{f.cf_totalArea} <span className="font-semibold text-[#2C2C2C]">{totalArea.toFixed(1)} {f.cf_sqft}</span></div>
          <div>{f.cf_usedArea} <span className="font-semibold text-[#2C2C2C]">{usedArea.toFixed(1)} {f.cf_sqft}</span></div>
          <div>{f.cf_remainingArea} <span className="font-semibold text-[#2C2C2C]">{remainingArea.toFixed(1)} {f.cf_sqft}</span></div>
        </div>
        <div className="mt-1 text-xs">{f.cf_remainingNote}</div>
        {areaError && <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 font-semibold text-red-700">{areaError}</div>}
      </div>

      <div className={cardClass}>
        <h3 className={sectionTitleClass}>🏠 {f.cf_spaceBuilder}</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => addSpace('room')} className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#8E7CFF] px-3 py-2 text-xs font-semibold text-white transition-transform duration-200 hover:scale-[1.03]"><Plus className="h-3 w-3" /> {f.cf_addRoom}</button>
          <button type="button" onClick={() => addSpace('kitchen')} className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#00BFA6] to-[#2ED8BE] px-3 py-2 text-xs font-semibold text-white transition-transform duration-200 hover:scale-[1.03]"><Plus className="h-3 w-3" /> {f.cf_addKitchen}</button>
          <button type="button" onClick={() => addSpace('bathroom')} className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#FFB74D] px-3 py-2 text-xs font-semibold text-white transition-transform duration-200 hover:scale-[1.03]"><Plus className="h-3 w-3" /> {f.cf_addBathroom}</button>
          <button type="button" onClick={() => addSpace('store')} className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#7D879C] to-[#A5ADBE] px-3 py-2 text-xs font-semibold text-white transition-transform duration-200 hover:scale-[1.03]"><Plus className="h-3 w-3" /> {f.cf_addStore}</button>
        </div>
      </div>

      <div className="space-y-4">
          {spaces.map((space, index) => {
            const floor = space.floorConfig ?? defaultFloor();
            const ceiling = space.ceilingConfig ?? defaultCeiling(data.constructionType || '');
            const footing = space.footing ?? defaultFooting(space.category ?? 'other');
            const finishing = space.finishing ?? defaultFinishing(space.category ?? 'other');
            const beam = space.rccBeam ?? defaultBeam();
            const columns = space.rccColumns ?? defaultColumns();
            const area = calcSpaceArea(space);
            const isActive = activeSpaceId === space.id || spaces.length === 1;
            return (
              <div key={space.id} className="space-y-4 rounded-2xl border border-[#DFE5F5] bg-white p-5 shadow-[0_8px_20px_rgba(0,0,0,0.08)]" style={{ borderLeft: '6px solid #6C63FF', animation: 'scFadeIn .28s ease-out' }}>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveSpaceId(isActive ? null : space.id)}
                    className="text-left"
                  >
                    <h3 className="text-base font-semibold text-[#2C2C2C]">{getSpaceTitle(space, index, f)}</h3>
                    <p className="text-xs text-[#67758F]">{f.cf_areaLabel} {area.toFixed(1)} {f.cf_sqft}</p>
                  </button>
                  <button type="button" onClick={() => removeSpace(space.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"><Trash2 className="h-3 w-3" /> {f.cf_remove}</button>
                </div>

                {isActive && (
                  <div className="space-y-3">
                    <h4 className={sectionTitleClass}>🏠 {f.cf_roomDetails}</h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_lengthFt}</span><input type="number" min="4" step="0.5" value={space.lengthFt} placeholder={f.cf_lenPh} onChange={(e) => updateSpaceField(space.id, 'lengthFt', Number(e.target.value) || 0)} className={inputClass} /></label>
                      <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_widthFt}</span><input type="number" min="4" step="0.5" value={space.widthFt} placeholder={f.cf_widPh} onChange={(e) => updateSpaceField(space.id, 'widthFt', Number(e.target.value) || 0)} className={inputClass} /></label>
                      <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_areaSqft}</span><input type="text" readOnly value={area.toFixed(1)} className={readonlyClass} /></label>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_adjMode}</span><select value={space.adjacencyMode ?? 'separate'} onChange={(e) => updateSpaceField(space.id, 'adjacencyMode', e.target.value)} className={selectClass}><option value="adjacent">{f.cf_adjAdjacent}</option><option value="separate">{f.cf_adjSeparate}</option></select></label>
                      {space.category === 'bathroom' && (
                        <>
                          <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_bathPlace}</span><select value={space.bathroomPlacement ?? 'separate'} onChange={(e) => updateSpaceField(space.id, 'bathroomPlacement', e.target.value)} className={selectClass}><option value="inside">{f.cf_bathInside}</option><option value="separate">{f.cf_bathSeparate}</option></select></label>
                          {space.bathroomPlacement === 'inside' && (
                            <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_parentSpace}</span><select value={space.parentSpaceId ?? ''} onChange={(e) => updateSpaceField(space.id, 'parentSpaceId', e.target.value)} className={selectClass}><option value="">{f.cf_selectParent}</option>{nonBathroomSpaces.map((parent) => (<option key={parent.id} value={parent.id}>{parent.roomType}</option>))}</select></label>
                          )}
                        </>
                      )}
                    </div>

                    <h4 className={sectionTitleClass}>🧱 {f.cf_wallCfg}</h4>
                    <p className="-mt-2 text-xs text-[#7B88A3]">{f.cf_stdWallH}</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_wallHeight}</span><input type="number" min="8" max="15" step="0.5" value={space.wallHeightFt ?? 10} placeholder={f.cf_wallHeightPh} onChange={(e) => updateSpaceField(space.id, 'wallHeightFt', Number(e.target.value) || 10)} className={inputClass} /></label>
                      <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_wallThick}</span><select value={space.wallThicknessIn ?? 9} onChange={(e) => updateSpaceField(space.id, 'wallThicknessIn', Number(e.target.value) || 9)} className={selectClass}><option value={4.5}>4.5</option><option value={9}>9</option></select></label>
                      <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_wallMat}</span><select value={space.wallMaterial ?? 'brick'} onChange={(e) => updateSpaceField(space.id, 'wallMaterial', e.target.value)} className={selectClass}><option value="brick">{f.cf_brick}</option><option value="block">{f.cf_block}</option></select></label>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_floorType}</span><select value={floor.floorType} onChange={(e) => updateSpaceFloor(space.id, 'floorType', e.target.value)} className={selectClass}><option value="tiles">{f.cf_tiles}</option><option value="concrete">{f.cf_concrete}</option><option value="masonry">{f.cf_masonry}</option></select></label>
                      {floor.floorType === 'tiles' && <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_tileL}</span><input type="number" min="100" value={floor.tileLengthMm} onChange={(e) => updateSpaceFloor(space.id, 'tileLengthMm', e.target.value)} className={inputClass} /></label>}
                      {floor.floorType === 'tiles' && <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_tileW}</span><input type="number" min="100" value={floor.tileWidthMm} onChange={(e) => updateSpaceFloor(space.id, 'tileWidthMm', e.target.value)} className={inputClass} /></label>}
                    </div>

                    <h4 className={sectionTitleClass}>🧪 {f.cf_wpFoot}</h4>
                    <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#E8ECF6] bg-[#F8FAFF] p-4 md:grid-cols-3">
                      <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_footType}</span><select value={footing.type} onChange={(e) => updateSpaceFooting(space.id, 'type', e.target.value)} className={selectClass}><option value="strip">{f.cf_footStrip}</option><option value="isolated">{f.cf_footIso}</option><option value="raft">{f.cf_footRaft}</option></select></label>
                      <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_footDepth}</span><input type="number" min="1.5" step="0.25" value={footing.depthFt} onChange={(e) => updateSpaceFooting(space.id, 'depthFt', e.target.value)} className={inputClass} /></label>
                      <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_footWidth}</span><input type="number" min="1" step="0.25" value={footing.widthFt} onChange={(e) => updateSpaceFooting(space.id, 'widthFt', e.target.value)} className={inputClass} /></label>
                      <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_concGrade}</span><select value={footing.concreteGrade} onChange={(e) => updateSpaceFooting(space.id, 'concreteGrade', e.target.value)} className={selectClass}><option value="M10">M10</option><option value="M15">M15</option><option value="M20">M20</option><option value="M25">M25</option></select></label>
                      <div className="mt-5"><ToggleSwitch checked={Boolean(finishing.plasterEnabled)} onChange={(checked) => updateSpaceFinishing(space.id, 'plasterEnabled', checked)} label={f.cf_plasterEn} /></div>
                      <div className="mt-5"><ToggleSwitch checked={Boolean(finishing.waterproofingEnabled)} onChange={(checked) => updateSpaceFinishing(space.id, 'waterproofingEnabled', checked)} label={f.cf_waterproof} /></div>
                    </div>

                    {finishing.waterproofingEnabled && (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_wpType}</span><select value={finishing.waterproofingType ?? 'bitumen'} onChange={(e) => updateSpaceFinishing(space.id, 'waterproofingType', e.target.value as WaterproofingType)} className={selectClass}><option value="bitumen">{f.cf_wpBitumen}</option><option value="plastic_sheet">{f.cf_wpPlastic}</option><option value="chemical">{f.cf_wpChemical}</option><option value="membrane">{f.cf_wpMembrane}</option></select></label>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_wallTilesH}</span><input type="number" min="0" max="10" step="0.5" value={finishing.wallTilesHeightFt} onChange={(e) => updateSpaceFinishing(space.id, 'wallTilesHeightFt', e.target.value)} className={inputClass} /></label>
                      <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_tileWaste}</span><input type="number" min="0" max="25" step="0.5" value={floor.tileWastagePercent} onChange={(e) => updateSpaceFloor(space.id, 'tileWastagePercent', e.target.value)} className={inputClass} /></label>
                    </div>

                    <h4 className={sectionTitleClass}>🏗️ {f.cf_structCeiling}</h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_ceilingType}</span><select value={ceiling.ceilingType} onChange={(e) => updateSpaceCeiling(space.id, 'ceilingType', e.target.value)} className={selectClass}><option value="rcc_slab">{f.cf_rccSlab}</option><option value="t_beam_girder">{f.cf_gaderStrip}</option><option value="wooden">{f.cf_woodCeil}</option></select></label>
                      <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_ceilingH}</span><input type="number" min="8" step="0.5" value={ceiling.ceilingHeightFt} onChange={(e) => updateSpaceCeiling(space.id, 'ceilingHeightFt', e.target.value)} className={inputClass} /></label>
                      {ceiling.ceilingType === 'rcc_slab' && <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_slabTh}</span><input type="number" min="3" step="0.5" value={ceiling.slabThicknessIn} onChange={(e) => updateSpaceCeiling(space.id, 'slabThicknessIn', e.target.value)} className={inputClass} /></label>}
                      {ceiling.ceilingType === 'rcc_slab' && <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_steelGr}</span><input type="text" value={ceiling.steelGrade} onChange={(e) => updateSpaceCeiling(space.id, 'steelGrade', e.target.value)} className={inputClass} /></label>}
                      {ceiling.ceilingType === 'rcc_slab' && <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_barSpace}</span><input type="number" min="3" step="0.5" value={ceiling.barSpacingIn} onChange={(e) => updateSpaceCeiling(space.id, 'barSpacingIn', e.target.value)} className={inputClass} /></label>}
                    </div>

                    {ceiling.ceilingType === 't_beam_girder' && (
                      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#FFE1C2] bg-[#FFF4E8] p-3 md:grid-cols-3">
                        <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_numGader}</span><input type="number" min="1" value={ceiling.gaderCount ?? 4} onChange={(e) => updateSpaceCeiling(space.id, 'gaderCount', e.target.value)} className={inputClass} /></label>
                        <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_stripSpace}</span><input type="number" min="1" step="0.25" value={ceiling.stripSpacingFt ?? 2} onChange={(e) => updateSpaceCeiling(space.id, 'stripSpacingFt', e.target.value)} className={inputClass} /></label>
                        <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_gaderMat}</span><select value={ceiling.gaderMaterial ?? 'steel'} onChange={(e) => updateSpaceCeiling(space.id, 'gaderMaterial', e.target.value)} className={selectClass}><option value="steel">{f.cf_steel}</option><option value="precast_concrete">{f.cf_precast}</option><option value="timber">{f.cf_timber}</option></select></label>
                      </div>
                    )}

                    {ceiling.ceilingType === 'wooden' && (
                      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#FFE1C2] bg-[#FFF4E8] p-3 md:grid-cols-3">
                        <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_woodBeams}</span><input type="number" min="1" value={ceiling.woodenBeamCount ?? 8} onChange={(e) => updateSpaceCeiling(space.id, 'woodenBeamCount', e.target.value)} className={inputClass} /></label>
                        <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_beamSpace}</span><input type="number" min="1" step="0.25" value={ceiling.woodenBeamSpacingFt ?? 2.5} onChange={(e) => updateSpaceCeiling(space.id, 'woodenBeamSpacingFt', e.target.value)} className={inputClass} /></label>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#E8ECF6] bg-[#F8FAFF] p-4 md:grid-cols-4">
                      <div className="mt-5"><ToggleSwitch checked={Boolean(beam.enabled)} onChange={(checked) => updateSpaceBeam(space.id, 'enabled', checked)} label={f.cf_rccBeamOpen} /></div>
                      {beam.enabled && <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_beamW}</span><input type="number" min="6" value={beam.widthIn} onChange={(e) => updateSpaceBeam(space.id, 'widthIn', e.target.value)} className={inputClass} /></label>}
                      {beam.enabled && <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_beamD}</span><input type="number" min="9" value={beam.depthIn} onChange={(e) => updateSpaceBeam(space.id, 'depthIn', e.target.value)} className={inputClass} /></label>}
                      {beam.enabled && <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_steelBars}</span><select value={beam.steelBars} onChange={(e) => updateSpaceBeam(space.id, 'steelBars', e.target.value)} className={selectClass}><option value={2}>{f.cf_bars2}</option><option value={4}>{f.cf_bars4}</option><option value={6}>{f.cf_bars6}</option></select></label>}
                      {beam.enabled && <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_stirrup}</span><input type="number" min="3" step="0.5" value={beam.stirrupSpacingIn} onChange={(e) => updateSpaceBeam(space.id, 'stirrupSpacingIn', e.target.value)} className={inputClass} /></label>}
                    </div>

                    <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#E8ECF6] bg-[#F8FAFF] p-4 md:grid-cols-4">
                      <div className="mt-5"><ToggleSwitch checked={Boolean(columns.enabled)} onChange={(checked) => updateSpaceColumns(space.id, 'enabled', checked)} label={f.cf_rccCol} /></div>
                      {columns.enabled && <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_colSize}</span><select value={columns.columnSize} onChange={(e) => updateSpaceColumns(space.id, 'columnSize', e.target.value)} className={selectClass}><option value="9x9">9x9</option><option value="12x12">12x12</option></select></label>}
                      {columns.enabled && <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_steelBars}</span><select value={columns.steelBars} onChange={(e) => updateSpaceColumns(space.id, 'steelBars', e.target.value)} className={selectClass}><option value={4}>{f.cf_bars4}</option><option value={6}>{f.cf_bars6}</option><option value={8}>{f.cf_bars8}</option></select></label>}
                      {columns.enabled && <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_stirrup}</span><input type="number" min="3" step="0.5" value={columns.stirrupSpacingIn} onChange={(e) => updateSpaceColumns(space.id, 'stirrupSpacingIn', e.target.value)} className={inputClass} /></label>}
                    </div>

                    <h4 className={sectionTitleClass}>🚪 {f.cf_doorsWin}</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase text-[#546180]">{f.cf_doors}</p><button type="button" onClick={() => addSpaceOpening(space.id, 'doors')} className="inline-flex items-center gap-1 rounded-lg border border-[#D8DFF0] px-2 py-1 text-xs text-[#4A5672]"><Plus className="h-3 w-3" /> {f.cf_add}</button></div>
                        {ensureArray(space.doors).map((door) => (
                          <div key={door.id} className="flex flex-wrap items-end gap-2 rounded-xl border border-[#E5EAF7] bg-[#FAFBFF] p-2">
                            <div className="min-w-[120px] flex-1"><select value={String(door.openingType ?? 'wooden')} onChange={(e) => updateSpaceOpening(space.id, 'doors', door.id, 'openingType', e.target.value)} className={selectClass}><option value="wooden">{f.cf_doorWood}</option><option value="steel">{f.cf_doorSteel}</option><option value="aluminum">{f.cf_doorAlum}</option></select></div>
                            <div className="w-20"><input type="number" min="1" step="0.1" value={door.widthFt} onChange={(e) => updateSpaceOpening(space.id, 'doors', door.id, 'widthFt', e.target.value)} className={inputClass} /></div>
                            <div className="w-20"><input type="number" min="1" step="0.1" value={door.heightFt} onChange={(e) => updateSpaceOpening(space.id, 'doors', door.id, 'heightFt', e.target.value)} className={inputClass} /></div>
                            <div className="w-16"><input type="number" min="0" value={door.count} onChange={(e) => updateSpaceOpening(space.id, 'doors', door.id, 'count', e.target.value)} className={inputClass} /></div>
                            <button type="button" onClick={() => removeSpaceOpening(space.id, 'doors', door.id)} className="rounded-lg border border-red-200 px-2 py-2 text-xs text-red-700">{f.cf_del}</button>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase text-[#546180]">{f.cf_windows}</p><button type="button" onClick={() => addSpaceOpening(space.id, 'windows')} className="inline-flex items-center gap-1 rounded-lg border border-[#D8DFF0] px-2 py-1 text-xs text-[#4A5672]"><Plus className="h-3 w-3" /> {f.cf_add}</button></div>
                        {ensureArray(space.windows).map((windowItem) => (
                          <div key={windowItem.id} className="flex flex-wrap items-end gap-2 rounded-xl border border-[#E5EAF7] bg-[#FAFBFF] p-2">
                            <div className="min-w-[120px] flex-1"><select value={String(windowItem.openingType ?? 'aluminum')} onChange={(e) => updateSpaceOpening(space.id, 'windows', windowItem.id, 'openingType', e.target.value)} className={selectClass}><option value="aluminum">{f.cf_winAlum}</option><option value="wooden">{f.cf_winWood}</option><option value="glass">{f.cf_winGlass}</option></select></div>
                            <div className="w-20"><input type="number" min="1" step="0.1" value={windowItem.widthFt} onChange={(e) => updateSpaceOpening(space.id, 'windows', windowItem.id, 'widthFt', e.target.value)} className={inputClass} /></div>
                            <div className="w-20"><input type="number" min="1" step="0.1" value={windowItem.heightFt} onChange={(e) => updateSpaceOpening(space.id, 'windows', windowItem.id, 'heightFt', e.target.value)} className={inputClass} /></div>
                            <div className="w-16"><input type="number" min="0" value={windowItem.count} onChange={(e) => updateSpaceOpening(space.id, 'windows', windowItem.id, 'count', e.target.value)} className={inputClass} /></div>
                            <button type="button" onClick={() => removeSpaceOpening(space.id, 'windows', windowItem.id)} className="rounded-lg border border-red-200 px-2 py-2 text-xs text-red-700">{f.cf_del}</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={`${cardClass} space-y-3`}>
          <div className="flex items-center justify-between">
            <h3 className={sectionTitleClass}>🏡 {f.cf_boundary}</h3>
            <ToggleSwitch checked={Boolean(boundary.enabled)} onChange={(checked) => updateBoundary('enabled', checked)} label={f.cf_enableBound} />
          </div>

          {boundary.enabled && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_sqPlotSide}</span><input type="text" value={squareBoundary.sideFt.toFixed(1)} readOnly className={readonlyClass} /></label>
              <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_boundPerim}</span><input type="text" value={squareBoundary.perimeterFt.toFixed(1)} readOnly className={readonlyClass} /></label>
              <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_heightFt}</span><input type="number" min="5" step="0.5" value={boundary.heightFt} onChange={(e) => updateBoundary('heightFt', e.target.value)} className={inputClass} /></label>
              <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_thickIn}</span><select value={boundary.thicknessIn} onChange={(e) => updateBoundary('thicknessIn', e.target.value)} className={selectClass}><option value={4.5}>4.5</option><option value={9}>9</option></select></label>
              <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_matType}</span><select value={boundary.materialType} onChange={(e) => updateBoundary('materialType', e.target.value)} className={selectClass}><option value="masonry">{f.cf_matMasonry}</option><option value="block">{f.cf_matBlock}</option><option value="rcc">{f.cf_matRcc}</option></select></label>
              <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_gateW}</span><input type="number" min="0" step="0.5" value={boundary.gateWidthFt} onChange={(e) => updateBoundary('gateWidthFt', e.target.value)} className={inputClass} /></label>
              <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_gateH}</span><input type="number" min="0" step="0.5" value={boundary.gateHeightFt} onChange={(e) => updateBoundary('gateHeightFt', e.target.value)} className={inputClass} /></label>
              <div className="mt-5"><ToggleSwitch checked={Boolean(boundary.plasterEnabled ?? true)} onChange={(checked) => updateBoundary('plasterEnabled', checked)} label={f.cf_boundPlaster} /></div>
              <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_footType}</span><select value={boundaryFooting.type} onChange={(e) => updateBoundaryFooting('type', e.target.value)} className={selectClass}><option value="strip">{f.cf_footStrip}</option><option value="isolated">{f.cf_footIso}</option><option value="raft">{f.cf_footRaft}</option></select></label>
              <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_footWidth}</span><input type="number" min="1" step="0.25" value={boundaryFooting.widthFt} onChange={(e) => updateBoundaryFooting('widthFt', e.target.value)} className={inputClass} /></label>
              <label className="block"><span className="text-xs text-[#5A6781]">{f.cf_footDepth}</span><input type="number" min="1.5" step="0.25" value={boundaryFooting.depthFt} onChange={(e) => updateBoundaryFooting('depthFt', e.target.value)} className={inputClass} /></label>
            </div>
          )}
        </div>

        <div className={cardClass}>
          <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">{f.cf_soil}</label>
          <select value={data.soil} onChange={(e) => onChange({ soil: e.target.value })} className={selectClass}>
            <option value="">{f.cf_selectSoil}</option>
            <option value="sandy">{f.cf_soilSandy}</option>
            <option value="clay">{f.cf_soilClay}</option>
            <option value="rocky">{f.cf_soilRocky}</option>
            <option value="mixed">{f.cf_soilMixed}</option>
          </select>
        </div>
    </div>
  );
}
