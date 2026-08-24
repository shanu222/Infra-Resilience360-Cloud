/**
 * API client for the standalone Live Inventory Admin portal.
 *
 * Talks only to the existing Railway backend. No credentials are embedded here:
 * the administrator's password is exchanged for a short-lived bearer token.
 */

const PRODUCTION_API_BASE_URL = 'https://infra-resilience360-cloud-production.up.railway.app'
const DEVELOPMENT_API_BASE_URL = 'http://localhost:10000'

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])

const stripTrailingSlash = (value: string): string => String(value ?? '').trim().replace(/\/+$/, '')

function resolveApiBaseUrl(): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}
  const override = stripTrailingSlash(env.VITE_API_BASE_URL ?? env.VITE_API_URL ?? '')
  if (override) return override
  if (typeof window !== 'undefined' && LOCAL_HOSTNAMES.has(window.location.hostname.toLowerCase())) {
    return DEVELOPMENT_API_BASE_URL
  }
  return PRODUCTION_API_BASE_URL
}

export const API_BASE_URL = stripTrailingSlash(resolveApiBaseUrl())

const TOKEN_STORAGE_KEY = 'r360-inventory-admin-token'

export type AdminMaterial = {
  id: string
  name: string
  unit: string
  quantity: number
}

export type AdminHub = {
  id: string
  name: string
  location: string
  district: string
  lastUpdated: string
  materials: AdminMaterial[]
}

export type AdminInventory = {
  version: number
  updatedAt: string
  hubs: AdminHub[]
}

/** Thrown when the session is missing or expired so the UI can return to the login screen. */
export class SessionExpiredError extends Error {
  constructor() {
    super('Your session has expired. Please sign in again.')
    this.name = 'SessionExpiredError'
  }
}

export function readStoredToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function storeToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    /* private browsing — the session simply will not persist across reloads */
  }
}

export function clearStoredToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** The backend's catch-all reply when a route does not exist on the running build. */
const UNKNOWN_ROUTE_ERROR = 'API route not found'

const STALE_BACKEND_MESSAGE =
  'The API is reachable but does not provide the inventory endpoints yet. Redeploy the backend from the latest commit, then try again.'

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string }
    if (body?.error === UNKNOWN_ROUTE_ERROR) return STALE_BACKEND_MESSAGE
    return body?.error || fallback
  } catch {
    return response.status === 404 ? STALE_BACKEND_MESSAGE : fallback
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = readStoredToken()
  if (!token) throw new SessionExpiredError()

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  }
  if (init.body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
    cache: 'no-store',
  })

  if (response.status === 401) {
    clearStoredToken()
    throw new SessionExpiredError()
  }
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'The request could not be completed.'))
  }
  return (await response.json()) as T
}

export async function login(password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/material-hub-admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ password }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Unable to sign in.'))
  }

  const body = (await response.json()) as { token?: string }
  if (!body?.token) throw new Error('The server did not return a session token.')
  storeToken(body.token)
}

export async function verifySession(): Promise<boolean> {
  try {
    await request<{ ok: boolean }>('/api/material-hub-admin/session')
    return true
  } catch {
    return false
  }
}

export function fetchInventory(): Promise<AdminInventory> {
  return request<AdminInventory>('/api/material-hub-admin/inventory')
}

export function saveMaterial(
  hubId: string,
  materialId: string,
  changes: { quantity: number; unit: string },
): Promise<{ material: AdminMaterial }> {
  return request<{ material: AdminMaterial }>(
    `/api/material-hub-admin/inventory/hubs/${encodeURIComponent(hubId)}/materials/${encodeURIComponent(materialId)}`,
    { method: 'PATCH', body: JSON.stringify(changes) },
  )
}

export function createMaterial(
  hubId: string,
  input: { name: string; unit: string; quantity: number },
): Promise<{ material: AdminMaterial }> {
  return request<{ material: AdminMaterial }>(
    `/api/material-hub-admin/inventory/hubs/${encodeURIComponent(hubId)}/materials`,
    { method: 'POST', body: JSON.stringify(input) },
  )
}

export function removeMaterial(hubId: string, materialId: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(
    `/api/material-hub-admin/inventory/hubs/${encodeURIComponent(hubId)}/materials/${encodeURIComponent(materialId)}`,
    { method: 'DELETE' },
  )
}
