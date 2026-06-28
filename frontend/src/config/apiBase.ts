/**
 * Single source of truth for the backend API origin.
 *
 * Resolution order:
 *   1. `VITE_API_BASE_URL` override.
 *   2. Production Railway origin fallback.
 */

export const PRODUCTION_API_BASE_URL = 'https://infra-resilience360-cloud-production.up.railway.app'

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
    return normalizeDeprecatedApiBase(env.VITE_API_BASE_URL ?? '')
  } catch {
    return ''
  }
}

export function resolveApiBaseUrl(): string {
  const override = readEnvOverride()
  if (override) return override
  return PRODUCTION_API_BASE_URL
}

/** Resolved absolute API origin (no trailing slash), e.g. Railway backend URL. */
export const API_BASE_URL = stripTrailingSlash(resolveApiBaseUrl())

export default API_BASE_URL
