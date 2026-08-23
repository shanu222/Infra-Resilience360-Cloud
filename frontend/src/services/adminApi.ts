/**
 * The live inventory admin UI accepts a runtime value from the user at login time.
 * We intentionally avoid hard-coding the backend admin key in the frontend.
 */
export function readAdminApiKeyOverride(): string {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}
    return String(env.VITE_ADMIN_API_KEY ?? '').trim()
  } catch {
    return ''
  }
}

export function adminJsonHeaders(adminKey?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-admin-key': (adminKey ?? readAdminApiKeyOverride()).trim(),
  }
}

/** Use with `FormData` uploads — do not set `Content-Type` (browser sets multipart boundary). */
export function adminKeyHeader(adminKey?: string): Record<string, string> {
  return { 'x-admin-key': (adminKey ?? readAdminApiKeyOverride()).trim() }
}
