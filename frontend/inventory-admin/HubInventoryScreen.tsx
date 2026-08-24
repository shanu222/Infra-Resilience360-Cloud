import { useState } from 'react'
import type { AdminHub, AdminMaterial } from './api'

type HubInventoryScreenProps = {
  hub: AdminHub
  onBack: () => void
  onSave: (materialId: string, changes: { quantity: number; unit: string }) => Promise<void>
  onAdd: (input: { name: string; unit: string; quantity: number }) => Promise<void>
  onDelete: (materialId: string) => Promise<void>
}

const formatQuantity = (value: number): string => value.toLocaleString('en-US')

export function HubInventoryScreen({ hub, onBack, onSave, onAdd, onDelete }: HubInventoryScreenProps) {
  const [editingId, setEditingId] = useState('')
  const [draftQuantity, setDraftQuantity] = useState('')
  const [draftUnit, setDraftUnit] = useState('')
  const [rowError, setRowError] = useState('')
  const [busy, setBusy] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUnit, setNewUnit] = useState('units')
  const [newQuantity, setNewQuantity] = useState('0')
  const [addError, setAddError] = useState('')

  function beginEdit(material: AdminMaterial) {
    setEditingId(material.id)
    setDraftQuantity(String(material.quantity))
    setDraftUnit(material.unit)
    setRowError('')
  }

  function cancelEdit() {
    setEditingId('')
    setRowError('')
  }

  async function commitEdit(materialId: string) {
    const quantity = Number(draftQuantity)
    if (!Number.isFinite(quantity) || quantity < 0) {
      setRowError('Enter a quantity of zero or more.')
      return
    }
    if (!draftUnit.trim()) {
      setRowError('Enter a unit.')
      return
    }

    setBusy(true)
    setRowError('')
    try {
      await onSave(materialId, { quantity, unit: draftUnit.trim() })
      setEditingId('')
    } catch (cause) {
      setRowError(cause instanceof Error ? cause.message : 'Could not save the change.')
    } finally {
      setBusy(false)
    }
  }

  async function commitAdd(event: React.FormEvent) {
    event.preventDefault()
    const quantity = Number(newQuantity)
    if (!newName.trim()) {
      setAddError('Enter a material name.')
      return
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      setAddError('Enter a quantity of zero or more.')
      return
    }

    setBusy(true)
    setAddError('')
    try {
      await onAdd({ name: newName.trim(), unit: newUnit.trim() || 'units', quantity })
      setNewName('')
      setNewUnit('units')
      setNewQuantity('0')
      setAddOpen(false)
    } catch (cause) {
      setAddError(cause instanceof Error ? cause.message : 'Could not add the material.')
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete(material: AdminMaterial) {
    const approved = window.confirm(`Remove "${material.name}" from ${hub.name}?`)
    if (!approved) return

    setBusy(true)
    try {
      await onDelete(material.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <button type="button" className="btn btn-ghost btn-back" onClick={onBack}>
        &larr; All Material Hubs
      </button>

      <header className="section-head section-head-row">
        <div>
          <h2>{hub.name}</h2>
          <p>
            {hub.location} &middot; {hub.district} &middot; Last updated {hub.lastUpdated}
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => setAddOpen((open) => !open)}>
          {addOpen ? 'Close' : 'Add material'}
        </button>
      </header>

      {addOpen ? (
        <form className="add-panel" onSubmit={commitAdd}>
          <label className="field">
            <span className="field-label">Material</span>
            <input
              value={newName}
              placeholder="e.g. Cement"
              onChange={(event) => setNewName(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Unit</span>
            <input value={newUnit} onChange={(event) => setNewUnit(event.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Quantity</span>
            <input
              type="number"
              min="0"
              step="any"
              value={newQuantity}
              onChange={(event) => setNewQuantity(event.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Add to hub
          </button>
          {addError ? <p className="alert alert-error add-panel-error">{addError}</p> : null}
        </form>
      ) : null}

      <div className="table-card">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Unit</th>
              <th className="numeric">Quantity</th>
              <th className="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {hub.materials.map((material) => {
              const isEditing = editingId === material.id
              return (
                <tr key={material.id} className={isEditing ? 'row-editing' : undefined}>
                  <td className="material-name">{material.name}</td>
                  <td>
                    {isEditing ? (
                      <input
                        className="cell-input"
                        value={draftUnit}
                        onChange={(event) => setDraftUnit(event.target.value)}
                      />
                    ) : (
                      material.unit
                    )}
                  </td>
                  <td className="numeric">
                    {isEditing ? (
                      <input
                        className="cell-input numeric"
                        type="number"
                        min="0"
                        step="any"
                        autoFocus
                        value={draftQuantity}
                        onChange={(event) => setDraftQuantity(event.target.value)}
                      />
                    ) : (
                      formatQuantity(material.quantity)
                    )}
                  </td>
                  <td className="actions">
                    {isEditing ? (
                      <div className="action-row">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={busy}
                          onClick={() => commitEdit(material.id)}
                        >
                          {busy ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={busy}
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="action-row">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => beginEdit(material)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={busy}
                          onClick={() => confirmDelete(material)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {rowError ? <p className="alert alert-error table-error">{rowError}</p> : null}
      </div>
    </section>
  )
}
