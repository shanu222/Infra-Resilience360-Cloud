import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import * as earthquakeConfig from './config.mjs'
import { buildSourceLabel } from './utils.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRootDir = path.resolve(__dirname, '../../..')
const cacheDir = path.join(repoRootDir, 'storage', 'cache', 'earthquake')
const cacheFile = path.join(cacheDir, 'latest.json')

let memoryCache = {
  loadedAt: 0,
  payload: null,
  provider: null,
}

export function getMemoryCache() {
  return memoryCache
}

export function isMemoryCacheFresh(now = Date.now()) {
  if (!memoryCache.payload) return false
  return now - Number(memoryCache.loadedAt || 0) < earthquakeConfig.EARTHQUAKE_CACHE_TTL_MS
}

export function setMemoryCache(payload, provider = payload?.provider ?? payload?.source ?? 'USGS') {
  memoryCache = {
    loadedAt: Date.now(),
    payload,
    provider,
  }
  return memoryCache
}

export async function readDiskCache() {
  try {
    const raw = await fs.readFile(cacheFile, 'utf8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.features)) return null
    return parsed
  } catch {
    return null
  }
}

export async function writeDiskCache(payload) {
  await fs.mkdir(cacheDir, { recursive: true })
  await fs.writeFile(cacheFile, JSON.stringify(payload, null, 2), 'utf8')
}

export function enrichCachedResponse(payload, { fromCache = true, warning = null } = {}) {
  const source = String(payload?.source ?? payload?.provider ?? 'USGS')
  const lastUpdated = String(payload?.lastUpdated ?? payload?.timestamp ?? new Date().toISOString())
  const cacheAgeMs = Math.max(0, Date.now() - Date.parse(lastUpdated))
  return {
    ...payload,
    source,
    sourceLabel: buildSourceLabel(source, fromCache),
    provider: payload?.provider ?? source,
    lastUpdated,
    fromCache,
    cacheAge: Math.round(cacheAgeMs / 1000),
    ...(warning ? { warning } : {}),
  }
}

export function getCacheStatus() {
  const now = Date.now()
  const lastUpdated = memoryCache.payload?.lastUpdated ?? memoryCache.payload?.timestamp ?? null
  return {
    memoryLoadedAt: memoryCache.loadedAt || null,
    memoryFresh: isMemoryCacheFresh(now),
    ttlSeconds: earthquakeConfig.EARTHQUAKE_REFRESH_SECONDS,
    provider: memoryCache.provider ?? memoryCache.payload?.provider ?? null,
    featureCount: Array.isArray(memoryCache.payload?.features) ? memoryCache.payload.features.length : 0,
    lastUpdated,
    cacheAgeSeconds: lastUpdated ? Math.round(Math.max(0, now - Date.parse(lastUpdated)) / 1000) : null,
    diskCacheFile: cacheFile,
  }
}
