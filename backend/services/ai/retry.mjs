import { classifyAiError, formatFailureReason, sanitizeForLog } from './errors.mjs'

export function logAttemptStart({ provider, model, operation }) {
  console.info(`[ai] Trying ${provider}${model ? ` (${model})` : ''} for ${operation}...`)
}

export function logAttemptSuccess({ provider, model, latencyMs, tokens, operation }) {
  console.info(
    `[ai] ${provider}${model ? ` ${model}` : ''} succeeded (${operation}) latency=${latencyMs}ms${
      tokens ? ` tokens=${tokens}` : ''
    }`,
  )
}

export function logAttemptFailure({ provider, model, error, latencyMs, operation }) {
  const reason = formatFailureReason(error)
  const detail = sanitizeForLog(error instanceof Error ? error.message : String(error))
  console.warn(
    `[ai] ${provider}${model ? ` ${model}` : ''} failed (${operation}) reason=${reason} latency=${latencyMs ?? 'n/a'}ms detail=${detail}`,
  )
}

export function logFallback({ fromProvider, toProvider, toModel }) {
  const target = toModel ? `${toProvider} ${toModel}` : toProvider
  console.info(`[ai] ${fromProvider} failed — trying ${target}...`)
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
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s`)), timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * Retry once on timeout/503/504/ECONNRESET; twice on 429 (1s then 3s backoff).
 */
export async function executeWithRetries(fn, { label = 'request' } = {}) {
  let lastError = null
  let rateLimitAttempts = 0

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await fn(attempt)
    } catch (error) {
      lastError = error
      const classification = classifyAiError(error)

      if (classification.is429) {
        rateLimitAttempts += 1
        if (rateLimitAttempts <= 2) {
          const backoffMs = rateLimitAttempts === 1 ? 1_000 : 3_000
          await sleep(backoffMs)
          continue
        }
        throw error
      }

      if (
        classification.retryable &&
        classification.category === 'transient' &&
        attempt < 2
      ) {
        await sleep(500)
        continue
      }

      throw error
    }
  }

  throw lastError ?? new Error(`${label} failed`)
}
