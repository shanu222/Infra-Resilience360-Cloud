import './loadEnv.mjs'
import compression from 'compression'
import express from 'express'
import { createServer } from 'node:http'
import { execFile } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import { Readable } from 'node:stream'
import multer from 'multer'
import path from 'node:path'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { predictRetrofitMl, retrainRetrofitMlModel } from './ml/retrofitMlModel.mjs'
import {
  registerDevice,
  unregisterDevice,
  updateSubscriptionPreferences,
  readRegisteredDevices,
} from './notifications.mjs'
import { initMongoConnection } from './mongoConnection.local.mjs'
import {
  loadMaterialHubsAdminPayload,
  createMaterialHub,
  updateMaterialHub,
  deleteMaterialHub,
  createMaterialEntry,
  getMaterialEntryById,
  updateMaterialEntry,
  deleteMaterialEntry,
} from './materialHubsLocal.mjs'
import { assertCriticalCmsHandlers, logBootEnvironmentSummary } from './startupValidate.mjs'
import {
  registerPageConfigRoutes,
  respondPublicDisasterMediaPresign,
  registerLocalPlatformRoutes,
} from './controllers/localCms.controller.mjs'

import { registerInstantProbeRoutes } from './routes/probes.routes.mjs'
import { registerLocalApiRoutes } from './routes/localApi.routes.mjs'
import { assertAdminApiKey } from './adminApiKey.mjs'
import { readOnlyModeMiddleware } from './middleware/readOnlyMode.mjs'
import {
  applyApiCorsHeaders,
  createCorsMiddleware,
  apiCorsEnforcementMiddleware,
} from './middleware/corsConfig.mjs'
import { DATA_DIR, MEDIA_ROOT, STORAGE_DIR } from './config/localPaths.mjs'
import {
  buildPublicMediaUrl,
  deleteLocalObjectByPublicUrl,
  isMediaUploadConfigured,
  logLocalMediaStartup,
  normalizeMediaObjectKey,
  uploadBufferLocalDisabled,
} from './s3LocalCompat.mjs'
import { emitUiUpdated, initRealtimeHub } from './realtimeHub.mjs'
import { canonicalRealtimePayload } from './realtimeMeta.mjs'

assertCriticalCmsHandlers({
  registerPageConfigRoutes,
  respondPublicDisasterMediaPresign,
})
logBootEnvironmentSummary()

console.log('? MAIN BACKEND ENTRY: backend/index.mjs LOADED')

const app = express()
app.use((req, _res, next) => {
  req.requestId = randomUUID()
  next()
})

const corsMiddleware = createCorsMiddleware()
app.use(corsMiddleware)
app.options(/.*/, corsMiddleware)
const httpServer = createServer(app)
/** Align with common reverse-proxy defaults so connections stay warm for repeat navigations. */
httpServer.keepAliveTimeout = 75_000
httpServer.headersTimeout = 80_000
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } })
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err)
})

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason)
})

logLocalMediaStartup()

