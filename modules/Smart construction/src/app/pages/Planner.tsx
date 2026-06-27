import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, MapPin, Home, AlertTriangle, CheckCircle2, Coins } from 'lucide-react';
import LocationInput from '../components/LocationInput';
import ConstructionForm from '../components/ConstructionForm';
import HazardSelector from '../components/HazardSelector';
import { calculateConstructionPlan, ConstructionInput, ProvinceRateCard, type CalculationLang } from '../utils/calculator';
import ModuleBackground from '../components/ModuleBackground';
import { fetchProvinceRates } from '../utils/provinceRates';
import { ensureArray, normalizeFormData } from '../utils/formDataNormalizer';
import { useSmartConstructionStrings } from '../../i18n/smartConstructionStrings';
import { usePortalLanguage } from '../../i18n/portalLanguage';

const usedAreaFromSpaces = (spaces: ConstructionInput['roomTemplates']): number =>
  (Array.isArray(spaces) ? spaces : []).reduce((sum, space) => {
    if (space.category === 'bathroom' && space.bathroomPlacement === 'inside') {
      return sum;
    }
    return sum + Math.max(0, space.lengthFt) * Math.max(0, space.widthFt);
  }, 0);

export default function Planner() {
  const navigate = useNavigate();
  const t = useSmartConstructionStrings();
  const p = t.planner;
  const lang = usePortalLanguage() as CalculationLang;
  const [step, setStep] = useState(1);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [showRateReview, setShowRateReview] = useState(false);
  const [rateFetchError, setRateFetchError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [formData, setFormData] = useState<Partial<ConstructionInput>>({
    location: { country: 'Pakistan', province: '', district: '' },
    constructionType: '',
    rooms: 1,
    totalRooms: 1,
    kitchens: 0,
    bathrooms: 0,
    lounges: 0,
    stores: 0,
    otherRooms: 0,
    roomSize: { length: 10, width: 12 },
    wallHeightFt: 10,
    ceilingHeightFt: 10,
    wallThicknessIn: 9,
    soil: '',
    hazards: [],
  });

  const totalSteps = 3;

  const updateFormData = (data: Partial<ConstructionInput>) => {
    setFormData((prev) => {
      const mergedBoundary = data.boundaryWall
        ? {
            ...(prev.boundaryWall ?? {}),
            ...data.boundaryWall,
            boundaryDoors: ensureArray(data.boundaryWall.boundaryDoors ?? prev.boundaryWall?.boundaryDoors),
            boundaryWindows: ensureArray(data.boundaryWall.boundaryWindows ?? prev.boundaryWall?.boundaryWindows),
          }
        : prev.boundaryWall;

      return normalizeFormData({
        ...prev,
        ...data,
        boundaryWall: mergedBoundary,
      });
    });
  };

  const handleRateFieldChange = (
    section: 'materialRates' | 'laborRates',
    key: string,
    value: string,
  ) => {
    if (!formData.rates) return;
    const numeric = Number(value);
    const safeValue = Number.isFinite(numeric) && numeric > 0 ? numeric : 0;

    const updatedRates: ProvinceRateCard = {
      ...formData.rates,
      [section]: {
        ...formData.rates[section],
        [key]: safeValue,
      },
    };

    updateFormData({ rates: updatedRates });
  };

  const requestProvinceRates = async () => {
    const province = formData.location?.province || 'Punjab';
    const previewInput: ConstructionInput = {
      constructionType: formData.constructionType || '',
      rooms: formData.rooms || 1,
      roomSize: formData.roomSize || { length: 10, width: 12 },
      totalPlotAreaSqFt: formData.totalPlotAreaSqFt,
      totalRooms: formData.totalRooms,
      roomTemplates: formData.roomTemplates,
      kitchens: formData.kitchens,
      bathrooms: formData.bathrooms,
      lounges: formData.lounges,
      stores: formData.stores,
      otherRooms: formData.otherRooms,
      wallHeightFt: formData.wallHeightFt ?? 10,
      ceilingHeightFt: formData.ceilingHeightFt ?? 10,
      wallThicknessIn: formData.wallThicknessIn ?? 9,
      doors: formData.doors,
      windows: formData.windows,
      boundaryWall: formData.boundaryWall,
      floorConfig: formData.floorConfig,
      ceilingConfig: formData.ceilingConfig,
      soil: formData.soil || 'mixed',
      hazards: formData.hazards || [],
      location: {
        country: 'Pakistan',
        province,
        district: formData.location?.district || '',
      },
      rates: formData.rates,
    };
    const previewMaterials = calculateConstructionPlan(previewInput, { lang }).materials;
    setRateFetchError('');
    setIsFetchingRates(true);

    try {
      const rates = await fetchProvinceRates(province, previewMaterials as unknown as Record<string, number>);
      updateFormData({
        location: {
          country: formData.location?.country || 'Pakistan',
          province,
          district: formData.location?.district || '',
        },
        rates,
      });
      setShowRateReview(true);
    } catch {
      setRateFetchError(p.rateFetchError);
      setShowRateReview(true);
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handleNext = async () => {
    const error = getStepValidationError();
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError('');

    if (step === totalSteps && isFetchingRates) {
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
      return;
    }

    if (!showRateReview) {
      await requestProvinceRates();
      return;
    }

    const safeData = normalizeFormData({
      ...formData,
      location: {
        country: 'Pakistan',
        province: formData.location?.province || '',
        district: formData.location?.district || '',
      },
    });

    console.log('Planner → Results Data:', safeData);

    navigate('/results', {
      state: safeData,
    });
  };

  const handleBack = () => {
    if (step === 3 && showRateReview) {
      setShowRateReview(false);
      setRateFetchError('');
      return;
    }

    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/');
    }
  };

  const getStepValidationError = (): string | null => {
    if (step === 1) {
      if (!formData.location?.province) {
        return p.errProvince;
      }
      return null;
    }

    if (step === 2) {
      const spaces = formData.roomTemplates ?? [];
      if (Number(formData.totalPlotAreaSqFt ?? 0) <= 0) {
        return p.errPlot;
      }

      if (spaces.length === 0) {
        return p.errSpace;
      }

      for (const space of spaces) {
        if (Number(space.lengthFt) <= 0 || Number(space.widthFt) <= 0) {
          return p.errSpaceSize;
        }
      }

      return null;
    }

    if (step === 3) {
      if (!formData.hazards || formData.hazards.length === 0) {
        return p.errHazard;
      }
      return null;
    }

    return null;
  };

  const canPreviewCalculation = Boolean(
    formData.constructionType &&
      formData.totalPlotAreaSqFt &&
      formData.totalRooms &&
      (formData.roomTemplates?.length ?? 0) > 0 &&
      formData.soil &&
      formData.hazards &&
      formData.location?.province &&
      formData.rates,
  );

  const previewResult = canPreviewCalculation
    ? calculateConstructionPlan(
        {
        constructionType: formData.constructionType || '',
        rooms: formData.rooms || 1,
        roomSize: formData.roomSize || { length: 10, width: 12 },
        totalPlotAreaSqFt: formData.totalPlotAreaSqFt,
        totalRooms: formData.totalRooms,
        roomTemplates: formData.roomTemplates,
        kitchens: formData.kitchens,
        bathrooms: formData.bathrooms,
        lounges: formData.lounges,
        stores: formData.stores,
        otherRooms: formData.otherRooms,
        wallHeightFt: formData.wallHeightFt ?? 10,
        ceilingHeightFt: formData.ceilingHeightFt ?? 10,
        wallThicknessIn: formData.wallThicknessIn ?? 9,
        doors: formData.doors,
        windows: formData.windows,
        boundaryWall: formData.boundaryWall,
        floorConfig: formData.floorConfig,
        ceilingConfig: formData.ceilingConfig,
        soil: formData.soil || 'mixed',
        hazards: formData.hazards || [],
        location: {
          country: 'Pakistan',
          province: formData.location?.province || '',
          district: formData.location?.district || '',
        },
        rates: formData.rates,
      },
      { lang },
    )
    : null;

  return (
    <ModuleBackground>
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {step === 1 ? p.backHome : p.previousStep}
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{p.title}</h1>
          <p className="text-gray-600">{p.subtitle}</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center flex-1">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      stepNum < step
                        ? 'bg-green-500 text-white'
                        : stepNum === step
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {stepNum < step ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : stepNum === 1 ? (
                      <MapPin className="w-5 h-5" />
                    ) : stepNum === 2 ? (
                      <Home className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-semibold text-gray-900">
                      {stepNum === 1 ? p.stepLocation : stepNum === 2 ? p.stepConstruction : p.stepHazards}
                    </div>
                  </div>
                </div>
                {stepNum < 3 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded ${
                      stepNum < step ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          {step === 1 && (
            <LocationInput
              data={formData.location || { country: 'Pakistan', province: '', district: '' }}
              onChange={(location) => updateFormData({ location })}
            />
          )}

          {step === 2 && (
            <ConstructionForm
              data={{
                constructionType: formData.constructionType || '',
                rooms: formData.rooms || 1,
                roomSize: formData.roomSize || { length: 10, width: 12 },
                totalPlotAreaSqFt: formData.totalPlotAreaSqFt,
                totalRooms: formData.totalRooms,
                kitchens: formData.kitchens,
                bathrooms: formData.bathrooms,
                lounges: formData.lounges,
                stores: formData.stores,
                otherRooms: formData.otherRooms,
                roomTemplates: formData.roomTemplates,
                wallHeightFt: formData.wallHeightFt ?? 10,
                ceilingHeightFt: formData.ceilingHeightFt ?? 10,
                wallThicknessIn: formData.wallThicknessIn ?? 9,
                doors: formData.doors,
                windows: formData.windows,
                openingDefaultsLocked: formData.openingDefaultsLocked,
                boundaryWall: formData.boundaryWall,
                floorConfig: formData.floorConfig,
                ceilingConfig: formData.ceilingConfig,
                soil: formData.soil || '',
              }}
              onChange={updateFormData}
            />
          )}

          {step === 3 && (
            <div className="space-y-6">
              <HazardSelector
                selected={formData.hazards || []}
                onChange={(hazards) => updateFormData({ hazards })}
              />

              {showRateReview && formData.rates && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-5 md:p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Rate Review ({formData.rates.province}, Pakistan)</h3>
                      <p className="text-sm text-gray-600">
                        Fetched rates are editable. Your final calculation will use these values.
                      </p>
                    </div>
                  </div>

                  {rateFetchError && (
                    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                      {rateFetchError}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Material Rates (PKR)</h4>
                      <div className="space-y-3">
                        <label className="block">
                          <span className="text-sm text-gray-700">Brick (per piece)</span>
                          <input
                            type="number"
                            min={1}
                            value={formData.rates.materialRates.brickPerPiece}
                            onChange={(e) => handleRateFieldChange('materialRates', 'brickPerPiece', e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm text-gray-700">Cement (per bag)</span>
                          <input
                            type="number"
                            min={1}
                            value={formData.rates.materialRates.cementPerBag}
                            onChange={(e) => handleRateFieldChange('materialRates', 'cementPerBag', e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm text-gray-700">Sand (per cu ft)</span>
                          <input
                            type="number"
                            min={1}
                            value={formData.rates.materialRates.sandPerCft}
                            onChange={(e) => handleRateFieldChange('materialRates', 'sandPerCft', e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm text-gray-700">Aggregate (per cu ft)</span>
                          <input
                            type="number"
                            min={1}
                            value={formData.rates.materialRates.aggregatePerCft}
                            onChange={(e) => handleRateFieldChange('materialRates', 'aggregatePerCft', e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm text-gray-700">Steel (per kg)</span>
                          <input
                            type="number"
                            min={1}
                            value={formData.rates.materialRates.steelPerKg}
                            onChange={(e) => handleRateFieldChange('materialRates', 'steelPerKg', e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm text-gray-700">Tiles (per sq ft)</span>
                          <input
                            type="number"
                            min={1}
                            value={formData.rates.materialRates.tilePerSqFt}
                            onChange={(e) => handleRateFieldChange('materialRates', 'tilePerSqFt', e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm text-gray-700">Plaster (per sq ft)</span>
                          <input
                            type="number"
                            min={1}
                            value={formData.rates.materialRates.plasterPerSqFt}
                            onChange={(e) => handleRateFieldChange('materialRates', 'plasterPerSqFt', e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm text-gray-700">Doors (per sq ft)</span>
                          <input
                            type="number"
                            min={1}
                            value={formData.rates.materialRates.doorPerSqFt}
                            onChange={(e) => handleRateFieldChange('materialRates', 'doorPerSqFt', e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm text-gray-700">Windows (per sq ft)</span>
                          <input
                            type="number"
                            min={1}
                            value={formData.rates.materialRates.windowPerSqFt}
                            onChange={(e) => handleRateFieldChange('materialRates', 'windowPerSqFt', e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm text-gray-700">Wood (per cu ft)</span>
                          <input
                            type="number"
                            min={1}
                            value={formData.rates.materialRates.woodPerCft}
                            onChange={(e) => handleRateFieldChange('materialRates', 'woodPerCft', e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm text-gray-700">Beam/Structural (per rft)</span>
                          <input
                            type="number"
                            min={1}
                            value={formData.rates.materialRates.beamPerRft}
                            onChange={(e) => handleRateFieldChange('materialRates', 'beamPerRft', e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Labor & Productivity</h4>
                      <div className="space-y-3">
                        <label className="block">
                          <span className="text-sm text-gray-700">Mason Daily Wage</span>
                          <input
                            type="number"
                            min={1}
                            value={formData.rates.laborRates.dailyWageMason}
                            onChange={(e) => handleRateFieldChange('laborRates', 'dailyWageMason', e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm text-gray-700">Helper Daily Wage</span>
                          <input
                            type="number"
                            min={1}
                            value={formData.rates.laborRates.dailyWageHelper}
                            onChange={(e) => handleRateFieldChange('laborRates', 'dailyWageHelper', e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm text-gray-700">Workers per 100 sq ft</span>
                          <input
                            type="number"
                            min={0.5}
                            step="0.1"
                            value={formData.rates.laborRates.workersPer100SqFt}
                            onChange={(e) => handleRateFieldChange('laborRates', 'workersPer100SqFt', e.target.value)}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm text-gray-700">Productivity (sq ft/worker/day)</span>
                          <input
                            type="number"
                            min={1}
                            step="0.1"
                            value={formData.rates.laborRates.productivitySqFtPerWorkerDay}
                            onChange={(e) =>
                              handleRateFieldChange('laborRates', 'productivitySqFtPerWorkerDay', e.target.value)
                            }
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {previewResult && (
                    <div className="mt-5 rounded-lg border border-green-300 bg-green-50 p-4">
                      <div className="text-sm text-green-800 font-semibold mb-2">Live Preview with Selected Rates</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="text-gray-700">Est. Cost: <span className="font-semibold">₨{previewResult.estimatedCost.toLocaleString()}</span></div>
                        <div className="text-gray-700">Labor: <span className="font-semibold">{previewResult.labor.workers}</span></div>
                        <div className="text-gray-700">Timeline: <span className="font-semibold">{previewResult.labor.days}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="sticky bottom-2 z-20 mt-2 rounded-2xl border border-[#DCE2F3] bg-white/95 p-3 shadow-[0_10px_28px_rgba(15,23,42,0.14)] backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-[#D7DEEE] text-[#4B5874] hover:bg-[#F6F8FF] transition-colors font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#8E7CFF] text-white hover:brightness-105 transition-all duration-200 font-semibold"
          >
            {step === totalSteps
              ? isFetchingRates
                ? 'Fetching Rates...'
                : showRateReview
                ? 'Proceed to Results'
                : 'Calculate Plan'
              : 'Next Step'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        </div>

        {validationError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {validationError}
          </div>
        )}

        {/* Step Counter */}
        <div className="text-center mt-6 text-sm text-gray-500">
          Step {step} of {totalSteps}
        </div>
      </div>
    </div>
    </ModuleBackground>
  );
}
