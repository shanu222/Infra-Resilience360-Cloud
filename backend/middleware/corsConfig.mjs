import cors from 'cors'

const stripTrailingSlash = (value) => String(value ?? '').trim().replace(/\/+$/, '')

/** Production and local dev browser origins allowed to call the API with credentials. */
export const corsOriginAllowlist = [
  'https://infra-resilience360-cloud.vercel.app',
  'https://www.infraresilience.org',
  'https://infraresilience.org',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  // Live Inventory Admin portal dev server; its production domain is supplied via CORS_ORIGINS.
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  // Capacitor Android / iOS WebView origins (iframe portal API calls).
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
  'ionic://localhost',
  ...String(process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '')
    .split(/[,;\s]+/)
    .map((v) => stripTrailingSlash(v))
    .filter(Boolean),
]

const normalizedAllowlist = new Set(corsOriginAllowlist.map(stripTrailingSlash))

export function isAllowedCorsOrigin(origin) {
  const o = stripTrailingSlash(origin)
  if (!o) return true
  if (normalizedAllowlist.has(o)) return true
  return false
}

export function applyApiCorsHeaders(req, res) {
  const origin = stripTrailingSlash(req?.headers?.origin)
  if (!origin) return
  if (!isAllowedCorsOrigin(origin)) return
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type')
  res.setHeader('Vary', 'Origin')
}

const CORS_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD'
const CORS_HEADERS =
  'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, cache-control, Range'

export function buildCorsOptions() {
  return {
    origin(origin, callback) {
      const normalized = stripTrailingSlash(origin)
      if (!normalized) return callback(null, true)
      if (isAllowedCorsOrigin(normalized)) return callback(null, normalized)
      console.error('[CORS] Blocked origin:', normalized)
      return callback(null, false)
    },
    methods: CORS_METHODS.split(','),
    allowedHeaders: CORS_HEADERS.split(',').map((h) => h.trim()),
    exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges', 'Content-Type'],
    credentials: true,
    optionsSuccessStatus: 204,
    maxAge: 86_400,
  }
}

export function createCorsMiddleware() {
  return cors(buildCorsOptions())
}

/**
 * Ensures every `/api/*` response (including multipart vision uploads) carries CORS headers
 * and handles OPTIONS preflight when upstream proxies bypass the global cors() handler.
 */
export function apiCorsEnforcementMiddleware(req, res, next) {
  applyApiCorsHeaders(req, res)

  if (String(req.method || '').toUpperCase() === 'OPTIONS') {
    const requestedHeaders = String(req.headers['access-control-request-headers'] ?? '').trim()
    res.setHeader('Access-Control-Allow-Methods', CORS_METHODS)
    res.setHeader('Access-Control-Allow-Headers', requestedHeaders || CORS_HEADERS)
    res.setHeader('Access-Control-Max-Age', '86400')
    res.status(204).end()
    return
  }

  next()
}
