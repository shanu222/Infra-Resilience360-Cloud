/**
 * Central AI error normalization for all user-facing surfaces.
 * Never expose provider names, API paths, keys, quota details, or stack traces.
 */

export const AI_USER_MESSAGES = {
  unavailable:
    'AI analysis is temporarily unavailable. Please try again shortly.',
  serviceUnavailable:
    'Image analysis service is temporarily unavailable.',
  highDemand:
    'AI analysis is temporarily unavailable. Please try again shortly.',
  incomplete:
    'The requested analysis could not be completed at this time.',
  generic:
    'Something went wrong while processing your request. Please try again.',
  network:
    'Unable to connect to the analysis service. Please check your connection and try again.',
  invalidImage: 'Please upload a valid image file to continue.',
  invalidInput: 'Please check your inputs and try again.',
} as const

export type AiErrorCategory =
  | 'ready'
  | 'analyzing'
  | 'temporary'
  | 'connection'
  | 'high_demand'
  | 'invalid_input'
  | 'generic'

const DEV_PATTERN =
  /\b(openai|huggingface|gemini|openrouter|azure|api_key|api key|quota|provider|fallback|\/api\/|429|500|stack|trace|exception|json\.stringify|sk-[a-z0-9]|server-generated|placeholder|configure\s+[a-z_]+_key|retry\s+start\s+ai|vision\/analyze|billing|rate.?limit|insufficient_quota|developer|debug)\b/i

/** Returns true when text must not be shown in production UI. */
export function isDeveloperFacingMessage(text: string): boolean {
  const value = String(text ?? '').trim()
  if (!value) return false
  return DEV_PATTERN.test(value)
}

/** Strip or replace unsafe fragments if they slip through. */
export function sanitizeAiUserText(text: string, fallback: string = AI_USER_MESSAGES.generic): string {
  const value = String(text ?? '').trim()
  if (!value) return fallback
  if (isDeveloperFacingMessage(value)) return fallback
  return value.replace(/sk-[A-Za-z0-9_-]+/g, '***')
}

export function classifyAiError(error: unknown): AiErrorCategory {
  const message = error instanceof Error ? error.message : String(error ?? '')
  const combined = message.toLowerCase()

  if (/invalid image|image file|upload a valid|400/.test(combined)) return 'invalid_input'
  if (/failed to fetch|network|timeout|cors|econnrefused|enotfound|502|503|504|connection|unreachable|offline/.test(combined)) {
    return 'connection'
  }
  if (/429|rate\s*limit|too many requests|high demand/.test(combined)) return 'high_demand'
  if (/503|temporarily unavailable|try again in a few minutes|service is currently unavailable/.test(combined)) {
    return 'temporary'
  }
  return 'generic'
}

/** Map any thrown value or API error string to a production-safe message. */
export function resolveAiUserMessage(
  error: unknown,
  fallback: string = AI_USER_MESSAGES.generic,
): string {
  if (!error) return fallback

  if (typeof error === 'object' && error !== null && 'error' in error) {
    const payload = error as { error?: unknown }
    const fromBody = sanitizeAiUserText(String(payload.error ?? ''))
    if (fromBody && fromBody !== AI_USER_MESSAGES.generic) return fromBody
  }

  const message = error instanceof Error ? error.message : String(error ?? '').trim()
  if (!message) return fallback

  if (isDeveloperFacingMessage(message)) {
    const category = classifyAiError(error)
    if (category === 'connection') return AI_USER_MESSAGES.network
    if (category === 'high_demand') return AI_USER_MESSAGES.unavailable
    if (category === 'temporary') return AI_USER_MESSAGES.unavailable
    if (category === 'invalid_input') return AI_USER_MESSAGES.invalidImage
    return fallback
  }

  return sanitizeAiUserText(message, fallback)
}

export function isPlaceholderVisionModel(model: unknown): boolean {
  const value = String(model ?? '').toLowerCase()
  return (
    value.startsWith('fallback') ||
    value.includes('offline') ||
    value.includes('placeholder') ||
    value.includes('no-api-key')
  )
}

export function assertProductionVisionResult<T extends { model?: string; summary?: string }>(
  payload: T,
): T {
  if (isPlaceholderVisionModel(payload.model)) {
    throw new Error(AI_USER_MESSAGES.unavailable)
  }
  if (payload.summary && isDeveloperFacingMessage(payload.summary)) {
    throw new Error(AI_USER_MESSAGES.incomplete)
  }
  return payload
}

/** @deprecated Use resolveAiUserMessage — kept for existing imports. */
export const AI_ANALYSIS_UNAVAILABLE = AI_USER_MESSAGES.unavailable

export const LOCATION_UNAVAILABLE =
  'Location service temporarily unavailable. Please select your city manually.'

export function formatApiErrorMessage(
  error: unknown,
  fallback: string = AI_USER_MESSAGES.generic,
): string {
  return resolveAiUserMessage(error, fallback)
}

export const AIErrorHandler = {
  messages: AI_USER_MESSAGES,
  classify: classifyAiError,
  resolve: resolveAiUserMessage,
  sanitize: sanitizeAiUserText,
  isDeveloperFacing: isDeveloperFacingMessage,
  isPlaceholderVisionModel,
  assertProductionVisionResult,
}
