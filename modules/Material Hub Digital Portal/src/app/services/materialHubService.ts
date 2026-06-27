import type { MaterialEntry, MaterialHub } from '../data/types';
import { supabase } from './supabase';

type HubSeedDefaults = {
  district: string;
  latitude: number;
  longitude: number;
  capacity: number;
};

const LOCATION_PRESETS: Record<string, HubSeedDefaults> = {
  gilgit: { district: 'Gilgit-Baltistan', latitude: 35.9208, longitude: 74.308, capacity: 200 },
  muzaffargarh: { district: 'Muzaffargarh', latitude: 30.0704, longitude: 71.1932, capacity: 200 },
  sukkur: { district: 'Sukkur', latitude: 27.7052, longitude: 68.8574, capacity: 200 },
};

const DEFAULT_PAKISTAN_CENTER = {
  latitude: 30.3753,
  longitude: 69.3451,
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

function hashString(value: string) {
  return Array.from(value).reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) % 100000;
  }, 7);
}

function deriveHubDefaults(name: string, location: string): HubSeedDefaults {
  const normalizedLocation = normalize(location);
  const presetKey = Object.keys(LOCATION_PRESETS).find((key) => normalizedLocation.includes(key));
  if (presetKey) {
    return LOCATION_PRESETS[presetKey];
  }

  const normalizedName = normalize(name);
  const latSeed = hashString(`${normalizedName}${normalizedLocation}lat`);
  const lngSeed = hashString(`${normalizedName}${normalizedLocation}lng`);

  return {
    district: location.trim() || name.trim() || 'Pakistan',
    latitude: Number((DEFAULT_PAKISTAN_CENTER.latitude + ((latSeed % 1200) - 600) / 1000).toFixed(4)),
    longitude: Number((DEFAULT_PAKISTAN_CENTER.longitude + ((lngSeed % 1600) - 800) / 1000).toFixed(4)),
    capacity: 200,
  };
}

type HubRow = {
  id: string;
  name: string;
  location: string;
  district: string;
  latitude: number;
  longitude: number;
  capacity: number;
  status: MaterialHub['status'];
  stock_percentage: number;
  damage_percentage: number;
  created_at: string;
  updated_at: string;
};

type EntryRow = {
  id: string;
  hub_id: string;
  name: string;
  unit: string;
  opening: number;
  received: number;
  issued: number;
  closing: number;
  damaged: number;
  percentage_remaining: number;
  created_at: string;
  updated_at: string;
};

