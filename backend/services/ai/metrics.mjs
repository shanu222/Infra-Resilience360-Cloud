const nowIso = () => new Date().toISOString()

const state = {
  startedAt: nowIso(),
  totalRequests: 0,
  cacheHits: 0,
  retries: 0,
  timeouts: 0,
  rateLimits: 0,
  providers: new Map(),
  models: new Map(),
  lastActiveProvider: null,
}

const initProvider = (name) => ({
  success: 0,
  failure: 0,
  healthy: true,
  latencyAvgMs: 0,
  latencyCount: 0,
  lastLatencyMs: null,
  lastModel: null,
  lastError: null,
  lastStatus: null,
  lastSeenAt: null,
})

const initModel = () => ({
  success: 0,
  failure: 0,
  retries: 0,
  avgLatencyMs: 0,
  count: 0,
  lastSeenAt: null,
})

function updateAvg(currentAvg, count, next) {
  if (!Number.isFinite(next) || next < 0) return { avg: currentAvg, count }
  const nextCount = count + 1
  return { avg: ((currentAvg * count) + next) / nextCount, count: nextCount }
}

export function recordRequest() {
  state.totalRequests += 1
}

export function recordCacheHit() {
  state.cacheHits += 1
}

export function recordRetry() {
  state.retries += 1
}

export function recordTimeout() {
  state.timeouts += 1
}

export function recordRateLimit() {
  state.rateLimits += 1
}

export function recordProviderSuccess({ provider, model, latencyMs }) {
  const p = state.providers.get(provider) ?? initProvider(provider)
  p.success += 1
  p.lastModel = model ?? p.lastModel
  p.lastLatencyMs = Number.isFinite(latencyMs) ? Math.round(latencyMs) : p.lastLatencyMs
  const updated = updateAvg(p.latencyAvgMs, p.latencyCount, latencyMs)
  p.latencyAvgMs = updated.avg
  p.latencyCount = updated.count
  p.healthy = true
  p.lastError = null
  p.lastStatus = 200
  p.lastSeenAt = nowIso()
  state.providers.set(provider, p)
  state.lastActiveProvider = provider

  if (model) {
    const key = `${provider}:${model}`
    const m = state.models.get(key) ?? initModel()
    m.success += 1
    const avg = updateAvg(m.avgLatencyMs, m.count, latencyMs)
    m.avgLatencyMs = avg.avg
    m.count = avg.count
    m.lastSeenAt = nowIso()
    state.models.set(key, m)
  }
}

export function recordProviderFailure({ provider, model, status, reason, latencyMs }) {
  const p = state.providers.get(provider) ?? initProvider(provider)
  p.failure += 1
  p.lastModel = model ?? p.lastModel
  p.lastLatencyMs = Number.isFinite(latencyMs) ? Math.round(latencyMs) : p.lastLatencyMs
  p.lastError = reason ?? null
  p.lastStatus = status ?? null
  p.lastSeenAt = nowIso()
  state.providers.set(provider, p)

  if (model) {
    const key = `${provider}:${model}`
    const m = state.models.get(key) ?? initModel()
    m.failure += 1
    const avg = updateAvg(m.avgLatencyMs, m.count, latencyMs)
    m.avgLatencyMs = avg.avg
    m.count = avg.count
    m.lastSeenAt = nowIso()
    state.models.set(key, m)
  }
}

export function snapshotMetrics() {
  const providers = {}
  for (const [name, data] of state.providers.entries()) {
    providers[name.toLowerCase()] = {
      success: data.success,
      failure: data.failure,
      latencyAvgMs: Math.round(data.latencyAvgMs || 0),
      lastLatencyMs: data.lastLatencyMs,
      lastModel: data.lastModel,
      lastError: data.lastError,
      lastStatus: data.lastStatus,
      lastSeenAt: data.lastSeenAt,
      healthy: data.healthy,
    }
  }

  const models = {}
  for (const [key, data] of state.models.entries()) {
    models[key] = {
      success: data.success,
      failure: data.failure,
      retries: data.retries,
      avgLatencyMs: Math.round(data.avgLatencyMs || 0),
      lastSeenAt: data.lastSeenAt,
    }
  }

  return {
    startedAt: state.startedAt,
    totalRequests: state.totalRequests,
    cacheHits: state.cacheHits,
    retries: state.retries,
    timeouts: state.timeouts,
    rateLimits: state.rateLimits,
    lastActiveProvider: state.lastActiveProvider,
    providers,
    models,
  }
}