const normalizeEnvValue = (rawValue, fallback = '') =>
  String(rawValue ?? fallback)
    .trim()
    .replace(/^['\"]|['\"]$/g, '')

const MEDIA_BASE_URL = normalizeEnvValue(process.env.MEDIA_BASE_URL, '').replace(/\/+$/, '')
const isRemoteMediaMode = Boolean(MEDIA_BASE_URL)

const envFlag = (rawValue, fallback = 'false') =>
  normalizeEnvValue(rawValue, fallback).toLowerCase() === 'true'

const parsedPort = Number(process.env.PORT)
if (!Number.isFinite(parsedPort) || parsedPort <= 0) {
  throw new Error('PORT is required and must be a positive number in backend/.env (expected 10000 for local dev).')
}
const PORT = parsedPort
console.log('[API] running on PORT:', PORT)
const AI_PROVIDER = normalizeEnvValue(process.env.AI_PROVIDER, 'openai').toLowerCase()
const selectedAiProvider = AI_PROVIDER === 'huggingface' ? 'huggingface' : 'openai'
const OPENAI_FALLBACK_TO_HUGGINGFACE = !['false', '0', 'no', 'off'].includes(
  normalizeEnvValue(process.env.OPENAI_FALLBACK_TO_HUGGINGFACE, 'true').toLowerCase(),
)
// Backend reads OpenAI key from OPENAI_API_KEY only.
const normalizeApiKey = (rawKey) => String(rawKey ?? '').trim().replace(/^['\"]|['\"]$/g, '')

const isPlaceholderApiKey = (key) => /^(sk-your|your-api-key|replace-with)/i.test(String(key ?? '').trim())

const OPENAI_API_KEY = (() => {
  const key = normalizeApiKey(process.env.OPENAI_API_KEY)
  return key && !isPlaceholderApiKey(key) ? key : ''
})()
const OPENAI_MODEL = String(process.env.OPENAI_MODEL ?? process.env.OPENAI_VISION_MODEL ?? 'gpt-4.1').trim()
const OPENAI_VISION_MODEL = String(process.env.OPENAI_VISION_MODEL ?? OPENAI_MODEL ?? 'gpt-4o-mini').trim()
const OPENAI_VISION_FALLBACK_MODELS = String(
  process.env.OPENAI_VISION_FALLBACK_MODELS ?? 'gpt-4o-mini,gpt-4.1-mini,gpt-4o',
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
  .filter((value, index, all) => all.indexOf(value) === index && value !== OPENAI_VISION_MODEL)
const OPENROUTER_API_KEY = String(process.env.OPENROUTER_API_KEY ?? '').trim()
const OPENROUTER_MODEL = String(process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini').trim()
const OPENROUTER_BASE_URL = String(process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1').trim().replace(/\/+$/, '')
const OPENROUTER_SITE_URL = String(process.env.OPENROUTER_SITE_URL ?? '').trim()
const OPENROUTER_SITE_NAME = String(process.env.OPENROUTER_SITE_NAME ?? 'Resilience360').trim()
const AZURE_OPENAI_ENDPOINT = String(process.env.AZURE_OPENAI_ENDPOINT ?? '').trim().replace(/\/+$/, '')
const AZURE_OPENAI_API_KEY = String(process.env.AZURE_OPENAI_API_KEY ?? '').trim()
const AZURE_OPENAI_DEPLOYMENT = String(process.env.AZURE_OPENAI_DEPLOYMENT ?? '').trim()
const AZURE_OPENAI_API_VERSION = String(process.env.AZURE_OPENAI_API_VERSION ?? '2024-10-21').trim()

const rotateApiKey = () => OPENAI_API_KEY

const getCurrentApiKey = () => OPENAI_API_KEY

const HUGGINGFACE_API_KEY = String(process.env.HUGGINGFACE_API_KEY ?? '').trim()
const HUGGINGFACE_BASE_URL = String(process.env.HUGGINGFACE_BASE_URL ?? 'https://router.huggingface.co/v1').trim()
const HUGGINGFACE_CHAT_MODEL = String(process.env.HUGGINGFACE_CHAT_MODEL ?? 'meta-llama/Llama-3.1-8B-Instruct').trim()
const HUGGINGFACE_VISION_MODEL = String(process.env.HUGGINGFACE_VISION_MODEL ?? HUGGINGFACE_CHAT_MODEL).trim()
const HUGGINGFACE_IMAGE_MODEL = String(process.env.HUGGINGFACE_IMAGE_MODEL ?? 'black-forest-labs/FLUX.1-dev').trim()
const model = selectedAiProvider === 'huggingface' ? HUGGINGFACE_CHAT_MODEL : OPENAI_MODEL
const hasKey = selectedAiProvider === 'huggingface' ? Boolean(HUGGINGFACE_API_KEY) : Boolean(OPENAI_API_KEY)
const hasHuggingFaceFallback = OPENAI_FALLBACK_TO_HUGGINGFACE && Boolean(HUGGINGFACE_API_KEY)
const isOpenAiConfigured = () => {
  const key = normalizeApiKey(process.env.OPENAI_API_KEY)
  return Boolean(key && !isPlaceholderApiKey(key))
}
console.info(`OpenAI Configured: ${isOpenAiConfigured() ? 'YES' : 'NO'}`)
console.info('[boot] AI provider:', selectedAiProvider, '| vision ready:', hasKey ? 'YES' : 'NO')
const AI_CHAT_TIMEOUT_MS = Math.max(15_000, Number(process.env.AI_CHAT_TIMEOUT_MS ?? 45_000) || 45_000)
const AI_PROVIDER_REQUEST_TIMEOUT_MS = Math.max(
  30_000,
  Number(process.env.AI_PROVIDER_REQUEST_TIMEOUT_MS ?? 120_000) || 120_000,
)
const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY ?? '').trim()
const GEMINI_MODEL = 'gemini-1.5-flash'
const OPENROUTER_LLAMA_MODEL = 'meta-llama/llama-3.3-70b-instruct'
const OPENROUTER_LLAMA_CHAT_COMPLETIONS_URL = 'https://openrouter.ai/api/v1/chat/completions'
const AI_IMAGE_TIMEOUT_MS = Math.max(20_000, Number(process.env.AI_IMAGE_TIMEOUT_MS ?? 75_000) || 75_000)
const AI_IMAGE_CONCURRENCY = Math.max(1, Math.min(4, Number(process.env.AI_IMAGE_CONCURRENCY ?? 2) || 2))
const NDMA_ADVISORIES_URL = process.env.NDMA_ADVISORIES_URL ?? 'https://ndma.gov.pk/advisories'
const NDMA_SITREPS_URL = process.env.NDMA_SITREPS_URL ?? 'https://ndma.gov.pk/sitreps'
const NDMA_PROJECTIONS_URL = process.env.NDMA_PROJECTIONS_URL ?? 'https://ndma.gov.pk/projection-impact-list_new'
const PMD_RSS_URL = process.env.PMD_RSS_URL ?? 'https://www.pmd.gov.pk/en'
const PMD_HOME_URL = process.env.PMD_HOME_URL ?? 'https://www.pmd.gov.pk/en'
const PMD_SATELLITE_URL = process.env.PMD_SATELLITE_URL ?? 'https://nwfc.pmd.gov.pk/new/satellite.php'
const PMD_RADAR_URL = process.env.PMD_RADAR_URL ?? 'https://radar.pmd.gov.pk/login'
const GLOBAL_EARTHQUAKE_FEED_URL =
  process.env.GLOBAL_EARTHQUAKE_FEED_URL ??
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson'
const GLOBAL_EARTHQUAKE_FEED_URL_BACKUP =
  process.env.GLOBAL_EARTHQUAKE_FEED_URL_BACKUP ??
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'
const GLOBAL_BUILDING_ATLAS_WFS_URL =
  process.env.GLOBAL_BUILDING_ATLAS_WFS_URL ??
  'https://tubvsig-so2sat-vm1.srv.mwn.de/geoserver/ows?'
const GLOBAL_BUILDING_ATLAS_WFS_LAYER_CANDIDATES =
  String(process.env.GLOBAL_BUILDING_ATLAS_WFS_LAYERS ?? 'GBA:ODbLPolygon,GBA.ODbLPolygon,GBA:Polygon,GBA.Polygon')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
const GLOBAL_BUILDING_ATLAS_ROOT =
  process.env.GLOBAL_BUILDING_ATLAS_ROOT ?? path.resolve(__dirname, '..', 'modules', 'GlobalBuildingAtlas')
const EMSC_EARTHQUAKE_FEED_URL =
  process.env.EMSC_EARTHQUAKE_FEED_URL ??
  'https://www.seismicportal.eu/fdsnws/event/1/query?format=json&limit=100'
const PAKISTAN_EARTHQUAKE_BOUNDS = {
  minlatitude: 23.0,
  maxlatitude: 37.0,
  minlongitude: 60.0,
  maxlongitude: 78.0,
}
const RECOVERY_EMAIL_PROVIDER = String(process.env.RECOVERY_EMAIL_PROVIDER ?? '').trim().toLowerCase()
const RECOVERY_FROM_EMAIL = String(process.env.RECOVERY_FROM_EMAIL ?? '').trim()
const RECOVERY_FROM_NAME = String(process.env.RECOVERY_FROM_NAME ?? 'Resilience360 Recovery').trim()
const RESEND_API_KEY = String(process.env.RESEND_API_KEY ?? '').trim()
const BREVO_API_KEY = String(process.env.BREVO_API_KEY ?? '').trim()
const INFRA_MODELS_GIT_SYNC_ENABLED = envFlag(process.env.INFRA_MODELS_GIT_SYNC_ENABLED, 'false')
const INFRA_MODELS_GIT_SYNC_BRANCH = String(process.env.INFRA_MODELS_GIT_SYNC_BRANCH ?? '').trim()
/** Optional legacy media sync toggle retained as disabled by default. */
const CMS_SYNC_ENABLED = envFlag(process.env.CMS_SYNC_ENABLED, 'false')
const RECOVERY_RATE_LIMIT_WINDOW_MS = Math.max(60_000, Number(process.env.RECOVERY_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000) || 15 * 60 * 1000)
const RECOVERY_RATE_LIMIT_MAX_REQUESTS = Math.max(1, Number(process.env.RECOVERY_RATE_LIMIT_MAX_REQUESTS ?? 6) || 6)
const recoveryRateLimitStore = new Map()
const retrofitTrainingDir = path.join(__dirname, 'ml', 'training')
const retrofitTrainingImagesDir = path.join(retrofitTrainingDir, 'images')
const retrofitTrainingDataFile = path.join(retrofitTrainingDir, 'userRetrofitTrainingData.json')
const communityIssuesDir = path.join(__dirname, 'data', 'community-issues')
const communityIssueImagesDir = path.join(communityIssuesDir, 'images')
const communityIssuesDataFile = path.join(communityIssuesDir, 'issues.json')
const sharedInfraModelsDir = path.join(__dirname, 'data', 'infra-models')
const sharedInfraModelsDataFile = path.join(sharedInfraModelsDir, 'generated-models.json')
const repoRootDir = path.resolve(__dirname, '..')
const adminDataDir = path.join(__dirname, 'data', 'admin')
const greenBuildingCodesDataFile = path.join(adminDataDir, 'green-building-codes.json')
const uploadedGreenCodesDir = path.join(repoRootDir, 'frontend', 'public', 'pgbc', 'All Codes', 'Uploaded')
const appStateDir = path.join(__dirname, 'data', 'app-state')
const appStateFile = path.join(appStateDir, 'shared-state.json')
const liveEarthquakeCacheDir = path.join(repoRootDir, 'storage', 'cache', 'earthquake')
const liveEarthquakeCacheFile = path.join(liveEarthquakeCacheDir, 'latest.json')
const LIVE_EARTHQUAKE_CACHE_TTL_MS = 60_000
const sharedInfraModelsGitRelativePath = 'backend/data/infra-models/generated-models.json'
const execFileAsync = promisify(execFile)
const allowedCommunityIssueStatuses = new Set(['Submitted', 'In Review', 'In Progress', 'Resolved', 'Rejected'])
const SHARED_INFRA_MODELS_MAX = 200
let liveEarthquakeCacheMemory = {
  loadedAt: 0,
  payload: null,
}
const GREEN_CODE_LABEL_OVERRIDES = {
  bcp2007: 'BCP 2007',
  bcp2021: 'BCP 2021',
  bec2011: 'BEC 2011',
  ecbc2023: 'ECBC 2023',
  fire2016: 'Fire Code 2016',
  gbcp2023: 'GBCP 2023',
  petsac2014: 'PETSAC 2014',
  standardization2021: 'Standardization 2021',
}

const GREEN_CODE_CATEGORY_OVERRIDES = {
  bcp2007: 'Building Code',
  bcp2021: 'Building Code',
  bec2011: 'Energy Efficiency',
  ecbc2023: 'Energy Conservation',
  fire2016: 'Fire Safety',
  gbcp2023: 'Green Building',
  petsac2014: 'Structural Safety',
  standardization2021: 'Standardization',
}

const GREEN_CODE_YEAR_OVERRIDES = {
  bcp2007: 2007,
  bcp2021: 2021,
  bec2011: 2011,
  ecbc2023: 2023,
  fire2016: 2016,
  gbcp2023: 2023,
  petsac2014: 2014,
  standardization2021: 2021,
}

const GREEN_CODE_KEY_ALIASES = {
  bcp2007_seismic: 'bcp2007',
  standardization: 'standardization2021',
}

const formatGreenCodeLabel = (codeKey) => {
  if (GREEN_CODE_LABEL_OVERRIDES[codeKey]) {
    return GREEN_CODE_LABEL_OVERRIDES[codeKey]
  }
  const parts = String(codeKey ?? '')
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
  const normalized = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .trim()
  return normalized || 'Untitled Code'
}

const normalizeGreenCodeKey = (rawKey) => {
  const base = String(rawKey ?? '').trim().toLowerCase()
  if (!base) return ''
  return GREEN_CODE_KEY_ALIASES[base] ?? base
}

const buildGreenCodeRecordFromKey = (codeKey, index) => ({
  id: `gbc-${index + 1}`,
  title: formatGreenCodeLabel(codeKey),
  codeKey,
  category: GREEN_CODE_CATEGORY_OVERRIDES[codeKey] ?? 'General',
  year: GREEN_CODE_YEAR_OVERRIDES[codeKey] ?? null,
  active: true,
  notes: '',
  updatedAt: new Date().toISOString(),
})

const discoverGreenBuildingCodeKeys = async () => {
  const candidates = [
    path.join(repoRootDir, 'frontend', 'public', 'pgbc'),
    path.join(repoRootDir, 'modules', 'GBCP Portal'),
  ]
  const keySet = new Set()

  for (const directory of candidates) {
    try {
      const fileNames = await fs.readdir(directory)
      for (const fileName of fileNames) {
        const matched = String(fileName).match(/^(.+?)_hierarchy\.(json|js)$/i)
        if (!matched?.[1]) continue
        const key = normalizeGreenCodeKey(matched[1])
        if (key) {
          keySet.add(key)
        }
      }
    } catch {
      // Ignore missing optional source directories.
    }
  }

  if (keySet.size === 0) {
    ;[
      'bcp2007',
      'bcp2021',
      'bec2011',
      'ecbc2023',
      'fire2016',
      'gbcp2023',
      'petsac2014',
      'standardization2021',
    ].forEach((key) => keySet.add(key))
  }

  return Array.from(keySet).sort((left, right) => left.localeCompare(right))
}

const buildDefaultGreenBuildingCodes = async () => {
  const keys = await discoverGreenBuildingCodeKeys()
  return keys.map((key, index) => buildGreenCodeRecordFromKey(key, index))
}

let openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null
const huggingFaceRouterClient =
  HUGGINGFACE_API_KEY
    ? new OpenAI({ apiKey: HUGGINGFACE_API_KEY, baseURL: HUGGINGFACE_BASE_URL })
    : null

registerInstantProbeRoutes(app)

const truthyEnv = (v) => ['1', 'true', 'yes'].includes(String(v ?? '').trim().toLowerCase())

/** One-line request log for ops (`R360_REQUEST_LOG=1`). Does not replace `R360_VERBOSE_HTTP`. */
if (truthyEnv(process.env.R360_REQUEST_LOG)) {
  app.use((req, _res, next) => {
    console.log('??', req.method, req.url)
    next()
  })
}

app.use(
  compression({
    threshold: 512,
    filter: (req, res) => compression.filter(req, res),
  }),
)

if (process.env.R360_VERBOSE_HTTP === '1') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`)
    next()
  })
}

app.use(express.json({ limit: '2mb' }))

/** Every /api route inherits credentialed CORS + explicit OPTIONS preflight handling. */
app.use('/api', apiCorsEnforcementMiddleware)

/** Block mutation endpoints; public GET APIs remain available. */
app.use(readOnlyModeMiddleware)


/** Public local-first content/media routes (filesystem-backed). */
registerLocalPlatformRoutes(app)
registerLocalApiRoutes(app)
app.use('/storage', (req, res, next) => {
  applyApiCorsHeaders(req, res)
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range')
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none')
  if (String(req.method || '').toUpperCase() === 'OPTIONS') {
    res.status(204).end()
    return
  }
  next()
})
app.use('/storage/content', async (req, res, next) => {
  if (!isRemoteMediaMode) {
    if (String(process.env.NODE_ENV ?? '').toLowerCase() === 'production') {
      return res.status(503).json({ error: 'media_base_url_not_configured' })
    }
    return next()
  }
  const method = String(req.method ?? '').toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const original = String(req.originalUrl ?? req.url ?? '')
  const suffix = original.replace(/^\/storage\/content\/?/, '')
  const remoteUrl = `${MEDIA_BASE_URL}${suffix ? `/${suffix}` : ''}`

  try {
    const upstream = await fetch(remoteUrl, {
      method,
      headers: {
        ...(req.headers.range ? { range: String(req.headers.range) } : {}),
        ...(req.headers['if-none-match'] ? { 'if-none-match': String(req.headers['if-none-match']) } : {}),
        ...(req.headers['if-modified-since'] ? { 'if-modified-since': String(req.headers['if-modified-since']) } : {}),
      },
    })

    res.status(upstream.status)
    const passHeaders = [
      'content-type',
      'content-length',
      'cache-control',
      'etag',
      'last-modified',
      'accept-ranges',
      'content-range',
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'cross-origin-resource-policy',
      'cross-origin-embedder-policy',
    ]
    for (const h of passHeaders) {
      const value = upstream.headers.get(h)
      if (value) res.setHeader(h, value)
    }
    if (method === 'HEAD' || !upstream.body) {
      res.end()
      return
    }
    Readable.fromWeb(upstream.body).pipe(res)
  } catch (error) {
    console.error('[media] remote proxy failed', error instanceof Error ? error.message : error)
    res.status(502).json({ error: 'remote_media_unavailable' })
  }
})
app.use('/storage', express.static(STORAGE_DIR, { maxAge: '1h', fallthrough: true }))
app.use('/storage/content', (_req, res) => {
  res.status(404).json({ error: 'media_not_found' })
})

/** Require `x-admin-key` for `/api/admin/*` mutations (except OPTIONS). */
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return next()
  const p = req.path || ''
  if (!p.startsWith('/api/admin')) return next()
  if (!assertAdminApiKey(req, res)) return
  next()
})

const realtimeEmitPaths = [
  '/api/admin/page-config',
  '/api/admin/homepage-config',
  '/api/admin/cms/retrofit',
  '/api/admin/cms/retrofit/reset',
  '/api/admin/disaster-dashboard',
  '/api/admin/content',
  '/api/admin/upload',
  '/api/admin/delete',
  '/api/admin/media',
  '/api/admin/media/deactivate',
  '/api/admin/media/map-local',
  '/api/admin/media/repair-urls',
  '/api/admin/sync-local-media',
  '/api/upload',
  '/api/admin/cms-universal-upload',
]

app.use((req, res, next) => {
  const method = String(req.method || '').toUpperCase()
  const requestPath = String(req.path || '')
  const isMutationMethod = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE'
  const shouldEmit =
    isMutationMethod &&
    realtimeEmitPaths.some((prefix) => requestPath.startsWith(prefix))
  if (!shouldEmit) return next()

  res.on('finish', () => {
    if (res.locals.__uiUpdatedEmitted === true) return
    if (res.statusCode < 200 || res.statusCode >= 400) return
    let rawPage = String(req.body?.page || req.query?.page || req.body?.section || '').trim()
    let rawSection = String(req.body?.section || req.query?.section || '').trim()
    if (requestPath.startsWith('/api/admin/cms/retrofit')) {
      rawPage = 'retrofit'
      rawSection = 'retrofit'
    } else if (requestPath.startsWith('/api/admin/upload')) {
      const sec = String(req.body?.section ?? req.body?.sectionName ?? '').trim()
      if (sec) {
        rawPage = sec
        rawSection = sec
      }
    }
    const page = rawPage || rawSection || 'global'
    const section = rawSection || rawPage || 'global'
    const meta = canonicalRealtimePayload({ page, section, source: requestPath })
    emitUiUpdated(meta)
    res.locals.__uiUpdatedEmitted = true
    console.info('[realtime] ui_updated emitted', {
      source: requestPath,
      page: meta.page,
      section: meta.section,
      statusCode: res.statusCode,
    })
  })
  next()
})

/** Set in process environment (.env or host config). Connection happens after HTTP bind so healthchecks can reach the process. */
const mongoUri = normalizeEnvValue(process.env.MONGODB_URI ?? '')

/** Prefer fenced ```json blocks; also accept ``` with no language tag. */
const stripMarkdownJsonFence = (rawText) => {
  const text = String(rawText ?? '')
  const tryFence = (re) => {
    const m = text.match(re)
    return m ? String(m[1] ?? '').trim() : ''
  }
  return (
    tryFence(/```json\s*([\s\S]*?)```/i) ||
    tryFence(/```\s*([\s\S]*?)```/) ||
    text.trim()
  )
}

/**
 * First complete JSON object or array in `text`, respecting strings and nesting.
 * Fixes prose + JSON, Gemini/HF plain text, and `lastIndexOf('}')` breaking on `}` inside strings.
 */
const extractFirstJsonFragment = (text) => {
  const s = String(text ?? '')
  let i = 0
  while (i < s.length && /\s/.test(s[i])) i += 1
  const startChar = s[i]
  if (startChar !== '{' && startChar !== '[') return null

  const stack = [startChar === '{' ? '}' : ']']
  const start = i
  i += 1
  let inString = false
  let escape = false

  while (i < s.length && stack.length > 0) {
    const c = s[i]
    if (escape) {
      escape = false
      i += 1
      continue
    }
    if (inString) {
      if (c === '\\') escape = true
      else if (c === '"') inString = false
      i += 1
      continue
    }
    if (c === '"') {
      inString = true
      i += 1
      continue
    }
    if (c === '{') {
      stack.push('}')
      i += 1
      continue
    }
    if (c === '[') {
      stack.push(']')
      i += 1
      continue
    }
    if (c === '}' || c === ']') {
      const expected = stack[stack.length - 1]
      if (c !== expected) return null
      stack.pop()
      i += 1
      if (stack.length === 0) {
        return s.slice(start, i)
      }
      continue
    }
    i += 1
  }
  return null
}

const extractJson = (rawText) => {
  if (!rawText) {
    throw new Error('Empty model response')
  }

  const candidate = stripMarkdownJsonFence(rawText)
  if (!candidate) {
    throw new Error('Empty model response')
  }

  try {
    const direct = JSON.parse(candidate)
    if (Array.isArray(direct) && direct.length === 1 && direct[0] !== null && typeof direct[0] === 'object' && !Array.isArray(direct[0])) {
      return direct[0]
    }
    return direct
  } catch {
    /* fall through */
  }

  const fragment = extractFirstJsonFragment(candidate)
  if (!fragment) {
    console.error('Failed to extract JSON. Raw (preview):', String(rawText).substring(0, 800))
    throw new Error('Could not parse structured JSON response. Check server logs for details.')
  }

  try {
    const parsed = JSON.parse(fragment)
    if (Array.isArray(parsed) && parsed.length === 1 && parsed[0] !== null && typeof parsed[0] === 'object' && !Array.isArray(parsed[0])) {
      return parsed[0]
    }
    return parsed
  } catch (err) {
    console.error('JSON.parse failed on extracted fragment (preview):', fragment.substring(0, 500), err)
    throw new Error('Could not parse structured JSON response. Check server logs for details.')
  }
}

/** Like {@link extractJson} but never throws ? used where a deterministic fallback must be returned. */
const tryExtractJson = (rawText) => {
  try {
    return extractJson(rawText)
  } catch (e) {
    console.error('tryExtractJson: invalid JSON from AI', e instanceof Error ? e.message : e)
    return null
  }
}

const safeArray = (value) => (Array.isArray(value) ? value : [])

const getAiMissingConfigMessage = (feature) => {
  if (selectedAiProvider === 'huggingface') {
    return `[server] Hugging Face credentials not configured for ${feature}`
  }
  return `[server] OpenAI credentials not configured for ${feature}`
}

const getAiMissingConfigUserMessage = () => USER_AI_MESSAGES.serviceUnavailable

const getErrorStatus = (error) =>
  typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
    ? error.status
    : undefined

const getOpenAiErrorDetails = (error) => {
  const status = getErrorStatus(error)
  const message = error instanceof Error ? error.message : String(error ?? '')
  const code =
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof error.error === 'object' &&
          error.error !== null &&
          'code' in error.error &&
          typeof error.error.code === 'string'
        ? error.error.code
        : ''
  const type =
    typeof error === 'object' && error !== null && 'type' in error && typeof error.type === 'string'
      ? error.type
      : typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof error.error === 'object' &&
          error.error !== null &&
          'type' in error.error &&
          typeof error.error.type === 'string'
        ? error.error.type
        : ''
  const param =
    typeof error === 'object' && error !== null && 'param' in error && typeof error.param === 'string'
      ? error.param
      : typeof error === 'object' &&
          error !== null &&
          'error' in error &&
          typeof error.error === 'object' &&
          error.error !== null &&
          'param' in error.error &&
          typeof error.error.param === 'string'
        ? error.error.param
        : ''
  return { status, message, code: String(code || ''), type: String(type || ''), param: String(param || '') }
}

const classifyOpenAiError = (error) => {
  const { status, message, code, type, param } = getOpenAiErrorDetails(error)
  const codeLower = code.toLowerCase()
  const typeLower = type.toLowerCase()
  const messageLower = message.toLowerCase()
  const paramLower = param.toLowerCase()

  if (status === 401 || /invalid api key|incorrect api key|authentication|unauthorized|api key/i.test(messageLower)) {
    return { category: 'auth_error', retryable: false, httpStatus: 401 }
  }
  if (status === 403 || /access denied|forbidden|organization|project|permission/i.test(messageLower)) {
    return { category: 'access_denied', retryable: false, httpStatus: 403 }
  }
  if (
    status === 404 ||
    codeLower === 'model_not_found' ||
    /model.*not found|unknown model|does not exist/i.test(messageLower) ||
    paramLower.includes('model')
  ) {
    return { category: 'model_unavailable', retryable: false, httpStatus: 404 }
  }
  if (
    codeLower === 'insufficient_quota' ||
    typeLower === 'insufficient_quota' ||
    /insufficient_quota|quota|billing|payment required|credit/i.test(messageLower)
  ) {
    return { category: 'quota_exceeded', retryable: false, httpStatus: 429 }
  }
  if (status === 429 || /rate limit|too many requests|request rate/i.test(messageLower)) {
    return { category: 'rate_limited', retryable: true, httpStatus: 429 }
  }
  if (status === 408 || status === 502 || status === 503 || status === 504 || /timeout|timed out|temporar|network|econn|enotfound/i.test(messageLower)) {
    return { category: 'transient_upstream', retryable: true, httpStatus: status ?? 503 }
  }
  if (status && status >= 400 && status <= 599) {
    return { category: 'provider_error', retryable: false, httpStatus: status }
  }
  return { category: 'unknown', retryable: false, httpStatus: 500 }
}

const isOpenAiLimitError = (error) => {
  const classification = classifyOpenAiError(error)
  return classification.category === 'rate_limited' || classification.category === 'quota_exceeded'
}

const isOpenAiAuthError = (error) => {
  const classification = classifyOpenAiError(error)
  return classification.category === 'auth_error' || classification.category === 'access_denied'
}

const isTransientAiError = (error) => classifyOpenAiError(error).retryable

const withPromiseTimeout = async (promise, timeoutMs, label) => {
  let timer = null
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s`)), timeoutMs)
      }),
    ])
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }
}

const USER_AI_MESSAGES = {
  unavailable: 'AI analysis is temporarily unavailable. Please try again in a few minutes.',
  serviceUnavailable: 'The analysis service is temporarily unavailable.',
  highDemand: 'The AI service is currently busy. Please try again shortly.',
  incomplete: 'Analysis could not be completed at this time. Please try again later.',
  generic: 'Analysis could not be completed at this time. Please try again later.',
  network: 'The analysis service is temporarily unavailable. Please try again in a few minutes.',
  invalidImage: 'Please upload a valid image file to continue.',
  configError: 'The analysis service is temporarily unavailable.',
  accessUnavailable: 'The analysis service is temporarily unavailable.',
  modelUnavailable: 'The analysis service is temporarily unavailable.',
  temporarilyBusy: 'The AI service is currently busy. Please try again shortly.',
  temporarilyUnavailable: 'AI analysis is temporarily unavailable. Please try again in a few minutes.',
}

const normalizeAiErrorForLog = (error, fallback) => {
  if (!error) return fallback
  const { status, message, code, type, param } = getOpenAiErrorDetails(error)
  const classification = classifyOpenAiError(error)
  const safeMessage = String(message || fallback).replace(/sk-[A-Za-z0-9_-]+/g, 'sk-***')
  return `category=${classification.category} status=${status ?? 'n/a'} code=${code || 'n/a'} type=${type || 'n/a'} param=${param || 'n/a'} message=${safeMessage}`
}

const toUserFacingAiError = (error, fallback = USER_AI_MESSAGES.generic) => {
  if (!error) return fallback
  const classification = classifyOpenAiError(error)
  switch (classification.category) {
    case 'auth_error':
      return USER_AI_MESSAGES.configError
    case 'access_denied':
      return USER_AI_MESSAGES.accessUnavailable
    case 'model_unavailable':
      return USER_AI_MESSAGES.modelUnavailable
    case 'rate_limited':
    case 'quota_exceeded':
      return USER_AI_MESSAGES.temporarilyBusy
    case 'transient_upstream':
      return USER_AI_MESSAGES.temporarilyUnavailable
    default:
      return fallback
  }
}

const normalizeAiErrorMessage = (error, fallback) => toUserFacingAiError(error, fallback)

const getAiErrorHttpStatus = (error) => {
  return classifyOpenAiError(error).httpStatus
}

const isTemporaryAiError = (error) => {
  const classification = classifyOpenAiError(error)
  return (
    classification.category === 'quota_exceeded' ||
    classification.category === 'rate_limited' ||
    classification.category === 'transient_upstream' ||
    classification.category === 'provider_error' ||
    classification.category === 'unknown' ||
    classification.category === 'auth_error' ||
    classification.category === 'access_denied' ||
    classification.category === 'model_unavailable'
  )
}

const toSanitizedVisionErrorPayload = (error, fallback = USER_AI_MESSAGES.unavailable) => {
  const message = toUserFacingAiError(error, fallback)
  return {
    success: false,
    temporary: isTemporaryAiError(error),
    message,
    error: message,
    code: 'analysis_unavailable',
  }
}

const getOpenAiLogSummary = (error) => {
  const details = getOpenAiErrorDetails(error)
  const classification = classifyOpenAiError(error)
  if (classification.category === 'quota_exceeded') return 'OpenAI quota exceeded'
  if (classification.category === 'rate_limited') return 'OpenAI returned HTTP 429 rate limit'
  if (classification.category === 'auth_error') return 'OpenAI returned HTTP 401 invalid credentials'
  if (classification.category === 'access_denied') return 'OpenAI returned HTTP 403 forbidden'
  if (classification.category === 'transient_upstream') return 'OpenAI upstream timeout/network failure'
  if (details.status === 500) return 'OpenAI returned HTTP 500'
  if (details.status === 502) return 'OpenAI returned HTTP 502'
  if (details.status === 503) return 'OpenAI returned HTTP 503'
  if (details.status === 504) return 'OpenAI returned HTTP 504'
  return 'OpenAI request failed'
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const runWithConcurrency = async (items, worker, concurrency = AI_IMAGE_CONCURRENCY) => {
  const results = []
  let index = 0
  const workerCount = Math.max(1, Math.min(concurrency, items.length || 1))

  const runners = Array.from({ length: workerCount }, async () => {
    while (index < items.length) {
      const current = index
      index += 1
      try {
        results[current] = { ok: true, value: await worker(items[current], current) }
      } catch (error) {
        results[current] = { ok: false, error }
      }
    }
  })

  await Promise.all(runners)
  return results
}

const buildGeminiPartsFromOpenAiContent = (content) => {
  if (typeof content === 'string') {
    return [{ text: content }]
  }
  if (Array.isArray(content)) {
    const parts = []
    for (const block of content) {
      if (block?.type === 'text' && block.text) {
        parts.push({ text: block.text })
      } else if (block?.type === 'image_url' && block.image_url?.url) {
        const url = String(block.image_url.url)
        const dataMatch = url.match(/^data:([^;]+);base64,(.+)$/)
        if (!dataMatch) {
          throw new Error('Gemini image input requires a data: URL with base64 content')
        }
        const mimeType = dataMatch[1] || 'image/jpeg'
        const data = dataMatch[2]
        parts.push({ inlineData: { mimeType, data } })
      }
    }
    if (parts.length === 0) {
      throw new Error('No usable content parts for Gemini')
    }
    return parts
  }
  throw new Error('Unsupported message content for Gemini')
}

const messagesToGeminiParams = (messages) => {
  const systemTexts = []
  const contents = []
  for (const msg of messages) {
    if (msg.role === 'system') {
      if (typeof msg.content === 'string') {
        systemTexts.push(msg.content)
      } else if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block?.type === 'text' && block.text) {
            systemTexts.push(block.text)
          }
        }
      }
      continue
    }
    const role = msg.role === 'assistant' ? 'model' : 'user'
    const parts = buildGeminiPartsFromOpenAiContent(msg.content)
    contents.push({ role, parts })
  }
  const systemInstruction = systemTexts.length > 0 ? systemTexts.join('\n\n') : undefined
  return { systemInstruction, contents }
}

let cachedOpenAiServiceModule = null

const callOpenAI = async ({
  messages,
  temperature,
  openaiModel,
  responseFormatJsonObject = true,
  timeoutMs = AI_PROVIDER_REQUEST_TIMEOUT_MS,
}) => {
  if (!cachedOpenAiServiceModule) {
    cachedOpenAiServiceModule = await import('./services/aiService.mjs')
  }
  const { openaiChatCompletionText } = cachedOpenAiServiceModule
  return openaiChatCompletionText({
    messages,
    model: openaiModel,
    temperature,
    timeoutMs,
    responseFormatJsonObject,
    onRotatedKey: (nextKey) => {
      openai = new OpenAI({ apiKey: nextKey })
    },
  })
}

/** Vision analysis uses OpenAI only (image_url payloads are not sent to alternate providers). */
const callOpenAIVisionWithRetry = async ({ messages, requestId, openaiModel = OPENAI_VISION_MODEL }) => {
  const endpoint = '/v1/chat/completions'
  const modelCandidates = [openaiModel, ...OPENAI_VISION_FALLBACK_MODELS].filter(Boolean)
  let lastError = null

  for (let modelIndex = 0; modelIndex < modelCandidates.length; modelIndex += 1) {
    const modelName = modelCandidates[modelIndex]
    const maxAttempts = 3
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const startedAt = Date.now()
      try {
        console.info('[vision/analyze] OpenAI request started', {
          requestId,
          endpoint,
          model: modelName,
          attempt,
          fallbackModelIndex: modelIndex,
        })
        const content = await callOpenAI({
          messages,
          temperature: 0.1,
          openaiModel: modelName,
          responseFormatJsonObject: true,
          timeoutMs: AI_PROVIDER_REQUEST_TIMEOUT_MS,
        })
        console.info('[vision/analyze] OpenAI response received', {
          requestId,
          endpoint,
          model: modelName,
          attempt,
          durationMs: Date.now() - startedAt,
        })
        return { content, modelUsed: modelName }
      } catch (error) {
        lastError = error
        const classification = classifyOpenAiError(error)
        const details = getOpenAiErrorDetails(error)
        console.error('[vision/analyze] OpenAI request failed', {
          requestId,
          endpoint,
          model: modelName,
          attempt,
          durationMs: Date.now() - startedAt,
          status: details.status ?? null,
          code: details.code || null,
          type: details.type || null,
          category: classification.category,
          detail: normalizeAiErrorForLog(error, 'OpenAI vision request failed'),
        })

        if (classification.category === 'model_unavailable' && modelIndex < modelCandidates.length - 1) {
          break
        }

        if (classification.retryable && attempt < maxAttempts) {
          const backoffMs = 1000 * Math.pow(2, attempt - 1)
          await sleep(backoffMs)
          continue
        }

        throw error
      }
    }
  }

  throw lastError ?? new Error('OpenAI vision request failed')
}

const callHuggingFace = async ({ messages, temperature, huggingFaceModel }) => {
  if (!huggingFaceRouterClient) {
    throw new Error('Hugging Face key missing. Set HUGGINGFACE_API_KEY in environment variables.')
  }

  const runWithClient = async (client, modelName, allowJsonResponseFormat) => {
    const payload = {
      model: modelName,
      temperature,
      messages,
      ...(allowJsonResponseFormat ? { response_format: { type: 'json_object' } } : {}),
    }

    return await withPromiseTimeout(
      client.chat.completions.create(payload),
      AI_PROVIDER_REQUEST_TIMEOUT_MS,
      'Hugging Face text generation',
    )
  }

  try {
    const completion = await runWithClient(huggingFaceRouterClient, huggingFaceModel, true)
    const text = completion.choices[0]?.message?.content ?? ''
    if (!String(text).trim()) {
      throw new Error('Hugging Face returned an empty response')
    }
    return text
  } catch (firstError) {
    try {
      const completion = await runWithClient(huggingFaceRouterClient, huggingFaceModel, false)
      const text = completion.choices[0]?.message?.content ?? ''
      if (!String(text).trim()) {
        throw new Error('Hugging Face returned an empty response')
      }
      return text
    } catch (secondError) {
      throw secondError
    }
  }
}

const callGemini = async ({ messages, temperature }) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key missing. Set GEMINI_API_KEY in environment variables.')
  }

  const { systemInstruction, contents } = messagesToGeminiParams(messages)
  if (!contents.length) {
    throw new Error('No Gemini contents to generate')
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    ...(systemInstruction ? { systemInstruction } : {}),
    generationConfig: {
      temperature,
      responseMimeType: 'application/json',
    },
  })

  try {
    const result = await withPromiseTimeout(
      model.generateContent({ contents }),
      AI_PROVIDER_REQUEST_TIMEOUT_MS,
      'Gemini text generation',
    )
    const text = result.response.text()
    if (!text || !String(text).trim()) {
      throw new Error('Gemini returned an empty response')
    }
    return text
  } catch (error) {
    try {
      const modelPlain = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        ...(systemInstruction ? { systemInstruction } : {}),
        generationConfig: { temperature },
      })
      const result = await withPromiseTimeout(
        modelPlain.generateContent({ contents }),
        AI_PROVIDER_REQUEST_TIMEOUT_MS,
        'Gemini text generation (plain)',
      )
      const text = result.response.text()
      if (!text || !String(text).trim()) {
        throw new Error('Gemini returned an empty response')
      }
      return text
    } catch (fallbackError) {
      throw fallbackError
    }
  }
}

const callLlama = async ({ messages, temperature }) => {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key missing. Set OPENROUTER_API_KEY in environment variables.')
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
  }
  if (OPENROUTER_SITE_URL) {
    headers['HTTP-Referer'] = OPENROUTER_SITE_URL
  }
  if (OPENROUTER_SITE_NAME) {
    headers['X-Title'] = OPENROUTER_SITE_NAME
  }

  const run = async (useJsonFormat) => {
    const body = {
      model: OPENROUTER_LLAMA_MODEL,
      messages,
      temperature,
      ...(useJsonFormat ? { response_format: { type: 'json_object' } } : {}),
    }
    const response = await withPromiseTimeout(
      fetch(OPENROUTER_LLAMA_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }),
      AI_PROVIDER_REQUEST_TIMEOUT_MS,
      'OpenRouter Llama text generation',
    )
    const raw = await response.text()
    if (!response.ok) {
      throw new Error(raw || `OpenRouter HTTP ${response.status}`)
    }
    let json
    try {
      json = raw ? JSON.parse(raw) : null
    } catch {
      throw new Error('OpenRouter returned invalid JSON')
    }
    const text = json?.choices?.[0]?.message?.content ?? ''
    if (!String(text).trim()) {
      throw new Error('OpenRouter returned an empty response')
    }
    return text
  }

  try {
    return await run(true)
  } catch (firstError) {
    return await run(false)
  }
}

const generateAIResponse = async (prompt, options = {}) => {
  const messages =
    typeof prompt === 'string' ? [{ role: 'user', content: prompt }] : prompt
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('generateAIResponse requires a non-empty messages array or a prompt string')
  }

  const { temperature = 0.2, openaiModel = OPENAI_MODEL, huggingFaceModel = HUGGINGFACE_CHAT_MODEL } = options

  const attempts = [
    { label: 'OpenAI', run: () => callOpenAI({ messages, temperature, openaiModel }) },
    { label: 'HuggingFace', run: () => callHuggingFace({ messages, temperature, huggingFaceModel }) },
    { label: 'Gemini', run: () => callGemini({ messages, temperature }) },
    { label: 'Llama (OpenRouter)', run: () => callLlama({ messages, temperature }) },
  ]

  const failures = []
  for (const { label, run } of attempts) {
    try {
      const text = await run()
      if (!String(text ?? '').trim()) {
        throw new Error('empty response')
      }
      console.log(`[AI] Response succeeded using provider: ${label}`)
      return text
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`[AI] Provider ${label} failed: ${message}`)
      failures.push(`${label}: ${message}`)
    }
  }

  throw new Error(`All AI providers failed. ${failures.join(' | ')}`)
}

const createChatCompletion = async ({ messages, temperature = 0.2, openaiModel = OPENAI_MODEL, huggingFaceModel = HUGGINGFACE_CHAT_MODEL }) => {
  const content = await generateAIResponse(messages, { temperature, openaiModel, huggingFaceModel })
  return { choices: [{ message: { content } }] }
}

const parseImageSize = (size) => {
  if (!size || size === 'auto') {
    return { width: 1024, height: 1024 }
  }

  const [rawWidth, rawHeight] = String(size).split('x')
  const width = Math.max(256, Number(rawWidth) || 1024)
  const height = Math.max(256, Number(rawHeight) || 1024)
  return { width, height }
}

const fetchImageAsBase64FromUrl = async (url) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AI_IMAGE_TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Image fetch failed (${response.status})`)
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    return buffer.toString('base64')
  } finally {
    clearTimeout(timer)
  }
}

const generateImageBase64 = async ({ prompt, size = '1024x1024' }) => {
  const validDallE3Sizes = ['1024x1024', '1024x1792', '1792x1024']
  const imageSize = validDallE3Sizes.includes(size) ? size : '1024x1024'

  const runImageRequest = async (client, provider) => {
    const modelName = provider === 'huggingface' ? HUGGINGFACE_IMAGE_MODEL : 'dall-e-3'
    const generated = await withPromiseTimeout(
      client.images.generate({
        model: modelName,
        prompt,
        ...(provider === 'openai' ? { size: imageSize } : {}),
        response_format: 'b64_json',
      }),
      AI_IMAGE_TIMEOUT_MS,
      'AI image generation',
    )

    const entry = generated?.data?.[0]
    if (entry?.b64_json) return entry.b64_json
    if (entry?.url) {
      return await fetchImageAsBase64FromUrl(entry.url)
    }
    return null
  }

  const tryOpenAi = async () => {
    if (!openai) {
      throw new Error('OpenAI API key required. Set OPENAI_API_KEY in environment variables.')
    }

    try {
      return await runImageRequest(openai, 'openai')
    } catch (error) {
      const status = getErrorStatus(error)
      if (isOpenAiAuthError(error)) {
        const nextKey = rotateApiKey()
        openai = nextKey ? new OpenAI({ apiKey: nextKey }) : null
      }
      throw error
    }
  }

  const tryHuggingFace = async () => {
    if (!huggingFaceRouterClient) {
      throw new Error('Hugging Face key missing. Set HUGGINGFACE_API_KEY in environment variables.')
    }

    return await runImageRequest(huggingFaceRouterClient, 'huggingface')
  }

  if (selectedAiProvider === 'huggingface') {
    return await tryHuggingFace()
  }

  try {
    return await tryOpenAi()
  } catch (error) {
    if (hasHuggingFaceFallback && (isOpenAiLimitError(error) || isTransientAiError(error))) {
      console.warn('OpenAI failed; falling back to Hugging Face for image generation')
      return await tryHuggingFace()
    }
    throw error
  }
}

const fetchRemoteText = async (url, timeoutMs = 14000) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Upstream request failed (${response.status}) for ${url}`)
    }
    return await response.text()
  } finally {
    clearTimeout(timer)
  }
}

const fetchRemoteJson = async (url, timeoutMs = 14000) => {
  const text = await fetchRemoteText(url, timeoutMs)
  return JSON.parse(text)
}

let atlasCountryStatsCache = null
let atlasCountryStatsLoadedAt = 0

const normalizeCountryName = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[()'.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const atlasCountryAliases = {
  pakistan: 'PAK',
  'united states': 'USA',
  usa: 'USA',
  'united states of america': 'USA',
  russia: 'RUS',
  'russian federation': 'RUS',
  turkey: 'TUR',
  turkiye: 'TUR',
  iran: 'IRN',
  india: 'IND',
  china: 'CHN',
  afghanistan: 'AFG',
}

const parseAtlasHitsCount = (responseText) => {
  const matched = responseText.match(/numberMatched="([0-9]+)"/i)
  if (matched?.[1]) return Number.parseInt(matched[1], 10)
  const features = responseText.match(/numberOfFeatures="([0-9]+)"/i)
  if (features?.[1]) return Number.parseInt(features[1], 10)
  return NaN
}

const tryCountBuildingsFromAtlasWfs = async ({ lat, lng, radiusKm }) => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radiusKm) || radiusKm <= 0) {
    return null
  }

  const safeRadiusKm = Math.max(1, Math.min(120, radiusKm))
  const latDelta = safeRadiusKm / 110.574
  const lngDelta = safeRadiusKm / (111.32 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)))

  const minLat = lat - latDelta
  const maxLat = lat + latDelta
  const minLng = lng - lngDelta
  const maxLng = lng + lngDelta

  for (const typeName of GLOBAL_BUILDING_ATLAS_WFS_LAYER_CANDIDATES) {
    const url =
      `${GLOBAL_BUILDING_ATLAS_WFS_URL}` +
      `service=WFS&version=2.0.0&request=GetFeature&typeNames=${encodeURIComponent(typeName)}` +
      '&resultType=hits&srsName=EPSG:4326' +
      `&bbox=${minLng},${minLat},${maxLng},${maxLat},EPSG:4326`

    try {
      const text = await fetchRemoteText(url, 9000)
      const count = parseAtlasHitsCount(text)
      if (Number.isFinite(count) && count >= 0) {
        const boxAreaSqKm = (maxLat - minLat) * (maxLng - minLng) * 111.32 * 110.574
        const circleAreaSqKm = Math.PI * safeRadiusKm * safeRadiusKm
        const areaScale = boxAreaSqKm > 0 ? Math.min(1, circleAreaSqKm / boxAreaSqKm) : 1
        return {
          estimatedBuildings: Math.round(count * areaScale),
          source: 'GlobalBuildingAtlas WFS',
          method: 'Spatial count from WFS hits query (bbox-adjusted to circle)',
          accuracyMode: 'WFS exact',
          confidence: 'High',
          note:
            safeRadiusKm < radiusKm
              ? `Radius clipped to ${safeRadiusKm} km for stable query performance.`
              : undefined,
        }
      }
    } catch {
      // Try next layer candidate.
    }
  }

  return null
}

const loadAtlasCountryStats = async () => {
  const now = Date.now()
  if (atlasCountryStatsCache && now - atlasCountryStatsLoadedAt < 10 * 60 * 1000) {
    return atlasCountryStatsCache
  }

  const volumeByCountryPath = path.join(GLOBAL_BUILDING_ATLAS_ROOT, 'make_plots', 'volume_by_country.json')
  const populationByCountryPath = path.join(GLOBAL_BUILDING_ATLAS_ROOT, 'make_plots', 'global_popuation_building_volume.json')

  const [volumeRaw, populationRaw] = await Promise.all([
    fs.readFile(volumeByCountryPath, 'utf8'),
    fs.readFile(populationByCountryPath, 'utf8'),
  ])

  const volumeByCountry = JSON.parse(volumeRaw)
  const populationByCountry = JSON.parse(populationRaw)
  const byIso = new Map()
  const byName = new Map()

  let globalBuildings = 0
  let globalPopulation = 0

  for (const [iso, volumeStats] of Object.entries(volumeByCountry)) {
    const count = Number(volumeStats?.count ?? 0)
    const population = Number(populationByCountry?.[iso]?.population ?? 0)
    const name = String(populationByCountry?.[iso]?.name ?? iso).trim()
    if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(population) || population <= 0) continue

    const buildingsPerPerson = count / population
    const entry = {
      iso,
      name,
      count,
      population,
      buildingsPerPerson,
    }

    byIso.set(iso, entry)
    byName.set(normalizeCountryName(name), iso)
    globalBuildings += count
    globalPopulation += population
  }

  for (const [alias, iso] of Object.entries(atlasCountryAliases)) {
    if (byIso.has(iso)) {
      byName.set(normalizeCountryName(alias), iso)
    }
  }

  atlasCountryStatsCache = {
    byIso,
    byName,
    globalBuildingsPerPerson: globalPopulation > 0 ? globalBuildings / globalPopulation : 0.22,
  }
  atlasCountryStatsLoadedAt = now

  return atlasCountryStatsCache
}

const resolveCountryIsoFromPlace = (place, byName) => {
  const text = String(place ?? '').trim()
  if (!text) return null

  const tail = normalizeCountryName(text.split(',').at(-1))
  if (tail && byName.has(tail)) {
    return byName.get(tail)
  }

  for (const [normalizedName, iso] of byName.entries()) {
    if (normalizedName && normalizeCountryName(text).includes(normalizedName)) {
      return iso
    }
  }

  return null
}

const estimateAtlasBuildingImpact = async ({ lat, lng, place, radiusKm, populationExposed }) => {
  const wfsEstimate = await tryCountBuildingsFromAtlasWfs({ lat, lng, radiusKm })
  if (wfsEstimate) {
    return wfsEstimate
  }

  const stats = await loadAtlasCountryStats()
  const countryIso = resolveCountryIsoFromPlace(place, stats.byName)
  const country = countryIso ? stats.byIso.get(countryIso) : null

  const buildingsPerPerson = Number(country?.buildingsPerPerson ?? stats.globalBuildingsPerPerson)
  const estimatedBuildings = Math.max(0, Math.round(Math.max(0, Number(populationExposed) || 0) * buildingsPerPerson))

  return {
    estimatedBuildings,
    source: country ? `GlobalBuildingAtlas (${country.name})` : 'GlobalBuildingAtlas (global model)',
    method: 'Country-level buildings-per-person scaling from atlas statistics',
    accuracyMode: 'Atlas statistical fallback',
    confidence: country ? 'Medium' : 'Low',
    note:
      country
        ? `Derived from atlas country totals: ${country.iso}, ${country.count.toLocaleString()} buildings.`
        : 'Country could not be resolved from place string; used global average scaling.',
  }
}

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim()
const clip = (value, max = 400) => String(value ?? '').slice(0, max)
const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase()
const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const pruneRecoveryRateLimitStore = (now) => {
  for (const [key, entry] of recoveryRateLimitStore.entries()) {
    if (!entry || now - entry.windowStart > RECOVERY_RATE_LIMIT_WINDOW_MS) {
      recoveryRateLimitStore.delete(key)
    }
  }
}

const checkRecoveryRateLimit = (clientKey) => {
  const now = Date.now()
  pruneRecoveryRateLimitStore(now)
  const current = recoveryRateLimitStore.get(clientKey)

  if (!current || now - current.windowStart > RECOVERY_RATE_LIMIT_WINDOW_MS) {
    recoveryRateLimitStore.set(clientKey, { windowStart: now, count: 1 })
    return { allowed: true }
  }

  if (current.count >= RECOVERY_RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((RECOVERY_RATE_LIMIT_WINDOW_MS - (now - current.windowStart)) / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  current.count += 1
  recoveryRateLimitStore.set(clientKey, current)
  return { allowed: true }
}

const buildRecoveryEmailContent = ({ portal, fullName, role, username, credential, credentialLabel }) => {
  const safePortal = clip(portal || 'Resilience360 Portal', 80)
  const safeName = clip(fullName || 'User', 120)
  const safeRole = clip(role || 'User', 60)
  const safeUsername = clip(username || '', 160)
  const safeCredential = clip(credential || '', 160)
  const safeCredentialLabel = clip(credentialLabel || 'Credential', 40)

  const subject = `${safePortal} - Credential Recovery`
  const text =
    `Assalam-o-Alaikum,\n\n` +
    `Your ${safePortal} credentials are:\n` +
    `Role: ${safeRole}\n` +
    `Username/Email: ${safeUsername}\n` +
    `${safeCredentialLabel}: ${safeCredential}\n\n` +
    `If you did not request this, please contact support immediately.\n` +
    `${RECOVERY_FROM_NAME}`

  const html =
    `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">` +
    `<p>Assalam-o-Alaikum ${escapeHtml(safeName)},</p>` +
    `<p>Your <strong>${escapeHtml(safePortal)}</strong> credentials are:</p>` +
    `<ul>` +
    `<li><strong>Role:</strong> ${escapeHtml(safeRole)}</li>` +
    `<li><strong>Username/Email:</strong> ${escapeHtml(safeUsername)}</li>` +
    `<li><strong>${escapeHtml(safeCredentialLabel)}:</strong> ${escapeHtml(safeCredential)}</li>` +
    `</ul>` +
    `<p>If you did not request this, please contact support immediately.</p>` +
    `<p>${escapeHtml(RECOVERY_FROM_NAME)}</p>` +
    `</div>`

  return { subject, text, html }
}

const ensureRetrofitTrainingStorage = async () => {
  await fs.mkdir(retrofitTrainingImagesDir, { recursive: true })
}

const readRetrofitTrainingData = async () => {
  try {
    const raw = await fs.readFile(retrofitTrainingDataFile, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeRetrofitTrainingData = async (rows) => {
  await ensureRetrofitTrainingStorage()
  await fs.writeFile(retrofitTrainingDataFile, JSON.stringify(rows, null, 2), 'utf8')
}

const ensureCommunityIssuesStorage = async () => {
  await fs.mkdir(communityIssueImagesDir, { recursive: true })
}

const readCommunityIssues = async () => {
  try {
    const raw = await fs.readFile(communityIssuesDataFile, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeCommunityIssues = async (rows) => {
  await ensureCommunityIssuesStorage()
  await fs.writeFile(communityIssuesDataFile, JSON.stringify(rows, null, 2), 'utf8')
}

const buildCommunityIssueImageUrl = (req, imageName) => {
  if (!imageName) return null
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').toString().split(',')[0].trim()
  const host = req.get('host')
  if (!host) return `/uploads/community-issues/${encodeURIComponent(imageName)}`
  return `${proto}://${host}/uploads/community-issues/${encodeURIComponent(imageName)}`
}

/** Prefer persisted HTTPS `storedImageUrl` over same-origin uploads path. */
const resolveCommunityIssueImageUrl = (req, issue) => {
  const direct = String(issue?.storedImageUrl ?? issue?.photoUrl ?? '').trim()
  if (/^https?:\/\//i.test(direct)) return direct
  return buildCommunityIssueImageUrl(req, issue?.imageName)
}

const ensureGreenBuildingCodesStorage = async () => {
  await fs.mkdir(adminDataDir, { recursive: true })
  try {
    await fs.access(greenBuildingCodesDataFile)
  } catch {
    const defaults = await buildDefaultGreenBuildingCodes()
    await fs.writeFile(greenBuildingCodesDataFile, JSON.stringify(defaults, null, 2), 'utf8')
  }
}

const readGreenBuildingCodes = async () => {
  await ensureGreenBuildingCodesStorage()
  try {
    const raw = await fs.readFile(greenBuildingCodesDataFile, 'utf8')
    const parsed = JSON.parse(raw)
    const current = Array.isArray(parsed) ? parsed : []
    const discoveredKeys = await discoverGreenBuildingCodeKeys()
    const seen = new Set()
    const normalizedCurrent = current
      .map((record, index) => {
        const normalized = normalizeGreenCodeRecord(record, record?.id ?? `gbc-${index + 1}`)
        const normalizedKey = normalizeGreenCodeKey(normalized.codeKey)
        if (normalizedKey) {
          normalized.codeKey = normalizedKey
          seen.add(normalizedKey)
        }
        return normalized
      })

    const additions = discoveredKeys
      .filter((key) => !seen.has(key))
      .map((key, index) => buildGreenCodeRecordFromKey(key, normalizedCurrent.length + index))

    const merged = [...normalizedCurrent, ...additions].map((record, index) => ({
      ...record,
      id: record.id || `gbc-${index + 1}`,
    }))

    if (additions.length > 0) {
      await writeGreenBuildingCodes(merged)
    }

    return merged
  } catch {
    const defaults = await buildDefaultGreenBuildingCodes()
    await writeGreenBuildingCodes(defaults)
    return defaults
  }
}

const writeGreenBuildingCodes = async (rows) => {
  await ensureGreenBuildingCodesStorage()
  await fs.writeFile(greenBuildingCodesDataFile, JSON.stringify(rows, null, 2), 'utf8')
}

const normalizeGreenCodeRecord = (input, existingId) => {
  const nowIso = new Date().toISOString()
  const year = Number(input?.year ?? 0)
  const activeRaw = String(input?.active ?? 'true').trim().toLowerCase()
  const active = ['true', '1', 'yes', 'on'].includes(activeRaw)
  return {
    id: existingId ?? `gbc-${randomBytes(6).toString('hex')}`,
    title: String(input?.title ?? '').trim() || 'Untitled Code',
    codeKey: String(input?.codeKey ?? '').trim().toLowerCase() || null,
    category: String(input?.category ?? '').trim() || 'General',
    year: Number.isFinite(year) && year > 0 ? year : null,
    active,
    notes: String(input?.notes ?? '').trim(),
    pdfPath: String(input?.pdfPath ?? input?.file_url ?? '').trim() || null,
    source: String(input?.source ?? 'manual').trim() || 'manual',
    updatedAt: nowIso,
  }
}

const sanitizeMaterialHubPayload = (input, { excludeKeys = [] } = {}) => {
  if (!input || typeof input !== 'object') {
    return {}
  }

  const excluded = new Set(excludeKeys)
  const output = {}
  for (const [rawKey, value] of Object.entries(input)) {
    const key = String(rawKey ?? '').trim()
    if (!key || excluded.has(key)) continue
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) continue
    if (value === undefined) continue
    output[key] = value
  }

  return output
}

const normalizeHubStatusForAdmin = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized === 'ready' || normalized === 'moderate' || normalized === 'critical' ? normalized : 'moderate'
}

const toPositiveNumber = (value, fallback = 0) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.max(0, num)
}

const computeEntryFields = (input) => {
  const opening = toPositiveNumber(input?.opening)
  const received = toPositiveNumber(input?.received)
  const issued = toPositiveNumber(input?.issued)
  const damaged = toPositiveNumber(input?.damaged)
  const gross = opening + received
  const closing = Math.max(0, gross - issued - damaged)
  const percentageRemaining = gross > 0 ? Math.round((closing / gross) * 100) : 0
  return { opening, received, issued, damaged, closing, percentageRemaining }
}

/** No end-user or admin login: allow admin API usage without credentials. */
const requireAdminSession = (_req, _res) => ({
  email: 'anonymous',
  expiresAt: Date.now() + 86400000 * 365,
})

// Admin/CMS routes removed for static public platform (media + feature APIs remain).

if (truthyEnv(process.env.R360_DEBUG_ROUTES)) {
  app.get('/api/debug/routes', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({ ok: true, message: 'Routes loaded', ts: new Date().toISOString() })
  })
  console.log('? Debug route enabled: GET /api/debug/routes (R360_DEBUG_ROUTES=1)')
}

const parseJsonBodyField = (value, fallback = null) => {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback
  }

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const normalizeHubStatus = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized === 'ready' || normalized === 'moderate' || normalized === 'critical' ? normalized : null
}

const normalizeAiAction = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()

  if (['create', 'add', 'insert', 'new'].includes(normalized)) {
    return 'create'
  }

  if (['update', 'edit', 'modify', 'change', 'set', 'upsert'].includes(normalized)) {
    return 'update'
  }

  if (['delete', 'remove', 'del', 'drop'].includes(normalized)) {
    return 'delete'
  }

  return ''
}

const firstNonEmptyArray = (candidates) => {
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate
    }
  }

  return []
}

