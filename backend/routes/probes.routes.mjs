import { existsSync, createReadStream } from 'node:fs'
import path from 'node:path'
import { DATA_DIR } from '../config/localPaths.mjs'
import {
  PAKISTAN_COG_STORAGE_PATH,
} from '../config/populationRaster.mjs'
import { resolveLocalMediaPath } from '../services/localMediaResolver.mjs'

/**
 * Instant probes before CORS / JSON / admin middleware so load balancers always get a response.
 */
const healthPayload = () => ({
  status: 'ok',
  uptime: process.uptime(),
})

const versionPayload = () => ({
  service: 'InfraResilience360 Backend',
  version: process.env.APP_VERSION || 'production',
})

const LOCAL_COG_KEYS = [
  'live-earthquake-alerts/pak_cog.tif',
  'gis/pak-cog.tif',
  'gis/pak_cog.tif',
  'pak_cog.tif',
  'pak-cog.tif',
]

async function serveLocalPakCogOrRedirect(res) {
  const candidates = [
    path.join(DATA_DIR, 'gis', 'pak-cog.tif'),
    path.join(DATA_DIR, 'gis', 'pak_cog.tif'),
  ]
  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue
    res.setHeader('Content-Type', 'image/tiff')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    createReadStream(filePath).pipe(res)
    return true
  }

  for (const key of LOCAL_COG_KEYS) {
    const filePath = resolveLocalMediaPath(key)
    if (!filePath) continue
    res.setHeader('Content-Type', 'image/tiff')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    createReadStream(filePath).pipe(res)
    return true
  }

  if (!res.headersSent) {
    res.redirect(307, PAKISTAN_COG_STORAGE_PATH)
  }
  return false
}

export function registerInstantProbeRoutes(app) {
  app.get('/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json(healthPayload())
  })

  app.get('/version', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json(versionPayload())
  })

  app.get('/api/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json(healthPayload())
  })

  /** GeoTIFF used by live-earthquake population raster — canonical R2 key live-earthquake-alerts/pak_cog.tif */
  app.get('/api/geo/pak-cog.tif', async (_req, res) => {
    await serveLocalPakCogOrRedirect(res)
  })

  app.get('/api/data/population/pakistan/pak_cog.tif', async (_req, res) => {
    await serveLocalPakCogOrRedirect(res)
  })

  app.get('/data/population/pakistan/pak_cog.tif', (_req, res) => {
    res.redirect(307, PAKISTAN_COG_STORAGE_PATH)
  })

  /** Backward-compatible alias for older clients referencing data/population path. */
  app.get('/storage/content/data/population/pak_cog.tif', (_req, res) => {
    res.redirect(307, PAKISTAN_COG_STORAGE_PATH)
  })

  /** Backend is API-only: root status is served in `backend/index.mjs`. */
}
