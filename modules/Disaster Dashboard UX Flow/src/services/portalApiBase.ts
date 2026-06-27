import { buildApiTargets, buildApiUrl } from '@resilience/api-base'

export function buildPortalApiUrl(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with '/': ${path}`)
  }
  return buildApiUrl(path)
}

/**
 * Disaster Dashboard portal should try same-origin API first (Vercel rewrite/proxy),
 * then optionally fallback to `r360_api_base` when provided in iframe URL.
 */
export function buildPortalApiTargets(path: string): string[] {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with '/': ${path}`)
  }
  return buildApiTargets(path)
}

