import type { HubInventory, Material, MaterialHub } from '@/config/materialHubCatalog'
import { adminJsonHeaders } from '@/services/adminApi'
import { buildApiUrl } from '@/services/apiBase'

export type PublicInventoryApiResponse = {
  hubs: MaterialHub[]
  inventory: HubInventory[]
  entries: Array<Record<string, unknown>>
}

export type AdminMaterialHubsResponse = {
  hubs: Array<Record<string, unknown>>
  entries: Array<Record<string, unknown>>
}

function normalizeStatus(value: unknown): MaterialHub['status'] {
  return value === 'moderate' || value === 'critical' ? value : 'ready'
}

function normalizeCoordinates(raw: unknown): [number, number] {
  if (Array.isArray(raw)) {
    const first = Number(raw[0] ?? 0)
    const second = Number(raw[1] ?? 0)
    return [Number.isFinite(first) ? first : 0, Number.isFinite(second) ? second : 0]
  }
  const latitude = Number((raw as Record<string, unknown>)?.latitude ?? 0)
  const longitude = Number((raw as Record<string, unknown>)?.longitude ?? 0)
  return [Number.isFinite(latitude) ? latitude : 0, Number.isFinite(longitude) ? longitude : 0]
}

export function normalizePublicMaterialRecord(raw: Record<string, unknown>): Material {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    unit: String(raw.unit ?? 'units'),
    opening: Number(raw.opening ?? 0),
    received: Number(raw.received ?? 0),
    issued: Number(raw.issued ?? 0),
    closing: Number(raw.closing ?? 0),
    damaged: Number(raw.damaged ?? 0),
    percentageRemaining: Number(raw.percentageRemaining ?? raw.percentage_remaining ?? 0),
  }
}

export function normalizePublicHubRecord(raw: Record<string, unknown>): MaterialHub {
  const coordinates = normalizeCoordinates(raw.coordinates ?? raw)
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    location: String(raw.location ?? ''),
    district: String(raw.district ?? ''),
    coordinates,
    capacity: Number(raw.capacity ?? 0),
    status: normalizeStatus(raw.status),
    stockPercentage: Number(raw.stockPercentage ?? raw.stock_percentage ?? 0),
    damagePercentage: Number(raw.damagePercentage ?? raw.damage_percentage ?? 0),
    imageUrl: String(raw.imageUrl ?? '').trim(),
  }
}

export function normalizePublicInventoryRecord(raw: Record<string, unknown>): HubInventory {
  return {
    hubId: String(raw.hubId ?? ''),
    hubName: String(raw.hubName ?? ''),
    lastUpdated: String(raw.lastUpdated ?? new Date().toISOString()),
    materials: Array.isArray(raw.materials)
      ? raw.materials.map((item) => normalizePublicMaterialRecord(item as Record<string, unknown>))
      : [],
  }
}

export async function fetchMaterialHubPublicInventory(): Promise<PublicInventoryApiResponse> {
  const response = await fetch(buildApiUrl('/api/material-hubs/inventory'), {
    headers: { 'Cache-Control': 'no-store' },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Unable to load live material hub inventory.')
  }

  const payload = (await response.json()) as Record<string, unknown>
  const hubs = Array.isArray(payload.hubs)
    ? payload.hubs.map((hub) => normalizePublicHubRecord(hub as Record<string, unknown>))
    : []
  const inventory = Array.isArray(payload.inventory)
    ? payload.inventory.map((hubInventory) => normalizePublicInventoryRecord(hubInventory as Record<string, unknown>))
    : []
  const entries = Array.isArray(payload.entries) ? payload.entries : []

  return { hubs, inventory, entries }
}

export async function inventoryAdminLogin(password: string): Promise<string> {
  const response = await fetch(buildApiUrl('/api/admin/inventory/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>
    const message = typeof payload.error === 'string' && payload.error ? payload.error : 'Invalid admin password.'
    throw new Error(message)
  }

  const payload = (await response.json()) as Record<string, unknown>
  const token = String(payload.token ?? '').trim()
  if (!token) {
    throw new Error('Backend login response did not include a token.')
  }
  return token
}

export async function fetchMaterialHubAdminData(adminKey: string): Promise<AdminMaterialHubsResponse & { stats: Record<string, unknown>; history: Record<string, unknown> }> {
  const headers = {
    ...adminJsonHeaders(adminKey),
  }

  const [hubsResponse, statsResponse, historyResponse] = await Promise.all([
    fetch(buildApiUrl('/api/admin/material-hubs'), { headers }),
    fetch(buildApiUrl('/api/admin/material-hubs/dashboard'), { headers }),
    fetch(buildApiUrl('/api/admin/material-hubs/history?limit=20'), { headers }),
  ])

  if (!hubsResponse.ok) {
    const payload = (await hubsResponse.json().catch(() => ({}))) as Record<string, unknown>
    const message = typeof payload.error === 'string' && payload.error ? payload.error : 'Unable to load Material Hub data.'
    throw new Error(message)
  }

  const payload = (await hubsResponse.json()) as AdminMaterialHubsResponse
  const stats = statsResponse.ok ? ((await statsResponse.json()) as Record<string, unknown>) : {}
  const history = historyResponse.ok ? ((await historyResponse.json()) as Record<string, unknown>) : { entries: [] }

  return {
    hubs: Array.isArray(payload.hubs) ? payload.hubs : [],
    entries: Array.isArray(payload.entries) ? payload.entries : [],
    stats,
    history,
  }
}

export async function createInventoryEntry(adminKey: string, payload: Record<string, unknown>) {
  const response = await fetch(buildApiUrl('/api/admin/material-hubs/entries'), {
    method: 'POST',
    headers: adminJsonHeaders(adminKey),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const parsed = (await response.json().catch(() => ({}))) as Record<string, unknown>
    const message = typeof parsed.error === 'string' ? parsed.error : 'Unable to create inventory entry.'
    throw new Error(message)
  }

  return (await response.json()) as Record<string, unknown>
}

export async function updateInventoryEntry(adminKey: string, entryId: string, payload: Record<string, unknown>) {
  const response = await fetch(buildApiUrl(`/api/admin/material-hubs/entries/${encodeURIComponent(entryId)}`), {
    method: 'PATCH',
    headers: adminJsonHeaders(adminKey),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const parsed = (await response.json().catch(() => ({}))) as Record<string, unknown>
    const message = typeof parsed.error === 'string' ? parsed.error : 'Unable to update inventory entry.'
    throw new Error(message)
  }

  return (await response.json()) as Record<string, unknown>
}

export async function deleteInventoryEntry(adminKey: string, entryId: string) {
  const response = await fetch(buildApiUrl(`/api/admin/material-hubs/entries/${encodeURIComponent(entryId)}`), {
    method: 'DELETE',
    headers: adminJsonHeaders(adminKey),
  })

  if (!response.ok) {
    const parsed = (await response.json().catch(() => ({}))) as Record<string, unknown>
    const message = typeof parsed.error === 'string' ? parsed.error : 'Unable to delete inventory entry.'
    throw new Error(message)
  }

  return (await response.json().catch(() => ({ ok: true }))) as Record<string, unknown>
}
