/**
 * Authentication for the standalone Material Hub inventory admin portal.
 *
 * The password never leaves the server: the portal posts it once to /login and
 * receives a short-lived HMAC-signed token used as a bearer credential afterwards.
 */

import crypto from 'node:crypto'

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 60_000

const readEnv = (name) => String(process.env[name] ?? '').trim()

function configuredPassword() {
  return readEnv('MATERIAL_HUB_ADMIN_PASSWORD')
}

export function isInventoryAdminConfigured() {
  return configuredPassword().length > 0
}

function signingSecret() {
  const explicit = readEnv('MATERIAL_HUB_ADMIN_TOKEN_SECRET') || readEnv('JWT_SECRET')
  if (explicit) return explicit
  // Derived from the password so tokens are still unforgeable without extra config.
  return crypto.createHash('sha256').update(`material-hub-inventory:${configuredPassword()}`).digest('hex')
}

const base64url = (input) => Buffer.from(input).toString('base64url')

function sign(payloadB64) {
  return crypto.createHmac('sha256', signingSecret()).update(payloadB64).digest('base64url')
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a ?? ''))
  const right = Buffer.from(String(b ?? ''))
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

/* ------------------------------------------------------------------ */
/* Brute-force throttling                                              */
/* ------------------------------------------------------------------ */

const attempts = new Map()

function clientKey(req) {
  const forwarded = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim()
  return forwarded || req.ip || req.socket?.remoteAddress || 'unknown'
}

function lockoutRemainingMs(key) {
  const record = attempts.get(key)
  if (!record || record.count < MAX_FAILED_ATTEMPTS) return 0
  const remaining = record.lockedUntil - Date.now()
  if (remaining <= 0) {
    attempts.delete(key)
    return 0
  }
  return remaining
}

function registerFailure(key) {
  const record = attempts.get(key) ?? { count: 0, lockedUntil: 0 }
  record.count += 1
  if (record.count >= MAX_FAILED_ATTEMPTS) record.lockedUntil = Date.now() + LOCKOUT_MS
  attempts.set(key, record)
}

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */

function issueToken() {
  const expiresAt = Date.now() + TOKEN_TTL_MS
  const payloadB64 = base64url(JSON.stringify({ sub: 'material-hub-inventory-admin', exp: expiresAt }))
  return { token: `${payloadB64}.${sign(payloadB64)}`, expiresAt }
}

function verifyToken(token) {
  const raw = String(token ?? '').trim()
  const separator = raw.lastIndexOf('.')
  if (separator <= 0) return null

  const payloadB64 = raw.slice(0, separator)
  const signature = raw.slice(separator + 1)
  if (!safeEqual(signature, sign(payloadB64))) return null

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
    if (payload?.sub !== 'material-hub-inventory-admin') return null
    if (!Number.isFinite(payload?.exp) || payload.exp <= Date.now()) return null
    return payload
  } catch {
    return null
  }
}

function bearerToken(req) {
  const header = String(req.headers.authorization ?? '')
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match ? match[1].trim() : ''
}

/* ------------------------------------------------------------------ */
/* Handlers                                                            */
/* ------------------------------------------------------------------ */

export function handleInventoryAdminLogin(req, res) {
  if (!isInventoryAdminConfigured()) {
    return res.status(503).json({
      error: 'Inventory administration is not configured on the server.',
    })
  }

  const key = clientKey(req)
  const lockedFor = lockoutRemainingMs(key)
  if (lockedFor > 0) {
    return res.status(429).json({
      error: `Too many failed attempts. Try again in ${Math.ceil(lockedFor / 1000)} seconds.`,
    })
  }

  const password = String(req.body?.password ?? '')
  if (!password || !safeEqual(password, configuredPassword())) {
    registerFailure(key)
    return res.status(401).json({ error: 'Incorrect password.' })
  }

  attempts.delete(key)
  const { token, expiresAt } = issueToken()
  return res.json({ token, expiresAt })
}

/** Express middleware guarding every inventory mutation endpoint. */
export function requireInventoryAdmin(req, res, next) {
  if (!isInventoryAdminConfigured()) {
    return res.status(503).json({ error: 'Inventory administration is not configured on the server.' })
  }
  const session = verifyToken(bearerToken(req))
  if (!session) {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' })
  }
  req.inventoryAdmin = session
  return next()
}
