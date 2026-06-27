import { existsSync, createReadStream } from 'node:fs'
import path from 'node:path'
import { DATA_DIR } from '../config/localPaths.mjs'
import { streamLocalMediaToResponse } from '../services/localMediaResolver.mjs'

/**
 * Instant probes before CORS / JSON / admin middleware so load balancers always get a response.
 */
export function registerInstantProbeRoutes(app) {
  app.get('/api/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({ status: 'ok', uptime: process.uptime() })
  })

  /** GeoTIFF used by live-earthquake / population raster — served from local data/gis/. */
  app.get('/api/geo/pak-cog.tif', async (_req, res) => {
    const candidates = [
      path.join(DATA_DIR, 'gis', 'pak-cog.tif'),
      path.join(DATA_DIR, 'gis', 'pak_cog.tif'),
    ]
    for (const filePath of candidates) {
      if (!existsSync(filePath)) continue
      res.setHeader('Content-Type', 'image/tiff')
      res.setHeader('Cache-Control', 'public, max-age=86400')
      createReadStream(filePath).pipe(res)
      return
    }
  const keys = ['gis/pak-cog.tif', 'gis/pak_cog.tif', 'pak_cog.tif', 'pak-cog.tif']
    for (const k of keys) {
       
      const ok = await streamLocalMediaToResponse(k, res)
      if (ok) return
    }
    if (!res.headersSent) {
      // Canonical production path: Railway -> /storage/content/* -> R2.
      res.redirect(307, '/storage/content/data/population/pak_cog.tif')
    }
  })

  app.get('/api/data/population/pakistan/pak_cog.tif', (_req, res) => {
    res.redirect(307, '/storage/content/data/population/pak_cog.tif')
  })

  app.get('/data/population/pakistan/pak_cog.tif', (_req, res) => {
    res.redirect(307, '/storage/content/data/population/pak_cog.tif')
  })

  /** Backend is API-only: root status is served in `backend/index.mjs`. */
}
