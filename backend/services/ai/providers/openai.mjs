import OpenAI from 'openai'
import {
  AI_TIMEOUT_MS,
  isOpenAiConfigured,
  OPENAI_API_KEY,
  OPENAI_MODEL,
  OPENAI_VISION_FALLBACK_MODELS,
  OPENAI_VISION_MODEL,
} from '../config.mjs'
import { executeWithRetries, logAttemptFailure, logAttemptSuccess, withTimeout } from '../retry.mjs'
import { extractUsageTokens } from '../messages.mjs'

export const name = 'OpenAI'

let cachedAiService = null

async function getOpenAiService() {
  if (!cachedAiService) {
    cachedAiService = await import('../../aiService.mjs')
  }
  return cachedAiService
}

export function isConfigured() {
  return isOpenAiConfigured()
}

export async function healthCheck() {
  if (!isConfigured()) {
    return { ok: false, provider: name, reason: 'OPENAI_API_KEY missing' }
  }
  const startedAt = Date.now()
  try {
    const client = new OpenAI({ apiKey: OPENAI_API_KEY.replace(/^['"]|['"]$/g, '') })
    await withTimeout(client.models.retrieve(OPENAI_VISION_MODEL), 8_000, 'OpenAI health probe')
    return { ok: true, provider: name, latencyMs: Date.now() - startedAt, model: OPENAI_VISION_MODEL }
  } catch (error) {
    return {
      ok: false,
      provider: name,
      latencyMs: Date.now() - startedAt,
      reason: error instanceof Error ? error.message : String(error),
    }
  }
}

async function runOpenAiChat({ messages, model, temperature, responseFormatJsonObject = true }) {
  const { openaiChatCompletionText } = await getOpenAiService()
  return openaiChatCompletionText({
    messages,
    model,
    temperature,
    timeoutMs: AI_TIMEOUT_MS,
    responseFormatJsonObject,
  })
}

export async function generateText({ messages, temperature = 0.2, model = OPENAI_MODEL }) {
  if (!isConfigured()) {
    throw new Error('OPENAI_API_KEY missing')
  }

  const startedAt = Date.now()
  try {
    const content = await executeWithRetries(
      () =>
        runOpenAiChat({
          messages,
          model,
          temperature,
          responseFormatJsonObject: true,
        }),
      { label: 'OpenAI text' },
    )
    logAttemptSuccess({ provider: name, model, latencyMs: Date.now() - startedAt, operation: 'generateText' })
    return { content, provider: name, model, latencyMs: Date.now() - startedAt }
  } catch (error) {
    logAttemptFailure({ provider: name, model, error, latencyMs: Date.now() - startedAt, operation: 'generateText' })
    throw error
  }
}

export async function analyzeImage({ messages, model = OPENAI_VISION_MODEL, requestId = null }) {
  if (!isConfigured()) {
    throw new Error('OPENAI_API_KEY missing')
  }

  const modelCandidates = [model, ...OPENAI_VISION_FALLBACK_MODELS].filter(Boolean)
  const failures = []

  for (const modelName of modelCandidates) {
    const startedAt = Date.now()
    try {
      const content = await executeWithRetries(
        () =>
          runOpenAiChat({
            messages,
            model: modelName,
            temperature: 0.1,
            responseFormatJsonObject: true,
          }),
        { label: `OpenAI vision ${modelName}` },
      )
      logAttemptSuccess({
        provider: name,
        model: modelName,
        latencyMs: Date.now() - startedAt,
        operation: 'analyzeImage',
      })
      return { content, provider: name, model: modelName, latencyMs: Date.now() - startedAt, requestId }
    } catch (error) {
      logAttemptFailure({
        provider: name,
        model: modelName,
        error,
        latencyMs: Date.now() - startedAt,
        operation: 'analyzeImage',
      })
      failures.push({ model: modelName, error })
    }
  }

  throw failures[failures.length - 1]?.error ?? new Error('OpenAI vision failed for all models')
}
