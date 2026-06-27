import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_TIMEOUT_MS, GEMINI_API_KEY, GEMINI_MODEL, GEMINI_VISION_MODEL } from '../config.mjs'
import { executeWithRetries, logAttemptFailure, logAttemptSuccess, withTimeout } from '../retry.mjs'
import { messagesToGeminiParams } from '../messages.mjs'

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

export async function generateText({ messages, temperature = 0.2, model = GEMINI_MODEL }) {
  if (!isConfigured()) {
    throw new Error('GEMINI_API_KEY missing')
  }

  const startedAt = Date.now()
  try {
    const content = await executeWithRetries(
      async () => {
        try {
          return await runGemini({ messages, temperature, modelName: model, jsonMode: true })
        } catch {
          return await runGemini({ messages, temperature, modelName: model, jsonMode: false })
        }
      },
      { label: 'Gemini text' },
    )
    logAttemptSuccess({ provider: name, model, latencyMs: Date.now() - startedAt, operation: 'generateText' })
    return { content, provider: name, model, latencyMs: Date.now() - startedAt }
  } catch (error) {
    logAttemptFailure({ provider: name, model, error, latencyMs: Date.now() - startedAt, operation: 'generateText' })
    throw error
  }
}

export async function analyzeImage({ messages, temperature = 0.1, model = GEMINI_VISION_MODEL, requestId = null }) {
  if (!isConfigured()) {
    throw new Error('GEMINI_API_KEY missing')
  }

  const startedAt = Date.now()
  try {
    const content = await executeWithRetries(
      async () => {
        try {
          return await runGemini({ messages, temperature, modelName: model, jsonMode: true })
        } catch {
          return await runGemini({ messages, temperature, modelName: model, jsonMode: false })
        }
      },
      { label: 'Gemini vision' },
    )
    logAttemptSuccess({ provider: name, model, latencyMs: Date.now() - startedAt, operation: 'analyzeImage' })
    return { content, provider: name, model, latencyMs: Date.now() - startedAt, requestId }
  } catch (error) {
    logAttemptFailure({ provider: name, model, error, latencyMs: Date.now() - startedAt, operation: 'analyzeImage' })
    throw error
  }
}
