import {
  AI_FALLBACK_ENABLED,
  AI_PROVIDER_ORDER,
  AI_UNAVAILABLE_MESSAGE,
  isAnyAiProviderConfigured,
} from './config.mjs'
import { AiServiceUnavailableError, classifyAiError, formatFailureReason } from './errors.mjs'
import { logAttemptStart, logFallback } from './retry.mjs'
import { normalizeMessages } from './messages.mjs'
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

function recordFailure(failures, providerName, error, model = null) {
  failures.push({
    provider: providerName,
    model,
    reason: formatFailureReason(error),
    message: error instanceof Error ? error.message : String(error),
  })
}

async function runProviderChain({ operation, options, failures }) {
  const chain = resolveProviderChain()

  for (let index = 0; index < chain.length; index += 1) {
    const provider = chain[index]
    if (!provider.isConfigured()) {
      recordFailure(failures, provider.name, new Error('not configured'))
      continue
    }

    if (index > 0) {
      logFallback({
        fromProvider: chain[index - 1]?.name ?? 'previous',
        toProvider: provider.name,
      })
    }

    logAttemptStart({ provider: provider.name, operation })

    try {
      if (operation === 'generateText') {
        return await provider.generateText(options)
      }
      return await provider.analyzeImage(options)
    } catch (error) {
      recordFailure(failures, provider.name, error, options?.model ?? null)
      const classification = classifyAiError(error)
      if (!AI_FALLBACK_ENABLED || !classification.fallback) {
        continue
      }
    }
  }

  throw new AiServiceUnavailableError(failures)
}

export async function generateText(promptOrMessages, options = {}) {
  const messages = normalizeMessages(promptOrMessages)
  if (!messages.length) {
    throw new Error('generateText requires a non-empty messages array or prompt string')
  }

  const failures = []
  if (!isAnyAiProviderConfigured()) {
    throw new AiServiceUnavailableError([{ provider: 'none', reason: 'no_keys', message: 'No AI keys configured' }])
  }

  const result = await runProviderChain({
    operation: 'generateText',
    options: { messages, ...options },
    failures,
  })

  return result
}

export async function analyzeImage(options = {}) {
  const { messages, requestId, ...rest } = options
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('analyzeImage requires messages')
  }

  const failures = []
  if (!isAnyAiProviderConfigured()) {
    throw new AiServiceUnavailableError([{ provider: 'none', reason: 'no_keys', message: 'No AI keys configured' }])
  }

  return runProviderChain({
    operation: 'analyzeImage',
    options: { messages, requestId, ...rest },
    failures,
  })
}

export async function healthCheck() {
  const chain = resolveProviderChain()
  const results = []
  for (const provider of chain) {
    results.push(await provider.healthCheck())
  }
  return {
    ok: results.some((entry) => entry.ok),
    providers: results,
    fallbackEnabled: AI_FALLBACK_ENABLED,
    order: AI_PROVIDER_ORDER,
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
