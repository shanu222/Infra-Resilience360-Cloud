import * as earthquakeConfig from './config.mjs'
import * as usgsProvider from './providers/usgs.mjs'
import * as emscProvider from './providers/emsc.mjs'
import * as gfzProvider from './providers/gfz.mjs'
import * as iscProvider from './providers/isc.mjs'
import * as ndmaProvider from './providers/ndma.mjs'
import {
  enrichCachedResponse,
  getCacheStatus,
  getMemoryCache,
  isMemoryCacheFresh,
  readDiskCache,
  setMemoryCache,
  writeDiskCache,
} from './cache.mjs'
import { buildSourceLabel } from './utils.mjs'

const PROVIDERS = [usgsProvider, emscProvider, gfzProvider, iscProvider, ndmaProvider]

function resolveActiveProviders() {
  const preferred = String(earthquakeConfig.EARTHQUAKE_PROVIDER ?? 'USGS').toUpperCase()
  const enabled = PROVIDERS.filter((provider) => provider.isEnabled(earthquakeConfig))
  if (enabled.length === 0) {
    return PROVIDERS.filter((provider) => provider.id === preferred)
  }
  const primary = enabled.find((provider) => provider.id === preferred)
  const rest = enabled.filter((provider) => provider.id !== preferred)
  return primary ? [primary, ...rest] : enabled
}

async function fetchFromProviders() {
  const activeProviders = resolveActiveProviders()
  let lastError = null
  for (const provider of activeProviders) {
    try {
      const payload = await provider.fetchFeed()
      return { payload, provider: provider.id }
    } catch (error) {
      lastError = error
      console.warn(`[earthquake] provider ${provider.id} failed:`, error instanceof Error ? error.message : error)
    }
  }
  throw (lastError instanceof Error ? lastError : new Error('All earthquake providers failed'))
}

export async function refreshLiveEarthquakeCache() {
  const { payload, provider } = await fetchFromProviders()
  setMemoryCache(payload, provider)
  await writeDiskCache(payload)
  return payload
}

export async function getLiveEarthquakeResponse() {
  const now = Date.now()
  if (isMemoryCacheFresh(now)) {
    return enrichCachedResponse(getMemoryCache().payload, { fromCache: true })
  }

  try {
    const payload = await refreshLiveEarthquakeCache()
    return enrichCachedResponse(payload, { fromCache: false })
  } catch (error) {
    const diskPayload = await readDiskCache()
    if (diskPayload) {
      setMemoryCache(diskPayload, diskPayload.provider ?? diskPayload.source ?? 'USGS')
      return enrichCachedResponse(diskPayload, {
        fromCache: true,
        warning: `${error instanceof Error ? error.message : 'Provider fetch failed'}; served cached dataset.`,
      })
    }

    const memoryPayload = getMemoryCache().payload
    if (memoryPayload) {
      return enrichCachedResponse(memoryPayload, {
        fromCache: true,
        warning: `${error instanceof Error ? error.message : 'Provider fetch failed'}; served in-memory cache.`,
      })
    }

    const source = earthquakeConfig.EARTHQUAKE_PROVIDER || 'USGS'
    return {
      type: 'FeatureCollection',
      source,
      sourceLabel: buildSourceLabel(source, true),
      provider: source,
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      feedUrl: earthquakeConfig.USGS_FEED,
      fromCache: true,
      cacheAge: 0,
      warning: error instanceof Error ? error.message : 'Provider fetch failed',
      statistics: { total: 0, significant: 0, last24h: 0, highestMagnitude: 0 },
      latestEvents: [],
      features: [],
    }
  }
}

let refreshTimer = null

export function startEarthquakeRefreshLoop() {
  refreshLiveEarthquakeCache().catch((error) => {
    console.warn('[earthquake] initial refresh failed:', error instanceof Error ? error.message : error)
  })

  if (refreshTimer) return
  refreshTimer = setInterval(() => {
    refreshLiveEarthquakeCache().catch((error) => {
      console.warn('[earthquake] periodic refresh failed:', error instanceof Error ? error.message : error)
    })
  }, earthquakeConfig.EARTHQUAKE_CACHE_TTL_MS)
  if (typeof refreshTimer.unref === 'function') refreshTimer.unref()
}

export function getEarthquakeServiceStatus() {
  return {
    provider: earthquakeConfig.EARTHQUAKE_PROVIDER,
    feedUrl: earthquakeConfig.USGS_FEED,
    enabledProviders: PROVIDERS.filter((provider) => provider.isEnabled(earthquakeConfig)).map((p) => p.id),
    cache: getCacheStatus(),
  }
}

export { earthquakeConfig, getCacheStatus }
