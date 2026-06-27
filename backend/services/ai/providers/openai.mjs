import OpenAI from 'openai'
import {
  AI_TIMEOUT_MS,
  isOpenAiConfigured,
  OPENAI_API_KEY,
  OPENAI_CODING_MODELS,
  OPENAI_TEXT_MODELS,
  OPENAI_VISION_FALLBACK_MODELS,
  OPENAI_VISION_MODEL,
  TASK_TYPE,
} from '../config.mjs'
import { executeWithRetries, logAttemptFailure, logAttemptSuccess, withTimeout } from '../retry.mjs'
import { classifyAiError } from '../errors.mjs'
import { recordRetry } from '../metrics.mjs'

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

function getModelChain(taskType, overrideModel) {
  const base = taskType === TASK_TYPE.CODING ? OPENAI_CODING_MODELS : OPENAI_TEXT_MODELS
  if (!overrideModel) return base
  const chain = [overrideModel, ...base]
  return chain.filter((item, index, all) => all.indexOf(item) === index)
}

export async function generateText({ messages, temperature = 0.2, model, taskType = TASK_TYPE.CHAT }) {
  if (!isConfigured()) {
    throw new Error('OPENAI_API_KEY missing')
  }

  const modelChain = getModelChain(taskType, model)
  let lastError = null
  for (const modelName of modelChain) {
    const startedAt = Date.now()
    try {
      const { value, retries } = await executeWithRetries(
        () =>
          runOpenAiChat({
            messages,
            model: modelName,
            temperature,
            responseFormatJsonObject: true,
          }),
        { label: `OpenAI text ${modelName}`, onRetry: () => recordRetry() },
      )
      logAttemptSuccess({
        provider: name,
        model: modelName,
        latencyMs: Date.now() - startedAt,
        operation: 'generateText',
        retries,
      })
      return { content: value, provider: name, model: modelName, latencyMs: Date.now() - startedAt, retries }
    } catch (error) {
      lastError = error
      logAttemptFailure({
        provider: name,
        model: modelName,
        error,
        latencyMs: Date.now() - startedAt,
        operation: 'generateText',
      })
      const classification = classifyAiError(error)
      if (!classification.fallback) throw error
      continue
    }
  }
  throw lastError ?? new Error('OpenAI text failed for all models')
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
      const { value, retries } = await executeWithRetries(
        () =>
          runOpenAiChat({
            messages,
            model: modelName,
            temperature: 0.1,
            responseFormatJsonObject: true,
          }),
        { label: `OpenAI vision ${modelName}`, onRetry: () => recordRetry() },
      )
      logAttemptSuccess({ provider: name, model: modelName, latencyMs: Date.now() - startedAt, operation: 'analyzeImage', retries })
      return { content: value, provider: name, model: modelName, latencyMs: Date.now() - startedAt, requestId, retries }
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
