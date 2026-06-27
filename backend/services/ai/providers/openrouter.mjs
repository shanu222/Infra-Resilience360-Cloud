import {
  AI_TIMEOUT_MS,
  OPENROUTER_API_KEY,
  OPENROUTER_BASE_URL,
  OPENROUTER_MODEL_CANDIDATES,
  OPENROUTER_SITE_NAME,
  OPENROUTER_SITE_URL,
} from '../config.mjs'
import { executeWithRetries, logAttemptFailure, logAttemptSuccess, withTimeout } from '../retry.mjs'
import { extractUsageTokens } from '../messages.mjs'

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
  return { ok: true, provider: name, models: OPENROUTER_MODEL_CANDIDATES }
}

export async function generateText({ messages, temperature = 0.2, models = OPENROUTER_MODEL_CANDIDATES }) {
  if (!isConfigured()) {
    throw new Error('OPENROUTER_API_KEY missing')
  }

  const failures = []
  for (const model of models) {
    const startedAt = Date.now()
    try {
      const { text, usage } = await executeWithRetries(
        async () => {
          try {
            return await callOpenRouterModel({ model, messages, temperature, jsonMode: true })
          } catch {
            return await callOpenRouterModel({ model, messages, temperature, jsonMode: false })
          }
        },
        { label: `OpenRouter ${model}` },
      )
      const tokens = usage?.total ?? null
      logAttemptSuccess({
        provider: name,
        model,
        latencyMs: Date.now() - startedAt,
        tokens,
        operation: 'generateText',
      })
      return { content: text, provider: name, model, latencyMs: Date.now() - startedAt, usage }
    } catch (error) {
      logAttemptFailure({
        provider: name,
        model,
        error,
        latencyMs: Date.now() - startedAt,
        operation: 'generateText',
      })
      failures.push({ model, error })
    }
  }

  throw failures[failures.length - 1]?.error ?? new Error('OpenRouter text generation failed for all models')
}

export async function analyzeImage({ messages, temperature = 0.1, models = OPENROUTER_MODEL_CANDIDATES, requestId = null }) {
  if (!isConfigured()) {
    throw new Error('OPENROUTER_API_KEY missing')
  }

  const failures = []
  for (const model of models) {
    const startedAt = Date.now()
    try {
      const { text, usage } = await executeWithRetries(
        async () => {
          try {
            return await callOpenRouterModel({ model, messages, temperature, jsonMode: true })
          } catch {
            return await callOpenRouterModel({ model, messages, temperature, jsonMode: false })
          }
        },
        { label: `OpenRouter vision ${model}` },
      )
      logAttemptSuccess({
        provider: name,
        model,
        latencyMs: Date.now() - startedAt,
        tokens: usage?.total ?? null,
        operation: 'analyzeImage',
      })
      return { content: text, provider: name, model, latencyMs: Date.now() - startedAt, requestId, usage }
    } catch (error) {
      logAttemptFailure({
        provider: name,
        model,
        error,
        latencyMs: Date.now() - startedAt,
        operation: 'analyzeImage',
      })
      failures.push({ model, error })
    }
  }

  throw failures[failures.length - 1]?.error ?? new Error('OpenRouter vision failed for all models')
}