const extractHubOpsFromPayload = (payload) =>
  firstNonEmptyArray([
    payload?.hubOperations,
    payload?.hubs,
    payload?.hub_changes,
    payload?.operations?.hubOperations,
    payload?.operations?.hubs,
    payload?.changes?.hubs,
  ])

const extractEntryOpsFromPayload = (payload) =>
  firstNonEmptyArray([
    payload?.entryOperations,
    payload?.entries,
    payload?.entry_changes,
    payload?.operations?.entryOperations,
    payload?.operations?.entries,
    payload?.changes?.entries,
  ])

const extractOperationsFromDocumentText = (documentText) => {
  if (!documentText) {
    return { hubOps: [], entryOps: [] }
  }

  let parsed = null

  try {
    parsed = extractJson(documentText)
  } catch {
    return { hubOps: [], entryOps: [] }
  }

  return {
    hubOps: extractHubOpsFromPayload(parsed),
    entryOps: extractEntryOpsFromPayload(parsed),
  }
}

const getUploadedDocumentText = async (file) => {
  if (!file) {
    return ''
  }

  const extension = path.extname(String(file.originalname ?? '')).toLowerCase()
  const mime = String(file.mimetype ?? '').toLowerCase()

  if (extension === '.pdf' || mime === 'application/pdf') {
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: file.buffer })
    let text = ''

    try {
      const parsed = await parser.getText()
      text = String(parsed?.text ?? '').replace(/\s+/g, ' ').trim()
    } finally {
      await parser.destroy().catch(() => undefined)
    }

    if (!text) {
      throw new Error('Could not extract readable text from PDF. Please upload a text-based PDF or paste the text in the instruction box.')
    }

    return text.slice(0, 120_000)
  }

  if (
    extension === '.docx' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const mammoth = await import('mammoth')
    const parsed = await mammoth.default.extractRawText({ buffer: file.buffer })
    const text = String(parsed?.value ?? '').replace(/\s+/g, ' ').trim()

    if (!text) {
      throw new Error('Could not extract readable text from DOCX. Please verify the file or paste text directly in the instruction box.')
    }

    return text.slice(0, 120_000)
  }

  if (extension === '.doc' || mime === 'application/msword') {
    throw new Error('Legacy .doc files are not supported for automatic extraction yet. Please save as .docx or PDF and upload again.')
  }

  const raw = file.buffer.toString('utf8')
  const printableLength = (raw.match(/[\x20-\x7E\n\r\t]/g) ?? []).length
  const printableRatio = raw.length > 0 ? printableLength / raw.length : 1

  if (printableRatio < 0.55) {
    throw new Error('Unsupported document encoding. Please upload UTF-8 text/CSV/JSON/Markdown/log, PDF, DOCX, or paste extracted text in the instruction box.')
  }

  return raw.slice(0, 120_000)
}

const verifyMaterialHubAdmin = async (_req) => {
  return { status: 200, user: { email: 'anonymous@local' } }
}

const normalizeInfraText = (value) => String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim()

const getInfraModelSignature = (model) =>
  [
    normalizeInfraText(model?.title),
    normalizeInfraText(model?.description),
    safeArray(model?.features).map((item) => normalizeInfraText(item)).sort().join('|'),
    safeArray(model?.advantagesPakistan).map((item) => normalizeInfraText(item)).sort().join('|'),
  ].join('::')

const sanitizeInfraModel = (value) => {
  if (!value || typeof value !== 'object') return null

  const item = {
    id: String(value.id ?? '').trim(),
    title: String(value.title ?? '').trim(),
    description: String(value.description ?? '').trim(),
    features: safeArray(value.features).map((entry) => String(entry ?? '').trim()).filter(Boolean).slice(0, 12),
    advantagesPakistan: safeArray(value.advantagesPakistan).map((entry) => String(entry ?? '').trim()).filter(Boolean).slice(0, 12),
    imageDataUrl: String(value.imageDataUrl ?? '').trim(),
    generatedAt: String(value.generatedAt ?? new Date().toISOString()).trim(),
  }

  if (!item.id || !item.title || !item.description || !item.imageDataUrl) return null
  if (item.features.length === 0 || item.advantagesPakistan.length === 0) return null

  return item
}

const ensureSharedInfraModelsStorage = async () => {
  await fs.mkdir(sharedInfraModelsDir, { recursive: true })
}

const readSharedInfraModels = async () => {
  try {
    const raw = await fs.readFile(sharedInfraModelsDataFile, 'utf8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const deduped = new Map()
    for (const entry of parsed) {
      const model = sanitizeInfraModel(entry)
      if (!model) continue
      const signature = getInfraModelSignature(model)
      if (!signature || deduped.has(signature)) continue
      deduped.set(signature, model)
    }

    return Array.from(deduped.values()).slice(-SHARED_INFRA_MODELS_MAX)
  } catch {
    return []
  }
}

const writeSharedInfraModels = async (rows) => {
  await ensureSharedInfraModelsStorage()
  await fs.writeFile(sharedInfraModelsDataFile, JSON.stringify(rows.slice(-SHARED_INFRA_MODELS_MAX), null, 2), 'utf8')
}

const appendSharedInfraModels = async (incomingRows) => {
  const existing = await readSharedInfraModels()
  const deduped = new Map()

  for (const item of existing) {
    deduped.set(getInfraModelSignature(item), item)
  }

  let added = 0
  for (const rawItem of incomingRows) {
    const item = sanitizeInfraModel(rawItem)
    if (!item) continue
    const signature = getInfraModelSignature(item)
    if (!signature || deduped.has(signature)) continue
    deduped.set(signature, {
      ...item,
      generatedAt: new Date().toISOString(),
    })
    added += 1
  }

  const merged = Array.from(deduped.values()).slice(-SHARED_INFRA_MODELS_MAX)
  await writeSharedInfraModels(merged)
  return {
    added,
    total: merged.length,
    models: merged,
  }
}

const runGitCommand = async (args) =>
  execFileAsync('git', args, {
    cwd: repoRootDir,
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 5,
  })

const syncSharedInfraModelsToGitHub = async () => {
  await ensureSharedInfraModelsStorage()

  const statusResult = await runGitCommand(['status', '--porcelain', '--', sharedInfraModelsGitRelativePath])
  const statusText = String(statusResult.stdout ?? '').trim()

  if (!statusText) {
    return {
      committed: false,
      pushed: false,
      message: 'No shared infra model changes to sync.',
    }
  }

  await runGitCommand(['add', '--', sharedInfraModelsGitRelativePath])
  const branch = INFRA_MODELS_GIT_SYNC_BRANCH || String((await runGitCommand(['rev-parse', '--abbrev-ref', 'HEAD'])).stdout ?? '').trim() || 'main'
  const commitMessage = `chore: sync shared infra models ${new Date().toISOString()}`
  await runGitCommand(['commit', '-m', commitMessage])
  await runGitCommand(['push', 'origin', branch])

  return {
    committed: true,
    pushed: true,
    branch,
    message: `Shared infra models synced to GitHub on branch ${branch}.`,
  }
}

const sendViaResend = async ({ toEmail, toName, subject, text, html }) => {
  if (!RESEND_API_KEY) {
    return { ok: false, reason: 'resend-key-missing' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RECOVERY_FROM_EMAIL,
      to: [toEmail],
      subject,
      text,
      html,
      reply_to: RECOVERY_FROM_EMAIL,
      tags: [
        { name: 'portal', value: 'recovery' },
        { name: 'recipient', value: toName || 'user' },
      ],
    }),
  })

  if (response.ok) {
    return { ok: true }
  }

  const responseText = await response.text()
  return { ok: false, reason: `resend-api-failed:${response.status}:${clip(responseText, 220)}` }
}

const sendViaBrevo = async ({ toEmail, toName, subject, text, html }) => {
  if (!BREVO_API_KEY) {
    return { ok: false, reason: 'brevo-key-missing' }
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: RECOVERY_FROM_NAME,
        email: RECOVERY_FROM_EMAIL,
      },
      to: [
        {
          email: toEmail,
          name: toName || 'User',
        },
      ],
      subject,
      htmlContent: html,
      textContent: text,
      replyTo: {
        email: RECOVERY_FROM_EMAIL,
        name: RECOVERY_FROM_NAME,
      },
    }),
  })

  if (response.ok) {
    return { ok: true }
  }

  const responseText = await response.text()
  return { ok: false, reason: `brevo-api-failed:${response.status}:${clip(responseText, 220)}` }
}

const sendRecoveryCredentialEmail = async (payload) => {
  if (!RECOVERY_FROM_EMAIL) {
    return { ok: false, reason: 'missing-from-email' }
  }

  const providers = RECOVERY_EMAIL_PROVIDER
    ? [RECOVERY_EMAIL_PROVIDER]
    : ['resend', 'brevo']

  let lastFailure = { ok: false, reason: 'no-provider-configured' }

  for (const provider of providers) {
    try {
      if (provider === 'resend') {
        const result = await sendViaResend(payload)
        if (result.ok) return result
        lastFailure = result
        continue
      }

      if (provider === 'brevo') {
        const result = await sendViaBrevo(payload)
        if (result.ok) return result
        lastFailure = result
      }
    } catch (error) {
      lastFailure = { ok: false, reason: `provider-error:${provider}:${clip(error?.message || error, 220)}` }
    }
  }

  return lastFailure
}

const ensureAppStateStorage = async () => {
  await fs.mkdir(appStateDir, { recursive: true })
}

const sanitizeEmergencyKitChecks = (value) => {
  if (!value || typeof value !== 'object') return {}

  const result = {}
  for (const [key, rawFlag] of Object.entries(value)) {
    const normalizedKey = String(key ?? '').trim()
    if (!normalizedKey) continue
    result[normalizedKey] = Boolean(rawFlag)
  }

  return result
}

const sanitizeSharedAppState = (value) => {
  if (!value || typeof value !== 'object') {
    return {
      offlineMode: false,
      lightweightMode: false,
      emergencyKitChecks: {},
      updatedAt: new Date().toISOString(),
    }
  }

  return {
    offlineMode: Boolean(value.offlineMode),
    lightweightMode: Boolean(value.lightweightMode),
    emergencyKitChecks: sanitizeEmergencyKitChecks(value.emergencyKitChecks),
    updatedAt: String(value.updatedAt ?? new Date().toISOString()),
  }
}

const readSharedAppState = async () => {
  try {
    const raw = await fs.readFile(appStateFile, 'utf8')
    return sanitizeSharedAppState(JSON.parse(raw))
  } catch {
    return sanitizeSharedAppState(null)
  }
}

const writeSharedAppState = async (state) => {
  await ensureAppStateStorage()
  const normalized = sanitizeSharedAppState({
    ...state,
    updatedAt: new Date().toISOString(),
  })
  await fs.writeFile(appStateFile, JSON.stringify(normalized, null, 2), 'utf8')
  return normalized
}

// ======================================
// HYBRID EARTHQUAKE SYSTEM (USGS + EMSC)
// ======================================

