/**
 * Admin API protection: clients should send `x-admin-key` (see VITE_ADMIN_API_KEY / ADMIN_API_KEY).
 * Also accepts legacy `x-admin-api-key` for the same value. Skips OPTIONS (CORS preflight).
 */
export function getExpectedAdminApiKey() {
  return String(process.env.ADMIN_API_KEY ?? 'secure-key').trim()
}

function getProvidedAdminKey(req) {
  return String(
    req.get('x-admin-key') ||
      req.get('x-admin-api-key') ||
      req.headers['x-admin-key'] ||
      req.headers['x-admin-api-key'] ||
      '',
  ).trim()
}

export function isValidAdminApiKey(provided) {
  const expected = getExpectedAdminApiKey()
  return String(provided ?? '').trim() === expected
}

export function assertAdminApiKey(req, res) {
  const expected = getExpectedAdminApiKey()
  const got = getProvidedAdminKey(req)
  if (got !== expected) {
    res.status(403).json({ error: 'Unauthorized' })
    return false
  }
  return true
}
