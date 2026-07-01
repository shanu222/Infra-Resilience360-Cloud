/**
 * Local-first CMS HTTP handlers — same response shapes as legacy Mongo CMS.
 */
import {
  readLocalCmsPage,
  readLocalHomepageConfig,
  readLocalRetrofitCms,
  readLocalSectionManifest,
} from '../services/localCms.service.mjs'
import { mapStorageContentToPublicMediaUrl, mediaKeyToLocalMediaUrl } from '../services/localUrlRewrite.mjs'

function safeString(v) {
  return String(v ?? '').trim()
}

export async function respondPublicCmsRead(req, res) {
  try {
    const page = safeString(req.query?.page || req.query?.slug || req.query?.section || 'homepage')
    const body = await readLocalCmsPage(page || 'homepage')
    res.setHeader('Cache-Control', 'public, max-age=60')
    return res.status(200).json(body)
  } catch (err) {
    console.error('[local-cms] GET /api/cms failed:', err)
    return res.status(200).json({
      page: 'homepage',
      elements: {},
      mediaLibrary: [],
      updatedAt: null,
      backgroundMedia: { video: '', image: '' },
    })
  }
}

export async function respondPublicHomepageConfig(_req, res) {
  try {
    const body = await readLocalHomepageConfig()
    res.setHeader('Cache-Control', 'public, max-age=60')
    return res.status(200).json(body)
  } catch (err) {
    console.error('[local-cms] GET /api/homepage-config failed:', err)
    return res.status(200).json({ type: 'homepage_config', cards: [] })
  }
}

export async function respondPublicRetrofitCms(_req, res) {
  try {
    const body = await readLocalRetrofitCms()
    res.setHeader('Cache-Control', 'public, max-age=60')
    return res.status(200).json(body)
  } catch (err) {
    console.error('[local-cms] GET /api/cms/retrofit failed:', err)
    return res.status(200).json({ pages: [] })
  }
}

export async function respondPublicSectionManifest(req, res) {
  const section = safeString(req.params?.section)
  if (!section) return res.status(400).json({ error: 'Invalid section.' })
  try {
    const body = await readLocalSectionManifest(section)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json(body)
  } catch (err) {
    console.error('[local-cms] section manifest failed:', err)
    return res.status(200).json({
      section,
      updatedAt: new Date().toISOString(),
      videos: [],
      images: [],
      documents: [],
    })
  }
}

export async function respondPublicDisasterMediaPresign(req, res) {
  const disaster = safeString(req.params?.disaster).toLowerCase()
  if (!disaster) return res.status(400).json({ error: 'Missing disaster id.' })
  const key = `disaster-dashboard/videos/${disaster}/video.mp4`
  const url = mediaKeyToLocalMediaUrl(key)
  return res.status(200).json({
    disaster,
    url,
    proxyUrl: url,
    title: disaster,
    description: '',
    s3Key: key,
    local: true,
  })
}

const DISASTER_HAZARD_ORDER = [
  'flood',
  'earthquake',
  'urban-fire',
  'crop-fire',
  'heatwave',
  'load-shedding',
  'storm-cyclone',
  'landslide',
  'cold-wave',
  'smog',
]

const DISASTER_ALIAS_MAP = {
  flood: ['flood'],
  earthquake: ['earthquake'],
  'urban-fire': ['urban-fire', 'urbanfire', 'urban fire'],
  'crop-fire': ['crop-fire', 'cropfire', 'crop fire'],
  heatwave: ['heatwave', 'heat-wave', 'heat wave'],
  'load-shedding': ['load-shedding', 'loadshedding', 'load shedding', 'loadscheduling'],
  'storm-cyclone': ['storm-cyclone', 'stormcyclone', 'storm cyclone', 'cyclone'],
  landslide: ['landslide', 'land slide'],
  'cold-wave': ['cold-wave', 'coldwave', 'cold wave'],
  smog: ['smog'],
}

function normalizeMediaPath(raw) {
  return String(raw ?? '').trim().replace(/\\/g, '/').replace(/^\/+/, '')
}

function normalizeNameForMatch(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
}