const toHub = (row: HubRow): MaterialHub => ({
  id: row.id,
  name: row.name,
  location: row.location,
  district: row.district,
  latitude: row.latitude,
  longitude: row.longitude,
  capacity: row.capacity,
  status: row.status,
  stockPercentage: row.stock_percentage,
  damagePercentage: row.damage_percentage,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toEntry = (row: EntryRow): MaterialEntry => ({
  id: row.id,
  hubId: row.hub_id,
  name: row.name,
  unit: row.unit,
  opening: row.opening,
  received: row.received,
  issued: row.issued,
  closing: row.closing,
  damaged: row.damaged,
  percentageRemaining: row.percentage_remaining,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const computeEntry = (payload: {
  opening: number;
  received: number;
  issued: number;
  damaged: number;
}) => {
  const opening = Math.max(0, payload.opening);
  const received = Math.max(0, payload.received);
  const issued = Math.max(0, payload.issued);
  const damaged = Math.max(0, payload.damaged);
  const gross = opening + received;
  const closing = Math.max(0, gross - issued - damaged);
  const percentageRemaining = gross > 0 ? Math.round((closing / gross) * 100) : 0;

  return { opening, received, issued, damaged, closing, percentageRemaining };
};

export async function listHubs(): Promise<MaterialHub[]> {
  const { data, error } = await supabase
    .from('material_hubs')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;

  return (data as HubRow[]).map(toHub);
}

type CreateHubPayload = {
  name: string;
  location: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  status?: MaterialHub['status'];
  stockPercentage?: number;
  damagePercentage?: number;
};

export async function createHub(payload: CreateHubPayload) {
  const defaults = deriveHubDefaults(payload.name, payload.location);

  const { data, error } = await supabase
    .from('material_hubs')
    .insert({
      name: payload.name,
      location: payload.location,
      district: payload.district ?? defaults.district,
      latitude: payload.latitude ?? defaults.latitude,
      longitude: payload.longitude ?? defaults.longitude,
      capacity: payload.capacity ?? defaults.capacity,
      status: payload.status ?? 'ready',
      stock_percentage: payload.stockPercentage ?? 0,
      damage_percentage: payload.damagePercentage ?? 0,
    })
    .select('*')
    .single();

  if (error) throw error;

  return toHub(data as HubRow);
}

export async function updateHub(
  hubId: string,
  payload: Partial<Omit<MaterialHub, 'id' | 'createdAt' | 'updatedAt'>>,
) {
  const patch: Record<string, string | number | null> = {};

  if (payload.name !== undefined) patch.name = payload.name;
  if (payload.location !== undefined) patch.location = payload.location;
  if (payload.district !== undefined) patch.district = payload.district;
  if (payload.latitude !== undefined) patch.latitude = payload.latitude;
  if (payload.longitude !== undefined) patch.longitude = payload.longitude;
  if (payload.capacity !== undefined) patch.capacity = payload.capacity;
  if (payload.status !== undefined) patch.status = payload.status;
  if (payload.stockPercentage !== undefined) patch.stock_percentage = payload.stockPercentage;
  if (payload.damagePercentage !== undefined) patch.damage_percentage = payload.damagePercentage;

  const { data, error } = await supabase
    .from('material_hubs')
    .update(patch)
    .eq('id', hubId)
    .select('*')
    .single();

  if (error) throw error;

  return toHub(data as HubRow);
}

export async function deleteHub(hubId: string) {
  const { error } = await supabase.from('material_hubs').delete().eq('id', hubId);

  if (error) throw error;
}

export async function listMaterialEntries(hubId?: string): Promise<MaterialEntry[]> {
  let query = supabase.from('hub_material_entries').select('*').order('name', { ascending: true });

  if (hubId) {
    query = query.eq('hub_id', hubId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data as EntryRow[]).map(toEntry);
}

export async function createMaterialEntry(
  payload: Omit<MaterialEntry, 'id' | 'closing' | 'percentageRemaining' | 'createdAt' | 'updatedAt'>,
) {
  const computed = computeEntry(payload);

  const { data, error } = await supabase
    .from('hub_material_entries')
    .insert({
      hub_id: payload.hubId,
      name: payload.name,
      unit: payload.unit,
      opening: computed.opening,
      received: computed.received,
      issued: computed.issued,
      damaged: computed.damaged,
      closing: computed.closing,
      percentage_remaining: computed.percentageRemaining,
    })
    .select('*')
    .single();

  if (error) throw error;

  await refreshHubMetrics(payload.hubId);

  return toEntry(data as EntryRow);
}

export async function updateMaterialEntry(
  entryId: string,
  payload: Partial<Omit<MaterialEntry, 'id' | 'closing' | 'percentageRemaining' | 'createdAt' | 'updatedAt'>>,
) {
  const existing = await getEntryById(entryId);
  if (!existing) {
    throw new Error('Inventory entry not found.');
  }

  const opening = payload.opening ?? existing.opening;
  const received = payload.received ?? existing.received;
  const issued = payload.issued ?? existing.issued;
  const damaged = payload.damaged ?? existing.damaged;

  const computed = computeEntry({ opening, received, issued, damaged });

  const patch: Record<string, string | number> = {
    opening: computed.opening,
    received: computed.received,
    issued: computed.issued,
    damaged: computed.damaged,
    closing: computed.closing,
    percentage_remaining: computed.percentageRemaining,
  };

  if (payload.name !== undefined) patch.name = payload.name;
  if (payload.unit !== undefined) patch.unit = payload.unit;
  if (payload.hubId !== undefined) patch.hub_id = payload.hubId;

  const { data, error } = await supabase
    .from('hub_material_entries')
    .update(patch)
    .eq('id', entryId)
    .select('*')
    .single();

  if (error) throw error;

  const updated = toEntry(data as EntryRow);

  await refreshHubMetrics(existing.hubId);
  if (updated.hubId !== existing.hubId) {
    await refreshHubMetrics(updated.hubId);
  }

  return updated;
}

export async function deleteMaterialEntry(entryId: string) {
  const existing = await getEntryById(entryId);
  if (!existing) {
    return;
  }

  const { error } = await supabase.from('hub_material_entries').delete().eq('id', entryId);

  if (error) throw error;

  await refreshHubMetrics(existing.hubId);
}

async function getEntryById(entryId: string): Promise<MaterialEntry | null> {
  const { data, error } = await supabase.from('hub_material_entries').select('*').eq('id', entryId).maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return toEntry(data as EntryRow);
}

export async function refreshHubMetrics(hubId: string) {
  const entries = await listMaterialEntries(hubId);

  if (entries.length === 0) {
    await updateHub(hubId, {
      stockPercentage: 0,
      damagePercentage: 0,
      status: 'critical',
    });
    return;
  }

  const totalStockPercentage = entries.reduce((sum, item) => sum + item.percentageRemaining, 0);
  const totalDamaged = entries.reduce((sum, item) => sum + item.damaged, 0);
  const totalGross = entries.reduce((sum, item) => sum + item.opening + item.received, 0);

  const stockPercentage = Math.round(totalStockPercentage / entries.length);
  const damagePercentage = totalGross > 0 ? Math.round((totalDamaged / totalGross) * 100) : 0;

  const status: MaterialHub['status'] =
    stockPercentage >= 75 && damagePercentage <= 10
      ? 'ready'
      : stockPercentage >= 50 && damagePercentage <= 20
        ? 'moderate'
        : 'critical';

  await updateHub(hubId, { stockPercentage, damagePercentage, status });
}
