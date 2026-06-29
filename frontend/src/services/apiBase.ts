import { Capacitor } from '@capacitor/core'
import { API_BASE_URL as CONFIGURED_API_BASE_URL } from '../config/apiBase'
import { formDataToMultipartBlob } from './nativeMultipart'
export { normalizeImageFileForUpload } from '../utils/normalizeImageFile'
import {
  AI_ANALYSIS_UNAVAILABLE,
  AI_USER_MESSAGES,
  AIErrorHandler,
  LOCATION_UNAVAILABLE,
  assertProductionVisionResult,
  classifyAiError,
  formatApiErrorMessage,
  isPlaceholderVisionModel,
  resolveAiUserMessage,
} from '../utils/apiErrorMessage'

export {
  AI_ANALYSIS_UNAVAILABLE,
  AI_USER_MESSAGES,
  AIErrorHandler,
  LOCATION_UNAVAILABLE,
  assertProductionVisionResult,
  classifyAiError,
  formatApiErrorMessage,
  isPlaceholderVisionModel,
  resolveAiUserMessage,
}

export type { AiErrorCategory } from '../utils/apiErrorMessage'

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const envApiBase = stripTrailingSlash(String(CONFIGURED_API_BASE_URL ?? '').trim())

function resolveEffectiveApiOrigin(): string {
  return envApiBase
}

/**
 * API origin: configured override, or production API on deployed web, or same-origin in local dev.
 */
export const API_BASE =
  resolveEffectiveApiOrigin()

let apiBackendLogged = false
if (typeof window !== 'undefined' && !apiBackendLogged) {
  apiBackendLogged = true
  void stripTrailingSlash(String(API_BASE ?? '').trim())
}

/**
 * Build API URL for a path. When a remote API origin is configured, returns an absolute URL.
 */
export const buildApiUrl = (path: string): string => {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with '/': ${path}`)
  }
  const base = stripTrailingSlash(String(API_BASE ?? '').trim())
  if (!base) return path
  return `${base}${path}`
}

/**
 * Logs transport failures (TLS, DNS, offline) then rethrows so callers keep their control flow.
 */
async function resolveFetchInit(input: RequestInfo | URL, init?: RequestInit): Promise<RequestInit | undefined> {
  if (!init?.body || !(init.body instanceof FormData) || !Capacitor.isNativePlatform()) {
    return init
  }

  const { body, contentType } = await formDataToMultipartBlob(init.body)
  const headers = new Headers(init.headers ?? {})
  headers.set('Content-Type', contentType)
  return { ...init, body, headers }
}

export async function fetchApi(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const method = String(init?.method ?? 'GET').toUpperCase()
  const resolvedInit = await resolveFetchInit(input, init)
  const hasBody = resolvedInit?.body !== undefined && resolvedInit?.body !== null
  const shouldTimeoutReadOnly = !resolvedInit?.signal && !hasBody && (method === 'GET' || method === 'HEAD')

  if (shouldTimeoutReadOnly) {
    const controller = new AbortController()
    const timeoutMs = 12_000
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(input, { ...resolvedInit, signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  }

  return await fetch(input, resolvedInit)
}

/**
 * Ordered URL candidates for API paths.
 * Deployed web uses the dedicated API origin only (no same-origin 404s).
 */
export const buildApiTargets = (path: string): string[] => {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with '/': ${path}`)
  }

  const origin = stripTrailingSlash(String(resolveEffectiveApiOrigin() || API_BASE || '').trim())
  if (!origin) {
    throw new Error('API base origin is not configured. Set VITE_API_BASE_URL.')
  }
  return [`${origin}${path}`]
}
