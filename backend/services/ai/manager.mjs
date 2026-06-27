import {
  AI_CACHE_ENABLED,
  AI_FALLBACK_ENABLED,
  AI_PARALLEL_FALLBACK,
  AI_PARALLEL_STAGGER_MS,
  AI_PROVIDER_ORDER,
  AI_UNAVAILABLE_MESSAGE,
  TASK_TYPE,
  isAnyAiProviderConfigured,
} from './config.mjs'
import { AiServiceUnavailableError, classifyAiError, formatFailureReason } from './errors.mjs'
import { logAttemptStart, logFallback } from './retry.mjs'
import { normalizeMessages } from './messages.mjs'
import { computeRequestHash, getCacheStats, getCacheValue, setCacheValue } from './cache.mjs'
import { getCircuitState, isProviderOpen, markProviderFailure, markProviderSuccess } from './circuitBreaker.mjs'
import {
  recordCacheHit,
  recordProviderFailure,
  recordProviderSuccess,
  recordRateLimit,
  recordRequest,
  recordTimeout,
  snapshotMetrics,
} from './metrics.mjs'
import * as openaiProvider from './providers/openai.mjs'
import * as geminiProvider from './providers/gemini.mjs'
import * as openrouterProvider from './providers/openrouter.mjs'

const PROVIDER_MAP = {
  openai: openaiProvider,
  gemini: geminiProvider,
  openrouter: openrouterProvider,
}

function resolveProviderChain() {
  const chain = AI_PROVIDER_ORDER.map((id) => PROVIDER_MAP[id]).filter(Boolean)
  return chain.length > 0 ? chain : [openaiProvider, geminiProvider, openrouterProvider]
}

function hasVisionPayload(messages = []) {
  for (const message of messages) {
    const content = message?.content
    if (!Array.isArray(content)) continue
    for (const part of content) {
      if (part?.type === 'image_url' && part?.image_url?.url) return true
    }
  }
  return false
}

function inferTaskType(messages = [], explicitTaskType = null) {
  if (explicitTaskType && Object.values(TASK_TYPE).includes(explicitTaskType)) {
    return explicitTaskType
  }
  if (hasVisionPayload(messages)) return TASK_TYPE.VISION
  const flattened = JSON.stringify(messages).toLowerCase()
  if (
    /function|typescript|javascript|python|code|debug|stack trace|compile|refactor|algorithm/.test(
      flattened,
    )
  ) {
    return TASK_TYPE.CODING
  }
  return TASK_TYPE.CHAT
}

function recordFailure(failures, providerName, error, model = null) {
  failures.push({
    provider: providerName,
    model,
    reason: formatFailureReason(error),
    message: error instanceof Error ? error.message : String(error),
  })
}

function normalizeProviderResult(result, providerName) {
  if (!result || typeof result !== 'object') return result
  return {
    ...result,
    provider: result.provider || providerName,
    retries: Number(result.retries ?? 0),
  }
}

async function callProviderOperation({ provider, operation, options }) {
  if (operation === 'generateText') return provider.generateText(options)
  return provider.analyzeImage(options)
}

