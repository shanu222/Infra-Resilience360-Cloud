/** Matches server `ADMIN_API_KEY` (default `secure-key`). */
export const ADMIN_API_KEY = String(import.meta.env.VITE_ADMIN_API_KEY ?? 'secure-key').trim()

export function adminJsonHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-admin-key': ADMIN_API_KEY,
  }
}

/** Use with `FormData` uploads — do not set `Content-Type` (browser sets multipart boundary). */
export function adminKeyHeader(): Record<string, string> {
  return { 'x-admin-key': ADMIN_API_KEY }
}