const normalizeLiveEarthquakeFeature = (feature, index = 0) => {
  const id = String(feature?.id ?? `quake-${index}`).trim()
  const properties = feature?.properties ?? {}
  const geometry = feature?.geometry ?? {}
  const coordinates = safeArray(geometry.coordinates)
  const lng = Number(coordinates[0])
  const lat = Number(coordinates[1])
  const depthKm = Number(coordinates[2] ?? 0)
  const mag = Number(properties.mag ?? 0)
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
      source: 'USGS',
      status: String(properties.status ?? 'reviewed'),
      title: String(properties.title ?? '').trim(),
      url: String(properties.url ?? 'https://earthquake.usgs.gov/').trim(),
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

const readLiveEarthquakeDiskCache = async () => {
  try {
    const raw = await fs.readFile(liveEarthquakeCacheFile, 'utf8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.features)) return null
    return parsed
  } catch {
    return null
  }
}

const writeLiveEarthquakeDiskCache = async (payload) => {
  await fs.mkdir(liveEarthquakeCacheDir, { recursive: true })
  await fs.writeFile(liveEarthquakeCacheFile, JSON.stringify(payload, null, 2), 'utf8')
}

const fetchLiveEarthquakesFromUSGS = async () => {
  const payload = await fetchRemoteJson(
    'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
    20_000,
  )
  const features = safeArray(payload?.features)
    .map((feature, index) => normalizeLiveEarthquakeFeature(feature, index))
    .filter(Boolean)
    .sort((a, b) => Number(b?.properties?.time ?? 0) - Number(a?.properties?.time ?? 0))

  return {
    type: 'FeatureCollection',
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'USGS Live Feed',
      feed: 'all_hour',
      count: features.length,
    },
    features,
  }
}

/**
 * Fetch earthquakes from USGS feed with Pakistan focus
 */
const fetchUSGSEarthquakes = async () => {
  // Try Pakistan-specific query first
  try {
    const starttime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const pakistanUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${starttime}&minlatitude=${PAKISTAN_EARTHQUAKE_BOUNDS.minlatitude}&maxlatitude=${PAKISTAN_EARTHQUAKE_BOUNDS.maxlatitude}&minlongitude=${PAKISTAN_EARTHQUAKE_BOUNDS.minlongitude}&maxlongitude=${PAKISTAN_EARTHQUAKE_BOUNDS.maxlongitude}&orderby=time`
    
    const payload = await fetchRemoteJson(pakistanUrl, 20000)
    const features = safeArray(payload?.features)
    if (features.length > 0) {
      console.log(`Fetched ${features.length} Pakistan-specific earthquakes from USGS`)
      return features.map(normalizeUSGSEvent).filter(Boolean)
    }
  } catch (error) {
    console.error('USGS Pakistan query error:', error?.message || error)
  }
  
  // Fallback to global feeds
  const feeds = [GLOBAL_EARTHQUAKE_FEED_URL, GLOBAL_EARTHQUAKE_FEED_URL_BACKUP]
  
  for (const feed of feeds) {
    try {
      const payload = await fetchRemoteJson(feed, 20000)
      const features = safeArray(payload?.features)
      if (features.length > 0) {
        return features.map(normalizeUSGSEvent).filter(Boolean)
      }
    } catch (error) {
      console.error('USGS fetch error:', error?.message || error)
    }
  }
  
  return []
}

/**
 * Fetch earthquakes from EMSC feed with Pakistan bounds
 */
const fetchEMSCEarthquakes = async () => {
  try {
    const starttime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const url = `${EMSC_EARTHQUAKE_FEED_URL}&starttime=${starttime}&minlatitude=${PAKISTAN_EARTHQUAKE_BOUNDS.minlatitude}&maxlatitude=${PAKISTAN_EARTHQUAKE_BOUNDS.maxlatitude}&minlongitude=${PAKISTAN_EARTHQUAKE_BOUNDS.minlongitude}&maxlongitude=${PAKISTAN_EARTHQUAKE_BOUNDS.maxlongitude}&orderby=time-desc`
    
    const payload = await fetchRemoteJson(url, 20000)
    const features = safeArray(payload?.features)
    
    if (features.length > 0) {
      console.log(`Fetched ${features.length} Pakistan-region earthquakes from EMSC`)
      return features.map(normalizeEMSCEvent).filter(Boolean)
    }
  } catch (error) {
    console.error('EMSC fetch error:', error?.message || error)
  }
  
  return []
}

/**
 * Normalize USGS event to common format
 */
const normalizeUSGSEvent = (feature) => {
  try {
    const properties = feature?.properties ?? {}
    const geometry = feature?.geometry ?? {}
    const coordinates = safeArray(geometry.coordinates)
    
    return {
      source: 'USGS',
      id: String(feature?.id ?? '').trim(),
      magnitude: Number(properties.mag ?? 0),
      time: new Date(Number(properties.time ?? Date.now())),
      latitude: Number(coordinates[1]),
      longitude: Number(coordinates[0]),
      depth: Number(coordinates[2]),
      place: String(properties.place ?? 'Unknown location').trim(),
      url: String(properties.url ?? 'https://earthquake.usgs.gov/').trim(),
      originalFeature: feature,
    }
  } catch {
    return null
  }
}

/**
 * Normalize EMSC event to common format
 */
const normalizeEMSCEvent = (feature) => {
  try {
    const properties = feature?.properties ?? {}
    const geometry = feature?.geometry ?? {}
    const coordinates = safeArray(geometry.coordinates)
    
    return {
      source: 'EMSC',
      id: String(feature?.id ?? '').trim(),
      magnitude: Number(properties.mag ?? 0),
      time: new Date(properties.time ?? Date.now()),
      latitude: Number(coordinates[1]),
      longitude: Number(coordinates[0]),
      depth: Number(coordinates[2]),
      place: String(properties.flynn_region ?? properties.place ?? 'Unknown location').trim(),
      url: `https://www.emsc-csem.org/Earthquake/earthquake.php?id=${feature?.id ?? ''}`,
      originalFeature: feature,
    }
  } catch {
    return null
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Check if two earthquakes are duplicates
 */
const areEarthquakesDuplicate = (eq1, eq2) => {
  // Check time difference (within 60 seconds)
  const timeDiff = Math.abs(eq1.time.getTime() - eq2.time.getTime())
  if (timeDiff > 60000) return false
  
  // Check coordinate proximity (within 25 km)
  const distance = calculateDistance(eq1.latitude, eq1.longitude, eq2.latitude, eq2.longitude)
  if (distance > 25) return false
  
  // Check magnitude similarity (within 0.3)
  const magDiff = Math.abs(eq1.magnitude - eq2.magnitude)
  if (magDiff > 0.3) return false
  
  return true
}

/**
 * Merge and deduplicate earthquakes from multiple sources
 * Priority: Keep earliest reported source
 */
const mergeAndDeduplicateEarthquakes = (usgsEvents, emscEvents) => {
  const combined = [...usgsEvents, ...emscEvents]
  const uniqueEvents = []
  
  for (const event of combined) {
    // Skip invalid events
    if (!event.id || Number.isNaN(event.magnitude)) continue
    
    // Find if this is a duplicate
    const duplicate = uniqueEvents.find((existing) => areEarthquakesDuplicate(existing, event))
    
    if (!duplicate) {
      // New unique event
      uniqueEvents.push(event)
    } else {
      // Keep the earliest reported (older time)
      if (event.time < duplicate.time) {
        Object.assign(duplicate, event)
      }
    }
  }
  
  // Sort by time (newest first)
  return uniqueEvents.sort((a, b) => b.time.getTime() - a.time.getTime())
}

/**
 * Check if earthquake is within Pakistan region
 */
const isInPakistanRegion = (event) => {
  return (
    event.latitude >= PAKISTAN_EARTHQUAKE_BOUNDS.minlatitude &&
    event.latitude <= PAKISTAN_EARTHQUAKE_BOUNDS.maxlatitude &&
    event.longitude >= PAKISTAN_EARTHQUAKE_BOUNDS.minlongitude &&
    event.longitude <= PAKISTAN_EARTHQUAKE_BOUNDS.maxlongitude
  )
}

/**
 * Fetch merged earthquakes from both USGS and EMSC
 * Prioritizes Pakistan-region earthquakes
 */
const fetchHybridEarthquakes = async () => {
  const [usgsEvents, emscEvents] = await Promise.all([
    fetchUSGSEarthquakes(),
    fetchEMSCEarthquakes(),
  ])
  
  const merged = mergeAndDeduplicateEarthquakes(usgsEvents, emscEvents)
  
  // Separate Pakistan and global earthquakes
  const pakistanEarthquakes = merged.filter(isInPakistanRegion)
  const globalEarthquakes = merged.filter(e => !isInPakistanRegion(e))
  
  // Prioritize Pakistan earthquakes: return all Pakistan quakes + recent global ones
  const prioritized = [...pakistanEarthquakes, ...globalEarthquakes.slice(0, 50)]
  
  console.log(`Earthquake fetch: USGS=${usgsEvents.length}, EMSC=${emscEvents.length}, Merged=${merged.length}, Pakistan=${pakistanEarthquakes.length}`)
  
  return prioritized
}

const fetchLiveEarthquakeFeaturesForAlerts = async () => {
  // Use hybrid earthquake system (USGS + EMSC merged)
  const mergedEvents = await fetchHybridEarthquakes()
  
  // Convert back to feature format for compatibility with existing code
  return mergedEvents.map((event) => event.originalFeature)
}

const extractQuakeAlertEvent = (feature) => {
  // Handle both original feature format and normalized format
  if (feature.source && feature.id && feature.magnitude !== undefined) {
    // Already normalized format
    return {
      id: feature.id,
      mag: feature.magnitude,
      place: feature.place,
      time: feature.time instanceof Date ? feature.time.getTime() : Date.now(),
      detailUrl: feature.url,
      latitude: Number.isFinite(feature.latitude) ? feature.latitude : null,
      longitude: Number.isFinite(feature.longitude) ? feature.longitude : null,
      depthKm: Number.isFinite(feature.depth) ? feature.depth : null,
      source: feature.source,
    }
  }
  
  // Original USGS feature format
  const id = String(feature?.id ?? '').trim()
  const mag = Number(feature?.properties?.mag ?? 0)
  const place = String(feature?.properties?.place ?? 'Unknown location').trim()
  const timeValue = Number(feature?.properties?.time ?? Date.now())
  const detailUrl = String(feature?.properties?.url ?? 'https://earthquake.usgs.gov/').trim()
  const coordinates = safeArray(feature?.geometry?.coordinates)
  const longitude = Number(coordinates[0])
  const latitude = Number(coordinates[1])
  const depthKm = Number(coordinates[2])

  if (!id || Number.isNaN(mag)) return null

  return {
    id,
    mag,
    place,
    time: Number.isNaN(timeValue) ? Date.now() : timeValue,
    detailUrl,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    depthKm: Number.isFinite(depthKm) ? depthKm : null,
    source: 'USGS',
  }
}

// Email-based earthquake notifier removed; browser notifications now run entirely in frontend.

const parsePmdCityTemperatures = (html) => {
  const majorCities = ['ISLAMABAD', 'LAHORE', 'KARACHI', 'PESHAWAR', 'GILGIT', 'MUZAFFARABAD']
  const text = normalizeWhitespace(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' '),
  )

  return majorCities
    .map((city) => {
      const matcher = new RegExp(`${city}\\s*([0-9]{1,2})\\s*?\\s*C`, 'i')
      const match = text.match(matcher)
      if (!match) return null

      return {
        city,
        temperatureC: Number(match[1]),
      }
    })
    .filter(Boolean)
}

const parsePmdSatelliteImage = (html) => {
  const imageRegexes = [
    /<img[^>]*src=["']([^"']*FY2G[^"']+\.(?:jpg|jpeg|png))[^>]*>/i,
    /<img[^>]*src=["']([^"']*satellite[^"']+\.(?:jpg|jpeg|png))[^>]*>/i,
    /<img[^>]*src=["']([^"']+\.(?:jpg|jpeg|png))[^>]*>/i,
  ]

  for (const regex of imageRegexes) {
    const match = html.match(regex)
    if (!match?.[1]) continue
    const imageUrl = match[1].startsWith('http') ? match[1] : new URL(match[1], PMD_SATELLITE_URL).toString()
    return imageUrl
  }

  return null
}

const decodeXmlEntities = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

const parseTag = (xmlChunk, tag) => {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = xmlChunk.match(regex)
  return match?.[1] ? decodeXmlEntities(normalizeWhitespace(match[1])) : ''
}

const parsePmdRssItems = (xmlString) => {
  const items = [...xmlString.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 8)
  return items.map((match, index) => {
    const chunk = match[1]
    const title = parseTag(chunk, 'title') || `PMD Update ${index + 1}`
    const link = parseTag(chunk, 'link') || PMD_RSS_URL
    const publishedAt = parseTag(chunk, 'pubDate')
    return {
      id: `pmd-rss-${index}-${link}`,
      title,
      link,
      publishedAt,
    }
  })
}

const parseLiveClimateLocation = (input) => {
  const name = String(input?.name ?? '').trim()
  const admin1 = String(input?.admin1 ?? '').trim()
  const country = String(input?.country ?? '').trim()
  const latitude = Number(input?.latitude)
  const longitude = Number(input?.longitude)

  if (!name || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null
  }

  return {
    name,
    admin1,
    country,
    latitude,
    longitude,
  }
}

const classifyHeatwaveRisk = (temperatureC) => {
  if (temperatureC >= 42) return 'Extreme'
  if (temperatureC >= 37) return 'High'
  if (temperatureC >= 32) return 'Moderate'
  return 'Low'
}

const classifyAirQuality = (aqi) => {
  if (aqi >= 201) return 'Very Unhealthy'
  if (aqi >= 151) return 'Unhealthy'
  if (aqi >= 101) return 'Unhealthy for Sensitive Groups'
  if (aqi >= 51) return 'Moderate'
  return 'Good'
}

const buildClimatePrecautions = ({ temperatureC, precipitationProbability, usAqi, windSpeedKmh }) => {
  const precautions = ['Keep drinking water, torch, and emergency contacts ready.']

  if (temperatureC >= 37) {
    precautions.push('Avoid direct outdoor exposure during afternoon heat peak (12pm-4pm).')
  }

  if (precipitationProbability >= 50) {
    precautions.push('Move valuables above expected flood level and avoid low-lying roads during rain.')
  }

  if (usAqi >= 101) {
    precautions.push('Limit outdoor activity and use protective masks for sensitive groups when possible.')
  }

  if (windSpeedKmh >= 35) {
    precautions.push('Secure light rooftop objects, signboards, and temporary structures against strong wind gusts.')
  }

  precautions.push('Store nearest shelter route and district helpline numbers offline.')
  return precautions
}

const computeClimateRiskScore = ({ temperatureC, precipitationProbability, usAqi, windSpeedKmh }) => {
  const heatScore = Math.max(0, Math.min(100, Math.round(((temperatureC - 20) / 25) * 100)))
  const rainScore = Math.max(0, Math.min(100, Math.round(precipitationProbability)))
  const airScore = Math.max(0, Math.min(100, Math.round((usAqi / 200) * 100)))
  const windScore = Math.max(0, Math.min(100, Math.round((windSpeedKmh / 60) * 100)))
  return Math.round(heatScore * 0.35 + rainScore * 0.3 + airScore * 0.25 + windScore * 0.1)
}

const resolveLiveClimateLocation = async ({ city, latitude, longitude }) => {
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    const reverseUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`
    const reverseBody = await fetchRemoteJson(reverseUrl, 22000)
    const location = parseLiveClimateLocation(safeArray(reverseBody?.results)[0])
    if (location) return location

    return {
      name: 'Current Location',
      admin1: '',
      country: 'Pakistan',
      latitude,
      longitude,
    }
  }

  const query = String(city ?? '').trim()
  if (!query) {
    throw new Error('city or latitude/longitude is required.')
  }

  const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
  const geocodeBody = await fetchRemoteJson(geocodeUrl, 22000)
  const resolved = parseLiveClimateLocation(safeArray(geocodeBody?.results)[0])

  if (!resolved) {
    throw new Error(`No live climate location match found for "${query}".`)
  }

  return resolved
}

const fetchLiveClimateSnapshot = async ({ city, latitude, longitude }) => {
  const location = await resolveLiveClimateLocation({ city, latitude, longitude })

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}` +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,weather_code' +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto&forecast_days=1'

  const airUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.latitude}&longitude=${location.longitude}` +
    '&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,us_aqi&timezone=auto'

  const [forecastBody, airBody] = await Promise.all([
    fetchRemoteJson(forecastUrl, 22000),
    fetchRemoteJson(airUrl, 22000),
  ])

  const currentForecast = forecastBody?.current ?? {}
  const currentAir = airBody?.current ?? {}
  const temperatureC = Number(currentForecast.temperature_2m ?? 0)
  const apparentTemperatureC = Number(currentForecast.apparent_temperature ?? temperatureC)
  const windSpeedKmh = Number(currentForecast.wind_speed_10m ?? 0)
  const precipitationMm = Number(currentForecast.precipitation ?? 0)
  const humidityPercent = Number(currentForecast.relative_humidity_2m ?? 0)
  const uvIndexMax = Number(safeArray(forecastBody?.daily?.uv_index_max)[0] ?? 0)
  const precipitationProbability = Number(safeArray(forecastBody?.daily?.precipitation_probability_max)[0] ?? 0)
  const pm25 = Number(currentAir.pm2_5 ?? 0)
  const pm10 = Number(currentAir.pm10 ?? 0)
  const usAqi = Number(currentAir.us_aqi ?? 0)

  const riskScore = computeClimateRiskScore({
    temperatureC,
    precipitationProbability,
    usAqi,
    windSpeedKmh,
  })

  return {
    source: 'Open-Meteo',
    updatedAt: new Date().toISOString(),
    location,
    metrics: {
      temperatureC,
      apparentTemperatureC,
      humidityPercent,
      windSpeedKmh,
      precipitationMm,
      precipitationProbability,
      uvIndexMax,
      pm25,
      pm10,
      usAqi,
    },
    riskScore,
    heatwaveRiskZone: classifyHeatwaveRisk(apparentTemperatureC),
    airQualityLevel: classifyAirQuality(usAqi),
    precautions: buildClimatePrecautions({
      temperatureC: apparentTemperatureC,
      precipitationProbability,
      usAqi,
      windSpeedKmh,
    }),
  }
}
const mapGuidanceSteps = (value) =>
  safeArray(value)
    .map((step) => ({
      title: String(step?.title ?? ''),
      description: String(step?.description ?? ''),
      keyChecks: safeArray(step?.keyChecks).map((item) => String(item)),
    }))
    .filter((step) => step.title && step.description)
    .slice(0, 5)

const buildFallbackEnglishConstructionGuidance = ({
  province,
  city,
  hazard,
  structureType,
  bestPracticeName,
}) => {
  const summary = `Default regional guidance for ${structureType} in ${city}, ${province}, Pakistan, with focus on ${hazard} resilience. Apply ${bestPracticeName} under qualified supervision and local building control.`
  const materials = [
    'Cement, fine aggregate, and coarse aggregate from approved sources; batching to specified mix designs.',
    'Reinforcement and structural steel with traceable mill certificates where applicable.',
    'Masonry units or precast elements meeting dimensional tolerances and local standards.',
  ]
  const safety = [
    'Confirm geotechnical and floodplain constraints before foundations and retaining work.',
    'Maintain edge protection, secure ladders/scaffolding, and clear site drainage during construction.',
    'Stage inspections at reinforcement, pours, and connections before covering works.',
  ]
  const stepBlueprints = [
    {
      title: 'Site characterization and hazard alignment',
      description: `Map ${hazard} exposure for ${city} (${province}): review flood history or seismic zone, utilities, access, and temporary works; align the execution plan with ${bestPracticeName}.`,
    },
    {
      title: 'Foundations and substructure',
      description: `Execute foundations suitable for ${structureType} and local soil moisture; detail damp-proofing, drains, and backfill compaction where flood risk exists.`,
    },
    {
      title: 'Primary structure and lateral system',
      description: `Erect the structural system with correct grades and spacing; verify connections, embedments, and continuity ties required for ${hazard} performance.`,
    },
    {
      title: 'Building envelope and MEP rough-in',
      description: `Close the envelope against driving rain and heat; coordinate sleeves and penetrations so the structure retains its intended load path and weather resistance.`,
    },
    {
      title: 'Finishes, commissioning, and handover',
      description: `Complete finishes without compromising structural elements; document tests, as-built drawings, and maintenance notes for the owner.`,
    },
  ]
  const keyChecks = ['Drawings and specs reviewed', 'Materials certified', 'Critical stage inspection recorded']
  const steps = stepBlueprints.map((row) => ({
    title: row.title,
    description: row.description,
    keyChecks,
  }))
  return { summary, materials, safety, steps }
}

const translateGuidanceToUrdu = async (guidance) => {
  try {
    const translationCompletion = await createChatCompletion({
      openaiModel: OPENAI_MODEL,
      huggingFaceModel: HUGGINGFACE_CHAT_MODEL,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional Urdu technical translator for civil engineering guidance in Pakistan. Translate faithfully and preserve exact meaning, order, and step structure. Return ONLY valid JSON. No text, markdown, or commentary outside the JSON object.',
        },
        {
          role: 'user',
          content:
            `Translate this English construction guidance to Urdu script (not roman Urdu) while keeping the same structure and counts. Return ONLY valid JSON matching this schema (no prose outside JSON):\n{\n  "summaryUrdu": string,\n  "materialsUrdu": string[],\n  "safetyUrdu": string[],\n  "stepsUrdu": [\n    {\n      "title": string,\n      "description": string,\n      "keyChecks": string[]\n    }\n  ]\n}. Guidance JSON:\n${JSON.stringify(guidance)}`,
        },
      ],
    })

    const translationText = translationCompletion.choices[0]?.message?.content ?? ''
    const parsedTranslation = tryExtractJson(translationText) ?? {}

    return {
      summaryUrdu: String(parsedTranslation.summaryUrdu ?? ''),
      materialsUrdu: safeArray(parsedTranslation.materialsUrdu).map((item) => String(item)),
      safetyUrdu: safeArray(parsedTranslation.safetyUrdu).map((item) => String(item)),
      stepsUrdu: mapGuidanceSteps(parsedTranslation.stepsUrdu),
    }
  } catch (e) {
    console.error('translateGuidanceToUrdu failed, using English fields as fallback.', e)
    return {
      summaryUrdu: '',
      materialsUrdu: [],
      safetyUrdu: [],
      stepsUrdu: [],
    }
  }
}

app.get('/api/app/state', async (_req, res) => {
  try {
    const state = await readSharedAppState()
    res.json({
      ok: true,
      state,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load shared app state.'
    res.status(500).json({ ok: false, error: message })
  }
})

app.put('/api/app/state', async (req, res) => {
  try {
    const payload = sanitizeSharedAppState(req.body)
    const state = await writeSharedAppState(payload)
    res.json({
      ok: true,
      state,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save shared app state.'
    res.status(500).json({ ok: false, error: message })
  }
})

app.get('/api/earthquake/live', async (_req, res) => {
  try {
    const now = Date.now()
    if (
      liveEarthquakeCacheMemory.payload &&
      now - Number(liveEarthquakeCacheMemory.loadedAt || 0) < LIVE_EARTHQUAKE_CACHE_TTL_MS
    ) {
      res.json({
        ...liveEarthquakeCacheMemory.payload,
        sourceLabel: 'USGS Live Feed',
        fromCache: true,
      })
      return
    }

    const livePayload = await fetchLiveEarthquakesFromUSGS()
    liveEarthquakeCacheMemory = {
      loadedAt: now,
      payload: livePayload,
    }
    await writeLiveEarthquakeDiskCache(livePayload)
    res.json({
      ...livePayload,
      sourceLabel: 'USGS Live Feed',
      fromCache: false,
    })
  } catch (error) {
    const fallback = await readLiveEarthquakeDiskCache()
    if (fallback) {
      liveEarthquakeCacheMemory = {
        loadedAt: Date.now(),
        payload: fallback,
      }
      res.json({
        ...fallback,
        sourceLabel: 'Live feed temporarily unavailable. Displaying cached earthquakes.',
        fromCache: true,
        warning: 'USGS unreachable; served cached payload.',
      })
      return
    }

    const message = error instanceof Error ? error.message : 'Failed to fetch live earthquakes.'
    res.status(503).json({
      ok: false,
      error: message,
      sourceLabel: 'Source: unavailable',
      features: [],
    })
  }
})

// ========== PUSH NOTIFICATION ENDPOINTS ==========

app.post('/api/notifications/register-device', async (req, res) => {
  try {
    const deviceToken = String(req.body?.deviceToken || '').trim()
    const platform = String(req.body?.platform || 'web').trim()

    if (!deviceToken) {
      res.status(400).json({ ok: false, error: 'Device token is required.' })
      return
    }

    const result = await registerDevice(deviceToken, platform)
    res.status(result.ok ? 201 : 400).json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to register device.'
    res.status(500).json({ ok: false, error: message })
  }
})

app.post('/api/notifications/unregister-device', async (req, res) => {
  try {
    const deviceToken = String(req.body?.deviceToken || '').trim()

    if (!deviceToken) {
      res.status(400).json({ ok: false, error: 'Device token is required.' })
      return
    }

    const result = await unregisterDevice(deviceToken)
    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to unregister device.'
    res.status(500).json({ ok: false, error: message })
  }
})

app.post('/api/notifications/subscribe-earthquakes', async (req, res) => {
  try {
    const deviceToken = String(req.body?.deviceToken || '').trim()
    const minMagnitude = Number(req.body?.minMagnitude || 5.0)

    if (!deviceToken) {
      res.status(400).json({ ok: false, error: 'Device token is required.' })
      return
    }

    const result = await updateSubscriptionPreferences(deviceToken, {
      earthquakes: true,
      minMagnitude: Math.max(4, minMagnitude),
    })

    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to subscribe to earthquakes.'
    res.status(500).json({ ok: false, error: message })
  }
})

app.post('/api/notifications/unsubscribe-earthquakes', async (req, res) => {
  try {
    const deviceToken = String(req.body?.deviceToken || '').trim()

    if (!deviceToken) {
      res.status(400).json({ ok: false, error: 'Device token is required.' })
      return
    }

    const result = await updateSubscriptionPreferences(deviceToken, {
      earthquakes: false,
    })

    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to unsubscribe from earthquakes.'
    res.status(500).json({ ok: false, error: message })
  }
})

app.get('/api/notifications/registered-devices', async (_req, res) => {
  try {
    const devices = await readRegisteredDevices()
    res.json({
      ok: true,
      total: devices.length,
      devices: devices.map((d) => ({
        token: d.token.substring(0, 20) + '...',
        platform: d.platform,
        registeredAt: d.registeredAt,
        subscriptions: d.subscriptions,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read devices.'
    res.status(500).json({ ok: false, error: message })
  }
})

// ========== END PUSH NOTIFICATION ENDPOINTS ==========

app.post('/api/recovery/send-credentials', async (req, res) => {
  const toEmail = normalizeEmail(req.body?.toEmail)
  const fullName = clip(req.body?.fullName, 120)
  const portal = clip(req.body?.portal, 80)
  const role = clip(req.body?.role, 60)
  const username = clip(req.body?.username, 160)
  const credential = clip(req.body?.credential, 160)
  const credentialLabel = clip(req.body?.credentialLabel || 'Credential', 40)

  if (!toEmail || !portal || !username || !credential) {
    res.status(400).json({
      ok: false,
      reason: 'invalid-request',
      message: 'toEmail, portal, username, and credential are required.',
    })
    return
  }

  const rateLimitKey = `${String(req.ip ?? 'unknown-ip')}|${toEmail}`
  const limiter = checkRecoveryRateLimit(rateLimitKey)
  if (!limiter.allowed) {
    res.setHeader('Retry-After', String(limiter.retryAfterSeconds ?? 60))
    res.status(429).json({
      ok: false,
      reason: 'rate-limited',
      message: 'Too many recovery requests. Please retry shortly.',
    })
    return
  }

  try {
    const { subject, text, html } = buildRecoveryEmailContent({
      portal,
      fullName,
      role,
      username,
      credential,
      credentialLabel,
    })

    const sendResult = await sendRecoveryCredentialEmail({
      toEmail,
      toName: fullName,
      subject,
      text,
      html,
    })

    if (!sendResult.ok) {
      const reason = String(sendResult.reason ?? '')
      const isMissingConfig =
        reason.includes('missing') || reason.includes('no-provider-configured') || reason.includes('key-missing')

      res.status(isMissingConfig ? 503 : 502).json({
        ok: false,
        reason: isMissingConfig ? 'backend-missing-config' : 'provider-send-failed',
        details: reason,
      })
      return
    }

    res.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Recovery email send failed.'
    res.status(500).json({ ok: false, reason: 'server-error', details: message })
  }
})

app.get('/api/pmd/rss', async (_req, res) => {
  try {
    const xml = await fetchRemoteText(PMD_RSS_URL)
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.send(xml)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to fetch PMD RSS feed.'
    res.status(502).send(message)
  }
})

app.get('/api/pmd/live', async (req, res) => {
  try {
    const [homeResult, satelliteResult] = await Promise.allSettled([
      fetchRemoteText(PMD_HOME_URL, 32000),
      fetchRemoteText(PMD_SATELLITE_URL, 32000),
    ])

    const homeHtml = homeResult.status === 'fulfilled' ? homeResult.value : ''
    const satelliteHtml = satelliteResult.status === 'fulfilled' ? satelliteResult.value : ''
    const cities = homeHtml ? parsePmdCityTemperatures(homeHtml) : []
    const satelliteImageUrl = satelliteHtml ? parsePmdSatelliteImage(satelliteHtml) : null
    let latestAlerts = []
    const forwardedProto = String(req.headers['x-forwarded-proto'] ?? '').split(',')[0]?.trim()
    const protocol = forwardedProto || req.protocol || 'https'
    const host = req.get('host')
    const internalRssUrl = host ? `${protocol}://${host}/api/pmd/rss` : ''

    try {
      const rssXml = await fetchRemoteText(PMD_RSS_URL, 24000)
      latestAlerts = parsePmdRssItems(rssXml)
    } catch {
      if (internalRssUrl) {
        try {
          const rssXml = await fetchRemoteText(internalRssUrl, 24000)
          latestAlerts = parsePmdRssItems(rssXml)
        } catch {
          latestAlerts = []
        }
      }
    }

    const bothWebSourcesFailed = homeResult.status === 'rejected' && satelliteResult.status === 'rejected'

    res.json({
      source: 'PMD',
      updatedAt: new Date().toISOString(),
      mode: bothWebSourcesFailed ? (latestAlerts.length > 0 ? 'rss-fallback' : 'degraded-empty') : 'full-or-partial-web',
      cities,
      latestAlerts,
      warning:
        bothWebSourcesFailed && latestAlerts.length === 0
          ? 'PMD web and RSS sources are temporarily unreachable. Retry in a minute.'
          : undefined,
      links: {
        home: PMD_HOME_URL,
        radar: PMD_RADAR_URL,
        satellite: PMD_SATELLITE_URL,
      },
      satellite: {
        label: 'Satellite Image (Latest)',
        imageUrl: satelliteImageUrl,
      },
      radar: {
        label: 'Radar Dashboard',
        pageUrl: PMD_RADAR_URL,
        requiresLogin: true,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to fetch PMD live weather updates.'
    res.status(502).json({ error: message })
  }
})

