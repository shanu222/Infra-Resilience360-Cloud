export function getErrorStatus(error) {
  if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
    return error.status
  }
  if (typeof error === 'object' && error !== null && 'httpStatus' in error && typeof error.httpStatus === 'number') {
    return error.httpStatus
  }
  return undefined
}

export function getErrorMessage(error) {
  if (error instanceof Error) return error.message
  return String(error ?? 'Unknown error')
}

export function classifyAiError(error) {
  const status = getErrorStatus(error)
  const message = getErrorMessage(error).toLowerCase()
  const code = String(error?.code ?? error?.error?.code ?? '').toLowerCase()

  if (status === 401 || /invalid api key|authentication|unauthorized/.test(message)) {
    return { category: 'auth_error', status: status ?? 401, retryable: false, fallback: true }
  }
  if (status === 403 || /forbidden|access denied/.test(message)) {
    return { category: 'access_denied', status: status ?? 403, retryable: false, fallback: true }
  }
  if (status === 404 || code === 'model_not_found' || /model.*not found|unknown model/.test(message)) {
    return { category: 'model_unavailable', status: status ?? 404, retryable: false, fallback: true }
  }
  if (
    status === 429 ||
    code === 'insufficient_quota' ||
    /rate limit|too many requests|quota exceeded|quota|billing/.test(message)
  ) {
    return { category: 'rate_limited', status: status ?? 429, retryable: true, fallback: true, is429: true }
  }
  if (
    status === 408 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    /timeout|timed out|econnreset|econnrefused|enotfound|network|fetch failed|socket hang up/.test(message)
  ) {
    return { category: 'transient', status: status ?? 503, retryable: true, fallback: true }
  }
  if (status && status >= 500) {
    return { category: 'provider_error', status, retryable: true, fallback: true }
  }
  return { category: 'unknown', status: status ?? 500, retryable: false, fallback: true }
}

export function formatFailureReason(error) {
  const classification = classifyAiError(error)
  if (classification.category === 'rate_limited') return '429'
  if (classification.category === 'transient' && /timeout|timed out/i.test(getErrorMessage(error))) return 'Timeout'
  if (classification.status) return String(classification.status)
  return classification.category
}

export class AiServiceUnavailableError extends Error {
  constructor(failures = []) {
    super('AI service is temporarily unavailable. Please try again later.')
    this.name = 'AiServiceUnavailableError'
    this.failures = failures
    this.httpStatus = 503
    this.userMessage = 'AI service is temporarily unavailable. Please try again later.'
  }
}

export function sanitizeForLog(text) {
  return String(text ?? '').replace(/sk-[A-Za-z0-9_-]+/g, 'sk-***').replace(/AIza[A-Za-z0-9_-]+/g, 'AIza***')
}
