import { useLocation, Link } from 'react-router';
import { ArrowLeft, MapPin, Home, Truck, CheckCircle2, Shield, Hammer, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateConstructionPlan, ConstructionInput, type CalculationLang } from '../utils/calculator';
import { useEffect, useMemo, useState } from 'react';
import ModuleBackground from '../components/ModuleBackground';
import { fetchProvinceRates } from '../utils/provinceRates';
import { normalizeFormData } from '../utils/formDataNormalizer';
import { useSmartConstructionStrings } from '../../i18n/smartConstructionStrings';
import { usePortalLanguage } from '../../i18n/portalLanguage';

function NoData({
  message,
  title,
  goPlanner,
}: {
  message?: string;
  title: string;
  goPlanner: string;
}) {
  return (
    <ModuleBackground>
      <div className="min-h-0 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link
            to="/planner"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {goPlanner}
          </Link>
        </div>
      </div>
    </ModuleBackground>
  );
}

export default function Results() {
  const t = useSmartConstructionStrings();
  const lang = usePortalLanguage() as CalculationLang;
  const r = t.results;
  const location = useLocation();
  const rawData = location.state;
  const safe = (value: unknown): number => Number(value) || 0;
  const [expandedTips, setExpandedTips] = useState<string[]>([]);
  const [expandedSteps, setExpandedSteps] = useState(true);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [materials, setMaterials] = useState<Record<string, number>>({});
  const [liveTotalCost, setLiveTotalCost] = useState(0);

  if (!rawData) {
    return <NoData title={t.noData.title} message={t.noData.message} goPlanner={t.noData.goPlanner} />;
  }

  const formData = normalizeFormData(rawData as ConstructionInput & Record<string, unknown>);

  const results = calculateConstructionPlan(formData as ConstructionInput, { lang });
  const materialObject = useMemo(
    () => ({
      bricks: results?.materials?.bricks ?? 0,
      cementBags: results?.materials?.cementBags ?? 0,
      sandCft: results?.materials?.sand ?? (results?.materials as Record<string, number> | undefined)?.sandCft ?? 0,
      aggregateCft: results?.materials?.aggregate ?? (results?.materials as Record<string, number> | undefined)?.aggregateCft ?? 0,
      steelKg: results?.materials?.steel ?? (results?.materials as Record<string, number> | undefined)?.steelKg ?? 0,
      tiles: results?.materials?.tileCount ?? (results?.materials as Record<string, number> | undefined)?.tiles ?? 0,
      plasterSqFt: results?.materials?.plasterAreaSqFt ?? (results?.materials as Record<string, number> | undefined)?.plasterSqFt ?? 0,
      doors: results?.materials?.doorsCount ?? (results?.materials as Record<string, number> | undefined)?.doors ?? 0,
      windows: results?.materials?.windowsCount ?? (results?.materials as Record<string, number> | undefined)?.windows ?? 0,
      concreteCft: results?.materials?.concreteCft ?? 0,
      paintSqFt: results?.materials?.paintSqFt ?? 0,
      tilesSqFt: results?.materials?.tilesSqFt ?? 0,
      tileCount: results?.materials?.tileCount ?? 0,
      doorsCount: results?.materials?.doorsCount ?? 0,
      windowsCount: results?.materials?.windowsCount ?? 0,
      waterproofAreaSqFt: results?.materials?.waterproofAreaSqFt ?? 0,
      woodCft: results?.materials?.woodCft ?? 0,
      gaderCount: results?.materials?.gaderCount ?? 0,
      beamConcreteCft: results?.materials?.beamConcreteCft ?? 0,
      columnConcreteCft: results?.materials?.columnConcreteCft ?? 0,
      gravelCft: results?.materials?.gravelCft ?? 0,
      bitumenSqFt: results?.materials?.bitumenSqFt ?? 0,
      insulationSqFt: results?.materials?.insulationSqFt ?? 0,
    }),
    [
      results.materials.bricks,
      results.materials.cementBags,
      results.materials.sand,
      results.materials.aggregate,
      results.materials.steel,
      results.materials.concreteCft,
      results.materials.plasterAreaSqFt,
      results.materials.paintSqFt,
      results.materials.tilesSqFt,
      results.materials.tileCount,
      results.materials.doorsCount,
      results.materials.windowsCount,
      results.materials.waterproofAreaSqFt,
      results.materials.woodCft,
      results.materials.gaderCount,
      results.materials.beamConcreteCft,
      results.materials.columnConcreteCft,
      results.materials.gravelCft,
      results.materials.bitumenSqFt,
      results.materials.insulationSqFt,
    ],
  );

  useEffect(() => {
    let cancelled = false;
    const initializeRates = async () => {
      setMaterials(materialObject);
      try {
        const fetched = await fetchProvinceRates(formData.location?.province || 'Punjab', materialObject);
        if (cancelled) return;
        setRates({ ...fetched.materialRates });
      } catch {
        if (cancelled) return;
        setRates({ ...(formData.rates?.materialRates ?? {}) });
      }
    };
    initializeRates();
    return () => {
      cancelled = true;
    };
  }, [formData.location?.province, materialObject]);

  useEffect(() => {
    if (!Object.keys(rates).length || !Object.keys(materials).length) return;

    const cost =
      (safe(materials.bricks) * safe(rates.brickPerPiece)) +
      (safe(materials.cementBags) * safe(rates.cementPerBag)) +
      (safe(materials.sandCft) * safe(rates.sandPerCft)) +
      (safe(materials.aggregateCft) * safe(rates.aggregatePerCft)) +
      (safe(materials.steelKg) * safe(rates.steelPerKg)) +
      (safe(materials.concreteCft) * safe(rates.concretePerCft)) +
      (safe(materials.plasterSqFt) * safe(rates.plasterPerSqFt)) +
      (safe(materials.paintSqFt) * safe(rates.paintPerSqFt)) +
      (safe(materials.tilesSqFt) * safe(rates.tilePerSqFt)) +
      (safe(materials.doorsCount) * safe(rates.doorWoodPerUnit)) +
      (safe(materials.windowsCount) * safe(rates.windowAluminumPerUnit)) +
      (safe(materials.waterproofAreaSqFt) * safe(rates.waterproofPerSqFt)) +
      (safe(materials.woodCft) * safe(rates.woodPerCft)) +
      (safe(materials.gaderCount) * safe(rates.gaderPerPiece)) +
      (safe(materials.beamConcreteCft) * safe(rates.beamConcretePerCft)) +
      (safe(materials.columnConcreteCft) * safe(rates.columnConcretePerCft)) +
      // Labour is part of the single final BOQ — previously the live total omitted it
      // and disagreed with every other figure on the page.
      safe(results.labor?.totalLaborCost) +
      safe(results.loungeCost);

    setLiveTotalCost(Math.round(cost));
  }, [rates, materials, results.labor?.totalLaborCost, results.loungeCost]);

  const updateRate = (key: string, value: string) => {
    setRates((prev) => ({
      ...prev,
      [key]: Math.max(0, Number(value) || 0),
    }));
  };
  const roomTemplates = formData.roomTemplates ?? [];
  // Prefer the calculator's habitable-room count so kitchens / washrooms / stores
  // are not labelled as "rooms" in the project summary.
  const totalConfiguredRooms = Math.max(
    1,
    Number(
      results.roomCountSummary?.totalRooms ??
        formData.totalRooms ??
        roomTemplates
          .filter((room) => room.category !== 'kitchen' && room.category !== 'bathroom' && room.category !== 'store')
          .reduce((sum, room) => sum + room.count, 0) ??
        formData.rooms,
    ),
  );
  const totalTemplateArea = roomTemplates.reduce(
    (sum, room) => sum + room.lengthFt * room.widthFt * room.count,
    0,
  );
  const totalDoors = results.openings.totalDoors;
  const totalWindows = results.openings.totalWindows;
  const spaceWiseTotal = (results.spaceCosts || []).reduce((sum, item) => sum + safe(item.total), 0);
  // Same figure as costBreakdown.total / estimatedCost: spaces + boundary +
  // circulation finish + labour. No parallel invented totals.
  const grandTotal =
    spaceWiseTotal +
    safe(results.boundaryBreakdown?.total) +
    safe(results.loungeCost) +
    safe(results.labor?.totalLaborCost);

  const toggleTip = (category: string) => {
    if (expandedTips.includes(category)) {
      setExpandedTips(expandedTips.filter((c) => c !== category));
    } else {
      setExpandedTips([...expandedTips, category]);
    }
  };

  const rec = r as Record<string, string>;

  const getConstructionTypeName = (type: string) => rec[`construction_${type}`] || type;

  const getSoilName = (soil: string) => rec[`soil_${soil}`] || soil;

  return (
    <ModuleBackground>
    <div className="min-h-0">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/planner"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {r.backToPlanner}
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {r.planTitle}
          </h1>
          <p className="text-gray-600">{r.planSubtitle}</p>
        </div>

        {/* Project Summary */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 mb-6 text-white">
          <h2 className="text-2xl font-bold mb-4">{r.projectSummary}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
              <div>
                <div className="text-sm text-indigo-100">{r.location}</div>
                <div className="font-semibold">
                  {formData.location.district && `${formData.location.district}, `}
                  {formData.location.province}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Home className="w-5 h-5 mt-1 flex-shrink-0" />
              <div>
                <div className="text-sm text-indigo-100">{r.constructionType}</div>
                <div className="font-semibold">{getConstructionTypeName(formData.constructionType)}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Hammer className="w-5 h-5 mt-1 flex-shrink-0" />
              <div>
                <div className="text-sm text-indigo-100">{r.specifications}</div>
                <div className="font-semibold">
                  {totalConfiguredRooms} {r.roomsAcross} {roomTemplates.length || 1} {r.templates}
                </div>
                <div className="text-xs text-indigo-100 mt-1">
                  {r.plot}: {(formData.totalPlotAreaSqFt ?? results.totalArea).toLocaleString()} {r.sqFt} | {r.builtUp}: {Math.round(totalTemplateArea || results.totalArea)} {r.sqFt}
                </div>
                <div className="text-xs text-indigo-100">
                  {r.openings}: {totalDoors} {r.doors}, {totalWindows} {r.windows} | {r.boundaryWall}: {formData.boundaryWall?.enabled ? r.enabled : r.disabled}
                </div>
                <div className="text-xs text-indigo-100">
                  {r.floor}: {formData.floorConfig?.floorType ?? 'tiles'} | {r.ceiling}: {formData.ceilingConfig?.ceilingType ?? 'rcc_slab'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {(results.spaceCosts || []).map((space) => (
            <div key={space.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{space.roomType} {space.number} {r.breakdown}</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-800">
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="font-semibold mb-2">{r.footing}</p>
                  <div className="flex justify-between"><span>{r.volume}</span><span>{space.footingVolumeCft.toFixed(2)} {r.cuFt}</span></div>
                  <div className="flex justify-between"><span>{r.cost}</span><span>Rs {space.footingCost.toLocaleString()}</span></div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="font-semibold mb-2">{r.walls}</p>
                  <div className="flex justify-between"><span>{r.bricks}</span><span>{space.bricksQty.toFixed(1)}</span></div>
                  <div className="flex justify-between"><span>{r.cement}</span><span>{space.cementQty.toFixed(1)}</span></div>
                  <div className="flex justify-between"><span>{r.sand}</span><span>{space.sandQty.toFixed(1)}</span></div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="font-semibold mb-2">{r.openingsSection}</p>
                  <div className="flex justify-between"><span>{r.doorsCost}</span><span>Rs {space.doorsCost.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>{r.windowsCost}</span><span>Rs {space.windowsCost.toLocaleString()}</span></div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="font-semibold mb-2">{r.ceilingSection}</p>
                  <div className="flex justify-between"><span>{r.rccVolume}</span><span>{space.rccVolumeCft.toFixed(2)} {r.cuFt}</span></div>
                  <div className="flex justify-between"><span>{r.steel}</span><span>{space.steelQty.toFixed(1)} kg</span></div>
                  <div className="flex justify-between"><span>{r.concreteStructuralCost}</span><span>Rs {space.structuralCost.toLocaleString()}</span></div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="font-semibold mb-2">{r.floorSection}</p>
                  <div className="flex justify-between"><span>{r.floorArea}</span><span>{space.floorAreaSqFt.toFixed(2)} {r.sqFt}</span></div>
                  <div className="flex justify-between"><span>{r.tilesFloorCost}</span><span>Rs {space.tileCost.toLocaleString()}</span></div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="font-semibold mb-2">{r.finishing}</p>
                  <div className="flex justify-between"><span>{r.plasterArea}</span><span>{space.plasterAreaSqFt.toFixed(2)} {r.sqFt}</span></div>
                  <div className="flex justify-between"><span>{r.plasterCost}</span><span>Rs {space.plasterCost.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>{r.waterproofArea}</span><span>{space.waterproofAreaSqFt.toFixed(2)} {r.sqFt}</span></div>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3 flex items-center justify-between">
                <span className="font-semibold text-indigo-900">{r.spaceTotal}</span>
                <span className="font-bold text-indigo-900">Rs {space.total.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{r.boundaryWallBreakdown}</h2>
          {results.boundaryBreakdown?.enabled ? (
            <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-800">
              <div className="rounded-lg border border-gray-200 p-3 flex justify-between"><span>{r.bricks}</span><span>{results.boundaryBreakdown.bricksQty.toFixed(1)}</span></div>
              <div className="rounded-lg border border-gray-200 p-3 flex justify-between"><span>{r.cement}</span><span>{results.boundaryBreakdown.cementQty.toFixed(1)}</span></div>
              <div className="rounded-lg border border-gray-200 p-3 flex justify-between"><span>{r.sand}</span><span>{results.boundaryBreakdown.sandQty.toFixed(1)}</span></div>
              <div className="rounded-lg border border-gray-200 p-3 flex justify-between"><span>{r.gateCost}</span><span>Rs {results.boundaryBreakdown.gateCost.toLocaleString()}</span></div>
              <div className="rounded-lg border border-gray-200 p-3 flex justify-between"><span>{r.wallVolume}</span><span>{results.boundaryBreakdown.wallVolumeCft.toFixed(2)} {r.cuFt}</span></div>
              <div className="rounded-lg border border-gray-200 p-3 flex justify-between"><span>{r.boundaryTotal}</span><span className="font-semibold">Rs {results.boundaryBreakdown.total.toLocaleString()}</span></div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">{r.boundaryNotEnabled}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6 border border-indigo-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{r.finalTotal}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>{r.spacesTotal}</span><span>Rs {spaceWiseTotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>{r.boundaryWallTotal}</span><span>Rs {safe(results.boundaryBreakdown?.total).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>{r.loungeCirculation}</span><span>Rs {safe(results.loungeCost).toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-lg"><span>{r.grandTotal}</span><span>Rs {grandTotal.toLocaleString()}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{r.materialRatesEditable}</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">{r.masonry}</h3>
              <label className="block"><span>{r.brickPerPiece}</span><input type="number" min={0} value={rates.brickPerPiece ?? 0} onChange={(e) => updateRate('brickPerPiece', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></label>
              <label className="block"><span>{r.cementPerBag}</span><input type="number" min={0} value={rates.cementPerBag ?? 0} onChange={(e) => updateRate('cementPerBag', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></label>
              <label className="block"><span>{r.sandPerCft}</span><input type="number" min={0} value={rates.sandPerCft ?? 0} onChange={(e) => updateRate('sandPerCft', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></label>
              <label className="block"><span>{r.aggregatePerCft}</span><input type="number" min={0} value={rates.aggregatePerCft ?? 0} onChange={(e) => updateRate('aggregatePerCft', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></label>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">{r.rcc}</h3>
              <label className="block"><span>{r.steelPerKg}</span><input type="number" min={0} value={rates.steelPerKg ?? 0} onChange={(e) => updateRate('steelPerKg', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></label>
              <label className="block"><span>{r.concretePerCft}</span><input type="number" min={0} value={rates.concretePerCft ?? 0} onChange={(e) => updateRate('concretePerCft', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></label>
              <label className="block"><span>{r.beamConcretePerCft}</span><input type="number" min={0} value={rates.beamConcretePerCft ?? 0} onChange={(e) => updateRate('beamConcretePerCft', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></label>
              <label className="block"><span>{r.columnConcretePerCft}</span><input type="number" min={0} value={rates.columnConcretePerCft ?? 0} onChange={(e) => updateRate('columnConcretePerCft', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></label>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">{r.finishingSection}</h3>
              <label className="block"><span>{r.plasterPerSqFt}</span><input type="number" min={0} value={rates.plasterPerSqFt ?? 0} onChange={(e) => updateRate('plasterPerSqFt', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></label>
              <label className="block"><span>{r.paintPerSqFt}</span><input type="number" min={0} value={rates.paintPerSqFt ?? 0} onChange={(e) => updateRate('paintPerSqFt', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></label>
              <label className="block"><span>{r.tilePerSqFt}</span><input type="number" min={0} value={rates.tilePerSqFt ?? 0} onChange={(e) => updateRate('tilePerSqFt', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></label>
              <label className="block"><span>{r.woodPerCft}</span><input type="number" min={0} value={rates.woodPerCft ?? 0} onChange={(e) => updateRate('woodPerCft', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></label>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">{r.openingsWaterproof}</h3>
              <label className="block"><span>{r.doorWoodPerUnit}</span><input type="number" min={0} value={rates.doorWoodPerUnit ?? 0} onChange={(e) => updateRate('doorWoodPerUnit', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></label>
              <label className="block"><span>{r.windowAluminumPerUnit}</span><input type="number" min={0} value={rates.windowAluminumPerUnit ?? 0} onChange={(e) => updateRate('windowAluminumPerUnit', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></label>
              <label className="block"><span>{r.waterproofPerSqFt}</span><input type="number" min={0} value={rates.waterproofPerSqFt ?? 0} onChange={(e) => updateRate('waterproofPerSqFt', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></label>
              <label className="block"><span>{r.gaderPerPiece}</span><input type="number" min={0} value={rates.gaderPerPiece ?? 0} onChange={(e) => updateRate('gaderPerPiece', e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300" /></label>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 flex items-center justify-between">
            <span className="font-semibold text-green-900">{r.liveBoqTotal}</span>
            <span className="text-xl font-bold text-green-900">Rs {liveTotalCost.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Materials Required */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{r.materialsRequired}</h2>
            </div>

            <div className="space-y-4">
              {results.materials.bricks > 0 && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-700">{r.bricks}</span>
                  <span className="font-semibold text-gray-900">
                    {results.materials.bricks.toLocaleString()} {r.pieces}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-700">{r.cement}</span>
                <span className="font-semibold text-gray-900">
                  {results.materials.cementBags} {r.bags}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-700">{r.masonryVolume}</span>
                <span className="font-semibold text-gray-900">
                  {results.materials.masonryVolumeM3.toFixed(2)} m3
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-700">{r.mortar}</span>
                <span className="font-semibold text-gray-900">
                  {results.materials.mortarM3.toFixed(2)} m3 ({results.materials.mortarCft} {r.cuFt})
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-700">{r.sand}</span>
                <span className="font-semibold text-gray-900">
                  {results.materials.sand} {r.cuFt}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-700">{r.aggregate}</span>
                <span className="font-semibold text-gray-900">
                  {results.materials.aggregate} {r.cuFt}
                </span>
              </div>
              {results.materials.steel > 0 && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-700">{r.steelReinforcement}</span>
                  <span className="font-semibold text-gray-900">
                    {results.materials.steel} kg
                  </span>
                </div>
              )}
              {results.materials.woodCft > 0 && (
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <span className="text-gray-700">{r.timberWood}</span>
                  <span className="font-semibold text-gray-900">{results.materials.woodCft} {r.cuFt}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <span className="text-gray-700">{r.plasterFinish}</span>
                <span className="font-semibold text-gray-900">{results.materials.plasterAreaSqFt.toFixed(1)} {r.sqFt}</span>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
              <p className="font-semibold mb-1">{r.wallVolumeMethod}</p>
              <p>
                {r.wallGross} {results.geometry.houseWallVolumeCft.toFixed(1)} {r.cuFt} | {r.openingsRemoved} {results.geometry.openingsVolumeCft.toFixed(1)} {r.cuFt}
              </p>
              <p>
                {r.houseWallNet} {results.geometry.netHouseWallVolumeCft.toFixed(1)} {r.cuFt} | {r.boundaryNet} {results.geometry.netBoundaryWallVolumeCft.toFixed(1)} {r.cuFt}
              </p>
              <p>
                {r.boundaryFoundationConcrete} {results.geometry.boundaryFoundationVolumeCft.toFixed(1)} {r.cuFt} | {r.netTotalMasonry} {results.geometry.netTotalMasonryVolumeCft.toFixed(1)} {r.cuFt}
              </p>
              <p>
                {r.totalFootingConcrete} {results.geometry.footingConcreteVolumeCft.toFixed(1)} {r.cuFt} | {r.netPlasterArea} {results.geometry.plasterAreaSqFt.toFixed(1)} {r.sqFt}
              </p>
              <p>
                {r.openingsArea} {results.geometry.openingsAreaSqFt.toFixed(1)} {r.sqFt} | {r.concreteVolume} {results.geometry.concreteVolumeCft.toFixed(1)} {r.cuFt}
              </p>
            </div>
          </div>

          {/* Foundation Recommendation */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{r.foundationDesign}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">{r.soilType}</div>
                <div className="font-semibold text-gray-900 text-lg">
                  {getSoilName(formData.soil)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">{r.recommendedFoundation}</div>
                <div className="font-semibold text-gray-900 text-lg">
                  {results.foundation.type}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">{r.depth}</div>
                <div className="font-semibold text-gray-900 text-lg">
                  {results.foundation.depth}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">{results.foundation.description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{r.itemizedCost}</h2>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between border-b border-gray-100 py-2"><span>{r.bricks}</span><span className="font-semibold">Rs {results.costBreakdown.brickCost.toLocaleString()}</span></div>
            <div className="flex justify-between border-b border-gray-100 py-2"><span>{r.cement}</span><span className="font-semibold">Rs {results.costBreakdown.cementCost.toLocaleString()}</span></div>
            <div className="flex justify-between border-b border-gray-100 py-2"><span>{r.sand}</span><span className="font-semibold">Rs {results.costBreakdown.sandCost.toLocaleString()}</span></div>
            <div className="flex justify-between border-b border-gray-100 py-2"><span>{r.aggregate}</span><span className="font-semibold">Rs {results.costBreakdown.aggregateCost.toLocaleString()}</span></div>
            <div className="flex justify-between border-b border-gray-100 py-2"><span>{r.steel}</span><span className="font-semibold">Rs {results.costBreakdown.steelCost.toLocaleString()}</span></div>
            <div className="flex justify-between border-b border-gray-100 py-2"><span>{r.tiles}</span><span className="font-semibold">Rs {results.costBreakdown.tileCost.toLocaleString()}</span></div>
            <div className="flex justify-between border-b border-gray-100 py-2"><span>{r.doorsGates}</span><span className="font-semibold">Rs {results.costBreakdown.doorsCost.toLocaleString()}</span></div>
            <div className="flex justify-between border-b border-gray-100 py-2"><span>{r.windows}</span><span className="font-semibold">Rs {results.costBreakdown.windowsCost.toLocaleString()}</span></div>
            <div className="flex justify-between border-b border-gray-100 py-2"><span>{r.wood}</span><span className="font-semibold">Rs {results.costBreakdown.woodCost.toLocaleString()}</span></div>
            <div className="flex justify-between border-b border-gray-100 py-2"><span>{r.plaster}</span><span className="font-semibold">Rs {results.costBreakdown.plasterCost.toLocaleString()}</span></div>
            <div className="flex justify-between border-b border-gray-100 py-2"><span>{r.structural}</span><span className="font-semibold">Rs {results.costBreakdown.structuralCost.toLocaleString()}</span></div>
            <div className="flex justify-between border-b border-gray-100 py-2"><span>{r.labor}</span><span className="font-semibold">Rs {results.costBreakdown.laborCost.toLocaleString()}</span></div>
            <div className="flex justify-between border-b border-gray-100 py-2"><span>{r.foundationAllowance}</span><span className="font-semibold">Rs {results.costBreakdown.foundationCost.toLocaleString()}</span></div>
            <div className="flex justify-between border-b border-gray-100 py-2"><span>{r.contractorMargin}</span><span className="font-semibold">Rs {results.costBreakdown.contractorMarginCost.toLocaleString()}</span></div>
          </div>

          <div className="mt-4 rounded-lg bg-indigo-50 border border-indigo-200 p-4 space-y-2 text-sm">
            <div className="flex justify-between items-center"><span className="font-semibold text-indigo-900">{r.materialWiseTotal}</span><span className="text-lg font-bold text-indigo-900">Rs {results.costBreakdown.total.toLocaleString()}</span></div>
            <div className="flex justify-between items-center"><span className="font-semibold text-indigo-900">{r.spaceWiseTotal}</span><span className="text-lg font-bold text-indigo-900">Rs {spaceWiseTotal.toLocaleString()}</span></div>
            <div className="flex justify-between items-center"><span className="font-semibold text-indigo-900">{r.boundaryWallCost}</span><span className="text-lg font-bold text-indigo-900">Rs {results.boundaryWallCost.toLocaleString()}</span></div>
            <div className="flex justify-between items-center"><span className="font-semibold text-indigo-900">{r.loungeCost}</span><span className="text-lg font-bold text-indigo-900">Rs {results.loungeCost.toLocaleString()}</span></div>
            <div className="flex justify-between items-center border-t border-indigo-200 pt-2"><span className="font-semibold text-indigo-900">{r.finalGrandTotal}</span><span className="text-xl font-bold text-indigo-900">Rs {grandTotal.toLocaleString()}</span></div>
          </div>
        </div>

        {/* Construction Steps */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <button
            onClick={() => setExpandedSteps(!expandedSteps)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Hammer className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{r.stepByStepGuide}</h2>
            </div>
            {expandedSteps ? (
              <ChevronUp className="w-6 h-6 text-gray-400" />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-400" />
            )}
          </button>

          {expandedSteps && (
            <div className="space-y-3">
              {(results.constructionSteps || []).map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">{step}</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resilience Tips */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{r.disasterResilienceRec}</h2>
              <p className="text-sm text-gray-600">
                {r.resilienceSub}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(results.resilienceTips || {}).map(([category, tips]) => (
              <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleTip(category)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900">{category}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{tips.length} {r.tipsCount}</span>
                    {expandedTips.includes(category) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>
                {expandedTips.includes(category) && (
                  <div className="p-4 bg-white">
                    <ul className="space-y-2">
                      {(tips || []).map((tip, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/planner"
            className="px-6 py-3 rounded-lg border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-colors font-semibold"
          >
            {r.planAnother}
          </Link>
          <Link
            to="/"
            className="px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-semibold"
          >
            {r.backToHome}
          </Link>
        </div>
      </div>
    </div>
    </ModuleBackground>
  );
}
