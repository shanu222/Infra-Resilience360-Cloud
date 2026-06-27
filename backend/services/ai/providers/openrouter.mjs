import {
  AI_TIMEOUT_MS,
  OPENROUTER_API_KEY,
  OPENROUTER_BASE_URL,
  OPENROUTER_CODING_MODELS,
  OPENROUTER_MODELS,
  OPENROUTER_SITE_NAME,
  OPENROUTER_SITE_URL,
  OPENROUTER_VISION_MODELS,
  TASK_TYPE,
} from '../config.mjs'
import { executeWithRetries, logAttemptFailure, logAttemptSuccess, withTimeout } from '../retry.mjs'
import { extractUsageTokens } from '../messages.mjs'
import { classifyAiError } from '../errors.mjs'
import { recordRetry } from '../metrics.mjs'

export const name = 'OpenRouter'

function buildHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
  }
  if (OPENROUTER_SITE_URL) headers['HTTP-Referer'] = OPENROUTER_SITE_URL
  if (OPENROUTER_SITE_NAME) headers['X-Title'] = OPENROUTER_SITE_NAME
  return headers
}

async function callOpenRouterModel({ model, messages, temperature, jsonMode = true }) {
  const body = {
    model,
    messages,
    temperature,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
  }

  const response = await withTimeout(
    fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }),
    AI_TIMEOUT_MS,
    `OpenRouter ${model}`,
  )

  const raw = await response.text()
  if (!response.ok) {
    const err = new Error(raw || `OpenRouter HTTP ${response.status}`)
    err.status = response.status
    throw err
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

  return { text, usage: extractUsageTokens(json) }
}

export function isConfigured() {
  return Boolean(OPENROUTER_API_KEY)
}

export async function healthCheck() {
  if (!isConfigured()) {
    return { ok: false, provider: name, reason: 'OPENROUTER_API_KEY missing' }
  }
  return { ok: true, provider: name, models: OPENROUTER_MODELS }
}

function getModelChain(taskType, overrideModels) {
  if (Array.isArray(overrideModels) && overrideModels.length > 0) return overrideModels
  if (taskType === TASK_TYPE.CODING) {
    return OPENROUTER_CODING_MODELS.length ? OPENROUTER_CODING_MODELS : OPENROUTER_MODELS
  }
  return OPENROUTER_MODELS
}

export async function generateText({ messages, temperature = 0.2, models, taskType = TASK_TYPE.CHAT }) {
  if (!isConfigured()) {
    throw new Error('OPENROUTER_API_KEY missing')
  }

  const modelChain = getModelChain(taskType, models)
  const failures = []
  for (const model of modelChain) {
    const startedAt = Date.now()
    try {
      const { value, retries } = await executeWithRetries(
        async () => {
          try {
            return await callOpenRouterModel({ model, messages, temperature, jsonMode: true })
          } catch {
            return await callOpenRouterModel({ model, messages, temperature, jsonMode: false })
          }
        },
        { label: `OpenRouter ${model}`, onRetry: () => recordRetry() },
      )
      const { text, usage } = value
      const tokens = usage?.total ?? null
      logAttemptSuccess({
        provider: name,
        model,
        latencyMs: Date.now() - startedAt,
        tokens,
        operation: 'generateText',
        retries,
      })
      return { content: text, provider: name, model, latencyMs: Date.now() - startedAt, usage, retries }
    } catch (error) {
      logAttemptFailure({
        provider: name,
        model,
        error,
        latencyMs: Date.now() - startedAt,
        operation: 'generateText',
      })
      const classification = classifyAiError(error)
      failures.push({ model, error })
      if (!classification.fallback) throw error
    }
  }

  throw failures[failures.length - 1]?.error ?? new Error('OpenRouter text generation failed for all models')
}

export async function analyzeImage({
  messages,
  temperature = 0.1,
  models,
  requestId = null,
}) {
  if (!isConfigured()) {
    throw new Error('OPENROUTER_API_KEY missing')
  }

  const modelChain = Array.isArray(models) && models.length > 0 ? models : OPENROUTER_VISION_MODELS
  if (modelChain.length === 0) {
    throw new Error('No OpenRouter vision-capable models configured')
  }

  const failures = []
  for (const model of modelChain) {
    const startedAt = Date.now()
    try {
      const { value, retries } = await executeWithRetries(
        async () => {
          try {
            return await callOpenRouterModel({ model, messages, temperature, jsonMode: true })
          } catch {
            return await callOpenRouterModel({ model, messages, temperature, jsonMode: false })
          }
        },
        { label: `OpenRouter vision ${model}`, onRetry: () => recordRetry() },
      )
      const { text, usage } = value
      logAttemptSuccess({
        provider: name,
        model,
        latencyMs: Date.now() - startedAt,
        tokens: usage?.total ?? null,
        operation: 'analyzeImage',
        retries,
      })
      return { content: text, provider: name, model, latencyMs: Date.now() - startedAt, requestId, usage, retries }
    } catch (error) {
      logAttemptFailure({
        provider: name,
        model,
        error,
        latencyMs: Date.now() - startedAt,
        operation: 'analyzeImage',
      })
      const classification = classifyAiError(error)
      failures.push({ model, error })
      if (!classification.fallback) throw error
    }
  }

  throw failures[failures.length - 1]?.error ?? new Error('OpenRouter vision failed for all models')
}
