import { AI_LOG_LEVEL, AI_MAX_RETRIES } from './config.mjs'
import { classifyAiError, formatFailureReason, sanitizeForLog } from './errors.mjs'

const shouldLogInfo = () => AI_LOG_LEVEL !== 'error'
const shouldLogWarn = () => AI_LOG_LEVEL !== 'silent'

export function logAttemptStart({ provider, model, operation }) {
  if (!shouldLogInfo()) return
  console.info(`[ai] Provider=${provider} Model=${model ?? 'default'} Operation=${operation} Status=Started`)
}

export function logAttemptSuccess({ provider, model, latencyMs, tokens, operation, retries = 0 }) {
  if (!shouldLogInfo()) return
  console.info(
    `[ai] Provider=${provider} Model=${model ?? 'default'} Operation=${operation} Status=Success Latency=${Math.round(
      latencyMs ?? 0,
    )}ms Retries=${retries} Tokens=${tokens ?? 'n/a'}`,
  )
}

export function logAttemptFailure({ provider, model, error, latencyMs, operation, retries = 0 }) {
  if (!shouldLogWarn()) return
  const reason = formatFailureReason(error)
  const detail = sanitizeForLog(error instanceof Error ? error.message : String(error))
  console.warn(
    `[ai] Provider=${provider} Model=${model ?? 'default'} Operation=${operation} Status=Failed Reason=${reason} Latency=${Math.round(
      latencyMs ?? 0,
    )}ms Retries=${retries} Detail=${detail}`,
  )
}

export function logFallback({ fromProvider, toProvider, toModel }) {
  if (!shouldLogInfo()) return
  const target = toModel ? `${toProvider} (${toModel})` : toProvider
  console.info(`[ai] ${fromProvider} failed. Trying ${target}...`)
}

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withTimeout(promise, timeoutMs, label) {
  let timer = null
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s`)),
          timeoutMs,
        )
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

const retryDelays = [1_000, 3_000, 6_000]

const addJitter = (baseMs) => {
  const jitter = Math.floor(Math.random() * 300)
  return baseMs + jitter
}

/**
 * Attempt flow:
 * - Attempt 1: immediate
 * - Attempt 2: +1s (+ jitter)
 * - Attempt 3: +3s (+ jitter)
 * - Attempt 4: +6s (+ jitter)
 */
export async function executeWithRetries(fn, { label = 'request', onRetry } = {}) {
  let lastError = null
  const maxAttempts = Math.max(1, AI_MAX_RETRIES + 1)

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const value = await fn(attempt)
      return { value, attemptsUsed: attempt, retries: Math.max(0, attempt - 1) }
    } catch (error) {
      lastError = error
      const classification = classifyAiError(error)
      if (!classification.retryable || attempt >= maxAttempts) {
        throw error
      }
      const delayBase = retryDelays[Math.min(attempt - 1, retryDelays.length - 1)]
      const backoffMs = addJitter(delayBase)
      if (typeof onRetry === 'function') {
        onRetry({ attempt, nextAttempt: attempt + 1, backoffMs, classification, label })
      }
      await sleep(backoffMs)
    }
  }

  throw lastError ?? new Error(`${label} failed`)
}
