import { safeArray } from './utils.mjs'

export function normalizeLiveEarthquakeFeature(feature, index = 0, source = 'USGS') {
  const id = String(feature?.id ?? `quake-${index}`).trim()
  const properties = feature?.properties ?? {}
  const geometry = feature?.geometry ?? {}
  const coordinates = safeArray(geometry.coordinates)
  const lng = Number(coordinates[0])
  const lat = Number(coordinates[1])
  const depthKm = Number(coordinates[2] ?? 0)
  const mag = Number(properties.mag ?? properties.magnitude ?? 0)
  const timeValue = Number(properties.time ?? Date.now())
  if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return {
    type: 'Feature',
    id,
    properties: {
      mag: Number.isFinite(mag) ? mag : 0,
      place: String(properties.place ?? 'Unknown location').trim() || 'Unknown location',
      time: Number.isFinite(timeValue) ? timeValue : Date.now(),
      updated: Number.isFinite(timeValue) ? timeValue : Date.now(),
      source,
      status: String(properties.status ?? 'reviewed'),
      title: String(properties.title ?? '').trim(),
      url: String(properties.url ?? '').trim(),
      type: String(properties.type ?? 'earthquake').trim(),
      tsunami: Number(properties.tsunami ?? 0),
      sig: Number(properties.sig ?? 0),
    },
    geometry: {
      type: 'Point',
      coordinates: [lng, lat, Number.isFinite(depthKm) ? depthKm : 0],
    },
  }
}

export function buildStatistics(features) {
  const total = features.length
  let significant = 0
  let last24h = 0
  let highestMagnitude = 0
  const since24h = Date.now() - 24 * 60 * 60 * 1000
  for (const feature of features) {
    const mag = Number(feature?.properties?.mag ?? 0)
    const time = Number(feature?.properties?.time ?? 0)
    if (mag >= 5) significant += 1
    if (Number.isFinite(time) && time >= since24h) last24h += 1
    if (Number.isFinite(mag) && mag > highestMagnitude) highestMagnitude = mag
  }
  return {
    total,
    significant,
    last24h,
    highestMagnitude: Number(highestMagnitude.toFixed(1)),
  }
}

export function buildLatestEvents(features, source = 'USGS', limit = 12) {
  return features.slice(0, limit).map((feature) => ({
    id: String(feature?.id ?? ''),
    magnitude: Number(feature?.properties?.mag ?? 0),
    place: String(feature?.properties?.place ?? 'Unknown location'),
    time: Number(feature?.properties?.time ?? Date.now()),
    source,
    coordinates: safeArray(feature?.geometry?.coordinates).slice(0, 3),
  }))
}

export function buildUnifiedPayload({
  source,
  feedUrl,
  features,
  generatedAt,
  provider = source,
}) {
  const timestamp = generatedAt || new Date().toISOString()
  return {
    type: 'FeatureCollection',
    source,
    sourceLabel: `Source: ${source}`,
    timestamp,
    feedUrl,
    provider,
    lastUpdated: timestamp,
    metadata: {
      generatedAt: timestamp,
      source,
      feed: feedUrl,
      count: features.length,
    },
    statistics: buildStatistics(features),
    latestEvents: buildLatestEvents(features, source),
    features,
  }
}
