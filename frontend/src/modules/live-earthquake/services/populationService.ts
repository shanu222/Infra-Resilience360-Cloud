import { fromArrayBuffer, type GeoTIFFImage } from 'geotiff'

type DensityPopulation = {
  total: number
  urban: number
  rural: number
  city: string
}

type RasterContext = {
  image: GeoTIFFImage
  width: number
  height: number
  minLng: number
  minLat: number
  maxLng: number
  maxLat: number
}

const PAK_COG_URL = '/data/population/pakistan/pak_cog.tif'
const SAMPLE_RING_STEPS = 24
const FALLBACK_DENSITY = 220

let rasterSource = 'Failed'
let rasterContext: RasterContext | null = null
let rasterLoadPromise: Promise<RasterContext> | null = null

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

async function loadRasterContext(): Promise<RasterContext> {
  if (rasterContext) return rasterContext
  if (!rasterLoadPromise) {
    rasterLoadPromise = (async () => {
      const response = await fetch(PAK_COG_URL, { cache: 'force-cache' })
      if (!response.ok) throw new Error(`COG fetch failed (${response.status})`)
      const buffer = await response.arrayBuffer()
      const tiff = await fromArrayBuffer(buffer)
      const image = await tiff.getImage()
      const [minLng, minLat, maxLng, maxLat] = image.getBoundingBox()
      const context: RasterContext = {
        image,
        width: image.getWidth(),
        height: image.getHeight(),
        minLng,
        minLat,
        maxLng,
        maxLat,
      }
      rasterContext = context
      rasterSource = 'Local COG (pak_cog.tif)'
      return context
    })()
  }
  return rasterLoadPromise
}

function withinBounds(context: RasterContext, lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= context.minLat &&
    lat <= context.maxLat &&
    lng >= context.minLng &&
    lng <= context.maxLng
  )
}

async function readDensityAt(lat: number, lng: number): Promise<number> {
  const context = await loadRasterContext()
  if (!withinBounds(context, lat, lng)) return 0
  const xNorm = (lng - context.minLng) / Math.max(1e-9, context.maxLng - context.minLng)
  const yNorm = (context.maxLat - lat) / Math.max(1e-9, context.maxLat - context.minLat)
  const px = clamp(Math.floor(xNorm * context.width), 0, context.width - 1)
  const py = clamp(Math.floor(yNorm * context.height), 0, context.height - 1)
  const data = await context.image.readRasters({ window: [px, py, px + 1, py + 1], width: 1, height: 1 })
  const value = Number(data?.[0]?.[0] ?? 0)
  return Number.isFinite(value) && value > 0 ? value : 0
}

function kmToDegreesLat(km: number): number {
  return km / 111.32
}

function kmToDegreesLng(km: number, atLat: number): number {
  const scale = Math.cos((atLat * Math.PI) / 180) * 111.32
  return km / Math.max(1, scale)
}

async function readAverageDensityInRadius(lat: number, lng: number, radiusKm: number): Promise<number> {
  const safeRadius = Math.max(0, Number(radiusKm || 0))
  if (safeRadius <= 0) return readDensityAt(lat, lng)

  const radialFactors = [0, 0.35, 0.7, 1]
  const samples: number[] = []
  for (const factor of radialFactors) {
    const currentRadius = safeRadius * factor
    if (currentRadius <= 0) {
      samples.push(await readDensityAt(lat, lng))
      continue
    }
    for (let step = 0; step < SAMPLE_RING_STEPS; step += 1) {
      const angle = (2 * Math.PI * step) / SAMPLE_RING_STEPS
      const dLat = kmToDegreesLat(currentRadius) * Math.sin(angle)
      const dLng = kmToDegreesLng(currentRadius, lat) * Math.cos(angle)
      samples.push(await readDensityAt(lat + dLat, lng + dLng))
    }
  }
  const valid = samples.filter((value) => Number.isFinite(value) && value > 0)
  if (!valid.length) return 0
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

export async function loadPopulationData(): Promise<boolean> {
  try {
    await loadRasterContext()
    return true
  } catch {
    rasterSource = 'Failed'
    return false
  }
}

export function getRasterSourceStatus(): string {
  return rasterSource
}

export async function estimateEpicenterPopulation(lat: number, lng: number): Promise<number> {
  const density = await readDensityAt(lat, lng)
  return Math.round(Math.max(0, density))
}

export async function estimateBufferedPopulation(lat: number, lng: number, radiusKm: number): Promise<number> {
  const avgDensity = await readAverageDensityInRadius(lat, lng, radiusKm)
  const area = Math.PI * radiusKm * radiusKm
  const effectiveDensity = avgDensity > 0 ? avgDensity : FALLBACK_DENSITY
  return Math.round(Math.max(0, effectiveDensity * area))
}

export async function estimateNearbyPopulation(lat: number, lng: number, radiusKm: number): Promise<number> {
  return estimateBufferedPopulation(lat, lng, radiusKm)
}

export async function getBothPopulations(
  lat: number,
  lng: number,
  radiusKm: number,
  area: number,
  location: string,
): Promise<{ raster: number; density: DensityPopulation; source: string }> {
  const epicenterDensity = await estimateEpicenterPopulation(lat, lng)
  const bufferedPopulation = await estimateBufferedPopulation(lat, lng, Math.max(2, radiusKm))
  const safeArea = Math.max(0, Number(area || 0))
  const estimatedDensity = safeArea > 0 ? Math.max(0, Math.round(bufferedPopulation / safeArea)) : epicenterDensity
  const city = String(location || 'Unknown')
  const densityModelTotal = Math.round(Math.max(0, estimatedDensity * safeArea))
  const urban = Math.round(densityModelTotal * 0.42)
  const rural = Math.max(0, densityModelTotal - urban)
  return {
    raster: bufferedPopulation,
    density: {
      total: densityModelTotal,
      urban,
      rural,
      city,
    },
    source: getRasterSourceStatus(),
  }
}
