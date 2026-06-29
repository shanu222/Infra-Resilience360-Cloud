import { API_BASE_URL as CONFIGURED_API_BASE_URL } from '../config/apiBase'
import { formDataToMultipartBlob } from './nativeMultipart'
import { isCapacitorNativeRuntime } from '../utils/capacitorRuntime'
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
/** Matches backend `AI_TIMEOUT_MS` default; override with `VITE_AI_TIMEOUT_MS`. */
export function resolveAiTimeoutMs(): number {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}
    return Math.max(5_000, Number(env.VITE_AI_TIMEOUT_MS ?? 45_000) || 45_000)
  } catch {
    return 45_000
  }
}

/**
 * Vision POST client budget: allow backend provider fallback chain (OpenAI → Gemini → OpenRouter)
 * to complete before aborting, matching web behaviour of waiting for the full orchestration.
 */
export function resolveAiVisionClientTimeoutMs(): number {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}
    const explicit = Number(env.VITE_AI_VISION_CLIENT_TIMEOUT_MS ?? 0)
    if (explicit > 0) return explicit

    const base = resolveAiTimeoutMs()
    const order = String(env.VITE_AI_PROVIDER_ORDER ?? 'openai,gemini,openrouter')
    const providers = Math.max(1, order.split(',').map((item) => item.trim()).filter(Boolean).length)
    return Math.min(300_000, base * providers + 15_000)
  } catch {
    return resolveAiTimeoutMs() * 3
  }
}

async function resolveFetchInit(input: RequestInfo | URL, init?: RequestInit): Promise<RequestInit | undefined> {
  if (!init?.body || !(init.body instanceof FormData) || !isCapacitorNativeRuntime()) {
    return init
  }

  const { body, contentType } = await formDataToMultipartBlob(init.body)
  const headers = new Headers(init.headers ?? {})
  headers.set('Content-Type', contentType)
  return { ...init, body: body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength), headers }
}

/**
 * Vision multipart POST with client timeout aligned to backend AI_TIMEOUT_MS.
 * Prevents infinite spinners when CapacitorHttp or the network stalls.
 */
export async function fetchVisionApi(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const timeoutMs = resolveAiVisionClientTimeoutMs()
  if (init?.signal) {
    return fetchApi(input, init)
  }

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetchApi(input, { ...init, signal: controller.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`AI analysis timed out after ${Math.round(timeoutMs / 1000)} seconds. Please try again.`)
    }
    throw error
  } finally {
    window.clearTimeout(timer)
  }
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
