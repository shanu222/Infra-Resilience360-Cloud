import type { ProvinceRateCard } from './calculator.ts';
import { buildApiTargets } from '@resilience/api-base';

const API_PATH = '/api/smart-construction/province-rates';

const DEFAULT_RATE_CARD: ProvinceRateCard = {
  province: 'Punjab',
  country: 'Pakistan',
  currency: 'PKR',
  source: 'Fallback baseline',
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
  notes: ['Using default baseline rates. You can edit these before calculating.'],
};

const asPositiveNumber = (value: unknown, fallback: number): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return numeric;
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
};

const normalizeRateCard = (raw: unknown, province: string): ProvinceRateCard => {
  const payload = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const materialRatesRaw = payload.materialRates && typeof payload.materialRates === 'object'
    ? (payload.materialRates as Record<string, unknown>)
    : {};
  const laborRatesRaw = payload.laborRates && typeof payload.laborRates === 'object'
    ? (payload.laborRates as Record<string, unknown>)
    : {};

  return {
    province: String(payload.province ?? province),
    country: 'Pakistan',
    currency: 'PKR',
    source: String(payload.source ?? 'AI estimate'),
    fetchedAt: String(payload.fetchedAt ?? new Date().toISOString()),
    materialRates: {
      brickPerPiece: asPositiveNumber(materialRatesRaw.brickPerPiece, DEFAULT_RATE_CARD.materialRates.brickPerPiece),
      cementPerBag: asPositiveNumber(materialRatesRaw.cementPerBag, DEFAULT_RATE_CARD.materialRates.cementPerBag),
      sandPerCft: asPositiveNumber(materialRatesRaw.sandPerCft, DEFAULT_RATE_CARD.materialRates.sandPerCft),
      aggregatePerCft: asPositiveNumber(materialRatesRaw.aggregatePerCft, DEFAULT_RATE_CARD.materialRates.aggregatePerCft),
      steelPerKg: asPositiveNumber(materialRatesRaw.steelPerKg, DEFAULT_RATE_CARD.materialRates.steelPerKg),
      tilePerSqFt: asPositiveNumber(materialRatesRaw.tilePerSqFt, DEFAULT_RATE_CARD.materialRates.tilePerSqFt),
      doorPerSqFt: asPositiveNumber(materialRatesRaw.doorPerSqFt, DEFAULT_RATE_CARD.materialRates.doorPerSqFt),
      windowPerSqFt: asPositiveNumber(materialRatesRaw.windowPerSqFt, DEFAULT_RATE_CARD.materialRates.windowPerSqFt),
      woodPerCft: asPositiveNumber(materialRatesRaw.woodPerCft, DEFAULT_RATE_CARD.materialRates.woodPerCft),
      plasterPerSqFt: asPositiveNumber(materialRatesRaw.plasterPerSqFt, DEFAULT_RATE_CARD.materialRates.plasterPerSqFt),
      beamPerRft: asPositiveNumber(materialRatesRaw.beamPerRft, DEFAULT_RATE_CARD.materialRates.beamPerRft),
      concretePerCft: asPositiveNumber(materialRatesRaw.concretePerCft, DEFAULT_RATE_CARD.materialRates.concretePerCft),
      paintPerSqFt: asPositiveNumber(materialRatesRaw.paintPerSqFt, DEFAULT_RATE_CARD.materialRates.paintPerSqFt),
      doorWoodPerUnit: asPositiveNumber(materialRatesRaw.doorWoodPerUnit, DEFAULT_RATE_CARD.materialRates.doorWoodPerUnit),
      windowAluminumPerUnit: asPositiveNumber(materialRatesRaw.windowAluminumPerUnit, DEFAULT_RATE_CARD.materialRates.windowAluminumPerUnit),
      waterproofPerSqFt: asPositiveNumber(materialRatesRaw.waterproofPerSqFt, DEFAULT_RATE_CARD.materialRates.waterproofPerSqFt),
      gaderPerPiece: asPositiveNumber(materialRatesRaw.gaderPerPiece, DEFAULT_RATE_CARD.materialRates.gaderPerPiece),
      beamConcretePerCft: asPositiveNumber(materialRatesRaw.beamConcretePerCft, DEFAULT_RATE_CARD.materialRates.beamConcretePerCft),
      columnConcretePerCft: asPositiveNumber(materialRatesRaw.columnConcretePerCft, DEFAULT_RATE_CARD.materialRates.columnConcretePerCft),
    },
    laborRates: {
      dailyWageMason: asPositiveNumber(laborRatesRaw.dailyWageMason, DEFAULT_RATE_CARD.laborRates.dailyWageMason),
      dailyWageHelper: asPositiveNumber(laborRatesRaw.dailyWageHelper, DEFAULT_RATE_CARD.laborRates.dailyWageHelper),
      workersPer100SqFt: asPositiveNumber(laborRatesRaw.workersPer100SqFt, DEFAULT_RATE_CARD.laborRates.workersPer100SqFt),
      productivitySqFtPerWorkerDay: asPositiveNumber(
        laborRatesRaw.productivitySqFtPerWorkerDay,
        DEFAULT_RATE_CARD.laborRates.productivitySqFtPerWorkerDay,
      ),
    },
    notes: toStringArray(payload.notes),
  };
};

export async function fetchProvinceRates(province: string, materials?: Record<string, number>): Promise<ProvinceRateCard> {
  const selectedProvince = String(province || 'Punjab').trim();
  const fallback = (): ProvinceRateCard => ({
    ...DEFAULT_RATE_CARD,
    province: selectedProvince,
    fetchedAt: new Date().toISOString(),
    source: 'Fallback baseline',
    notes: ['Using default baseline rates. You can edit these before calculating.'],
  });

  try {
    const targets = buildApiTargets(API_PATH);
    const timeoutMs = 10_000;

    for (const target of targets) {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : 0;
      try {
        const response = await fetch(target, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ province: selectedProvince, materials: materials ?? {} }),
          signal: controller?.signal,
        });

        if (!response.ok) {
          continue;
        }

        const payload = await response.json();
        return normalizeRateCard(payload, selectedProvince);
      } catch {
        /* try next target / fall through to defaults */
      } finally {
        if (timer) window.clearTimeout(timer);
      }
    }
  } catch {
    /* buildApiTargets may throw when the API origin is missing */
  }

  return fallback();
}

export function getDefaultProvinceRateCard(province: string): ProvinceRateCard {
  return {
    ...DEFAULT_RATE_CARD,
    province: String(province || 'Punjab').trim(),
    fetchedAt: new Date().toISOString(),
  };
}

