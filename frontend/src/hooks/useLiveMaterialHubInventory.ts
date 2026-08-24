/**
 * Live Material Hub inventory, served from the central backend.
 *
 * The bundled static catalog is used as the initial value and as a fallback, so the
 * public portal renders instantly and never shows an empty table if the API is
 * unreachable. A successful response always wins over the bundled copy.
 */

import { useCallback, useEffect, useState } from 'react'
import { API_BASE_URL } from '@/config/apiBase'
import { mockInventory } from '@/config/materialHubCatalog'
import type { HubInventory, Material } from '@/config/materialHubCatalog'

type ApiMaterial = Partial<Material> & { name?: unknown }

type ApiHub = {
  hubId?: unknown
  hubName?: unknown
  lastUpdated?: unknown
  materials?: unknown
}

const toNumber = (value: unknown, fallback = 0): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const toText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

function normalizeMaterial(raw: ApiMaterial, index: number): Material | null {
  const name = toText(raw?.name)
  if (!name) return null

  const closing = toNumber(raw?.closing, toNumber(raw?.opening))
  return {
    id: toText(raw?.id) || `m${index + 1}`,
    name,
    unit: toText(raw?.unit) || 'units',
    opening: toNumber(raw?.opening, closing),
    received: toNumber(raw?.received),
    issued: toNumber(raw?.issued),
    closing,
    damaged: toNumber(raw?.damaged),
    percentageRemaining: toNumber(raw?.percentageRemaining, 100),
  }
}

function normalizeInventory(payload: unknown): HubInventory[] | null {
  const hubs = (payload as { hubs?: unknown } | null)?.hubs
  if (!Array.isArray(hubs) || hubs.length === 0) return null

  const normalized = hubs
    .map((entry) => {
      const hub = entry as ApiHub
      const hubId = toText(hub?.hubId)
      if (!hubId) return null

      const materials = Array.isArray(hub?.materials)
        ? (hub.materials as ApiMaterial[]).map(normalizeMaterial).filter((m): m is Material => m !== null)
        : []

      return {
        hubId,
        hubName: toText(hub?.hubName) || hubId,
        lastUpdated: toText(hub?.lastUpdated) || new Date().toISOString().slice(0, 10),
        materials,
      } satisfies HubInventory
    })
    .filter((hub): hub is HubInventory => hub !== null)

  return normalized.length > 0 ? normalized : null
}

export function useLiveMaterialHubInventory(): HubInventory[] {
  const [inventory, setInventory] = useState<HubInventory[]>(mockInventory)

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/material-hubs/inventory`, {
        signal,
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) return

      const normalized = normalizeInventory(await response.json())
      if (normalized) setInventory(normalized)
    } catch {
      /* offline or unreachable API — keep the last known good inventory */
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void refresh(controller.signal)

    /** Returning to the tab should surface an administrator's edit without a hard reload. */
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      controller.abort()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [refresh])

  return inventory
}
