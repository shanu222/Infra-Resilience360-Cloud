import type { AdminHub } from './api'

type HubListScreenProps = {
  hubs: AdminHub[]
  onSelect: (hubId: string) => void
}

function totalUnits(hub: AdminHub): number {
  return hub.materials.reduce((sum, material) => sum + material.quantity, 0)
}

export function HubListScreen({ hubs, onSelect }: HubListScreenProps) {
  return (
    <section>
      <header className="section-head">
        <h2>Material Hubs</h2>
        <p>Select a hub to view and update its live inventory.</p>
      </header>

      <div className="hub-grid">
        {hubs.map((hub) => (
          <article key={hub.id} className="hub-card">
            <h3>{hub.name}</h3>
            <p className="hub-card-meta">
              {hub.location} &middot; {hub.district}
            </p>

            <dl className="hub-card-stats">
              <div>
                <dt>Materials</dt>
                <dd>{hub.materials.length}</dd>
              </div>
              <div>
                <dt>Total quantity</dt>
                <dd>{totalUnits(hub).toLocaleString('en-US')}</dd>
              </div>
            </dl>

            <button type="button" className="btn btn-primary btn-block" onClick={() => onSelect(hub.id)}>
              View Inventory
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
