import {
  USGS_FEED,
  USGS_FEED_MAX_RETRIES,
  USGS_FEED_TIMEOUT_MS,
} from '../config.mjs'
import { fetchRemoteJson, sleep, safeArray } from '../utils.mjs'
import {
  buildUnifiedPayload,
  normalizeLiveEarthquakeFeature,
} from '../normalize.mjs'

export const id = 'USGS'

export function isEnabled(config) {
  return Boolean(config?.PROVIDER_ENABLED?.USGS)
}

export async function fetchFeed() {
  let payload = null
  let lastError = null
  for (let attempt = 1; attempt <= USGS_FEED_MAX_RETRIES; attempt += 1) {
    try {
      payload = await fetchRemoteJson(USGS_FEED, USGS_FEED_TIMEOUT_MS)
      break
    } catch (error) {
      lastError = error
      if (attempt >= USGS_FEED_MAX_RETRIES) break
      await sleep(350 * attempt)
    }
  }
  if (!payload) {
    throw (lastError instanceof Error ? lastError : new Error('Unable to fetch USGS feed'))
  }

  const features = safeArray(payload?.features)
    .map((feature, index) => normalizeLiveEarthquakeFeature(feature, index, id))
    .filter(Boolean)
    .sort((a, b) => Number(b?.properties?.time ?? 0) - Number(a?.properties?.time ?? 0))

  const generatedMs = Number(payload?.metadata?.generated ?? payload?.metadata?.generatedAt ?? payload?.generated)
  const generatedAt =
    Number.isFinite(generatedMs) && generatedMs > 0 ? new Date(generatedMs).toISOString() : new Date().toISOString()

  return buildUnifiedPayload({
    source: id,
    feedUrl: USGS_FEED,
    features,
    generatedAt,
    provider: id,
  })
}
