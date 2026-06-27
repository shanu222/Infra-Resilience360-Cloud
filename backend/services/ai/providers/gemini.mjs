import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  AI_TIMEOUT_MS,
  GEMINI_API_KEY,
  GEMINI_CODING_MODELS,
  GEMINI_MODEL,
  GEMINI_TEXT_MODELS,
  GEMINI_VISION_MODELS,
  TASK_TYPE,
} from '../config.mjs'
import { executeWithRetries, logAttemptFailure, logAttemptSuccess, withTimeout } from '../retry.mjs'
import { messagesToGeminiParams } from '../messages.mjs'
import { classifyAiError } from '../errors.mjs'
import { recordRetry } from '../metrics.mjs'

export const name = 'Gemini'

export function isConfigured() {
  return Boolean(GEMINI_API_KEY)
}

export async function healthCheck() {
  if (!isConfigured()) {
    return { ok: false, provider: name, reason: 'GEMINI_API_KEY missing' }
  }
  return { ok: true, provider: name, model: GEMINI_MODEL }
}

async function runGemini({ messages, temperature, modelName, jsonMode = true }) {
  const { systemInstruction, contents } = messagesToGeminiParams(messages)
  if (!contents.length) {
    throw new Error('No Gemini contents to generate')
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({
    model: modelName,
    ...(systemInstruction ? { systemInstruction } : {}),
    generationConfig: {
      temperature,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  })

  const result = await withTimeout(
    model.generateContent({ contents }),
    AI_TIMEOUT_MS,
    'Gemini generation',
  )
  const text = result.response.text()
  if (!String(text ?? '').trim()) {
    throw new Error('Gemini returned an empty response')
  }
  return text
}

function getModelChain(taskType, overrideModel) {
  if (overrideModel) return [overrideModel]
  if (taskType === TASK_TYPE.CODING) return GEMINI_CODING_MODELS
  return GEMINI_TEXT_MODELS
}

export async function generateText({ messages, temperature = 0.2, model, taskType = TASK_TYPE.CHAT }) {
  if (!isConfigured()) {
    throw new Error('GEMINI_API_KEY missing')
  }

  const modelChain = getModelChain(taskType, model)
  let lastError = null
  for (const modelName of modelChain) {
    const startedAt = Date.now()
    try {
      const { value, retries } = await executeWithRetries(
        async () => {
          try {
            return await runGemini({ messages, temperature, modelName, jsonMode: true })
          } catch {
            return await runGemini({ messages, temperature, modelName, jsonMode: false })
          }
        },
        { label: `Gemini text ${modelName}`, onRetry: () => recordRetry() },
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
  throw lastError ?? new Error('Gemini text failed for all models')
}

export async function analyzeImage({ messages, temperature = 0.1, model, requestId = null }) {
  if (!isConfigured()) {
    throw new Error('GEMINI_API_KEY missing')
  }

  const modelChain = model ? [model] : GEMINI_VISION_MODELS
  let lastError = null
  for (const modelName of modelChain) {
    const startedAt = Date.now()
    try {
      const { value, retries } = await executeWithRetries(
        async () => {
          try {
            return await runGemini({ messages, temperature, modelName, jsonMode: true })
          } catch {
            return await runGemini({ messages, temperature, modelName, jsonMode: false })
          }
        },
        { label: `Gemini vision ${modelName}`, onRetry: () => recordRetry() },
      )
      logAttemptSuccess({
        provider: name,
        model: modelName,
        latencyMs: Date.now() - startedAt,
        operation: 'analyzeImage',
        retries,
      })
      return { content: value, provider: name, model: modelName, latencyMs: Date.now() - startedAt, requestId, retries }
    } catch (error) {
      lastError = error
      logAttemptFailure({
        provider: name,
        model: modelName,
        error,
        latencyMs: Date.now() - startedAt,
        operation: 'analyzeImage',
      })
      const classification = classifyAiError(error)
      if (!classification.fallback) throw error
      continue
    }
  }
  throw lastError ?? new Error('Gemini vision failed for all models')
}
