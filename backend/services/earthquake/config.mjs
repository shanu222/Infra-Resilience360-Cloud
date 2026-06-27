const truthyEnv = (value, fallback = 'false') =>
  ['1', 'true', 'yes'].includes(String(value ?? fallback).trim().toLowerCase())

export const EARTHQUAKE_PROVIDER = String(process.env.EARTHQUAKE_PROVIDER ?? 'USGS')
  .trim()
  .toUpperCase()

export const EARTHQUAKE_REFRESH_SECONDS = Math.max(
  15,
  Number(process.env.EARTHQUAKE_REFRESH_SECONDS ?? 60) || 60,
)

export const EARTHQUAKE_CACHE_TTL_MS = EARTHQUAKE_REFRESH_SECONDS * 1000

export const USGS_FEED =
  process.env.USGS_FEED ??
  process.env.USGS_FEED_URL ??
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'

export const USGS_FEED_TIMEOUT_MS = Math.max(
  5_000,
  Number(process.env.USGS_FEED_TIMEOUT_MS ?? 20_000) || 20_000,
)

export const USGS_FEED_MAX_RETRIES = Math.max(
  1,
  Number(process.env.USGS_FEED_MAX_RETRIES ?? 3) || 3,
)

export const PROVIDER_ENABLED = {
  USGS: EARTHQUAKE_PROVIDER === 'USGS' || truthyEnv(process.env.USGS_ENABLED, 'true'),
  EMSC: truthyEnv(process.env.EMSC_ENABLED, 'false'),
  GFZ: truthyEnv(process.env.GFZ_ENABLED, 'false'),
  ISC: truthyEnv(process.env.ISC_ENABLED, 'false'),
  NDMA: truthyEnv(process.env.NDMA_ENABLED, 'false'),
}

export const EMSC_FEED_URL =
  process.env.EMSC_EARTHQUAKE_FEED_URL ??
  'https://www.seismicportal.eu/fdsnws/event/1/query?format=json&limit=100'

export const GFZ_FEED_URL = process.env.GFZ_FEED_URL ?? ''
export const ISC_FEED_URL = process.env.ISC_FEED_URL ?? ''