function encodedStorageContentUrl(relativePath) {
  const clean = normalizeMediaPath(relativePath)
  const encoded = clean
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return mapStorageContentToPublicMediaUrl(`/storage/content/disaster-dashboard/${encoded}`)
}

function inferHazardFromPath(relativePath) {
  const clean = normalizeMediaPath(relativePath)
  const norm = normalizeNameForMatch(clean.split('/').pop() ?? clean)
  const pathNorm = normalizeNameForMatch(clean)
  for (const hazardId of DISASTER_HAZARD_ORDER) {
    const aliases = DISASTER_ALIAS_MAP[hazardId] ?? []
    for (const alias of aliases) {
      const token = normalizeNameForMatch(alias)
      if (!token) continue
      if (pathNorm.includes(`/${token}/`) || pathNorm.includes(`-${token}-`) || pathNorm.endsWith(`-${token}`)) {
        return hazardId
      }
      if (norm.includes(token)) return hazardId
    }
  }

  const numbered = /(?:^|[^a-z0-9])(?:image|video|audio|pdf|document)[-_ ]?(\d+)(?:[^a-z0-9]|$)/i.exec(
    clean.split('/').pop() ?? '',
  )
  if (numbered) {
    const idx = Number(numbered[1]) - 1
    if (Number.isInteger(idx) && idx >= 0 && idx < DISASTER_HAZARD_ORDER.length) {
      return DISASTER_HAZARD_ORDER[idx]
    }
  }

  return null
}

async function headOk(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    if (response.ok) return true
    // Some R2/CDN edges reject HEAD for certain object types — confirm with a ranged GET before discarding.
    const rangedGet = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } })
    return rangedGet.ok
  } catch {
    return false
  }
}

const isDevMediaDebug = () => String(process.env.NODE_ENV ?? '').toLowerCase() !== 'production'

function devMediaLog(...args) {
  if (!isDevMediaDebug()) return
  console.info('[disaster-media]', ...args)
}

