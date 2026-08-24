/**
 * Blocks administrative CMS mutations while preserving public GET/HEAD/OPTIONS APIs.
 */

const READ_ONLY_MESSAGE = 'Administrative editing has been disabled.'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function requestPath(req) {
  const raw = String(req.path || req.url || '').split('?')[0]
  return raw.startsWith('/') ? raw : `/${raw}`
}

function isAdminMutationPath(path, method) {
  const m = String(method || '').toUpperCase()
  if (SAFE_METHODS.has(m)) return false
  return path === '/api/admin' || path.startsWith('/api/admin/')
}

function isBlockedAdminUploadPath(path, method) {
  const m = String(method || '').toUpperCase()
  if (m !== 'POST') return false
  return path === '/api/upload'
}

export function readOnlyModeMiddleware(req, res, next) {
  const method = String(req.method || 'GET').toUpperCase()
  if (SAFE_METHODS.has(method)) return next()

  const path = requestPath(req)

  if (
    isAdminMutationPath(path, method) ||
    isBlockedAdminUploadPath(path, method)
  ) {
    return res.status(403).json({ error: READ_ONLY_MESSAGE })
  }

  return next()
}

export const READ_ONLY_ADMIN_MESSAGE = READ_ONLY_MESSAGE
