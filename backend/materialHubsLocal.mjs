/**
 * Material Hubs inventory — local JSON (`data/material-hubs.json`).
 */
import { randomBytes } from 'node:crypto'
import { readJsonCollection, writeJsonCollection } from './services/JsonDatabase.mjs'

function emptyPayload() {
  return { hubs: [], entries: [] }
}

function toPositiveNumber(value, fallback = 0) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.max(0, num)
}

function computeHubMetricsFromEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { stock_percentage: 0, damage_percentage: 0, status: 'critical' }
  }
  const totalStock = entries.reduce((sum, e) => sum + toPositiveNumber(e?.percentage_remaining), 0)
  const totalDamaged = entries.reduce((sum, e) => sum + toPositiveNumber(e?.damaged), 0)
  const totalGross = entries.reduce(
    (sum, e) => sum + toPositiveNumber(e?.opening) + toPositiveNumber(e?.received),
    0,
  )
  const stock_percentage = Math.round(totalStock / entries.length)
  const damage_percentage = totalGross > 0 ? Math.round((totalDamaged / totalGross) * 100) : 0
  const status =
    stock_percentage >= 75 && damage_percentage <= 10 ? 'ready'
    : stock_percentage >= 50 && damage_percentage <= 20 ? 'moderate'
    : 'critical'
  return { stock_percentage, damage_percentage, status }
}

async function loadStore() {
  const data = await readJsonCollection('material-hubs', emptyPayload())
  return {
    hubs: Array.isArray(data?.hubs) ? data.hubs : [],
    entries: Array.isArray(data?.entries) ? data.entries : [],
  }
}

async function saveStore(store) {
  await writeJsonCollection('material-hubs', store)
}

export async function loadMaterialHubsAdminPayload() {
  return loadStore()
}

export async function refreshMaterialHubMetricsMongo(hubId) {
  const store = await loadStore()
  const hubEntries = store.entries.filter((e) => String(e.hub_id) === String(hubId))
  const metrics = computeHubMetricsFromEntries(hubEntries)
  const idx = store.hubs.findIndex((h) => String(h.id) === String(hubId))
  if (idx < 0) return
  const nowIso = new Date().toISOString()
  store.hubs[idx] = { ...store.hubs[idx], ...metrics, updated_at: nowIso }
  await saveStore(store)
}

export async function createMaterialHub(payload) {
  const store = await loadStore()
  const nowIso = new Date().toISOString()
  const id = `hub-${randomBytes(6).toString('hex')}`
  const doc = { id, ...payload, created_at: nowIso, updated_at: nowIso }
  store.hubs.push(doc)
  await saveStore(store)
  return doc
}

export async function updateMaterialHub(hubId, patch) {
  const store = await loadStore()
  const idx = store.hubs.findIndex((h) => String(h.id) === String(hubId))
  if (idx < 0) return null
  const nowIso = new Date().toISOString()
  store.hubs[idx] = { ...store.hubs[idx], ...patch, updated_at: nowIso }
  await saveStore(store)
  return store.hubs[idx]
}

export async function deleteMaterialHub(hubId) {
  const store = await loadStore()
  const before = store.hubs.length
  store.hubs = store.hubs.filter((h) => String(h.id) !== String(hubId))
  store.entries = store.entries.filter((e) => String(e.hub_id) !== String(hubId))
  if (store.hubs.length === before) return false
  await saveStore(store)
  return true
}

export async function createMaterialEntry(payload) {
  const store = await loadStore()
  const nowIso = new Date().toISOString()
  const id = `entry-${randomBytes(6).toString('hex')}`
  const doc = { id, ...payload, created_at: nowIso, updated_at: nowIso }
  store.entries.push(doc)
  await saveStore(store)
  if (doc.hub_id) await refreshMaterialHubMetricsMongo(doc.hub_id)
  return doc
}

export async function getMaterialEntryById(entryId) {
  const store = await loadStore()
  return store.entries.find((e) => String(e.id) === String(entryId)) ?? null
}

export async function updateMaterialEntry(entryId, patch) {
  const store = await loadStore()
  const idx = store.entries.findIndex((e) => String(e.id) === String(entryId))
  if (idx < 0) return null
  const previousHubId = String(store.entries[idx].hub_id ?? '')
  const nowIso = new Date().toISOString()
  store.entries[idx] = { ...store.entries[idx], ...patch, updated_at: nowIso }
  await saveStore(store)
  await refreshMaterialHubMetricsMongo(previousHubId)
  const nextHubId = String(store.entries[idx].hub_id ?? '')
  if (nextHubId && nextHubId !== previousHubId) await refreshMaterialHubMetricsMongo(nextHubId)
  return store.entries[idx]
}

export async function deleteMaterialEntry(entryId) {
  const store = await loadStore()
  const existing = store.entries.find((e) => String(e.id) === String(entryId))
  if (!existing) return false
  const hubId = String(existing.hub_id ?? '')
  store.entries = store.entries.filter((e) => String(e.id) !== String(entryId))
  await saveStore(store)
  if (hubId) await refreshMaterialHubMetricsMongo(hubId)
  return true
}