export async function respondDisasterDashboardMediaMetadata(_req, res) {
  const metadataUrl = mapStorageContentToPublicMediaUrl('/storage/content/disaster-dashboard/metadata.json')
  devMediaLog('metadata endpoint', metadataUrl)
  let metadata
  try {
    const upstream = await fetch(metadataUrl, { cache: 'no-store' })
    devMediaLog('metadata HTTP status', upstream.status)
    if (!upstream.ok) {
      return res.status(502).json({
        ok: false,
        error: 'metadata_fetch_failed',
        status: upstream.status,
        metadataUrl,
      })
    }
    metadata = await upstream.json()
    devMediaLog('metadata received', metadata)
  } catch (error) {
    devMediaLog('metadata fetch failed', String(error?.message ?? error ?? 'unknown'))
    return res.status(502).json({
      ok: false,
      error: 'metadata_fetch_failed',
      metadataUrl,
      detail: String(error?.message ?? error ?? 'unknown'),
    })
  }

  const typedPaths = {
    images: Array.isArray(metadata?.images) ? metadata.images.map(normalizeMediaPath).filter(Boolean) : [],
    videos: Array.isArray(metadata?.videos) ? metadata.videos.map(normalizeMediaPath).filter(Boolean) : [],
    audio: Array.isArray(metadata?.audio) ? metadata.audio.map(normalizeMediaPath).filter(Boolean) : [],
    pdfs: Array.isArray(metadata?.pdfs) ? metadata.pdfs.map(normalizeMediaPath).filter(Boolean) : [],
  }

  // Validate every distinct R2 object once (parallel HEAD/GET-range probe) before any hazard is assigned.
  const uniqueByType = { images: [], videos: [], audio: [], pdfs: [] }
  const seenPaths = new Set()
  for (const mediaType of ['images', 'videos', 'audio', 'pdfs']) {
    for (const relPath of typedPaths[mediaType]) {
      if (seenPaths.has(`${mediaType}:${relPath}`)) continue
      seenPaths.add(`${mediaType}:${relPath}`)
      uniqueByType[mediaType].push({ path: relPath, url: encodedStorageContentUrl(relPath) })
    }
  }

  const validatedByType = { images: [], videos: [], audio: [], pdfs: [] }
  await Promise.all(
    Object.entries(uniqueByType).flatMap(([mediaType, rows]) =>
      rows.map(async (row) => {
        const ok = await headOk(row.url)
        devMediaLog('R2 URL resolved', { mediaType, path: row.path, url: row.url, ok })
        if (ok) validatedByType[mediaType].push(row)
      }),
    ),
  )

  const hazardMedia = Object.fromEntries(
    DISASTER_HAZARD_ORDER.map((hazardId) => [
      hazardId,
      {
        hazardId,
        aliases: DISASTER_ALIAS_MAP[hazardId] ?? [],
        images: [],
        videos: [],
        audio: [],
        pdfs: [],
      },
    ]),
  )

  // Media whose filename does not map to a specific hazard (e.g. a shared dashboard background or
  // a shared risk-atlas PDF) is tracked separately so it can back-fill any hazard left without its
  // own dedicated asset — this keeps every hazard rendering a real, verified R2 object instead of
  // nothing, without ever inventing or hardcoding a URL.
  const sharedByType = { images: [], videos: [], audio: [], pdfs: [] }

  for (const mediaType of ['images', 'videos', 'audio', 'pdfs']) {
    for (const row of validatedByType[mediaType]) {
      const hazard = inferHazardFromPath(row.path)
      devMediaLog('resolved hazard mapping', { mediaType, path: row.path, hazard })
      if (hazard && hazardMedia[hazard]) {
        hazardMedia[hazard][mediaType].push(row)
      } else {
        sharedByType[mediaType].push(row)
      }
    }
  }

  for (const hazardId of DISASTER_HAZARD_ORDER) {
    for (const mediaType of ['images', 'videos', 'audio', 'pdfs']) {
      if (hazardMedia[hazardId][mediaType].length === 0 && sharedByType[mediaType].length > 0) {
        hazardMedia[hazardId][mediaType] = [...sharedByType[mediaType]]
      }
      hazardMedia[hazardId][`${mediaType}Available`] = hazardMedia[hazardId][mediaType].length > 0
    }

    hazardMedia[hazardId].thumbnail = hazardMedia[hazardId].images[0]?.url ?? ''
    hazardMedia[hazardId].poster = hazardMedia[hazardId].images[0]?.url ?? ''
    hazardMedia[hazardId].gallery = hazardMedia[hazardId].images.map((row) => row.url)
    hazardMedia[hazardId].guidanceImages = hazardMedia[hazardId].images.map((row) => row.url)
    hazardMedia[hazardId].video = hazardMedia[hazardId].videos[0]?.url ?? ''
    hazardMedia[hazardId].audioPrimary = hazardMedia[hazardId].audio[0]?.url ?? ''
    hazardMedia[hazardId].pdf = hazardMedia[hazardId].pdfs[0]?.url ?? ''
    devMediaLog('media loading result', {
      hazardId,
      imagesAvailable: hazardMedia[hazardId].imagesAvailable,
      videosAvailable: hazardMedia[hazardId].videosAvailable,
      audioAvailable: hazardMedia[hazardId].audioAvailable,
      pdfsAvailable: hazardMedia[hazardId].pdfsAvailable,
    })
  }

  res.setHeader('Cache-Control', 'public, max-age=120')
  return res.status(200).json({
    ok: true,
    source: {
      metadataUrl,
      mediaBaseUrl: String(process.env.MEDIA_BASE_URL ?? ''),
      module: 'disaster-dashboard',
      root: 'content/disaster-dashboard',
    },
    aliases: DISASTER_ALIAS_MAP,
    metadata,
    hazards: hazardMedia,
  })
}

/** Public GET-only router stub — admin/CMS mutations remain disabled. */
export function registerPageConfigRoutes(app, _deps = {}) {
  app.get('/api/cms/mapping-status', async (_req, res) => {
    res.status(200).json({ ok: true, localFirst: true, sections: {} })
  })
}

export function registerLocalPlatformRoutes(app) {
  app.get('/api/section-content/:section', respondPublicSectionManifest)
  app.get('/api/disaster-media/:disaster', respondPublicDisasterMediaPresign)
  app.get('/api/disaster-dashboard/media-metadata', respondDisasterDashboardMediaMetadata)

  console.log('✅ Local platform routes registered (content, media)')
}

