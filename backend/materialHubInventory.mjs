/**
 * Material Hub inventory transforms, public payload, and update history.
 */
import { randomBytes } from 'node:crypto'
import { readJsonCollection, writeJsonCollection } from './services/JsonDatabase.mjs'
import { loadMaterialHubsAdminPayload } from './materialHubsLocal.mjs'

const HISTORY_COLLECTION = 'material-hubs-history'
const LOW_STOCK_THRESHOLD = 25

function toPositiveNumber(value, fallback = 0) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.max(0, num)
}

function entryStatus(entry) {
  const closing = toPositiveNumber(entry?.closing)
  const pct = toPositiveNumber(entry?.percentage_remaining)
  if (closing <= 0) return 'out-of-stock'
  if (pct < LOW_STOCK_THRESHOLD) return 'low-stock'
  return 'available'
}

function mapEntryToMaterial(entry) {
  return {
    id: String(entry.id),
    name: String(entry.name ?? ''),
    unit: String(entry.unit ?? 'units'),
    opening: toPositiveNumber(entry.opening),
    received: toPositiveNumber(entry.received),
    issued: toPositiveNumber(entry.issued),
    closing: toPositiveNumber(entry.closing),
    damaged: toPositiveNumber(entry.damaged),
    percentageRemaining: toPositiveNumber(entry.percentage_remaining),
  }
}

function mapHubToFrontend(hub) {
  return {
    id: String(hub.id),
    name: String(hub.name ?? ''),
    location: String(hub.location ?? ''),
    district: String(hub.district ?? ''),
    coordinates: [Number(hub.latitude) || 0, Number(hub.longitude) || 0],
    capacity: toPositiveNumber(hub.capacity),
    status: hub.status === 'moderate' || hub.status === 'critical' ? hub.status : 'ready',
    stockPercentage: toPositiveNumber(hub.stock_percentage),
    damagePercentage: toPositiveNumber(hub.damage_percentage),
  }
}

export function buildPublicInventoryPayload(store) {
  const hubs = Array.isArray(store?.hubs) ? store.hubs : []
  const entries = Array.isArray(store?.entries) ? store.entries : []

  const hubById = new Map(hubs.map((h) => [String(h.id), h]))

  const inventory = hubs.map((hub) => {
    const hubId = String(hub.id)
    const hubEntries = entries.filter((e) => String(e.hub_id) === hubId)
    const lastUpdated = hubEntries.reduce((max, e) => {
      const ts = String(e.updated_at ?? e.created_at ?? '')
      return ts > max ? ts : max
    }, String(hub.updated_at ?? hub.created_at ?? ''))

    return {
      hubId,
      hubName: String(hub.name ?? ''),
      lastUpdated: lastUpdated || new Date().toISOString(),
      materials: hubEntries.map(mapEntryToMaterial),
    }
  })

  return {
    hubs: hubs.map(mapHubToFrontend),
    inventory,
    entries: entries.map((entry) => {
      const hub = hubById.get(String(entry.hub_id))
      return {
        id: String(entry.id),
        hubId: String(entry.hub_id),
        hubName: String(hub?.name ?? ''),
        name: String(entry.name ?? ''),
        unit: String(entry.unit ?? 'units'),
        opening: toPositiveNumber(entry.opening),
        received: toPositiveNumber(entry.received),
        issued: toPositiveNumber(entry.issued),
        closing: toPositiveNumber(entry.closing),
        damaged: toPositiveNumber(entry.damaged),
        percentageRemaining: toPositiveNumber(entry.percentage_remaining),
        status: entryStatus(entry),
        updatedAt: String(entry.updated_at ?? entry.created_at ?? ''),
      }
    }),
  }
}

export async function loadPublicInventoryPayload() {
  const store = await loadMaterialHubsAdminPayload()
  return buildPublicInventoryPayload(store)
}

export async function loadInventoryDashboardStats() {
  const payload = await loadPublicInventoryPayload()
  const { hubs, inventory, entries } = payload

  let availableItems = 0
  let lowStockItems = 0
  let outOfStockItems = 0
  let lastInventoryUpdate = ''

  for (const entry of entries) {
    if (entry.status === 'available') availableItems += 1
    else if (entry.status === 'low-stock') lowStockItems += 1
    else outOfStockItems += 1
    if (entry.updatedAt > lastInventoryUpdate) lastInventoryUpdate = entry.updatedAt
  }

  const recentlyUpdated = [...entries]
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, 8)

  return {
    totalHubs: hubs.length,
    totalItems: entries.length,
    availableItems,
    lowStockItems,
    outOfStockItems,
    lastInventoryUpdate: lastInventoryUpdate || null,
    recentlyUpdated,
  }
}

async function loadHistoryStore() {
  const data = await readJsonCollection(HISTORY_COLLECTION, { entries: [] })
  return { entries: Array.isArray(data?.entries) ? data.entries : [] }
}

async function saveHistoryStore(store) {
  await writeJsonCollection(HISTORY_COLLECTION, store)
}

const TRACKED_FIELDS = ['name', 'unit', 'opening', 'received', 'issued', 'damaged', 'closing']

export async function recordInventoryHistory({ previous, next, updatedBy }) {
  if (!previous || !next) return

  const store = await loadMaterialHubsAdminPayload()
  const hub = store.hubs.find((h) => String(h.id) === String(next.hub_id))
  const hubName = String(hub?.name ?? next.hub_id ?? '')

  const history = await loadHistoryStore()
  const nowIso = new Date().toISOString()
  const actor = String(updatedBy ?? 'admin').trim() || 'admin'

  for (const field of TRACKED_FIELDS) {
    const prevVal = previous[field]
    const nextVal = next[field]
    if (String(prevVal) === String(nextVal)) continue

    history.entries.unshift({
      id: `hist-${randomBytes(6).toString('hex')}`,
      entry_id: String(next.id),
      material_name: String(next.name ?? previous.name ?? ''),
      hub_id: String(next.hub_id ?? ''),
      hub_name: hubName,
      field,
      previous_value: String(prevVal ?? ''),
      new_value: String(nextVal ?? ''),
      updated_by: actor,
      updated_at: nowIso,
    })
  }

  if (history.entries.length > 500) {
    history.entries = history.entries.slice(0, 500)
  }

  await saveHistoryStore(history)
}

export async function listInventoryHistory({ limit = 100 } = {}) {
  const history = await loadHistoryStore()
  const max = Math.max(1, Math.min(500, Number(limit) || 100))
  return { entries: history.entries.slice(0, max) }
}
