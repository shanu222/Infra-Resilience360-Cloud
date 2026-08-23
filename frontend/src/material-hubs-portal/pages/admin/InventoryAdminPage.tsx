import { useEffect, useMemo, useState } from 'react'
import { Activity, Database, Plus, RefreshCcw, Save, ShieldCheck, Trash2 } from 'lucide-react'
import { API_BASE_URL } from '@/config/apiBase'
import { createInventoryEntry, deleteInventoryEntry, fetchMaterialHubAdminData, inventoryAdminLogin, updateInventoryEntry } from '@/material-hubs-portal/services/materialHubLiveApi'

const ADMIN_SESSION_KEY = 'r360-material-hub-admin-key'

type AdminHubRow = {
  id: string
  name: string
  location: string
  district: string
  status: 'ready' | 'moderate' | 'critical'
  stock_percentage?: number
  damage_percentage?: number
  capacity?: number
  updated_at?: string
}

type InventoryRow = {
  id: string
  hub_id?: string
  hubId?: string
  hub_name?: string
  name?: string
  unit?: string
  opening?: number
  received?: number
  issued?: number
  damaged?: number
  closing?: number
  percentage_remaining?: number
  updated_at?: string
}

type InventoryFormState = {
  hub_id: string
  name: string
  unit: string
  opening: string
  received: string
  issued: string
  damaged: string
}

const emptyFormState = (): InventoryFormState => ({
  hub_id: '',
  name: '',
  unit: 'units',
  opening: '0',
  received: '0',
  issued: '0',
  damaged: '0',
})