app.get('/api/climate/live', async (req, res) => {
  try {
    const city = String(req.query.city ?? '').trim()
    const latitude = req.query.lat !== undefined ? Number(req.query.lat) : Number.NaN
    const longitude = req.query.lng !== undefined ? Number(req.query.lng) : Number.NaN

    const snapshot = await fetchLiveClimateSnapshot({
      city,
      latitude,
      longitude,
    })

    res.setHeader('Cache-Control', 'no-store')
    res.json(snapshot)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to fetch live climate data for this location.'
    res.status(502).json({ error: message })
  }
})

app.get('/api/location', async (req, res) => {
  try {
    const forwarded = String(req.headers['x-forwarded-for'] ?? '').split(',')[0]?.trim()
    const remote = String(req.socket?.remoteAddress ?? '').trim()
    const clientIp = forwarded || remote
    const useIpLookup =
      clientIp &&
      clientIp !== '127.0.0.1' &&
      clientIp !== '::1' &&
      !clientIp.startsWith('::ffff:127.')
    const lookupUrl = useIpLookup
      ? `https://ipapi.co/${encodeURIComponent(clientIp)}/json/`
      : 'https://ipapi.co/json/'

    const response = await fetch(lookupUrl, {
      headers: { 'User-Agent': 'InfraResilience360/1.0 (+https://www.infraresilience.org)' },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      res.status(502).json({ error: 'Location service unavailable' })
      return
    }

    const data = await response.json()
    res.setHeader('Cache-Control', 'private, max-age=300')
    res.json({
      city: data.city || 'Lahore',
      country: data.country_name || 'Pakistan',
      latitude: Number(data.latitude) || 31.5204,
      longitude: Number(data.longitude) || 74.3587,
    })
  } catch (error) {
    console.error('[location]', error)
    res.status(502).json({ error: 'Location service unavailable' })
  }
})

app.get('/api/global-earthquakes', async (_req, res) => {
  try {
    // Fetch from both USGS and EMSC, merge and deduplicate
    const mergedEvents = await fetchHybridEarthquakes()
    
    if (mergedEvents.length === 0) {
      res.status(502).json({ error: 'No earthquake data available from sources.' })
      return
    }
    
    // Convert normalized events back to GeoJSON features for API compatibility
    const features = mergedEvents.map((event) => event.originalFeature)
    
    // Count sources
    const sources = {
      USGS: mergedEvents.filter(e => e.source === 'USGS').length,
      EMSC: mergedEvents.filter(e => e.source === 'EMSC').length,
    }

    res.setHeader('Cache-Control', 'no-store')
    res.json({
      source: 'HYBRID (USGS + EMSC)',
      sources,
      fetchedAt: new Date().toISOString(),
      total: mergedEvents.length,
      features,
    })
  } catch (error) {
    console.error('Hybrid earthquake fetch error:', error?.message || error)
    res.status(502).json({ error: 'Unable to fetch global earthquake feed from upstream sources.' })
  }
})

app.post('/api/earthquake/building-impact', async (req, res) => {
  try {
    const lat = Number(req.body?.lat)
    const lng = Number(req.body?.lng)
    const place = String(req.body?.place ?? '')
    const radiusKm = Number(req.body?.radiusKm)
    const populationExposed = Number(req.body?.populationExposed)

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radiusKm)) {
      res.status(400).json({
        error: 'lat, lng and radiusKm are required numeric values.',
      })
      return
    }

    const estimate = await estimateAtlasBuildingImpact({
      lat,
      lng,
      place,
      radiusKm,
      populationExposed,
    })

    res.setHeader('Cache-Control', 'no-store')
    res.json(estimate)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to estimate atlas-based building impact.'
    res.status(502).json({ error: message })
  }
})

app.get('/api/ndma/advisories', async (_req, res) => {
  try {
    const html = await fetchRemoteText(NDMA_ADVISORIES_URL)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.send(html)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to fetch NDMA advisories.'
    res.status(502).send(message)
  }
})

app.get('/api/ndma/sitreps', async (_req, res) => {
  try {
    const html = await fetchRemoteText(NDMA_SITREPS_URL)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.send(html)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to fetch NDMA situation reports.'
    res.status(502).send(message)
  }
})

app.get('/api/ndma/projections', async (_req, res) => {
  try {
    const html = await fetchRemoteText(NDMA_PROJECTIONS_URL)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.send(html)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to fetch NDMA projections.'
    res.status(502).send(message)
  }
})

/** Full vision JSON shape so clients never break on AI/CMS/API failures (HTTP 200). */
function buildVisionAnalyzeFallbackResponse({
  requestId,
  modelName,
  imageQuality,
  extractedDefects,
  extractedFeatures,
  baseSummary,
  reason,
  province,
}) {
  const prov = String(province ?? 'Punjab').trim() || 'Punjab'
  const defects =
    Array.isArray(extractedDefects) && extractedDefects.length > 0 ?
      extractedDefects
    : [
        {
          type: 'other',
          severity: 'medium',
          confidence: 0.5,
          location: 'unspecified',
          evidence: String(reason || 'Vision AI unavailable').slice(0, 400),
          retrofitAction: 'Engage a structural engineer for inspection before repair.',
        },
      ]
  const features = Array.isArray(extractedFeatures) ? extractedFeatures : []
  const summary =
    String(baseSummary || '').trim().slice(0, 900) ||
    `Structural image analysis is temporarily unavailable (${String(reason || 'error').slice(0, 160)}). Values shown are placeholders ? retry when the AI service is healthy.`

  const structuredGuidance = {
    damageClassification: {
      primary: 'Unclassified distress',
      detected: ['surface defects', 'cracking'],
      featureEvidence: ['Fallback mode ? confirm distress in the field'],
    },
    severity: {
      level: 'Moderate',
      rationale: String(reason || 'Automated assessment unavailable').slice(0, 280),
    },
    probableCauses: ['Environmental exposure', 'Thermal movement', 'Material aging'],
    risk: {
      lifeSafety: 'Not fully evaluated ? treat as potentially significant until inspected.',
      serviceability: 'May worsen without remedial action',
      progressionRisk: 'Unknown pending site investigation',
    },
    retrofitMethods: [
      {
        step: 1,
        technique: 'Epoxy injection',
        targetCondition: 'Stabilized crack network',
        procedure:
          'Rout and clean cracks, install injection ports, inject low-viscosity epoxy per manufacturer under pressure monitoring.',
        materials: [
          { name: 'Structural epoxy resin', spec: 'Low-viscosity injection grade', unit: 'kg', estimatedQty: 6 },
          { name: 'Injection ports + sealant', spec: 'Standard kit', unit: 'set', estimatedQty: 1 },
        ],
        tools: ['Injection pump', 'Crack scope', 'PPE kit'],
        qaChecks: ['Visual leak check', 'Re-measure crack widths after cure window'],
      },
      {
        step: 2,
        technique: 'Steel jacket / confinement strengthening',
        targetCondition: 'Improved shear/confinement capacity',
        procedure: 'Fabricate thin steel jacket, anchor with dowels, grout annulus per approved drawings.',
        materials: [
          { name: 'Mild steel plates', spec: '3?5 mm', unit: 'kg', estimatedQty: 55 },
          { name: 'Non-shrink grout', spec: 'High strength', unit: 'bag', estimatedQty: 12 },
        ],
        tools: ['Torque wrench', 'Welding set'],
        qaChecks: ['Weld inspection', 'Grout cube tests where specified'],
      },
    ],
    safetyPrecautions: [
      'Isolate unsafe areas until a licensed engineer signs off.',
      'Use certified personnel for overhead work and fall protection.',
      'Verify live services before cutting or drilling.',
    ],
    localizedCostEstimation: {
      province: prov,
      currency: 'PKR',
      lineItems: [
        { item: 'Desk review + site visit (allowance)', quantity: '1 visit', unitRatePkr: 25000, costPkr: 25000 },
        { item: 'Tentative crack repair allowance', quantity: '1 LS', unitRatePkr: 95000, costPkr: 95000 },
      ],
      totalEstimatedCostPkr: 120000,
      assumptions: ['Indicative only ? obtain firm BOQ after inspection', String(reason || '').slice(0, 200)],
    },
  }

  return {
    model: modelName || 'fallback',
    requestId,
    analyzedAt: new Date().toISOString(),
    imageQuality,
    defectFeatures: features,
    summary,
    defects,
    costSignals: {
      assessedDamageLevel: 'medium',
      recommendedScope: 'standard',
      estimatedAffectedAreaPercent: 32,
      severityScore: 56,
      urgencyLevel: 'priority',
    },
    priorityActions: [
      'Confirm the backend has OPENAI_API_KEY set and restart the server.',
      'Retry Start AI Analysis when `/api/vision/analyze` returns full AI output.',
    ],
    retrofitPlan: {
      immediate: ['Restrict unsafe loads; post warnings where relevant.'],
      shortTerm: ['Engage a structural engineer for inspection and crack mapping.'],
      longTerm: ['Implement retrofit aligned to hazard and code once full AI analysis succeeds.'],
    },
    safetyNote:
      'This response is a server-generated fallback and is not a substitute for site-specific engineering.',
    structuredGuidance,
  }
}

const handleVisionAnalyze = async (req, res) => {
  if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
    res.status(400).json({ error: USER_AI_MESSAGES.invalidImage, code: 'invalid_image' })
    return
  }

  const uploadedMime = String(req.file.mimetype || '').toLowerCase()
  const uploadedName = String(req.file.originalname || '')
  const uploadedExt = path.extname(uploadedName).toLowerCase()
  const allowedMimes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ])
  const allowedExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'])
  if (!uploadedName || (!allowedMimes.has(uploadedMime) && !allowedExts.has(uploadedExt))) {
    res.status(400).json({ error: USER_AI_MESSAGES.invalidImage, code: 'invalid_image' })
    return
  }

  console.info('[vision/analyze] received file:', req.file.originalname, req.file.mimetype, req.file.size, 'bytes')

  const requestId = randomBytes(8).toString('hex')
  console.info('[AI] Request sent', { route: '/api/vision/analyze', requestId })
  const provinceEarly = String(req.body.province ?? 'Punjab')
  if (truthyEnv(process.env.R360_PERSIST_VISION_UPLOADS)) {
    try {
      const uploadsDir = path.join(STORAGE_DIR, 'uploads')
      await fs.mkdir(uploadsDir, { recursive: true })
      const originalName = String(req.file.originalname || 'upload.jpg')
      const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '-')
      const persistedName = `${Date.now()}-${requestId}-${safeName}`.slice(0, 180)
      await fs.writeFile(path.join(uploadsDir, persistedName), req.file.buffer)
    } catch (persistError) {
      console.warn('[vision/analyze] unable to persist upload to storage/uploads:', persistError)
    }
  }

  if (selectedAiProvider === 'openai' && !isOpenAiConfigured()) {
    console.warn('[vision/analyze] OpenAI not configured', { requestId })
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    const payload = toSanitizedVisionErrorPayload(null, USER_AI_MESSAGES.serviceUnavailable)
    res.status(503).json({ ...payload, requestId })
    return
  }

  if (!hasKey) {
    console.warn('[vision/analyze] AI credentials not configured', { requestId, feature: 'vision analyze' })
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    const payload = toSanitizedVisionErrorPayload(null, USER_AI_MESSAGES.serviceUnavailable)
    res.status(503).json({ ...payload, requestId })
    return
  }

  let extractedDefects = []
  let extractedFeatures = []
  let imageQuality = { visibility: 'good', notes: 'Image quality assessment pending.' }
  let baseSummary = ''

  try {
    const analysisNonce = randomBytes(10).toString('hex')
    const structureType = String(req.body.structureType ?? 'Unknown')
    const province = String(req.body.province ?? 'Unknown')
    const location = String(req.body.location ?? `${province}, Pakistan`)
    const riskProfile = String(req.body.riskProfile ?? 'Unknown')

    const imageBase64 = req.file.buffer.toString('base64')
    const imageDataUrl = `data:${req.file.mimetype};base64,${imageBase64}`
    const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min))
    const asArray = (value) => (Array.isArray(value) ? value : [])

    const visionMessages = [
      {
        role: 'system',
        content:
          'You are the AI Structural Damage Assessment Engine powering Infra Resilience360 for NDMA Pakistan. You are not a chatbot. You are an engineering assessment engine. Analyze only visible evidence and return only strict JSON.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              `RequestId=${requestId}; Nonce=${analysisNonce}. Context: structureType=${structureType}; province=${province}; location=${location}; hazardProfile=${riskProfile}. Analyze uploaded infrastructure damage image and return ONLY valid JSON with this exact schema:\n{\n"analysisSummary": string,\n"damageClassification": "Minor|Moderate|Major|Severe|Critical",\n"severityScore": number,\n"confidence": string,\n"safetyStatus": "Safe|Use with Caution|Unsafe|Immediate Evacuation Recommended",\n"inspectionPriority": "Low|Medium|High|Urgent|Emergency",\n"visibleDefects": string[],\n"probableCauses": string[],\n"recommendedRetrofits": string[],\n"immediateSafetyActions": string[],\n"engineeringObservations": string[],\n"limitations": string,\n"disclaimer": "This assessment is image-based only and must not replace a professional structural inspection."\n}\nRules: be concise, do not estimate costs/labor/material quantities/duration, do not invent hidden damage, if uncertain include "Requires detailed structural inspection." in limitations.`,
          },
          {
            type: 'image_url',
            image_url: { url: imageDataUrl },
          },
        ],
      },
    ]

    const { content: completionText, modelUsed } = await callOpenAIVisionWithRetry({
      messages: visionMessages,
      requestId,
      openaiModel: OPENAI_VISION_MODEL,
    })

    const parsed = tryExtractJson(completionText) ?? {}
    const confidenceRaw = String(parsed?.confidence ?? '65%').trim()
    const confidenceNumeric = clamp(Number(confidenceRaw.replace('%', '')) || 65, 1, 100)
    const classification = String(parsed?.damageClassification ?? 'Moderate')
    const severityScore = clamp(parsed?.severityScore ?? (classification === 'Critical' ? 90 : classification === 'Severe' ? 78 : classification === 'Major' ? 68 : classification === 'Moderate' ? 52 : 28), 0, 100)
    const safetyStatus = String(parsed?.safetyStatus ?? 'Use with Caution')
    const inspectionPriority = String(parsed?.inspectionPriority ?? 'High')
    const visibleDefects = asArray(parsed?.visibleDefects).map((v) => String(v)).filter(Boolean).slice(0, 12)
    const probableCauses = asArray(parsed?.probableCauses).map((v) => String(v)).filter(Boolean).slice(0, 8)
    const recommendedRetrofits = asArray(parsed?.recommendedRetrofits).map((v) => String(v)).filter(Boolean).slice(0, 10)
    const immediateSafetyActions = asArray(parsed?.immediateSafetyActions).map((v) => String(v)).filter(Boolean).slice(0, 10)
    const engineeringObservations = asArray(parsed?.engineeringObservations).map((v) => String(v)).filter(Boolean).slice(0, 10)
    const limitations = String(parsed?.limitations ?? 'Requires detailed structural inspection.').slice(0, 420)

    imageQuality = /poor|low visibility|blur|unclear|occluded/i.test(limitations)
      ? { visibility: 'fair', notes: limitations }
      : { visibility: 'good', notes: limitations }
    baseSummary = String(parsed?.analysisSummary ?? 'Image-based structural assessment completed.').slice(0, 900)

    extractedDefects = visibleDefects.map((entry) => {
      const text = String(entry).toLowerCase()
      const type = /crack/.test(text)
        ? 'crack'
        : /spall|delamination|honeycomb/.test(text)
          ? 'spalling'
          : /corrosion|rebar/.test(text)
            ? 'corrosion'
            : /moisture|water|flood/.test(text)
              ? 'moisture'
              : /tilt|bulg|deflect|sag|buckl|collapse/.test(text)
                ? 'deformation'
                : 'other'
      const severity = severityScore >= 72 ? 'high' : severityScore >= 45 ? 'medium' : 'low'
      return {
        type,
        severity,
        confidence: clamp(confidenceNumeric / 100, 0, 1),
        location: location.slice(0, 220),
        evidence: entry.slice(0, 400),
        retrofitAction: (recommendedRetrofits[0] ?? 'Requires detailed structural inspection.').slice(0, 300),
      }
    })
    extractedFeatures = []

    const responsePayload = {
      model: modelUsed,
      requestId,
      analyzedAt: new Date().toISOString(),
      imageQuality,
      defectFeatures: extractedFeatures,
      summary: baseSummary,
      defects: extractedDefects.length > 0 ? extractedDefects : [
        {
          type: 'other',
          severity: severityScore >= 72 ? 'high' : severityScore >= 45 ? 'medium' : 'low',
          confidence: clamp(confidenceNumeric / 100, 0, 1),
          location: location.slice(0, 220),
          evidence: engineeringObservations[0] ?? 'Visible distress requires field inspection.',
          retrofitAction: recommendedRetrofits[0] ?? 'Requires detailed structural inspection.',
        },
      ],
      costSignals: {
        assessedDamageLevel: severityScore >= 72 ? 'high' : severityScore >= 45 ? 'medium' : 'low',
        recommendedScope: severityScore >= 72 ? 'comprehensive' : severityScore >= 45 ? 'standard' : 'basic',
        estimatedAffectedAreaPercent: clamp(Math.round(18 + extractedDefects.length * 7), 8, 95),
        severityScore,
        urgencyLevel: inspectionPriority === 'Emergency' || inspectionPriority === 'Urgent' ? 'critical' : inspectionPriority === 'High' ? 'priority' : 'routine',
      },
      priorityActions: (immediateSafetyActions.length > 0 ? immediateSafetyActions : ['Professional structural inspection', 'Restrict occupancy where needed']).slice(0, 8),
      retrofitPlan: {
        immediate: (immediateSafetyActions.length > 0 ? immediateSafetyActions : ['Restrict occupancy', 'Temporary shoring']).slice(0, 6),
        shortTerm: recommendedRetrofits.slice(0, 6),
        longTerm: ['Detailed structural investigation and design verification before permanent retrofit.'],
      },
      safetyNote: `Safety status: ${safetyStatus}. ${limitations}`.slice(0, 420),
      structuredGuidance: {
        damageClassification: {
          primary: classification,
          detected: visibleDefects.length > 0 ? visibleDefects : ['Requires detailed structural inspection.'],
          featureEvidence: engineeringObservations.length > 0 ? engineeringObservations : [baseSummary],
        },
        severity: {
          level: classification === 'Minor' ? 'Low' : classification === 'Moderate' ? 'Moderate' : classification === 'Major' ? 'High' : 'Critical',
          rationale: baseSummary.slice(0, 280),
        },
        probableCauses: probableCauses.length > 0 ? probableCauses : ['Requires detailed structural inspection.'],
        risk: {
          lifeSafety: safetyStatus,
          serviceability: severityScore >= 45 ? 'Serviceability may be compromised.' : 'Limited visible serviceability impact.',
          progressionRisk: inspectionPriority === 'Emergency' || inspectionPriority === 'Urgent' ? 'Rapid progression possible without intervention.' : 'Monitor condition; perform detailed inspection.',
        },
        retrofitMethods: recommendedRetrofits.slice(0, 5).map((technique, index) => ({
          step: index + 1,
          technique,
          targetCondition: 'Stabilized structural behavior',
          procedure: `Apply ${technique} as per structural engineer design and site conditions.`,
          materials: [],
          tools: [],
          qaChecks: ['Engineer approval', 'Site inspection sign-off'],
        })),
        safetyPrecautions: immediateSafetyActions.length > 0 ? immediateSafetyActions : ['Professional structural inspection'],
        localizedCostEstimation: {
          province,
          currency: 'PKR',
          lineItems: [],
          totalEstimatedCostPkr: 0,
          assumptions: ['Cost estimation is intentionally excluded for this endpoint.'],
        },
      },
    }

    res.setHeader('Cache-Control', 'no-store, max-age=0')
    res.json(responsePayload)
  } catch (error) {
    console.error('[vision/analyze] OpenAI failure summary', {
      requestId,
      summary: getOpenAiLogSummary(error),
    })
    console.error('[vision/analyze]', {
      requestId,
      detail: normalizeAiErrorForLog(error, 'Vision analysis failed.'),
    })
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    const payload = toSanitizedVisionErrorPayload(error, USER_AI_MESSAGES.unavailable)
    res.status(503).json({ ...payload, requestId })
  }
}

app.post('/api/vision/analyze', upload.single('image'), handleVisionAnalyze)
app.post('/api/analyze-retrofit', upload.single('image'), handleVisionAnalyze)

/** Backend diagnostics for AI readiness (no secrets returned). */
app.get('/api/health/ai', async (req, res) => {
  const envLoaded = Boolean(process.env.OPENAI_API_KEY)
  const openAiConfigured = isOpenAiConfigured()
  const openAiClientInitialized = Boolean(openai)
  const configuredVisionModel = OPENAI_VISION_MODEL
  const fallbackVisionModels = OPENAI_VISION_FALLBACK_MODELS
  const shouldProbe = ['1', 'true', 'yes'].includes(String(req.query.probe ?? '').toLowerCase())
  const diagnostics = {
    envLoaded,
    openAiConfigured,
    openAiClientInitialized,
    configuredVisionModel,
    fallbackVisionModels,
    probeExecuted: false,
    visionEndpointReachable: null,
    probeError: null,
  }

  if (shouldProbe) {
    diagnostics.probeExecuted = true
    if (!openAiConfigured || !openai) {
      diagnostics.visionEndpointReachable = false
      diagnostics.probeError = 'OpenAI client is not configured.'
    } else {
      const startedAt = Date.now()
      try {
        await withPromiseTimeout(openai.models.retrieve(configuredVisionModel), 8000, 'OpenAI model probe')
        diagnostics.visionEndpointReachable = true
        diagnostics.probeDurationMs = Date.now() - startedAt
      } catch (error) {
        diagnostics.visionEndpointReachable = false
        diagnostics.probeDurationMs = Date.now() - startedAt
        diagnostics.probeError = normalizeAiErrorForLog(error, 'OpenAI model probe failed')
      }
    }
  }

  const statusCode = openAiConfigured ? 200 : 503
  res.status(statusCode).json({
    ok: openAiConfigured,
    provider: selectedAiProvider,
    diagnostics,
  })
})

