/**
 * Single source of truth for the backend API origin.
 *
 * Resolution order:
 *   1. `VITE_API_BASE_URL` (or legacy `VITE_API_URL`) override — any environment.
 *   2. Browser running on a local host       -> development API.
 *   3. Everything else (production web)      -> production API.
 */

export const PRODUCTION_API_BASE_URL = 'https://infra-resilience360-cloud-production.up.railway.app'
export const DEVELOPMENT_API_BASE_URL = 'http://localhost:10000'

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])

const stripTrailingSlash = (value: string): string => String(value ?? '').trim().replace(/\/+$/, '')

function normalizeDeprecatedApiBase(value: string): string {
  const base = stripTrailingSlash(value)
  if (!base) return ''
  try {
    const parsed = new URL(base)
    const host = parsed.hostname.toLowerCase()
    if (host === `api.${'infraresilience.org'}`) {
      return PRODUCTION_API_BASE_URL
    }
  } catch {
    // Keep original fallback behavior for malformed overrides.
  }
  return base
}

function readEnvOverride(): string {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}
    return normalizeDeprecatedApiBase(env.VITE_API_BASE_URL ?? env.VITE_API_URL ?? '')
  } catch {
    return ''
  }
}

function isLocalHost(hostname: string): boolean {
  const host = String(hostname ?? '').toLowerCase()
  return LOCAL_HOSTNAMES.has(host) || host.endsWith('.local')
}

export function resolveApiBaseUrl(): string {
  const override = readEnvOverride()
  if (override) return override
  if (typeof window !== 'undefined' && isLocalHost(window.location.hostname)) {
    return DEVELOPMENT_API_BASE_URL
  }
  return PRODUCTION_API_BASE_URL
}

/** Resolved absolute API origin (no trailing slash), e.g. Railway backend URL. */
export const API_BASE_URL = stripTrailingSlash(resolveApiBaseUrl())

export default API_BASE_URL
