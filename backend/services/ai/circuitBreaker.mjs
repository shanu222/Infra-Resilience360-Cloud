import {
  AI_CIRCUIT_BREAKER_COOLDOWN_MS,
  AI_CIRCUIT_BREAKER_THRESHOLD,
} from './config.mjs'

const breakers = new Map()

const initEntry = () => ({
  consecutiveFailures: 0,
  openUntil: 0,
  lastStatus: null,
  lastError: null,
  lastLatencyMs: null,
  lastCheckedAt: null,
  healthy: true,
})

function getEntry(provider) {
  if (!breakers.has(provider)) {
    breakers.set(provider, initEntry())
  }
  return breakers.get(provider)
}

export function isProviderOpen(provider) {
  const entry = getEntry(provider)
  const now = Date.now()
  if (entry.openUntil > now) return true
  if (entry.openUntil > 0 && entry.openUntil <= now) {
    entry.openUntil = 0
    entry.consecutiveFailures = 0
    entry.healthy = true
  }
  return false
}

export function markProviderSuccess(provider, { latencyMs = null } = {}) {
  const entry = getEntry(provider)
  entry.consecutiveFailures = 0
  entry.openUntil = 0
  entry.healthy = true
  entry.lastStatus = 200
  entry.lastError = null
  entry.lastLatencyMs = Number.isFinite(latencyMs) ? Math.round(latencyMs) : null
  entry.lastCheckedAt = new Date().toISOString()
}

export function markProviderFailure(provider, { status = null, reason = null, retryable = false, latencyMs = null } = {}) {
  const entry = getEntry(provider)
  entry.consecutiveFailures += 1
  entry.lastStatus = status
  entry.lastError = reason
  entry.lastLatencyMs = Number.isFinite(latencyMs) ? Math.round(latencyMs) : null
  entry.lastCheckedAt = new Date().toISOString()
  entry.healthy = false
  if (retryable && entry.consecutiveFailures >= AI_CIRCUIT_BREAKER_THRESHOLD) {
    entry.openUntil = Date.now() + AI_CIRCUIT_BREAKER_COOLDOWN_MS
  }
}

export function getCircuitState() {
  const out = {}
  const now = Date.now()
  for (const [provider, entry] of breakers.entries()) {
    out[provider.toLowerCase()] = {
      healthy: entry.openUntil <= now,
      open: entry.openUntil > now,
      openUntil: entry.openUntil > now ? new Date(entry.openUntil).toISOString() : null,
      consecutiveFailures: entry.consecutiveFailures,
      lastStatus: entry.lastStatus,
      lastError: entry.lastError,
      lastLatencyMs: entry.lastLatencyMs,
      lastCheckedAt: entry.lastCheckedAt,
    }
  }
  return out
}

