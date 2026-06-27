/**
 * Local-first CMS HTTP handlers — same response shapes as legacy Mongo CMS.
 */
import {
  readLocalCmsPage,
  readLocalHomepageConfig,
  readLocalRetrofitCms,
  readLocalSectionManifest,
} from '../services/localCms.service.mjs'
import { mediaKeyCandidates, streamLocalMediaToResponse } from '../services/localMediaResolver.mjs'
import { mediaKeyToLocalMediaUrl } from '../services/localUrlRewrite.mjs'

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

/** Public GET-only router stub — admin/CMS mutations remain disabled. */
export function registerPageConfigRoutes(app, _deps = {}) {
  app.get('/api/cms/mapping-status', async (_req, res) => {
    res.status(200).json({ ok: true, localFirst: true, sections: {} })
  })
}

function decodeS3PathPathParam(rawPath) {
  const raw = safeString(rawPath)
  if (!raw) return ''
  const pathOnly = raw.split('?')[0].replace(/^\/+/, '')
  try {
    return decodeURIComponent(pathOnly)
  } catch {
    return pathOnly
  }
}

async function handleLocalS3MediaProxy(req, res, applyCors) {
  if (typeof applyCors === 'function') applyCors(req, res)
  const key = decodeS3PathPathParam(req.params?.[0])
  if (!key) return res.status(400).json({ error: 'Missing media key.' })
  const candidates = mediaKeyCandidates(key)
  for (const candidate of candidates) {
     
    const ok = await streamLocalMediaToResponse(candidate, res)
    if (ok) return
  }
  return res.status(404).json({ error: 'Media not found', key })
}

export function registerLocalPlatformRoutes(app, { applyCors } = {}) {
  app.get('/api/section-content/:section', respondPublicSectionManifest)

  app.get('/static/media/:disaster', respondPublicDisasterMediaPresign)

  app.get('/static/media', async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json([])
  })

  const bindProxy = (req, res) => handleLocalS3MediaProxy(req, res, applyCors)
  app.get('/static/media/local/*', bindProxy)
  app.head('/static/media/local/*', bindProxy)

  console.log('✅ Local platform routes registered (content, media)')
}