async function runProviderChain({ operation, options, failures }) {
  const chain = resolveProviderChain()

  for (let index = 0; index < chain.length; index += 1) {
    const provider = chain[index]
    if (!provider.isConfigured()) {
      recordFailure(failures, provider.name, new Error('not configured'))
      continue
    }
    if (isProviderOpen(provider.name)) {
      recordFailure(failures, provider.name, new Error('circuit breaker open'))
      continue
    }

    if (index > 0) {
      logFallback({
        fromProvider: chain[index - 1]?.name ?? 'previous',
        toProvider: provider.name,
      })
    }

    logAttemptStart({ provider: provider.name, operation })
    const startedAt = Date.now()

    try {
      const response = await callProviderOperation({ provider, operation, options })
      const normalized = normalizeProviderResult(response, provider.name)
      markProviderSuccess(provider.name, { latencyMs: Date.now() - startedAt })
      recordProviderSuccess({
        provider: provider.name,
        model: normalized?.model ?? null,
        latencyMs: Date.now() - startedAt,
      })
      return normalized
    } catch (error) {
      const classification = classifyAiError(error)
      const status = classification.status
      const reason = formatFailureReason(error)
      const latencyMs = Date.now() - startedAt
      if (classification.category === 'rate_limited') recordRateLimit()
      if (classification.category === 'transient' && /timeout|timed out/i.test(String(error?.message ?? ''))) {
        recordTimeout()
      }
      markProviderFailure(provider.name, {
        status,
        reason,
        retryable: classification.retryable,
        latencyMs,
      })
      recordProviderFailure({
        provider: provider.name,
        model: options?.model ?? null,
        status,
        reason,
        latencyMs,
      })
      recordFailure(failures, provider.name, error, options?.model ?? null)
      if (!AI_FALLBACK_ENABLED || !classification.fallback) continue
    }
  }

  throw new AiServiceUnavailableError(failures)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runProviderChainParallel({ operation, options, failures }) {
  const chain = resolveProviderChain().filter((provider) => provider.isConfigured() && !isProviderOpen(provider.name))
  if (chain.length === 0) {
    throw new AiServiceUnavailableError([{ provider: 'none', reason: 'all_unavailable', message: 'No providers available' }])
  }

  const tasks = chain.map((provider, index) =>
    (async () => {
      const staggerMs = index * AI_PARALLEL_STAGGER_MS
      if (staggerMs > 0) await delay(staggerMs)
      const startedAt = Date.now()
      try {
        logAttemptStart({ provider: provider.name, operation })
        const response = await callProviderOperation({ provider, operation, options })
        const normalized = normalizeProviderResult(response, provider.name)
        markProviderSuccess(provider.name, { latencyMs: Date.now() - startedAt })
        recordProviderSuccess({
          provider: provider.name,
          model: normalized?.model ?? null,
          latencyMs: Date.now() - startedAt,
        })
        return normalized
      } catch (error) {
        const classification = classifyAiError(error)
        const latencyMs = Date.now() - startedAt
        if (classification.category === 'rate_limited') recordRateLimit()
        if (classification.category === 'transient' && /timeout|timed out/i.test(String(error?.message ?? ''))) {
          recordTimeout()
        }
        markProviderFailure(provider.name, {
          status: classification.status,
          reason: formatFailureReason(error),
          retryable: classification.retryable,
          latencyMs,
        })
        recordProviderFailure({
          provider: provider.name,
          model: options?.model ?? null,
          status: classification.status,
          reason: formatFailureReason(error),
          latencyMs,
        })
        recordFailure(failures, provider.name, error, options?.model ?? null)
        throw error
      }
    })(),
  )

  const settled = await Promise.allSettled(tasks)
  const firstSuccess = settled.find((entry) => entry.status === 'fulfilled')
  if (firstSuccess?.status === 'fulfilled') return firstSuccess.value
  throw new AiServiceUnavailableError(failures)
}

export async function generateText(promptOrMessages, options = {}) {
  const messages = normalizeMessages(promptOrMessages)
  if (!messages.length) {
    throw new Error('generateText requires a non-empty messages array or prompt string')
  }

  recordRequest()
  const failures = []
  if (!isAnyAiProviderConfigured()) {
    throw new AiServiceUnavailableError([{ provider: 'none', reason: 'no_keys', message: 'No AI keys configured' }])
  }

  const taskType = inferTaskType(messages, options.taskType)
  const hashKey = computeRequestHash({
    taskType,
    operation: 'generateText',
    messages,
    modelHint: options.openaiModel ?? '',
  })
  const cached = getCacheValue(hashKey)
  if (cached) {
    recordCacheHit()
    return { ...cached, fromCache: true }
  }

  const runOptions = { messages, ...options, taskType }
  const result = AI_PARALLEL_FALLBACK
    ? await runProviderChainParallel({ operation: 'generateText', options: runOptions, failures })
    : await runProviderChain({ operation: 'generateText', options: runOptions, failures })

  if (AI_CACHE_ENABLED) {
    setCacheValue(hashKey, result)
  }

  return result
}

export async function analyzeImage(options = {}) {
  const { messages, requestId, ...rest } = options
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('analyzeImage requires messages')
  }

  recordRequest()
  const failures = []
  if (!isAnyAiProviderConfigured()) {
    throw new AiServiceUnavailableError([{ provider: 'none', reason: 'no_keys', message: 'No AI keys configured' }])
  }

  const hashKey = computeRequestHash({
    taskType: TASK_TYPE.VISION,
    operation: 'analyzeImage',
    messages,
    modelHint: rest.model ?? '',
  })
  const cached = getCacheValue(hashKey)
  if (cached) {
    recordCacheHit()
    return { ...cached, fromCache: true }
  }

  const runOptions = { messages, requestId, ...rest, taskType: TASK_TYPE.VISION }
  const result = AI_PARALLEL_FALLBACK
    ? await runProviderChainParallel({ operation: 'analyzeImage', options: runOptions, failures })
    : await runProviderChain({ operation: 'analyzeImage', options: runOptions, failures })

  if (AI_CACHE_ENABLED) {
    setCacheValue(hashKey, result)
  }
  return result
}

export async function healthCheck() {
  const chain = resolveProviderChain()
  const results = []
  for (const provider of chain) {
    results.push(await provider.healthCheck())
  }
  const metrics = snapshotMetrics()
  const circuit = getCircuitState()
  const providers = {}
  for (const entry of results) {
    const key = String(entry.provider ?? '').toLowerCase()
    const breaker = circuit[key] ?? null
    providers[key] = {
      status: entry.ok && !(breaker?.open) ? 'healthy' : breaker?.open ? 'circuit_open' : 'unhealthy',
      model: entry.model ?? null,
      modelsAvailable: Array.isArray(entry.models) ? entry.models.length : undefined,
      reason: entry.reason ?? null,
      latency: entry.latencyMs ?? null,
      circuit: breaker,
    }
  }
  const availableProviders = results.filter((entry) => entry.ok).length
  return {
    status: availableProviders > 0 ? 'healthy' : 'degraded',
    ok: availableProviders > 0,
    activeProvider: metrics.lastActiveProvider,
    fallbackEnabled: AI_FALLBACK_ENABLED,
    parallelFallback: AI_PARALLEL_FALLBACK,
    availableProviders,
    order: AI_PROVIDER_ORDER,
    providers,
    cache: getCacheStats(),
    metrics,
    circuitBreaker: circuit,
  }
}

export function getUnavailableResponse(extra = {}) {
  return {
    success: false,
    message: AI_UNAVAILABLE_MESSAGE,
    error: AI_UNAVAILABLE_MESSAGE,
    code: 'analysis_unavailable',
    ...extra,
  }
}

export { AI_UNAVAILABLE_MESSAGE, isAnyAiProviderConfigured }