app.post('/api/material-hubs/ai-agent', upload.single('document'), async (req, res) => {
  if (!hasKey) {
    res.status(503).json({
      error: getAiMissingConfigUserMessage(),
    })
    return
  }

  try {
    const auth = await verifyMaterialHubAdmin(req)
    if (auth.status !== 200) {
      res.status(auth.status).json({ error: auth.error })
      return
    }

    const instruction = String(req.body.instruction ?? '').trim()
    const hubs = safeArray(parseJsonBodyField(req.body.hubs, []))
    const inventory = safeArray(parseJsonBodyField(req.body.inventory, []))
    const documentText = await getUploadedDocumentText(req.file)

    if (!instruction && !documentText) {
      res.status(400).json({ error: 'Provide an admin instruction or upload a document for analysis.' })
      return
    }

    const compactContext = {
      hubs: hubs.slice(0, 200).map((hub) => ({
        id: String(hub?.id ?? ''),
        name: String(hub?.name ?? ''),
        location: String(hub?.location ?? ''),
        district: String(hub?.district ?? ''),
        status: String(hub?.status ?? ''),
        stockPercentage: Number(hub?.stockPercentage ?? 0),
        damagePercentage: Number(hub?.damagePercentage ?? 0),
      })),
      inventory: inventory.slice(0, 300).map((hubInventory) => ({
        hubId: String(hubInventory?.hubId ?? ''),
        hubName: String(hubInventory?.hubName ?? ''),
        materials: safeArray(hubInventory?.materials).slice(0, 400).map((item) => ({
          id: String(item?.id ?? ''),
          hubId: String(item?.hubId ?? ''),
          name: String(item?.name ?? ''),
          unit: String(item?.unit ?? ''),
          opening: Number(item?.opening ?? 0),
          received: Number(item?.received ?? 0),
          issued: Number(item?.issued ?? 0),
          damaged: Number(item?.damaged ?? 0),
          closing: Number(item?.closing ?? 0),
        })),
      })),
    }

    const completion = await createChatCompletion({
      openaiModel: OPENAI_MODEL,
      huggingFaceModel: HUGGINGFACE_CHAT_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content:
            'You are an inventory operations AI for disaster material hubs. You must return strict JSON only. Be conservative and avoid destructive edits unless explicitly requested. Use existing IDs for updates/deletes whenever possible.',
        },
        {
          role: 'user',
          content:
            `You are helping an admin update Material Hub portal data. Analyze deeply and return strict JSON with this schema only:\n{\n  "summary": string,\n  "confidence": number,\n  "risks": string[],\n  "hubOperations": [\n    {\n      "action": "create|update|delete",\n      "hubId": string | null,\n      "hubName": string | null,\n      "name": string | null,\n      "location": string | null,\n      "district": string | null,\n      "latitude": number | null,\n      "longitude": number | null,\n      "capacity": number | null,\n      "status": "ready|moderate|critical" | null,\n      "stockPercentage": number | null,\n      "damagePercentage": number | null\n    }\n  ],\n  "entryOperations": [\n    {\n      "action": "create|update|delete",\n      "entryId": string | null,\n      "hubId": string | null,\n      "hubName": string | null,\n      "name": string | null,\n      "unit": string | null,\n      "opening": number | null,\n      "received": number | null,\n      "issued": number | null,\n      "damaged": number | null\n    }\n  ]\n}.\n\nRules:\n- For update/delete, include IDs when available from context.\n- Never invent hub IDs or entry IDs.\n- Keep numbers non-negative.\n- stockPercentage and damagePercentage must be between 0 and 100 when present.\n- Be conservative with deletes unless explicitly requested.\n- If data is uncertain, add the uncertainty in risks and keep operations minimal.\n\nAdmin instruction:\n${instruction || '(none)'}\n\nUploaded document text:\n${documentText || '(none)'}\n\nCurrent live context:\n${JSON.stringify(compactContext).slice(0, 120_000)}`,
        },
      ],
    })

    const text = completion.choices[0]?.message?.content ?? ''
    const parsed = extractJson(text)

    const aiHubOps = extractHubOpsFromPayload(parsed)
    const aiEntryOps = extractEntryOpsFromPayload(parsed)
    const docFallback = extractOperationsFromDocumentText(documentText)

    const hubOpsSource = aiHubOps.length > 0 ? aiHubOps : docFallback.hubOps
    const entryOpsSource = aiEntryOps.length > 0 ? aiEntryOps : docFallback.entryOps

    const hubOperations = safeArray(hubOpsSource).map((item) => ({
      action: normalizeAiAction(item?.action),
      hubId: item?.hubId ? String(item.hubId) : null,
      hubName: item?.hubName ? String(item.hubName) : null,
      name: item?.name ? String(item.name) : null,
      location: item?.location ? String(item.location) : null,
      district: item?.district ? String(item.district) : null,
      latitude: item?.latitude === null || item?.latitude === undefined ? null : Number(item.latitude),
      longitude: item?.longitude === null || item?.longitude === undefined ? null : Number(item.longitude),
      capacity: item?.capacity === null || item?.capacity === undefined ? null : Math.max(0, Number(item.capacity) || 0),
      status: normalizeHubStatus(item?.status),
      stockPercentage:
        item?.stockPercentage === null || item?.stockPercentage === undefined
          ? null
          : Math.max(0, Math.min(100, Number(item.stockPercentage) || 0)),
      damagePercentage:
        item?.damagePercentage === null || item?.damagePercentage === undefined
          ? null
          : Math.max(0, Math.min(100, Number(item.damagePercentage) || 0)),
    })).filter((item) => item.action)

    const entryOperations = safeArray(entryOpsSource).map((item) => ({
      action: normalizeAiAction(item?.action),
      entryId: item?.entryId ? String(item.entryId) : null,
      hubId: item?.hubId ? String(item.hubId) : null,
      hubName: item?.hubName ? String(item.hubName) : null,
      name: item?.name ? String(item.name) : null,
      unit: item?.unit ? String(item.unit) : null,
      opening: item?.opening === null || item?.opening === undefined ? null : Math.max(0, Number(item.opening) || 0),
      received: item?.received === null || item?.received === undefined ? null : Math.max(0, Number(item.received) || 0),
      issued: item?.issued === null || item?.issued === undefined ? null : Math.max(0, Number(item.issued) || 0),
      damaged: item?.damaged === null || item?.damaged === undefined ? null : Math.max(0, Number(item.damaged) || 0),
    })).filter((item) => item.action)

    const baseRisks = safeArray(parsed.risks).map((item) => String(item))
    const risks =
      hubOperations.length === 0 && entryOperations.length === 0
        ? [
            ...baseRisks,
            'No actionable operations were generated. Upload a structured JSON with hubOperations/entryOperations or provide clearer update instructions with exact hub/material names.',
          ]
        : baseRisks

    res.json({
      model,
      analyzedAt: new Date().toISOString(),
      summary: String(parsed.summary ?? ''),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence ?? 0.6) || 0.6)),
      risks,
      hubOperations,
      entryOperations,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Material Hubs AI analysis failed.'
    const statusFromProvider =
      typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
        ? error.status
        : undefined
    const isQuotaError = /\b429\b|quota|insufficient_quota|billing|rate\s*limit/i.test(message)

    res.status(statusFromProvider ?? (isQuotaError ? 429 : 500)).json({
      error: message,
      provider: selectedAiProvider,
      model,
    })
  }
})

app.post('/api/ml/retrofit-estimate', (req, res) => {
  try {
    const structureType = String(req.body.structureType ?? 'Masonry House')
    const province = String(req.body.province ?? 'Punjab')
    const city = String(req.body.city ?? '')
    const areaSqft = Number(req.body.areaSqft ?? 1200)
    const severityScore = Number(req.body.severityScore ?? 40)
    const affectedAreaPercent = Number(req.body.affectedAreaPercent ?? 25)
    const urgencyLevel = String(req.body.urgencyLevel ?? 'priority')
    const laborDaily = req.body.laborDaily !== undefined ? Number(req.body.laborDaily) : undefined
    const materialIndex = req.body.materialIndex !== undefined ? Number(req.body.materialIndex) : undefined
    const equipmentIndex = req.body.equipmentIndex !== undefined ? Number(req.body.equipmentIndex) : undefined
    const logisticsIndex = req.body.logisticsIndex !== undefined ? Number(req.body.logisticsIndex) : undefined
    const defectProfile = req.body.defectProfile ?? {}
    const imageQuality = String(req.body.imageQuality ?? 'good')

    const prediction = predictRetrofitMl({
      structureType,
      province,
      city,
      areaSqft,
      severityScore,
      affectedAreaPercent,
      urgencyLevel,
      laborDaily,
      materialIndex,
      equipmentIndex,
      logisticsIndex,
      defectProfile,
      imageQuality,
    })

    res.json(prediction)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ML estimate failed.'
    res.status(500).json({ error: message })
  }
})

app.post('/api/ml/training-data', upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Training image file is required.' })
    return
  }

  try {
    const recordId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const extension = req.file.mimetype.includes('png') ? 'png' : req.file.mimetype.includes('webp') ? 'webp' : 'jpg'
    const imageName = `${recordId}.${extension}`
    await ensureRetrofitTrainingStorage()
    await fs.writeFile(path.join(retrofitTrainingImagesDir, imageName), req.file.buffer)

    const record = {
      id: recordId,
      createdAt: new Date().toISOString(),
      imageName,
      structureType: String(req.body.structureType ?? 'Masonry House'),
      province: String(req.body.province ?? 'Punjab'),
      city: String(req.body.city ?? ''),
      areaSqft: Number(req.body.areaSqft ?? 1200),
      severityScore: Number(req.body.severityScore ?? 45),
      affectedAreaPercent: Number(req.body.affectedAreaPercent ?? 25),
      urgencyLevel: String(req.body.urgencyLevel ?? 'priority'),
      laborDaily: Number(req.body.laborDaily ?? 2600),
      materialIndex: Number(req.body.materialIndex ?? 1),
      equipmentIndex: Number(req.body.equipmentIndex ?? 1),
      logisticsIndex: Number(req.body.logisticsIndex ?? 1),
    }

    const existing = await readRetrofitTrainingData()
    existing.push(record)
    await writeRetrofitTrainingData(existing)

    res.json({
      message: 'Training data sample saved.',
      sampleCount: existing.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save training data sample.'
    res.status(500).json({ error: message })
  }
})

