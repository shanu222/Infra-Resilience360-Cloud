import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  clearStoredToken,
  createMaterial,
  fetchInventory,
  login,
  readStoredToken,
  removeMaterial,
  saveMaterial,
  SessionExpiredError,
  verifySession,
} from './api'
import type { AdminInventory } from './api'
import { LoginScreen } from './LoginScreen'
import { HubListScreen } from './HubListScreen'
import { HubInventoryScreen } from './HubInventoryScreen'

const SAVED_NOTICE = 'Saved. The public Material Hub now shows the updated inventory.'

export function InventoryAdminApp() {
  const [checkingSession, setCheckingSession] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [inventory, setInventory] = useState<AdminInventory | null>(null)
  const [selectedHubId, setSelectedHubId] = useState('')
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')

  const loadInventory = useCallback(async () => {
    setLoadError('')
    try {
      setInventory(await fetchInventory())
    } catch (cause) {
      if (cause instanceof SessionExpiredError) {
        setSignedIn(false)
        setInventory(null)
        return
      }
      setLoadError(cause instanceof Error ? cause.message : 'Could not load inventory.')
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      if (!readStoredToken()) {
        if (!cancelled) setCheckingSession(false)
        return
      }
      const valid = await verifySession()
      if (cancelled) return
      setSignedIn(valid)
      if (!valid) clearStoredToken()
      setCheckingSession(false)
    }

    void restoreSession()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (signedIn) void loadInventory()
  }, [signedIn, loadInventory])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 4000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const handleLogin = useCallback(async (password: string) => {
    await login(password)
    setSignedIn(true)
  }, [])

  const handleSignOut = useCallback(() => {
    clearStoredToken()
    setSignedIn(false)
    setInventory(null)
    setSelectedHubId('')
  }, [])

  /** Every mutation re-reads the backend so the portal always mirrors the source of truth. */
  const afterMutation = useCallback(async () => {
    await loadInventory()
    setNotice(SAVED_NOTICE)
  }, [loadInventory])

  const selectedHub = useMemo(
    () => inventory?.hubs.find((hub) => hub.id === selectedHubId) ?? null,
    [inventory, selectedHubId],
  )

  if (checkingSession) {
    return (
      <div className="login-shell">
        <p className="loading-text">Loading…</p>
      </div>
    )
  }

  if (!signedIn) {
    return <LoginScreen onSubmit={handleLogin} />
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-brand">
          <span className="login-brand-mark">IR360</span>
          <div>
            <strong>Infra Resilience360&deg;</strong>
            <span>Live Inventory Admin</span>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleSignOut}>
          Sign out
        </button>
      </header>

      <main className="admin-main">
        {notice ? <p className="alert alert-success">{notice}</p> : null}
        {loadError ? <p className="alert alert-error">{loadError}</p> : null}

        {!inventory ? (
          <p className="loading-text">Loading inventory…</p>
        ) : selectedHub ? (
          <HubInventoryScreen
            hub={selectedHub}
            onBack={() => setSelectedHubId('')}
            onSave={async (materialId, changes) => {
              await saveMaterial(selectedHub.id, materialId, changes)
              await afterMutation()
            }}
            onAdd={async (input) => {
              await createMaterial(selectedHub.id, input)
              await afterMutation()
            }}
            onDelete={async (materialId) => {
              await removeMaterial(selectedHub.id, materialId)
              await afterMutation()
            }}
          />
        ) : (
          <HubListScreen hubs={inventory.hubs} onSelect={setSelectedHubId} />
        )}
      </main>
    </div>
  )
}
