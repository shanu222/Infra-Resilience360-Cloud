/**
 * Single source of truth for live Material Hub inventory.
 *
 * Durable storage is one JSON object in Cloudflare R2, because Railway containers
 * have an ephemeral filesystem — anything written to disk there is lost on redeploy.
 * When R2 credentials are absent (local development) the same document is kept in
 * `data/material-hub-inventory.json` instead.
 */

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { readJsonCollection, writeJsonCollection } from './services/JsonDatabase.mjs'
import { buildSeedInventory } from './materialHubInventorySeed.mjs'

const COLLECTION_NAME = 'material-hub-inventory'

/**
 * Deliberately outside the `content/` prefix served by the public media proxy,
 * so the inventory document is never reachable as a static asset.
 */
const R2_OBJECT_KEY = String(
  process.env.MATERIAL_HUB_INVENTORY_R2_KEY || 'data/material-hub-inventory.json',
).trim()

/** Guards against a stale read on a second container instance; writes invalidate immediately. */
const CACHE_TTL_MS = 10_000

const normalizeEnv = (value) =>
  String(value ?? '')
    .trim()
    .replace(/^['"]|['"]$/g, '')

const R2_ACCOUNT_ID = normalizeEnv(process.env.R2_ACCOUNT_ID)
const R2_BUCKET = normalizeEnv(process.env.R2_BUCKET)
const R2_ACCESS_KEY_ID = normalizeEnv(process.env.R2_ACCESS_KEY_ID)
const R2_SECRET_ACCESS_KEY = normalizeEnv(process.env.R2_SECRET_ACCESS_KEY)
const R2_ENDPOINT =
  normalizeEnv(process.env.R2_ENDPOINT) ||
  (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '')

const isR2Enabled = Boolean(R2_ENDPOINT && R2_BUCKET && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY)

const r2Client = isR2Enabled
  ? new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      forcePathStyle: true,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    })
  : null

export function describeInventoryStorage() {
  return isR2Enabled
    ? { driver: 'r2', bucket: R2_BUCKET, key: R2_OBJECT_KEY, durable: true }
    : { driver: 'local-file', key: `data/${COLLECTION_NAME}.json`, durable: false }
}

/* ------------------------------------------------------------------ */
/* Normalization                                                       */
/* ------------------------------------------------------------------ */

const toText = (value, fallback = '') => {
  const text = String(value ?? '').trim()
  return text || fallback
}

const toQuantity = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) return 0
  return Math.round(num * 100) / 100
}

function normalizeMaterial(raw, index) {
  const name = toText(raw?.name)
  if (!name) return null
  return {
    id: toText(raw?.id, `m${index + 1}`),
    name,
    unit: toText(raw?.unit, 'units'),
    quantity: toQuantity(raw?.quantity),
  }
}

function normalizeHub(raw) {
  const id = toText(raw?.id)
  if (!id) return null
  const materials = Array.isArray(raw?.materials) ? raw.materials : []
  return {
    id,
    name: toText(raw?.name, id),
    location: toText(raw?.location, '—'),
    district: toText(raw?.district, '—'),
    lastUpdated: toText(raw?.lastUpdated, new Date().toISOString().slice(0, 10)),
    materials: materials.map(normalizeMaterial).filter(Boolean),
  }
}

function normalizePayload(raw) {
  const hubs = Array.isArray(raw?.hubs) ? raw.hubs.map(normalizeHub).filter(Boolean) : []
  return {
    version: 1,
    updatedAt: toText(raw?.updatedAt, new Date().toISOString()),
    hubs,
  }
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

let cached = null
let cachedAt = 0

function isMissingObjectError(error) {
  const name = String(error?.name ?? '')
  const code = String(error?.Code ?? error?.code ?? '')
  const status = Number(error?.$metadata?.httpStatusCode ?? 0)
  return name === 'NoSuchKey' || name === 'NotFound' || code === 'NoSuchKey' || status === 404
}

async function readFromR2() {
  const response = await r2Client.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: R2_OBJECT_KEY }))
  const body = await response.Body.transformToString()
  return JSON.parse(body)
}

async function writeToR2(payload) {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: R2_OBJECT_KEY,
      Body: `${JSON.stringify(payload, null, 2)}\n`,
      ContentType: 'application/json',
      CacheControl: 'no-store',
    }),
  )
}

async function readRaw() {
  if (isR2Enabled) {
    try {
      return await readFromR2()
    } catch (error) {
      if (isMissingObjectError(error)) return null
      throw error
    }
  }
  return readJsonCollection(COLLECTION_NAME, null)
}

async function writeRaw(payload) {
  if (isR2Enabled) {
    await writeToR2(payload)
    return
  }
  await writeJsonCollection(COLLECTION_NAME, payload)
}

