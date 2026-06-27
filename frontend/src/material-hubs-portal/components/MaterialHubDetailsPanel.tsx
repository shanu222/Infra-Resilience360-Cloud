import { BookOpen, Mail, MapPin, Package, Phone, X } from 'lucide-react'
import { Link } from 'react-router'
import type { HubInventory, MaterialHub } from '@/config/materialHubCatalog'
import { MATERIAL_HUB_GUIDANCE_ITEMS } from '@/config/materialHubGuidance'
import { getMaterialHubLocationDetail } from '@/config/materialHubLocationDetails'
import { formatMaterialStockQuantity } from '@/config/materialHubStockQuantities'
import { MaterialHubMediaImage } from './MaterialHubMedia'

type MaterialHubDetailsPanelProps = {
  hub: MaterialHub
  inventory: HubInventory | undefined
  onClose?: () => void
  variant: 'sidebar' | 'sheet'
}

export function MaterialHubDetailsPanel({
  hub,
  inventory,
  onClose,
  variant,
}: MaterialHubDetailsPanelProps) {
  const detail = getMaterialHubLocationDetail(hub)
  const panelClass =
    variant === 'sheet'
      ? 'mh-hub-panel mh-hub-panel--sheet'
      : 'mh-hub-panel mh-hub-panel--sidebar'

  return (
    <aside className={panelClass} aria-label={`${hub.name} details`}>
      <div className="mh-hub-panel__header">
        <div>
          <p className="mh-hub-panel__eyebrow">Material hub</p>
          <h2 className="mh-hub-panel__title">{hub.name}</h2>
          <p className="mh-hub-panel__meta">
            <MapPin className="w-4 h-4 shrink-0" aria-hidden />
            {hub.location}, {detail.province}
          </p>
        </div>
        {onClose ? (
          <button type="button" className="mh-hub-panel__close" onClick={onClose} aria-label="Close hub details">
            <X className="w-5 h-5" />
          </button>
        ) : null}
      </div>

      {hub.imageUrl?.trim() ?
        <div className="mh-hub-panel__image">
          <MaterialHubMediaImage
            src={hub.imageUrl}
            alt={hub.name}
            className="w-full h-full object-cover"
            wrapperClassName="w-full h-44 sm:h-52"
            loading="eager"
          />
        </div>
      : null}

      <div className="mh-hub-panel__body">
        <p className="mh-hub-panel__desc">{detail.description}</p>

        <section>
          <h3 className="mh-hub-panel__section-title">
            <Package className="w-4 h-4" aria-hidden />
            Available materials
          </h3>
          {inventory?.materials.length ?
            <ul className="mh-hub-panel__list">
              {inventory.materials.map((m) => (
                <li key={m.id}>
                  <span className="mh-hub-panel__material-name">{m.name}</span>
                  <span className="mh-hub-panel__material-qty">{formatMaterialStockQuantity(m, hub.id)}</span>
                </li>
              ))}
            </ul>
          : <p className="mh-hub-panel__muted">Material list available on the inventory page.</p>}
        </section>

        <section>
          <h3 className="mh-hub-panel__section-title">
            <BookOpen className="w-4 h-4" aria-hidden />
            Guidance documents
          </h3>
          <ul className="mh-hub-panel__guidance">
            {MATERIAL_HUB_GUIDANCE_ITEMS.map((g) => (
              <li key={g.id}>
                <Link to="/training" className="mh-hub-panel__guidance-link">
                  <MaterialHubMediaImage
                    src={g.media.thumbnail}
                    alt=""
                    className="w-12 h-12 object-cover rounded-md"
                    wrapperClassName="w-12 h-12 shrink-0 rounded-md overflow-hidden"
                  />
                  <span>{g.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mh-hub-panel__section-title">Coverage area</h3>
          <div className="mh-hub-panel__tags">
            {detail.coverageAreas.map((area) => (
              <span key={area} className="mh-hub-panel__tag">
                {area}
              </span>
            ))}
          </div>
        </section>

        {detail.contact?.phone || detail.contact?.email ? (
          <section>
            <h3 className="mh-hub-panel__section-title">Contact</h3>
            <div className="mh-hub-panel__contact">
              {detail.contact.phone ? (
                <a href={`tel:${detail.contact.phone.replace(/\s/g, '')}`} className="mh-hub-panel__contact-row">
                  <Phone className="w-4 h-4 shrink-0" aria-hidden />
                  {detail.contact.phone}
                </a>
              ) : null}
              {detail.contact.email ? (
                <a href={`mailto:${detail.contact.email}`} className="mh-hub-panel__contact-row">
                  <Mail className="w-4 h-4 shrink-0" aria-hidden />
                  {detail.contact.email}
                </a>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </aside>
  )
}