app.post('/api/ml/retrain', async (_req, res) => {
  try {
    const samples = await readRetrofitTrainingData()
    const result = retrainRetrofitMlModel(samples)
    res.json({
      ...result,
      sampleCount: samples.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrain ML model.'
    res.status(500).json({ error: message })
  }
})

app.post('/api/community/issues', upload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Issue photo is required.' })
    return
  }

  try {
    const issueId = `issue-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const extension = req.file.mimetype.includes('png') ? 'png' : req.file.mimetype.includes('webp') ? 'webp' : 'jpg'
    const imageName = `${issueId}.${extension}`

    await ensureCommunityIssuesStorage()

    let storedImageUrl = ''
    const mediaKey = normalizeMediaObjectKey(`community-issues/${imageName}`)
    if (isMediaUploadConfigured()) {
      await uploadBufferLocalDisabled({
        key: mediaKey,
        buffer: req.file.buffer,
        contentType: req.file.mimetype || `image/${extension}`,
      })
      storedImageUrl = buildPublicMediaUrl(mediaKey)
    } else {
      await fs.writeFile(path.join(communityIssueImagesDir, imageName), req.file.buffer)
    }

    const issue = {
      id: issueId,
      submittedAt: new Date().toISOString(),
      category: String(req.body.category ?? 'Broken roads'),
      notes: String(req.body.notes ?? '').trim() || 'No additional notes provided.',
      photoName: req.file.originalname || imageName,
      imageName,
      ...(storedImageUrl ? { storedImageUrl } : {}),
      status: 'Submitted',
      lat: req.body.lat !== undefined && String(req.body.lat).trim() !== '' ? Number(req.body.lat) : null,
      lng: req.body.lng !== undefined && String(req.body.lng).trim() !== '' ? Number(req.body.lng) : null,
      province: String(req.body.province ?? '').trim() || null,
      district: String(req.body.district ?? '').trim() || null,
    }

    const issues = await readCommunityIssues()
    issues.unshift(issue)
    await writeCommunityIssues(issues)

    res.json({
      ...issue,
      imageUrl: resolveCommunityIssueImageUrl(req, issue),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit community issue.'
    res.status(500).json({ error: message })
  }
})

app.get('/api/community/issues', async (req, res) => {
  try {
    const statusFilter = String(req.query.status ?? '').trim()
    const allIssues = await readCommunityIssues()
    const filtered = statusFilter
      ? allIssues.filter((item) => String(item.status).toLowerCase() === statusFilter.toLowerCase())
      : allIssues

    res.json(
      filtered.map((issue) => ({
        ...issue,
        imageUrl: resolveCommunityIssueImageUrl(req, issue),
      })),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load community issues.'
    res.status(500).json({ error: message })
  }
})

app.patch('/api/community/issues/:id/status', async (req, res) => {
  try {
    const issueId = String(req.params.id ?? '').trim()
    const status = String(req.body.status ?? '').trim()

    if (!issueId) {
      res.status(400).json({ error: 'Issue id is required.' })
      return
    }

    if (!allowedCommunityIssueStatuses.has(status)) {
      res.status(400).json({ error: 'Invalid status.' })
      return
    }

    const issues = await readCommunityIssues()
    const index = issues.findIndex((item) => item.id === issueId)
    if (index < 0) {
      res.status(404).json({ error: 'Issue not found.' })
      return
    }

    issues[index] = {
      ...issues[index],
      status,
      updatedAt: new Date().toISOString(),
    }

    await writeCommunityIssues(issues)

    res.json({
      ...issues[index],
      imageUrl: resolveCommunityIssueImageUrl(req, issues[index]),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update community issue status.'
    res.status(500).json({ error: message })
  }
})

const handleSmartConstructionProvinceRates = async (req, res) => {
  const province = String(req.body?.province ?? 'Punjab').trim() || 'Punjab'
  const city = String(req.body?.city ?? '').trim() || (
    {
      Punjab: 'Lahore',
      Sindh: 'Karachi',
      KPK: 'Peshawar',
      'Khyber Pakhtunkhwa': 'Peshawar',
      Balochistan: 'Quetta',
      'Gilgit-Baltistan': 'Gilgit',
      AJK: 'Muzaffarabad',
      'Islamabad Capital Territory': 'Islamabad',
    }[province] || 'Lahore'
  )

  const cacheDir = path.join(STORAGE_DIR, 'cache', 'material-prices')
  const cacheFile = path.join(
    cacheDir,
    `${province.replace(/[^a-zA-Z0-9-]+/g, '-')}-${city.replace(/[^a-zA-Z0-9-]+/g, '-')}.json`,
  )
  const readCache = async () => {
    try {
      const parsed = JSON.parse(await fs.readFile(cacheFile, 'utf8'))
      const cachedAtMs = Date.parse(String(parsed?.cachedAt ?? ''))
      return {
        cachedAtMs: Number.isFinite(cachedAtMs) ? cachedAtMs : 0,
        response: parsed?.response && typeof parsed.response === 'object' ? parsed.response : null,
      }
    } catch {
      return null
    }
  }
  const writeCache = async (responsePayload) => {
    try {
      await fs.mkdir(cacheDir, { recursive: true })
      await fs.writeFile(
        cacheFile,
        JSON.stringify({ cachedAt: new Date().toISOString(), response: responsePayload }, null, 2),
        'utf8',
      )
    } catch {
      /* ignore cache write errors */
    }
  }
  const freshCache = await readCache()
  if (freshCache?.response && Date.now() - freshCache.cachedAtMs < 24 * 60 * 60 * 1000) {
    res.json(freshCache.response)
    return
  }

  const requiredMaterials = [
    'cement',
    'steel rebar grade 60',
    'fine sand',
    'coarse sand',
    'crush aggregate',
    'bricks',
    'concrete blocks',
    'ready mix concrete',
    'timber',
    'ceramic tiles',
    'marble granite',
    'paint',
    'electrical cable',
    'pvc water pipe',
    'gi pipe',
    'door',
    'window',
    'roofing sheet',
  ]
  const norm = (value) =>
    String(value ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
  const findMaterial = (rows, matcher) => rows.find((row) => matcher(norm(row?.material)))
  const toRate = (row, targetUnit) => {
    const price = Number(row?.currentPrice)
    if (!Number.isFinite(price) || price <= 0) return null
    const unit = norm(row?.unit)
    if (targetUnit === 'kg') {
      if (/kg/.test(unit)) return price
      if (/ton|tonne/.test(unit)) return price / 1000
    }
    if (targetUnit === 'cft') {
      if (/cft|cubic feet|ft3/.test(unit)) return price
      if (/m3|cubic meter/.test(unit)) return price / 35.3147
    }
    if (targetUnit === 'sqft') {
      if (/sq ft|ft2/.test(unit)) return price
      if (/sq m|m2/.test(unit)) return price / 10.7639
    }
    if (targetUnit === 'piece') return price
    if (targetUnit === 'unit') return price
    if (targetUnit === 'bag') return price
    return price
  }

  const fallbackByProvince = {
    Punjab: {
      brickPerPiece: 15,
      cementPerBag: 800,
      sandPerCft: 50,
      aggregatePerCft: 60,
      steelPerKg: 150,
      tilePerSqFt: 380,
      plasterPerSqFt: 65,
      woodPerCft: 4200,
      beamPerRft: 450,
      concretePerCft: 180,
      paintPerSqFt: 28,
      doorWoodPerUnit: 18000,
      windowAluminumPerUnit: 14500,
      waterproofPerSqFt: 42,
      gaderPerPiece: 5200,
      beamConcretePerCft: 220,
      columnConcretePerCft: 240,
      dailyWageMason: 2500,
      dailyWageHelper: 1800,
      workersPer100SqFt: 2.4,
      productivitySqFtPerWorkerDay: 11,
    },
    Sindh: {
      brickPerPiece: 16,
      cementPerBag: 830,
      sandPerCft: 52,
      aggregatePerCft: 62,
      steelPerKg: 154,
      tilePerSqFt: 390,
      plasterPerSqFt: 66,
      woodPerCft: 4300,
      beamPerRft: 470,
      concretePerCft: 188,
      paintPerSqFt: 29,
      doorWoodPerUnit: 18600,
      windowAluminumPerUnit: 14900,
      waterproofPerSqFt: 44,
      gaderPerPiece: 5400,
      beamConcretePerCft: 230,
      columnConcretePerCft: 250,
      dailyWageMason: 2600,
      dailyWageHelper: 1850,
      workersPer100SqFt: 2.5,
      productivitySqFtPerWorkerDay: 10.8,
    },
    KPK: {
      brickPerPiece: 15,
      cementPerBag: 810,
      sandPerCft: 49,
      aggregatePerCft: 59,
      steelPerKg: 151,
      tilePerSqFt: 375,
      plasterPerSqFt: 64,
      woodPerCft: 4150,
      beamPerRft: 445,
      concretePerCft: 176,
      paintPerSqFt: 27,
      doorWoodPerUnit: 17600,
      windowAluminumPerUnit: 14200,
      waterproofPerSqFt: 41,
      gaderPerPiece: 5100,
      beamConcretePerCft: 216,
      columnConcretePerCft: 236,
      dailyWageMason: 2450,
      dailyWageHelper: 1750,
      workersPer100SqFt: 2.3,
      productivitySqFtPerWorkerDay: 11.3,
    },
    Balochistan: {
      brickPerPiece: 17,
      cementPerBag: 860,
      sandPerCft: 55,
      aggregatePerCft: 66,
      steelPerKg: 158,
      tilePerSqFt: 410,
      plasterPerSqFt: 69,
      woodPerCft: 4400,
      beamPerRft: 490,
      concretePerCft: 195,
      paintPerSqFt: 30,
      doorWoodPerUnit: 19200,
      windowAluminumPerUnit: 15400,
      waterproofPerSqFt: 46,
      gaderPerPiece: 5600,
      beamConcretePerCft: 238,
      columnConcretePerCft: 258,
      dailyWageMason: 2700,
      dailyWageHelper: 1900,
      workersPer100SqFt: 2.6,
      productivitySqFtPerWorkerDay: 10.2,
    },
    'Gilgit-Baltistan': {
      brickPerPiece: 18,
      cementPerBag: 890,
      sandPerCft: 58,
      aggregatePerCft: 69,
      steelPerKg: 162,
      tilePerSqFt: 425,
      plasterPerSqFt: 71,
      woodPerCft: 4550,
      beamPerRft: 510,
      concretePerCft: 204,
      paintPerSqFt: 32,
      doorWoodPerUnit: 20100,
      windowAluminumPerUnit: 16200,
      waterproofPerSqFt: 49,
      gaderPerPiece: 5900,
      beamConcretePerCft: 248,
      columnConcretePerCft: 270,
      dailyWageMason: 2800,
      dailyWageHelper: 2000,
      workersPer100SqFt: 2.7,
      productivitySqFtPerWorkerDay: 9.8,
    },
    'Islamabad Capital Territory': {
      brickPerPiece: 16,
      cementPerBag: 840,
      sandPerCft: 53,
      aggregatePerCft: 63,
      steelPerKg: 155,
      tilePerSqFt: 395,
      plasterPerSqFt: 67,
      woodPerCft: 4350,
      beamPerRft: 475,
      concretePerCft: 190,
      paintPerSqFt: 29,
      doorWoodPerUnit: 18800,
      windowAluminumPerUnit: 15000,
      waterproofPerSqFt: 45,
      gaderPerPiece: 5480,
      beamConcretePerCft: 233,
      columnConcretePerCft: 252,
      dailyWageMason: 2650,
      dailyWageHelper: 1900,
      workersPer100SqFt: 2.5,
      productivitySqFtPerWorkerDay: 10.9,
    },
  }

  const fallback = fallbackByProvince[province] ?? fallbackByProvince.Punjab

  const buildBaselineResponse = (notes) => ({
    province,
    city,
    country: 'Pakistan',
    currency: 'PKR',
    source: `Baseline rates (${city}, ${province})`,
    fetchedAt: new Date().toISOString(),
    materialRates: {
      brickPerPiece: fallback.brickPerPiece,
      cementPerBag: fallback.cementPerBag,
      sandPerCft: fallback.sandPerCft,
      aggregatePerCft: fallback.aggregatePerCft,
      steelPerKg: fallback.steelPerKg,
      tilePerSqFt: fallback.tilePerSqFt,
      doorPerSqFt: 650,
      windowPerSqFt: 540,
      plasterPerSqFt: fallback.plasterPerSqFt,
      woodPerCft: fallback.woodPerCft,
      beamPerRft: fallback.beamPerRft,
      concretePerCft: fallback.concretePerCft,
      paintPerSqFt: fallback.paintPerSqFt,
      doorWoodPerUnit: fallback.doorWoodPerUnit,
      windowAluminumPerUnit: fallback.windowAluminumPerUnit,
      waterproofPerSqFt: fallback.waterproofPerSqFt,
      gaderPerPiece: fallback.gaderPerPiece,
      beamConcretePerCft: fallback.beamConcretePerCft,
      columnConcretePerCft: fallback.columnConcretePerCft,
    },
    laborRates: {
      dailyWageMason: fallback.dailyWageMason,
      dailyWageHelper: fallback.dailyWageHelper,
      workersPer100SqFt: fallback.workersPer100SqFt,
      productivitySqFtPerWorkerDay: fallback.productivitySqFtPerWorkerDay,
    },
    notes,
  })

  if (!OPENAI_API_KEY || !openai) {
    res.json(
      buildBaselineResponse([
        `Using baseline rates for ${city}, ${province}.`,
        'Live market lookup is unavailable until OPENAI_API_KEY is configured.',
      ]),
    )
    return
  }

  try {
    const response = await withPromiseTimeout(
      openai.responses.create({
        model: OPENAI_MODEL,
        tools: [{ type: 'web_search_preview' }],
        input: [
          {
            role: 'system',
            content:
              'You are a Senior Chartered Civil Engineer, Quantity Surveyor and Construction Cost Estimation Specialist for Pakistan. Estimate current material prices for the requested city/province using web search and return JSON only.',
          },
          {
            role: 'user',
            content:
              `Requested location city=${city}, province=${province}, country=Pakistan. Required materials only: Cement (50 kg bag), Steel Rebar Grade 60, Fine Sand, Coarse Sand, Crush Aggregate (20 mm), Bricks, Concrete Blocks, Ready Mix Concrete, Timber, Ceramic Tiles, Marble/Granite, Paint, Electrical Cable, PVC Water Pipe, GI Pipe, Door, Window, Roofing Sheet. For each return material, unit, currentPrice, currency, city, province, estimatedRange, confidence, lastUpdated, sourceSummary. Use PKR. Return JSON only.`,
          },
        ],
      }),
      90_000,
      'smart construction web search',
    )
    const parsed = extractJson(String(response?.output_text ?? ''))
    const rows = Array.isArray(parsed?.materials) ? parsed.materials : []
    const seenRequired = new Set(
      rows.map((row) => norm(row?.material)).filter((label) => requiredMaterials.some((m) => label.includes(m))),
    )
    if (seenRequired.size < requiredMaterials.length) {
      throw new Error('Incomplete live material list from web search.')
    }
    for (const row of rows) {
      const price = Number(row?.currentPrice)
      if (!Number.isFinite(price) || price <= 0) throw new Error(`Invalid price for ${String(row?.material ?? 'unknown')}`)
      if (String(row?.currency ?? '').trim().toUpperCase() !== 'PKR') throw new Error('Invalid currency in live material data')
      const rowCity = norm(row?.city)
      const rowProvince = norm(row?.province)
      const requestedCity = norm(city)
      const requestedProvince = norm(province)
      if (!rowCity || !rowProvince) {
        throw new Error('Location is missing in live material data')
      }
      const locationMatches =
        rowCity.includes(requestedCity) ||
        rowProvince.includes(requestedProvince) ||
        requestedProvince.includes(rowProvince)
      if (!locationMatches) {
        throw new Error(`Location mismatch in live material data: ${String(row?.city ?? '')}, ${String(row?.province ?? '')}`)
      }
    }

    const cement = findMaterial(rows, (v) => v.includes('cement'))
    const steel = findMaterial(rows, (v) => v.includes('steel') || v.includes('rebar'))
    const fineSand = findMaterial(rows, (v) => v.includes('fine sand'))
    const aggregate = findMaterial(rows, (v) => v.includes('aggregate') || v.includes('crush'))
    const bricks = findMaterial(rows, (v) => v.includes('brick'))
    const readyMix = findMaterial(rows, (v) => v.includes('ready mix'))
    const timber = findMaterial(rows, (v) => v.includes('timber') || v.includes('wood'))
    const ceramicTiles = findMaterial(rows, (v) => v.includes('ceramic') || v.includes('tile'))
    const paint = findMaterial(rows, (v) => v.includes('paint'))
    const door = findMaterial(rows, (v) => v.includes('door'))
    const window = findMaterial(rows, (v) => v.includes('window'))
    const marble = findMaterial(rows, (v) => v.includes('marble') || v.includes('granite'))
    const roofing = findMaterial(rows, (v) => v.includes('roofing'))
    const concreteBlocks = findMaterial(rows, (v) => v.includes('concrete block'))

    const asPositiveLive = (value, fallbackValue) => {
      const numeric = Number(value)
      if (!Number.isFinite(numeric) || numeric <= 0) return fallbackValue
      return numeric
    }
    const live = {
      province,
      city,
      country: 'Pakistan',
      currency: 'PKR',
      source: `OpenAI web search market rates (${city}, ${province})`,
      fetchedAt: new Date().toISOString(),
      materialRates: {
        brickPerPiece: asPositiveLive(toRate(bricks, 'piece'), fallback.brickPerPiece),
        cementPerBag: asPositiveLive(toRate(cement, 'bag'), fallback.cementPerBag),
        sandPerCft: asPositiveLive(toRate(fineSand, 'cft'), fallback.sandPerCft),
        aggregatePerCft: asPositiveLive(toRate(aggregate, 'cft'), fallback.aggregatePerCft),
        steelPerKg: asPositiveLive(toRate(steel, 'kg'), fallback.steelPerKg),
        tilePerSqFt: asPositiveLive(toRate(ceramicTiles, 'sqft'), fallback.tilePerSqFt),
        doorPerSqFt: asPositiveLive(toRate(door, 'sqft'), 650),
        windowPerSqFt: asPositiveLive(toRate(window, 'sqft'), 540),
        plasterPerSqFt: asPositiveLive(toRate(marble, 'sqft'), fallback.plasterPerSqFt),
        woodPerCft: asPositiveLive(toRate(timber, 'cft'), fallback.woodPerCft),
        beamPerRft: fallback.beamPerRft,
        concretePerCft: asPositiveLive(toRate(readyMix, 'cft'), fallback.concretePerCft),
        paintPerSqFt: asPositiveLive(toRate(paint, 'sqft'), fallback.paintPerSqFt),
        doorWoodPerUnit: asPositiveLive(toRate(door, 'unit'), fallback.doorWoodPerUnit),
        windowAluminumPerUnit: asPositiveLive(toRate(window, 'unit'), fallback.windowAluminumPerUnit),
        waterproofPerSqFt: asPositiveLive(toRate(roofing, 'sqft'), fallback.waterproofPerSqFt),
        gaderPerPiece: asPositiveLive(toRate(concreteBlocks, 'piece'), fallback.gaderPerPiece),
        beamConcretePerCft: asPositiveLive(toRate(readyMix, 'cft'), fallback.beamConcretePerCft),
        columnConcretePerCft: asPositiveLive(toRate(readyMix, 'cft'), fallback.columnConcretePerCft),
      },
      laborRates: {
        dailyWageMason: fallback.dailyWageMason,
        dailyWageHelper: fallback.dailyWageHelper,
        workersPer100SqFt: fallback.workersPer100SqFt,
        productivitySqFtPerWorkerDay: fallback.productivitySqFtPerWorkerDay,
      },
      notes: [
        `Live rates generated for ${city}, ${province} via OpenAI web search.`,
        'Labor rates use local baseline values for calculator stability.',
      ],
    }
    await writeCache(live)
    res.json(live)
    return
  } catch (error) {
    const cached = await readCache()
    if (cached?.response) {
      res.json(cached.response)
      return
    }
    res.json(
      buildBaselineResponse([
        `Using baseline rates for ${city}, ${province}.`,
        'Live market lookup is temporarily unavailable.',
      ]),
    )
    return
  }

}

app.post('/api/smart-construction/province-rates', handleSmartConstructionProvinceRates)
app.post('/api/material-prices', handleSmartConstructionProvinceRates)

app.post('/api/guidance/construction', async (req, res) => {
  const province = String(req.body?.province ?? 'Punjab')
  const city = String(req.body?.city ?? 'Lahore')
  const hazard = String(req.body?.hazard ?? 'flood')
  const structureType = String(req.body?.structureType ?? 'Masonry House')
  const bestPracticeName = String(req.body?.bestPracticeName ?? 'General Resilient Construction Practice')

  const respondFallback = (reasonLabel) => {
    const englishGuidance = buildFallbackEnglishConstructionGuidance({
      province,
      city,
      hazard,
      structureType,
      bestPracticeName,
    })
    console.warn('[guidance/construction] Using English fallback:', reasonLabel)
    res.json({
      ...englishGuidance,
      summaryUrdu: englishGuidance.summary,
      materialsUrdu: englishGuidance.materials,
      safetyUrdu: englishGuidance.safety,
      stepsUrdu: englishGuidance.steps,
    })
  }

  if (!hasKey) {
    respondFallback('AI key missing')
    return
  }

  try {
    const completion = await createChatCompletion({
      openaiModel: OPENAI_MODEL,
      huggingFaceModel: HUGGINGFACE_CHAT_MODEL,
      temperature: 0.15,
      messages: [
        {
          role: 'system',
          content:
            'You are a senior disaster-resilient construction engineer for Pakistan. Return ONLY valid JSON. No text, markdown, or commentary outside the JSON object. Use comprehensive, location-wise, implementation-ready engineering guidance in English.',
        },
        {
          role: 'user',
          content:
            `Create comprehensive location-aware construction guidance for structureType=${structureType} in city=${city}, province=${province}, Pakistan for hazard=${hazard}. Best practice to apply: ${bestPracticeName}. Use deep technical reasoning: local hazard patterns, soil/drainage implications, execution sequencing, QA/QC, and practical field constraints. Return ONLY valid JSON (no prose outside JSON) matching this schema:\n{\n  "summary": string,\n  "materials": string[],\n  "safety": string[],\n  "steps": [\n    {\n      "title": string,\n      "description": string,\n      "keyChecks": string[]\n    }\n  ]\n}. Constraints: exactly 5 steps; each step must be distinct and actionable; each description must explicitly include location-wise relevance and implementation guidance for Pakistan.`,
        },
      ],
    })

    const text = completion.choices[0]?.message?.content ?? ''
    const parsed = tryExtractJson(text)
    const baseline = buildFallbackEnglishConstructionGuidance({
      province,
      city,
      hazard,
      structureType,
      bestPracticeName,
    })
    let englishGuidance = baseline
    if (parsed && typeof parsed === 'object') {
      const steps = mapGuidanceSteps(parsed.steps)
      if (steps.length > 0) {
        const materials = safeArray(parsed.materials)
          .map((item) => String(item))
          .filter(Boolean)
        const safety = safeArray(parsed.safety)
          .map((item) => String(item))
          .filter(Boolean)
        const summary = String(parsed.summary ?? '').trim()
        englishGuidance = {
          summary: summary || baseline.summary,
          materials: materials.length > 0 ? materials : baseline.materials,
          safety: safety.length > 0 ? safety : baseline.safety,
          steps,
        }
      }
    }

    const translated = await translateGuidanceToUrdu(englishGuidance)

    res.json({
      ...englishGuidance,
      summaryUrdu: translated.summaryUrdu || englishGuidance.summary,
      materialsUrdu: translated.materialsUrdu.length > 0 ? translated.materialsUrdu : englishGuidance.materials,
      safetyUrdu: translated.safetyUrdu.length > 0 ? translated.safetyUrdu : englishGuidance.safety,
      stepsUrdu: translated.stepsUrdu.length > 0 ? translated.stepsUrdu : englishGuidance.steps,
    })
  } catch (error) {
    console.error('Construction guidance AI path failed:', error)
    respondFallback(normalizeAiErrorMessage(error, 'AI request failed'))
  }
})

app.post('/api/guidance/step-images', async (req, res) => {
  if (!hasKey) {
    res.status(503).json({ error: getAiMissingConfigUserMessage() })
    return
  }

  try {
    const province = String(req.body.province ?? 'Punjab')
    const city = String(req.body.city ?? 'Lahore')
    const hazard = String(req.body.hazard ?? 'flood')
    const structureType = String(req.body.structureType ?? 'Masonry House')
    const bestPracticeName = String(req.body.bestPracticeName ?? 'General Resilient Construction Practice')
    const steps = safeArray(req.body.steps).slice(0, 5)

    const generateStepImage = async (stepTitle, stepDescription) => {
      const prompt = `Photorealistic construction scene in ${city}, ${province}, Pakistan for ${structureType}. Hazard: ${hazard}. Best practice: ${bestPracticeName}. Step: ${stepTitle}. Show realistic workers, tools, materials, site details, and hazard-specific safeguards. ${stepDescription}`

      let lastError = null
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const b64 = await generateImageBase64({
            prompt,
            size: '1024x1024',
          })

          if (!b64) {
            lastError = new Error('No image data returned')
            await sleep(300 * attempt)
            continue
          }

          return {
            stepTitle,
            prompt,
            imageDataUrl: `data:image/png;base64,${b64}`,
          }
        } catch (error) {
          lastError = error
          if (attempt < 2 && isTransientAiError(error)) {
            await sleep(500 * attempt)
          }
        }
      }

      throw (lastError instanceof Error ? lastError : new Error(`Image generation failed for step: ${stepTitle}`))
    }

    const imageJobs = steps.map((step) => ({
      stepTitle: String(step?.title ?? 'Construction Step'),
      stepDescription: String(step?.description ?? ''),
    }))

    const generationResults = await runWithConcurrency(
      imageJobs,
      async (job) => generateStepImage(job.stepTitle, job.stepDescription),
      AI_IMAGE_CONCURRENCY,
    )

    const images = generationResults
      .filter((item) => item?.ok)
      .map((item) => item.value)
      .filter(Boolean)

    if (images.length === 0) {
      const firstError = generationResults.find((item) => item && !item.ok)?.error
      throw (firstError instanceof Error ? firstError : new Error('Step image generation failed.'))
    }

    res.json({
      images,
      partial: images.length < imageJobs.length,
      failed: imageJobs.length - images.length,
    })
  } catch (error) {
    const message = normalizeAiErrorMessage(error, 'Step image generation failed.')
    res.status(getAiErrorHttpStatus(error)).json({ error: message })
  }
})

app.post('/api/advisory/ask', async (req, res) => {
  if (!hasKey) {
    res.status(503).json({ error: getAiMissingConfigUserMessage() })
    return
  }

  try {
    const question = String(req.body.question ?? '').trim()
    const province = String(req.body.province ?? 'Punjab')
    const district = req.body.district ? String(req.body.district) : null
    const riskLayer = String(req.body.riskLayer ?? 'flood')
    const riskValue = String(req.body.riskValue ?? 'Unknown')
    const language = String(req.body.language ?? 'English')
    const districtProfile = req.body.districtProfile ?? null

    if (!question) {
      res.status(400).json({ error: 'Question is required.' })
      return
    }

    const responseLanguage = language === 'Urdu' ? 'Urdu' : 'English'

    const completion = await createChatCompletion({
      openaiModel: OPENAI_MODEL,
      huggingFaceModel: HUGGINGFACE_CHAT_MODEL,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            'You are Resilience360 AI advisor. Answer questions on hazards, climate change, environmental resilience, and relevant organizations with practical, accurate, and actionable guidance for Pakistan. Keep answers concise but useful, and avoid hallucinated specific numbers or claims.',
        },
        {
          role: 'user',
          content:
            `Answer this user question in ${responseLanguage}: "${question}"\n\nLocal context:\n- Province: ${province}\n- District: ${district ?? 'Not selected'}\n- Risk layer: ${riskLayer}\n- Risk value: ${riskValue}\n- District profile JSON: ${JSON.stringify(districtProfile)}\n\nResponse requirements:\n1) Provide a practical answer tailored to the local context where relevant.\n2) Mention 2-4 concrete next actions.\n3) If applicable, mention credible organizations to coordinate with (e.g., NDMA, PDMA, PMD, district administration, humanitarian agencies).\n4) Keep response within about 180 words.`,
        },
      ],
    })

    const answer = completion.choices[0]?.message?.content?.trim() ?? ''
    if (!answer) {
      res.status(500).json({ error: 'AI returned an empty advisory response.' })
      return
    }

    res.json({ answer })
  } catch (error) {
    const message = normalizeAiErrorMessage(error, 'Advisory generation failed.')
    res.status(getAiErrorHttpStatus(error)).json({ error: message })
  }
})

app.post('/api/pgbc/ai-summary', async (req, res) => {
  if (!hasKey) {
    res.status(503).json({ error: getAiMissingConfigUserMessage() })
    return
  }

  try {
    const sectionText = String(req.body?.sectionText ?? '').trim()
    const sectionLabel = String(req.body?.sectionLabel ?? '').trim()

    if (!sectionText) {
      res.status(400).json({ error: 'sectionText is required.' })
      return
    }

    const prompt = [
      'You are summarizing a building code section.',
      'Use only the exact section text provided below.',
      'Do not add assumptions or external interpretation.',
      'Output format:',
      '1) Summary (4-6 bullets)',
      '2) Key compliance points (if present in text)',
      `Section: ${sectionLabel}`,
      'Exact Section Text:',
      sectionText,
    ].join('\n\n')

    const completion = await createChatCompletion({
      openaiModel: OPENAI_MODEL,
      huggingFaceModel: HUGGINGFACE_CHAT_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'Summarize legal/technical code text exactly and conservatively.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const summaryText = completion.choices[0]?.message?.content?.trim() ?? ''
    if (!summaryText) {
      res.status(500).json({ error: 'AI returned an empty summary.' })
      return
    }

    res.json({ summaryText })
  } catch (error) {
    const message = normalizeAiErrorMessage(error, 'PGBC summary generation failed.')
    res.status(getAiErrorHttpStatus(error)).json({ error: message })
  }
})

app.post('/api/pgbc/code-qa', async (req, res) => {
  if (!hasKey) {
    res.status(503).json({ error: getAiMissingConfigUserMessage() })
    return
  }

  try {
    const question = String(req.body?.question ?? '').trim()
    const codeContexts = safeArray(req.body?.codeContexts)
      .map((item) => String(item ?? '').trim())
      .filter(Boolean)
      .slice(0, 8)
    const selectedCodeNames = safeArray(req.body?.selectedCodeNames)
      .map((item) => String(item ?? '').trim())
      .filter(Boolean)
      .slice(0, 50)
    const allCodeNames = safeArray(req.body?.allCodeNames)
      .map((item) => String(item ?? '').trim())
      .filter(Boolean)
      .slice(0, 100)

    if (!question) {
      res.status(400).json({ error: 'question is required.' })
      return
    }

    if (!codeContexts.length) {
      res.status(400).json({ error: 'At least one selected code context is required.' })
      return
    }

    const combinedContext = codeContexts.join('\n\n-----\n\n').slice(0, 120000)
    const selectedCodeList = selectedCodeNames.length ? selectedCodeNames.join(' | ') : 'Not provided'
    const availableCodeList = allCodeNames.length ? allCodeNames.join(' | ') : selectedCodeList

    const completion = await createChatCompletion({
      openaiModel: OPENAI_MODEL,
      huggingFaceModel: HUGGINGFACE_CHAT_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert Pakistan building code assistant. Use only provided selected code context for citations. If selected context includes citation candidates relevant to the question, treat it as addressed and cite those sections. Do not output contradictory results (e.g., not addressed while citing selected sections). If truly not addressed, set addressedInSelectedCodes=false and suggest better code selections from available code names.',
        },
        {
          role: 'user',
          content:
            `User question:\n${question}\n\nSelected code names:\n${selectedCodeList}\n\nAll available code names:\n${availableCodeList}\n\nSelected code context:\n${combinedContext}\n\nReturn strict JSON exactly in this schema:\n{\n  "addressedInSelectedCodes": boolean,\n  "directAnswer": string,\n  "points": [\n    {\n      "statement": string,\n      "citations": [\n        {\n          "codeName": string,\n          "chapter": string,\n          "section": string,\n          "evidence": string\n        }\n      ]\n    }\n  ],\n  "assumptions": string[],\n  "checkInPdf": string[],\n  "suggestedCodesIfNotAddressed": [\n    {\n      "codeName": string,\n      "why": string\n    }\n  ]\n}\n\nRules:\n- If not addressed, directAnswer must explicitly include: "Not addressed in the selected code(s)".\n- If addressedInSelectedCodes=true, provide section-level citations from selected code names.\n- Never mark not addressed when you cite sections from selected codes.\n- Keep chapter/section values concise (e.g., "10", "10.2.3").\n- suggestedCodesIfNotAddressed should be empty when addressedInSelectedCodes=true.`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    const parsed = extractJson(raw)

    const points = safeArray(parsed.points)
      .map((point) => ({
        statement: String(point?.statement ?? '').trim(),
        citations: safeArray(point?.citations)
          .map((citation) => ({
            codeName: String(citation?.codeName ?? '').trim(),
            chapter: String(citation?.chapter ?? '').trim(),
            section: String(citation?.section ?? '').trim(),
            evidence: String(citation?.evidence ?? '').trim(),
          }))
          .filter((citation) => citation.codeName || citation.chapter || citation.section || citation.evidence),
      }))
      .filter((point) => point.statement)
      .slice(0, 8)

    const directAnswer = String(parsed.directAnswer ?? '').trim()
    if (!directAnswer && points.length === 0) {
      res.status(500).json({ error: 'AI returned empty answer.' })
      return
    }

    const selectedNameSet = new Set(selectedCodeNames.map((item) => item.toLowerCase()))
    const isCitationFromSelected = (citation) => {
      const citationName = String(citation?.codeName ?? '').trim().toLowerCase()
      if (!citationName) return false
      if (selectedNameSet.has(citationName)) return true
      return [...selectedNameSet].some((name) => citationName.includes(name) || name.includes(citationName))
    }

    const hasSelectedCitations = points.some((point) =>
      safeArray(point?.citations).some((citation) => isCitationFromSelected(citation)),
    )

    const checkInPdfList = safeArray(parsed.checkInPdf)
      .map((item) => String(item ?? '').trim())
      .filter(Boolean)
      .slice(0, 6)

    const hasCheckInPdfFromSelected = checkInPdfList.some((line) => {
      const lowerLine = line.toLowerCase()
      return [...selectedNameSet].some((name) => lowerLine.includes(name))
    })

    let addressedInSelectedCodes = Boolean(parsed.addressedInSelectedCodes)
    if (!addressedInSelectedCodes && (hasSelectedCitations || hasCheckInPdfFromSelected)) {
      addressedInSelectedCodes = true
    }

    const shouldForceNotAddressedText = !addressedInSelectedCodes
    const normalizedDirectAnswer = shouldForceNotAddressedText
      ? directAnswer.includes('Not addressed in the selected code(s)')
        ? directAnswer
        : `Not addressed in the selected code(s). ${directAnswer}`.trim()
      : directAnswer.replace(/^Not addressed in the selected code\(s\)\.?\s*/i, '').trim() || directAnswer

    const suggestedCodesIfNotAddressed = shouldForceNotAddressedText
      ? safeArray(parsed.suggestedCodesIfNotAddressed)
          .map((item) => ({
            codeName: String(item?.codeName ?? '').trim(),
            why: String(item?.why ?? '').trim(),
          }))
          .filter((item) => item.codeName)
          .slice(0, 6)
      : []

    res.json({
      addressedInSelectedCodes,
      directAnswer: normalizedDirectAnswer,
      points,
      assumptions: safeArray(parsed.assumptions).map((item) => String(item ?? '').trim()).filter(Boolean).slice(0, 6),
      checkInPdf: checkInPdfList,
      suggestedCodesIfNotAddressed,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PGBC code Q&A failed.'
    res.status(500).json({ error: message })
  }
})

app.post('/api/models/resilience-catalog', async (req, res) => {
  if (!hasKey) {
    res.status(503).json({
      error: getAiMissingConfigUserMessage(),
    })
    return
  }

  try {
    const country = String(req.body.country ?? 'Pakistan')
    const province = String(req.body.province ?? 'National')

    const modelSpecs = [
      {
        id: 'flood-housing-cluster',
        title: 'Elevated Flood-Resilient Housing Cluster',
        description:
          'Cluster housing model with raised plinth, drainage channels, and protected lifeline utilities for riverine and urban flood zones.',
        features: [
          'Raised plinth and flood-compatible ground floor',
          'Perimeter drainage and sump-pump with backflow control',
          'Elevated electrical and water utility routing',
        ],
        advantagesPakistan: [
          'Reduces recurring flood repair burden in Sindh and South Punjab',
          'Improves post-flood re-occupancy speed for low-income communities',
          'Supports PDMA/municipal flood mitigation investments',
        ],
      },
      {
        id: 'seismic-school-block',
        title: 'Ductile Seismic School Block Retrofit Model',
        description:
          'School safety retrofit with column jacketing, confinement detailing, and non-structural anchorage to protect students in high seismic zones.',
        features: [
          'Column/beam jacketing at critical bays',
          'Masonry confinement and out-of-plane restraint',
          'Secured parapets, ceilings, and service systems',
        ],
        advantagesPakistan: [
          'Cuts collapse risk in KP and GB school infrastructure',
          'Improves continuity of education after earthquakes',
          'Aligns with phased public-sector retrofit budgeting',
        ],
      },
      {
        id: 'bridge-approach-protection',
        title: 'Bridge Approach and Embankment Resilience Model',
        description:
          'Transport resilience model combining embankment stabilization, seismic restraint components, and high-flow erosion protection.',
        features: [
          'Toe protection and sub-surface drainage',
          'Joint restrainers and bearing upgrade package',
          'Scour-resistant slope treatment and monitoring',
        ],
        advantagesPakistan: [
          'Reduces road cut-offs during flood and seismic events',
          'Protects strategic trade and evacuation corridors',
          'Lowers lifecycle maintenance costs for NHA/provincial roads',
        ],
      },
      {
        id: 'community-shelter-hub',
        title: 'Community Shelter + Early Warning Hub Model',
        description:
          'Multi-hazard community center with structural hardening, emergency stock nodes, and integrated warning communication interfaces.',
        features: [
          'Wind/seismic-resistant shelter core',
          'Emergency power, water, and communication stack',
          'Accessible evacuation and medical triage layout',
        ],
        advantagesPakistan: [
          'Strengthens last-mile preparedness in hazard-prone districts',
          'Improves coordination for district emergency response',
          'Provides dual-use public utility in normal times',
        ],
      },
    ]

    const modelResults = await runWithConcurrency(
      modelSpecs,
      async (spec) => {
        const prompt = `Photorealistic infrastructure visualization for ${spec.title} in ${country} (${province}). Show realistic construction context, local materials, climate-appropriate design, and civil engineering details. No text overlays.`
        const imageBase64 = await generateImageBase64({ prompt, size: '1024x1024' })
        if (!imageBase64) {
          throw new Error(`No image data returned for ${spec.title}`)
        }

        return {
          ...spec,
          imageDataUrl: `data:image/png;base64,${imageBase64}`,
        }
      },
      AI_IMAGE_CONCURRENCY,
    )

    const models = modelResults
      .filter((item) => item?.ok)
      .map((item) => item.value)
      .filter(Boolean)

    if (models.length === 0) {
      const firstError = modelResults.find((item) => item && !item.ok)?.error
      throw (firstError instanceof Error ? firstError : new Error('Infra model generation failed.'))
    }

    res.json({
      models,
      partial: models.length < modelSpecs.length,
      failed: modelSpecs.length - models.length,
    })
  } catch (error) {
    const message = normalizeAiErrorMessage(error, 'Infra model generation failed.')
    res.status(getAiErrorHttpStatus(error)).json({ error: message })
  }
})

app.get('/api/models/shared-generated', async (_req, res) => {
  try {
    const models = await readSharedInfraModels()
    res.json({ models })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load shared infra models.'
    res.status(500).json({ error: message })
  }
})

app.post('/api/models/shared-generated', async (req, res) => {
  try {
    const incoming = safeArray(req.body?.models)
    if (incoming.length === 0) {
      res.status(400).json({ error: 'models array is required.' })
      return
    }

    const result = await appendSharedInfraModels(incoming)
    res.json({
      added: result.added,
      total: result.total,
      models: result.models,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save shared infra models.'
    res.status(500).json({ error: message })
  }
})

app.post('/api/models/shared-generated/sync-github', async (req, res) => {
  try {
    if (!INFRA_MODELS_GIT_SYNC_ENABLED) {
      res.status(403).json({ error: 'GitHub sync is disabled. Set INFRA_MODELS_GIT_SYNC_ENABLED=true on server.' })
      return
    }

    const syncResult = await syncSharedInfraModelsToGitHub()
    res.json(syncResult)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub sync failed for shared infra models.'
    res.status(500).json({ error: message })
  }
})

app.post('/api/models/research', async (req, res) => {
  if (!hasKey) {
    res.status(503).json({
      error: getAiMissingConfigUserMessage(),
    })
    return
  }

  try {
    const modelName = String(req.body.modelName ?? '').trim()
    const province = String(req.body.province ?? 'Pakistan')

    if (!modelName) {
      res.status(400).json({ error: 'modelName is required.' })
      return
    }

    const completion = await createChatCompletion({
      openaiModel: OPENAI_MODEL,
      huggingFaceModel: HUGGINGFACE_CHAT_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are a civil engineering research assistant. Return strict JSON only. Use conservative, practical guidance for Pakistan and include source links from credible institutions where possible.',
        },
        {
          role: 'user',
          content:
            `Research this infrastructure model: ${modelName}. Focus on where it is used around the world and feasibility for Pakistan (${province}). Return strict JSON using this schema:
{
  "modelName": string,
  "overview": string,
  "globalUseCases": [{ "country": string, "project": string, "application": string, "evidenceNote": string }],
  "pakistanUseCases": string[],
  "features": string[],
  "materials": [{ "name": string, "specification": string, "availabilityInPakistan": "High|Medium|Low" }],
  "availability": {
    "readinessPakistan": string,
    "localSupplyPotential": string,
    "importDependencyNote": string
  },
  "resilience": {
    "flood": string,
    "earthquake": string,
    "floodScore": number,
    "earthquakeScore": number
  },
  "sourceLinks": string[],
  "googleSearchHints": {
    "global": string,
    "pakistan": string
  }
}. Constraints: floodScore and earthquakeScore must be integers 1-10. sourceLinks should be direct URLs and not placeholders.`,
        },
      ],
    })

    const text = completion.choices[0]?.message?.content ?? ''
    const parsed = extractJson(text)

    const googleGlobal = `https://www.google.com/search?q=${encodeURIComponent(`${modelName} global case studies infrastructure`)}`
    const googlePakistan = `https://www.google.com/search?q=${encodeURIComponent(`${modelName} Pakistan infrastructure`)}`

    res.json({
      modelName: String(parsed.modelName ?? modelName),
      overview: String(parsed.overview ?? ''),
      globalUseCases: safeArray(parsed.globalUseCases).map((item) => ({
        country: String(item?.country ?? ''),
        project: String(item?.project ?? ''),
        application: String(item?.application ?? ''),
        evidenceNote: String(item?.evidenceNote ?? ''),
      })),
      pakistanUseCases: safeArray(parsed.pakistanUseCases).map((item) => String(item)),
      features: safeArray(parsed.features).map((item) => String(item)),
      materials: safeArray(parsed.materials).map((item) => ({
        name: String(item?.name ?? ''),
        specification: String(item?.specification ?? ''),
        availabilityInPakistan: String(item?.availabilityInPakistan ?? 'Medium'),
      })),
      availability: {
        readinessPakistan: String(parsed.availability?.readinessPakistan ?? ''),
        localSupplyPotential: String(parsed.availability?.localSupplyPotential ?? ''),
        importDependencyNote: String(parsed.availability?.importDependencyNote ?? ''),
      },
      resilience: {
        flood: String(parsed.resilience?.flood ?? ''),
        earthquake: String(parsed.resilience?.earthquake ?? ''),
        floodScore: Math.max(1, Math.min(10, Number(parsed.resilience?.floodScore ?? 6) || 6)),
        earthquakeScore: Math.max(1, Math.min(10, Number(parsed.resilience?.earthquakeScore ?? 6) || 6)),
      },
      sourceLinks: safeArray(parsed.sourceLinks).map((item) => String(item)).filter(Boolean),
      googleSearch: {
        global: googleGlobal,
        pakistan: googlePakistan,
        globalHint: String(parsed.googleSearchHints?.global ?? `${modelName} global case studies infrastructure`),
        pakistanHint: String(parsed.googleSearchHints?.pakistan ?? `${modelName} Pakistan infrastructure applications`),
      },
    })
  } catch (error) {
    const message = normalizeAiErrorMessage(error, 'Infra model research failed.')
    res.status(getAiErrorHttpStatus(error)).json({ error: message })
  }
})