/** Serializes read-modify-write cycles so concurrent edits cannot clobber each other. */
let writeQueue = Promise.resolve()

function enqueue(task) {
  const run = writeQueue.then(task, task)
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function loadPayload({ allowCache = true } = {}) {
  if (allowCache && cached && Date.now() - cachedAt < CACHE_TTL_MS) return cached

  const raw = await readRaw()
  if (!raw || !Array.isArray(raw?.hubs) || raw.hubs.length === 0) {
    const seeded = normalizePayload(buildSeedInventory())
    await writeRaw(seeded)
    cached = seeded
    cachedAt = Date.now()
    console.info(`[material-hub-inventory] bootstrapped store (${describeInventoryStorage().driver})`)
    return seeded
  }

  const normalized = normalizePayload(raw)
  cached = normalized
  cachedAt = Date.now()
  return normalized
}

async function savePayload(payload) {
  const normalized = normalizePayload({ ...payload, updatedAt: new Date().toISOString() })
  await writeRaw(normalized)
  cached = normalized
  cachedAt = Date.now()
  return normalized
}

/** Applies `mutate` to the freshest copy of the document and persists the result. */
function mutate(mutator) {
  return enqueue(async () => {
    const current = await loadPayload({ allowCache: false })
    const draft = JSON.parse(JSON.stringify(current))
    const result = mutator(draft)
    const saved = await savePayload(draft)
    return { payload: saved, result }
  })
}

function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function findHub(payload, hubId) {
  const id = toText(hubId)
  const hub = payload.hubs.find((entry) => entry.id === id)
  if (!hub) throw httpError(404, 'Material hub not found.')
  return hub
}

function stampHub(hub) {
  hub.lastUpdated = new Date().toISOString().slice(0, 10)
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export async function getInventory() {
  return loadPayload()
}

/**
 * Shape consumed by the existing public portal. Quantity is projected onto the
 * legacy opening/closing fields so the public UI needs no rendering changes.
 */
export async function getPublicInventory() {
  const payload = await loadPayload()
  return {
    updatedAt: payload.updatedAt,
    hubs: payload.hubs.map((hub) => ({
      hubId: hub.id,
      hubName: hub.name,
      location: hub.location,
      district: hub.district,
      lastUpdated: hub.lastUpdated,
      materials: hub.materials.map((material) => ({
        id: material.id,
        name: material.name,
        unit: material.unit,
        opening: material.quantity,
        received: 0,
        issued: 0,
        closing: material.quantity,
        damaged: 0,
        percentageRemaining: 100,
      })),
    })),
  }
}

export async function updateMaterial(hubId, materialId, changes) {
  const { result } = await mutate((draft) => {
    const hub = findHub(draft, hubId)
    const material = hub.materials.find((entry) => entry.id === toText(materialId))
    if (!material) throw httpError(404, 'Material not found in this hub.')

    if (changes?.quantity !== undefined) {
      const quantity = Number(changes.quantity)
      if (!Number.isFinite(quantity) || quantity < 0) {
        throw httpError(400, 'Quantity must be zero or a positive number.')
      }
      material.quantity = toQuantity(quantity)
    }
    if (changes?.unit !== undefined) {
      const unit = toText(changes.unit)
      if (!unit) throw httpError(400, 'Unit cannot be empty.')
      material.unit = unit
    }
    if (changes?.name !== undefined) {
      const name = toText(changes.name)
      if (!name) throw httpError(400, 'Material name cannot be empty.')
      material.name = name
    }

    stampHub(hub)
    return material
  })
  return result
}

export async function addMaterial(hubId, input) {
  const { result } = await mutate((draft) => {
    const hub = findHub(draft, hubId)
    const name = toText(input?.name)
    if (!name) throw httpError(400, 'Material name is required.')

    const duplicate = hub.materials.some(
      (entry) => entry.name.toLowerCase() === name.toLowerCase(),
    )
    if (duplicate) throw httpError(409, 'That material already exists in this hub.')

    const usedIds = new Set(hub.materials.map((entry) => entry.id))
    let nextIndex = hub.materials.length + 1
    while (usedIds.has(`m${nextIndex}`)) nextIndex += 1

    const material = {
      id: `m${nextIndex}`,
      name,
      unit: toText(input?.unit, 'units'),
      quantity: toQuantity(input?.quantity),
    }
    hub.materials.push(material)
    stampHub(hub)
    return material
  })
  return result
}

export async function deleteMaterial(hubId, materialId) {
  await mutate((draft) => {
    const hub = findHub(draft, hubId)
    const index = hub.materials.findIndex((entry) => entry.id === toText(materialId))
    if (index < 0) throw httpError(404, 'Material not found in this hub.')
    hub.materials.splice(index, 1)
    stampHub(hub)
    return true
  })
  return { ok: true }
}