export function InventoryAdminPage() {
  const [adminKey, setAdminKey] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ADMIN_SESSION_KEY)
    } catch {
      return null
    }
  })
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hubs, setHubs] = useState<AdminHubRow[]>([])
  const [entries, setEntries] = useState<InventoryRow[]>([])
  const [stats, setStats] = useState<Record<string, unknown>>({})
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [form, setForm] = useState<InventoryFormState>(emptyFormState())
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)

  async function loadInventoryData(key: string) {
    setIsRefreshing(true)
    setError(null)
    try {
      const response = await fetchMaterialHubAdminData(key)
      setHubs(Array.isArray(response.hubs) ? (response.hubs as AdminHubRow[]) : [])
      setEntries(Array.isArray(response.entries) ? (response.entries as InventoryRow[]) : [])
      setStats(response.stats as Record<string, unknown>)
      setHistory(Array.isArray(response.history?.entries) ? (response.history.entries as Array<Record<string, unknown>>) : [])
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to load Material Hub inventory.'
      setError(message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (!adminKey) return
    setIsLoading(true)
    void loadInventoryData(adminKey)
  }, [adminKey])

  const handleLogin = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      const token = await inventoryAdminLogin(password)
      setAdminKey(token)
      setPassword('')
      try {
        localStorage.setItem(ADMIN_SESSION_KEY, token)
      } catch {
        // Ignore storage errors in restricted browsers.
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to sign in.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setAdminKey(null)
    setEntries([])
    setHubs([])
    setForm(emptyFormState())
    setEditingEntryId(null)
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY)
    } catch {
      // Ignore storage errors.
    }
  }

  const resetForm = () => {
    setForm(emptyFormState())
    setEditingEntryId(null)
    setSuccess(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!adminKey) return

    const hubId = form.hub_id.trim()
    const name = form.name.trim()
    if (!hubId || !name) {
      setError('Hub and material name are required.')
      return
    }

    const payload = {
      hub_id: hubId,
      name,
      unit: form.unit || 'units',
      opening: Number(form.opening || 0),
      received: Number(form.received || 0),
      issued: Number(form.issued || 0),
      damaged: Number(form.damaged || 0),
    }

    try {
      setError(null)
      setSuccess(null)
      setIsLoading(true)
      if (editingEntryId) {
        await updateInventoryEntry(adminKey, editingEntryId, payload)
        setSuccess('Inventory entry updated successfully.')
      } else {
        await createInventoryEntry(adminKey, payload)
        setSuccess('Inventory entry created successfully.')
      }
      resetForm()
      await loadInventoryData(adminKey)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to save inventory entry.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditEntry = (entry: InventoryRow) => {
    setEditingEntryId(String(entry.id))
    setForm({
      hub_id: String(entry.hub_id ?? entry.hubId ?? ''),
      name: String(entry.name ?? ''),
      unit: String(entry.unit ?? 'units'),
      opening: String(Number(entry.opening ?? 0)),
      received: String(Number(entry.received ?? 0)),
      issued: String(Number(entry.issued ?? 0)),
      damaged: String(Number(entry.damaged ?? 0)),
    })
    setError(null)
    setSuccess(null)
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!adminKey) return
    const entry = entries.find((item) => String(item.id) === String(entryId))
    const confirmed = window.confirm(`Delete ${entry?.name ?? 'this item'} from the live inventory?`)
    if (!confirmed) return

    try {
      setError(null)
      setSuccess(null)
      setIsLoading(true)
      await deleteInventoryEntry(adminKey, entryId)
      setSuccess('Inventory entry deleted successfully.')
      if (editingEntryId === entryId) resetForm()
      await loadInventoryData(adminKey)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to delete inventory entry.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return entries
    return entries.filter((entry) => {
      const hubName = String(entry.hub_name ?? entry.hubId ?? '').toLowerCase()
      const name = String(entry.name ?? '').toLowerCase()
      return name.includes(term) || hubName.includes(term)
    })
  }, [entries, searchTerm])

  const summaryCards = useMemo(
    () => [
      { label: 'Total hubs', value: String(hubs.length) },
      { label: 'Ready', value: String(hubs.filter((hub) => hub.status === 'ready').length) },
      { label: 'Low stock items', value: String(Number(stats.lowStockItems ?? 0)) },
      { label: 'Out of stock', value: String(Number(stats.outOfStockItems ?? 0)) },
    ],
    [hubs, stats],
  )

  if (!adminKey) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <div className="rounded-2xl border border-emerald-200 bg-white/90 p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Material Hub admin</p>
              <h1 className="text-3xl font-bold text-slate-900">Live Inventory Access</h1>
            </div>
          </div>

          <label className="mb-2 block text-sm font-semibold text-slate-700">Admin password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none ring-0 transition focus:border-emerald-500 focus:bg-white"
            placeholder="Enter API key"
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleLogin()
            }}
          />

          <button
            type="button"
            onClick={() => void handleLogin()}
            className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            disabled={isLoading || !password.trim()}
          >
            {isLoading ? 'Signing in…' : 'Access live inventory'}
          </button>

          {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <p className="mt-6 text-xs text-slate-500">
            Uses the same live backend inventory source as the public Material Hub portal. API origin: {API_BASE_URL}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Admin console</p>
          <h1 className="text-3xl font-bold text-slate-900">Material Hub inventory</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadInventoryData(adminKey)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed"
            disabled={isRefreshing}
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      {error ? <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <Database className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Inventory records</h2>
          </div>

          <div className="border-b border-slate-200 px-5 py-3">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:bg-white"
              placeholder="Search by material or hub"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">Hub</th>
                  <th className="px-5 py-3 font-semibold">Material</th>
                  <th className="px-5 py-3 font-semibold">Opening</th>
                  <th className="px-5 py-3 font-semibold">Closing</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEntries.map((entry) => (
                  <tr key={String(entry.id)} className="bg-white hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-700">{String(entry.hub_name ?? entry.hub_id ?? 'Unknown')}</td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900">{String(entry.name ?? 'Unknown item')}</div>
                      <div className="text-xs text-slate-500">{String(entry.unit ?? 'units')}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{Number(entry.opening ?? 0)}</td>
                    <td className="px-5 py-3 text-slate-700">{Number(entry.closing ?? 0)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditEntry(entry)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteEntry(String(entry.id))}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">{editingEntryId ? 'Edit inventory item' : 'Add inventory item'}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Hub</label>
              <select
                value={form.hub_id}
                onChange={(event) => setForm((current) => ({ ...current, hub_id: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value="">Select hub</option>
                {hubs.map((hub) => (
                  <option key={hub.id} value={hub.id}>
                    {hub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Material name</label>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white"
                placeholder="e.g. Bamboo for Joists"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Unit</label>
              <input
                value={form.unit}
                onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white"
                placeholder="units"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Opening</label>
                <input
                  type="number"
                  min="0"
                  value={form.opening}
                  onChange={(event) => setForm((current) => ({ ...current, opening: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Received</label>
                <input
                  type="number"
                  min="0"
                  value={form.received}
                  onChange={(event) => setForm((current) => ({ ...current, received: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Issued</label>
                <input
                  type="number"
                  min="0"
                  value={form.issued}
                  onChange={(event) => setForm((current) => ({ ...current, issued: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Damaged</label>
                <input
                  type="number"
                  min="0"
                  value={form.damaged}
                  onChange={(event) => setForm((current) => ({ ...current, damaged: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                disabled={isLoading || !form.hub_id || !form.name.trim()}
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Saving…' : editingEntryId ? 'Update entry' : 'Add entry'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear form
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">Recent inventory changes</h2>
            </div>

            <div className="space-y-3">
              {history.length ? (
                history.slice(0, 6).map((entry, index) => (
                  <div key={`${String(entry.entry_id ?? index)}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-800">{String(entry.material_name ?? 'Inventory update')}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {String(entry.field ?? 'updated')} • {String(entry.updated_by ?? 'admin')}
                    </p>
                    <p className="mt-2 text-xs text-slate-600">
                      {String(entry.previous_value ?? '')} → {String(entry.new_value ?? '')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No recent inventory history yet.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