app.post('/api/models/research-images', async (req, res) => {
  if (!hasKey) {
    res.status(503).json({
      error: getAiMissingConfigUserMessage(),
    })
    return
  }

  try {
    const modelName = String(req.body.modelName ?? '').trim()
    const province = String(req.body.province ?? 'Pakistan')

    if (!modelName) {
      res.status(400).json({ error: 'modelName is required.' })
      return
    }

    const views = ['Front View', 'Back View', 'Left Side View', 'Right Side View', 'Top/Roof View', 'Isometric View']

    const generationResults = await runWithConcurrency(
      views,
      async (view) => {
        const prompt = `Photorealistic civil-infrastructure concept image of ${modelName} for Pakistan (${province}). Required camera angle: ${view}. Show realistic structural details, drainage, seismic safety elements, and material context. No text labels.`
        const b64 = await generateImageBase64({ prompt, size: '1024x1024' })
        if (!b64) {
          throw new Error(`No image data returned for ${view}`)
        }

        return {
          view,
          imageDataUrl: `data:image/png;base64,${b64}`,
        }
      },
      AI_IMAGE_CONCURRENCY,
    )

    const images = generationResults
      .filter((item) => item?.ok)
      .map((item) => item.value)
      .filter(Boolean)

    if (images.length === 0) {
      const firstError = generationResults.find((item) => item && !item.ok)?.error
      throw (firstError instanceof Error ? firstError : new Error('Infra model view image generation failed.'))
    }

    res.json({
      images,
      partial: images.length < views.length,
      failed: views.length - images.length,
    })
  } catch (error) {
    const message = normalizeAiErrorMessage(error, 'Infra model view image generation failed.')
    res.status(getAiErrorHttpStatus(error)).json({ error: message })
  }
})

app.post('/api/models/structural-design-report', async (req, res) => {
  if (!hasKey) {
    res.status(503).json({
      error: getAiMissingConfigUserMessage(),
    })
    return
  }

  try {
    const modelName = String(req.body.modelName ?? '').trim()
    const location = String(req.body.location ?? '').trim()
    const stories = Number(req.body.stories ?? 1)
    const geoTechReport = String(req.body.geoTechReport ?? '').trim()
    const intendedUse = String(req.body.intendedUse ?? 'house').trim()

    if (!modelName || !location || !stories) {
      res.status(400).json({ error: 'modelName, location and stories are required.' })
      return
    }

    const completion = await createChatCompletion({
      openaiModel: OPENAI_MODEL,
      huggingFaceModel: HUGGINGFACE_CHAT_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are a structural engineer. Provide a preliminary conceptual report only (not stamped final design). Return strict JSON.',
        },
        {
          role: 'user',
          content:
            `Generate a preliminary structural design report for real-world planning.
Model: ${modelName}
Location: ${location}
Stories: ${stories}
Intended Use: ${intendedUse}
GeoTech Report (optional input): ${geoTechReport || 'Not provided'}

Return strict JSON schema:
{
  "summary": string,
  "designAssumptions": string[],
  "structuralSystem": string,
  "foundationSystem": string,
  "loadPathAndLateralSystem": string,
  "materialSpecifications": string[],
  "preliminaryMemberSizing": string[],
  "floodResilienceMeasures": string[],
  "earthquakeResilienceMeasures": string[],
  "constructionMaterialsBOQ": string[],
  "rateAndCostNotes": string[],
  "codeAndComplianceChecks": string[],
  "limitations": string[]
}. Keep practical for Pakistan and mention that final design needs local licensed engineer review.`,
        },
      ],
    })

    const text = completion.choices[0]?.message?.content ?? ''
    const parsed = extractJson(text)

    res.json({
      summary: String(parsed.summary ?? ''),
      designAssumptions: safeArray(parsed.designAssumptions).map((item) => String(item)),
      structuralSystem: String(parsed.structuralSystem ?? ''),
      foundationSystem: String(parsed.foundationSystem ?? ''),
      loadPathAndLateralSystem: String(parsed.loadPathAndLateralSystem ?? ''),
      materialSpecifications: safeArray(parsed.materialSpecifications).map((item) => String(item)),
      preliminaryMemberSizing: safeArray(parsed.preliminaryMemberSizing).map((item) => String(item)),
      floodResilienceMeasures: safeArray(parsed.floodResilienceMeasures).map((item) => String(item)),
      earthquakeResilienceMeasures: safeArray(parsed.earthquakeResilienceMeasures).map((item) => String(item)),
      constructionMaterialsBOQ: safeArray(parsed.constructionMaterialsBOQ).map((item) => String(item)),
      rateAndCostNotes: safeArray(parsed.rateAndCostNotes).map((item) => String(item)),
      codeAndComplianceChecks: safeArray(parsed.codeAndComplianceChecks).map((item) => String(item)),
      limitations: safeArray(parsed.limitations).map((item) => String(item)),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    const message = normalizeAiErrorMessage(error, 'Structural design report generation failed.')
    res.status(getAiErrorHttpStatus(error)).json({ error: message })
  }
})

// ========== ADMIN APP ENDPOINTS ==========

app.get('/api/admin/session', (req, res) => {
  const session = requireAdminSession(req, res)
  if (!session) return
  res.json({
    ok: true,
    email: session.email,
    expiresAt: new Date(session.expiresAt).toISOString(),
  })
})

app.get('/api/admin/green-codes', async (req, res) => {
  const session = requireAdminSession(req, res)
  if (!session) return
  try {
    const [rows, discoveredCodeKeys] = await Promise.all([
      readGreenBuildingCodes(),
      discoverGreenBuildingCodeKeys(),
    ])
    res.json({ codes: rows, discoveredCodeKeys })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load Green Building Codes data.'
    res.status(500).json({ error: message })
  }
})

app.post('/api/admin/green-codes', async (req, res) => {
  const session = requireAdminSession(req, res)
  if (!session) return
  try {
    const rows = await readGreenBuildingCodes()
    const next = normalizeGreenCodeRecord(req.body)
    rows.unshift(next)
    await writeGreenBuildingCodes(rows)
    res.status(201).json(next)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create Green Building Code record.'
    res.status(500).json({ error: message })
  }
})

app.post('/api/admin/green-codes/upload', upload.single('file'), async (req, res) => {
  const session = requireAdminSession(req, res)
  if (!session) return

  try {
    if (!req.file) {
      res.status(400).json({ error: 'PDF file is required.' })
      return
    }

    const mime = String(req.file.mimetype ?? '').toLowerCase()
    const originalName = String(req.file.originalname ?? '').toLowerCase()
    if (mime !== 'application/pdf' && !originalName.endsWith('.pdf')) {
      res.status(400).json({ error: 'Only PDF uploads are supported.' })
      return
    }

    const safeBase = String(req.body?.title ?? req.file.originalname ?? 'uploaded-code')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60) || 'uploaded-code'
    const fileName = `${Date.now()}-${safeBase}.pdf`

    let relativePdfPath = `All Codes/Uploaded/${fileName}`

    if (isMediaUploadConfigured()) {
      const mediaKey = `pgbc/All Codes/Uploaded/${fileName}`
      const publicUrl = await uploadBufferLocalDisabled({
        key: mediaKey,
        buffer: req.file.buffer,
        contentType: 'application/pdf',
      })
      relativePdfPath = publicUrl
    } else {
      await fs.mkdir(uploadedGreenCodesDir, { recursive: true })
      const absolutePath = path.join(uploadedGreenCodesDir, fileName)
      await fs.writeFile(absolutePath, req.file.buffer)
    }

    const rows = await readGreenBuildingCodes()
    const next = normalizeGreenCodeRecord({
      title: req.body?.title || req.file.originalname.replace(/\.pdf$/i, ''),
      codeKey: req.body?.codeKey,
      category: req.body?.category,
      year: req.body?.year,
      active: req.body?.active,
      notes: req.body?.notes,
      pdfPath: relativePdfPath,
      source: 'uploaded',
    })
    rows.unshift(next)
    await writeGreenBuildingCodes(rows)

    res.status(201).json(next)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload Green Building Code.'
    res.status(500).json({ error: message })
  }
})

app.patch('/api/admin/green-codes/:id', async (req, res) => {
  const session = requireAdminSession(req, res)
  if (!session) return
  try {
    const recordId = String(req.params.id ?? '').trim()
    const rows = await readGreenBuildingCodes()
    const index = rows.findIndex((item) => String(item?.id) === recordId)
    if (index < 0) {
      res.status(404).json({ error: 'Code record not found.' })
      return
    }
    rows[index] = normalizeGreenCodeRecord({ ...rows[index], ...req.body }, recordId)
    await writeGreenBuildingCodes(rows)
    res.json(rows[index])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update Green Building Code record.'
    res.status(500).json({ error: message })
  }
})

app.delete('/api/admin/green-codes/:id', async (req, res) => {
  const session = requireAdminSession(req, res)
  if (!session) return
  try {
    const recordId = String(req.params.id ?? '').trim()
    const rows = await readGreenBuildingCodes()
    const existing = rows.find((item) => String(item?.id) === recordId)
    const filtered = rows.filter((item) => String(item?.id) !== recordId)
    if (filtered.length === rows.length) {
      res.status(404).json({ error: 'Code record not found.' })
      return
    }

    if (existing?.pdfPath) {
      if (String(existing.pdfPath).includes('/storage/content/') || String(existing.pdfPath).includes('/static/media/local/')) {
        await deleteLocalObjectByPublicUrl(String(existing.pdfPath))
      } else if (/^All Codes\/Uploaded\//i.test(existing.pdfPath)) {
        const absolutePath = path.join(repoRootDir, 'frontend', 'public', 'pgbc', existing.pdfPath)
        await fs.unlink(absolutePath).catch(() => {})
      }
    }

    await writeGreenBuildingCodes(filtered)
    res.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete Green Building Code record.'
    res.status(500).json({ error: message })
  }
})

app.get('/api/material-hubs', async (_req, res) => {
  try {
    const payload = await loadMaterialHubsAdminPayload()
    res.json(payload)
  } catch (error) {
    console.error('[api/material-hubs] GET failed:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/admin/material-hubs', async (req, res) => {
  const session = requireAdminSession(req, res)
  if (!session) return
  try {
    const payload = await loadMaterialHubsAdminPayload()
    res.json(payload)
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 500
    const message = error instanceof Error ? error.message : 'Failed to load Material Hubs data.'
    res.status(Number.isFinite(status) && status >= 400 ? status : 500).json({ error: message })
  }
})

app.post('/api/admin/material-hubs/hubs', async (req, res) => {
  const session = requireAdminSession(req, res)
  if (!session) return
  try {
    const name = String(req.body?.name ?? '').trim()
    if (!name) {
      res.status(400).json({ error: 'Hub name is required.' })
      return
    }

    const basePayload = sanitizeMaterialHubPayload(req.body, {
      excludeKeys: ['id', 'created_at', 'updated_at'],
    })

    const payload = {
      ...basePayload,
      name,
      location: String(req.body?.location ?? '').trim() || 'Pakistan',
      district: String(req.body?.district ?? '').trim() || 'Unknown',
      latitude: Number(req.body?.latitude ?? 0) || 0,
      longitude: Number(req.body?.longitude ?? 0) || 0,
      capacity: Math.round(toPositiveNumber(req.body?.capacity, 0)),
      status: normalizeHubStatusForAdmin(req.body?.status),
      stock_percentage: Math.max(0, Math.min(100, Number(req.body?.stock_percentage ?? 0) || 0)),
      damage_percentage: Math.max(0, Math.min(100, Number(req.body?.damage_percentage ?? 0) || 0)),
    }

    const created = await createMaterialHub(payload)
    res.status(201).json(created)
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 500
    const message = error instanceof Error ? error.message : 'Failed to create Material Hub.'
    res.status(Number.isFinite(status) && status >= 400 ? status : 500).json({ error: message })
  }
})

app.patch('/api/admin/material-hubs/hubs/:id', async (req, res) => {
  const session = requireAdminSession(req, res)
  if (!session) return
  try {
    const hubId = String(req.params.id ?? '').trim()
    if (!hubId) {
      res.status(400).json({ error: 'Hub id is required.' })
      return
    }

    const patch = sanitizeMaterialHubPayload(req.body, {
      excludeKeys: ['id', 'created_at', 'updated_at'],
    })
    if (req.body?.name !== undefined) patch.name = String(req.body.name ?? '').trim()
    if (req.body?.location !== undefined) patch.location = String(req.body.location ?? '').trim()
    if (req.body?.district !== undefined) patch.district = String(req.body.district ?? '').trim()
    if (req.body?.latitude !== undefined) patch.latitude = Number(req.body.latitude ?? 0) || 0
    if (req.body?.longitude !== undefined) patch.longitude = Number(req.body.longitude ?? 0) || 0
    if (req.body?.capacity !== undefined) patch.capacity = Math.round(toPositiveNumber(req.body.capacity, 0))
    if (req.body?.status !== undefined) patch.status = normalizeHubStatusForAdmin(req.body.status)
    if (req.body?.stock_percentage !== undefined) {
      patch.stock_percentage = Math.max(0, Math.min(100, Number(req.body.stock_percentage ?? 0) || 0))
    }
    if (req.body?.damage_percentage !== undefined) {
      patch.damage_percentage = Math.max(0, Math.min(100, Number(req.body.damage_percentage ?? 0) || 0))
    }

    const updated = await updateMaterialHub(hubId, patch)
    if (!updated) {
      res.status(404).json({ error: 'Hub not found.' })
      return
    }

    res.json(updated)
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 500
    const message = error instanceof Error ? error.message : 'Failed to update Material Hub.'
    res.status(Number.isFinite(status) && status >= 400 ? status : 500).json({ error: message })
  }
})

app.delete('/api/admin/material-hubs/hubs/:id', async (req, res) => {
  const session = requireAdminSession(req, res)
  if (!session) return
  try {
    const hubId = String(req.params.id ?? '').trim()
    if (!hubId) {
      res.status(400).json({ error: 'Hub id is required.' })
      return
    }

    const deleted = await deleteMaterialHub(hubId)
    if (!deleted) {
      res.status(404).json({ error: 'Hub not found.' })
      return
    }

    res.json({ ok: true })
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 500
    const message = error instanceof Error ? error.message : 'Failed to delete Material Hub.'
    res.status(Number.isFinite(status) && status >= 400 ? status : 500).json({ error: message })
  }
})

app.post('/api/admin/material-hubs/entries', async (req, res) => {
  const session = requireAdminSession(req, res)
  if (!session) return
  try {
    const hubId = String(req.body?.hub_id ?? req.body?.hubId ?? '').trim()
    const name = String(req.body?.name ?? '').trim()
    const unit = String(req.body?.unit ?? '').trim() || 'units'

    if (!hubId || !name) {
      res.status(400).json({ error: 'hub_id and name are required.' })
      return
    }

    const computed = computeEntryFields(req.body)
    const basePayload = sanitizeMaterialHubPayload(req.body, {
      excludeKeys: ['id', 'created_at', 'updated_at', 'closing', 'percentage_remaining'],
    })

    const payload = {
      ...basePayload,
      hub_id: hubId,
      name,
      unit,
      opening: computed.opening,
      received: computed.received,
      issued: computed.issued,
      damaged: computed.damaged,
      closing: computed.closing,
      percentage_remaining: computed.percentageRemaining,
    }

    const created = await createMaterialEntry(payload)
    res.status(201).json(created)
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 500
    const message = error instanceof Error ? error.message : 'Failed to create inventory entry.'
    res.status(Number.isFinite(status) && status >= 400 ? status : 500).json({ error: message })
  }
})

app.patch('/api/admin/material-hubs/entries/:id', async (req, res) => {
  const session = requireAdminSession(req, res)
  if (!session) return
  try {
    const entryId = String(req.params.id ?? '').trim()
    if (!entryId) {
      res.status(400).json({ error: 'Entry id is required.' })
      return
    }

    const existing = await getMaterialEntryById(entryId)
    if (!existing) {
      res.status(404).json({ error: 'Entry not found.' })
      return
    }

    const merged = {
      opening: req.body?.opening ?? existing.opening,
      received: req.body?.received ?? existing.received,
      issued: req.body?.issued ?? existing.issued,
      damaged: req.body?.damaged ?? existing.damaged,
    }
    const computed = computeEntryFields(merged)
    const nextHubId = String(req.body?.hub_id ?? req.body?.hubId ?? existing.hub_id).trim()

    const basePatch = sanitizeMaterialHubPayload(req.body, {
      excludeKeys: ['id', 'created_at', 'updated_at', 'closing', 'percentage_remaining'],
    })

    const patch = {
      ...basePatch,
      hub_id: nextHubId,
      name: req.body?.name !== undefined ? String(req.body.name ?? '').trim() : existing.name,
      unit: req.body?.unit !== undefined ? String(req.body.unit ?? '').trim() || 'units' : existing.unit,
      opening: computed.opening,
      received: computed.received,
      issued: computed.issued,
      damaged: computed.damaged,
      closing: computed.closing,
      percentage_remaining: computed.percentageRemaining,
    }

    const updated = await updateMaterialEntry(entryId, patch)
    if (!updated) {
      res.status(404).json({ error: 'Entry not found.' })
      return
    }

    res.json(updated)
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 500
    const message = error instanceof Error ? error.message : 'Failed to update inventory entry.'
    res.status(Number.isFinite(status) && status >= 400 ? status : 500).json({ error: message })
  }
})

app.delete('/api/admin/material-hubs/entries/:id', async (req, res) => {
  const session = requireAdminSession(req, res)
  if (!session) return
  try {
    const entryId = String(req.params.id ?? '').trim()
    if (!entryId) {
      res.status(400).json({ error: 'Entry id is required.' })
      return
    }

    const deleted = await deleteMaterialEntry(entryId)
    if (!deleted) {
      res.status(404).json({ error: 'Entry not found.' })
      return
    }

    res.json({ ok: true })
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 500
    const message = error instanceof Error ? error.message : 'Failed to delete inventory entry.'
    res.status(Number.isFinite(status) && status >= 400 ? status : 500).json({ error: message })
  }
})

// ========== END ADMIN APP ENDPOINTS ==========

app.use((error, req, res, next) => {
  const apiPath = String(req.path ?? '')
  if (apiPath.startsWith('/api')) {
    applyApiCorsHeaders(req, res)
  }
  if (error instanceof SyntaxError && 'body' in error && apiPath.startsWith('/api/')) {
    res.status(400).json({ error: 'Invalid JSON payload.' })
    return
  }
  if (apiPath.startsWith('/api')) {
    console.error('? GLOBAL ERROR:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' })
    }
    return
  }
  next(error)
})

app.use('/api', (req, res) => {
  applyApiCorsHeaders(req, res)
  console.error(`[api] no route matched: ${req.method} ${req.originalUrl ?? req.url}`)
  res.status(404).json({ error: 'API route not found' })
})

app.get('/', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({
    status: 'ok',
    service: 'resilience360-api',
    mode: 'api-only',
    frontend: 'served-by-vercel',
    mediaProxy: isRemoteMediaMode ? 'remote' : 'local',
    mediaBaseUrl: isRemoteMediaMode ? MEDIA_BASE_URL : null,
  })
})

app.use((req, res) => {
  const pathName = String(req.path ?? '')
  if (pathName.startsWith('/storage')) {
    res.status(404).json({ error: 'storage_route_not_found' })
    return
  }
  res.status(404).json({ error: 'route_not_found', allowedRoots: ['/api', '/storage'] })
})

async function startServer() {
  if (
    selectedAiProvider === 'openai' &&
    !['1', 'true', 'yes'].includes(String(process.env.ALLOW_MISSING_OPENAI_KEY ?? '').trim().toLowerCase())
  ) {
    try {
      const { assertOpenAiKeyConfigured } = await import('./services/aiService.mjs')
      assertOpenAiKeyConfigured()
    } catch (e) {
      console.error(
        '[boot] OpenAI key check failed ? continuing so public API (CMS, homepage-config, etc.) can start. AI routes need OPENAI_API_KEY (or set ALLOW_MISSING_OPENAI_KEY=1 to skip this check).',
        e instanceof Error ? e.message : e,
      )
    }
  }

  initMongoConnection(mongoUri)
  console.info('[boot] Local-first mode ? cloud sync disabled; serving from data/ and storage/content/')

  initRealtimeHub(httpServer)
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('?? BACKEND BOOTED SUCCESSFULLY')
    console.log('?? Server running on port:', PORT)
    console.info(`OpenAI Configured: ${isOpenAiConfigured() ? 'YES' : 'NO'}`)
    console.log('?? Backend running on correct entry file')
    console.log('?? Backend ready')
    console.log(
      '?? API base:',
      process.env.PUBLIC_API_BASE_URL || '(co-host /api on same origin as the web app, or set PUBLIC_API_BASE_URL)',
    )
    console.info('[API] Listening', { port: PORT, entry: 'backend/index.mjs' })
  })
}

startServer().catch((err) => {
  console.error('[server] startServer failed:', err)
  process.exit(1)
})



