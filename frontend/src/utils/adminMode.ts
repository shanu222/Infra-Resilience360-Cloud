/**
 * Legacy admin routes (`admin.html`) now render a read-only notice only.
 * The public app uses `index.html` → `main.tsx`.
 */
export function isAdminHtmlRoute(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const p = window.location.pathname || ''
    return /(^|\/)admin\.html$/i.test(p) || /(^|\/)admin-homepage\.html$/i.test(p)
  } catch {
    return false
  }
}

/** Diagnostic only; does not activate the admin shell. */
export function isAdminServiceEnv(): boolean {
  return import.meta.env.VITE_ADMIN_SERVICE_MODE === 'true'
}

/** Always false — administrative editing is permanently disabled. */
export function shouldActivateAdminShell(): boolean {
  return false
}
