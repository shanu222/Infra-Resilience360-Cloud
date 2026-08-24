import { useEffect, useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'
import { mockHubs } from '@/config/materialHubCatalog'
import { MaterialHubDetailsPanel } from '../../components/MaterialHubDetailsPanel'
import { MaterialHubPakistanMap } from '../../components/MaterialHubPakistanMap'
import { useMaterialHubStrings } from '@/hooks/useMaterialHubStrings'
import { useLiveMaterialHubInventory } from '@/hooks/useLiveMaterialHubInventory'

export function HubLocations() {
  const s = useMaterialHubStrings()
  const inventory = useLiveMaterialHubInventory()
  const [selectedHubId, setSelectedHubId] = useState(mockHubs[0]?.id ?? '')
  const [panelOpen, setPanelOpen] = useState(false)

  const selectedHub = useMemo(
    () => mockHubs.find((h) => h.id === selectedHubId) ?? mockHubs[0],
    [selectedHubId],
  )

  const selectedInventory = useMemo(
    () => inventory.find((inv) => inv.hubId === selectedHub?.id),
    [inventory, selectedHub?.id],
  )

  useEffect(() => {
    if (!panelOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [panelOpen])

  const selectHub = (hubId: string) => {
    setSelectedHubId(hubId)
  }

  const openHubDetails = (hubId: string) => {
    setSelectedHubId(hubId)
    setPanelOpen(true)
  }

  if (!selectedHub) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mh-map-title-card text-center mb-6 px-6 py-8">
        <h1 className="text-4xl font-bold mb-4">{s.hubNetworkTitle}</h1>
      </div>

      <div className="mh-map-desc-card text-center mb-8 px-6 py-6">
        <p className="text-xl max-w-3xl mx-auto">{s.hubNetworkDesc}</p>
      </div>

      <div className="mh-map-glass-container mb-6">
        <div className="mh-map-selector-card mx-4 sm:mx-6 mt-4 sm:mt-6 px-4 sm:px-6 py-4">
          <p className="mh-map-selector-label text-sm font-semibold mb-3">{s.selectHub}</p>
          <div className="flex flex-wrap gap-2 sm:gap-3" role="tablist" aria-label={s.navLocations}>
            {mockHubs.map((hub) => {
              const hubTheme =
                hub.id === 'gb1' ? 'mh-hub-tab--gilgit' :
                hub.id === 'mzg1' ? 'mh-hub-tab--muzaffargarh' :
                hub.id === 'sukkur1' ? 'mh-hub-tab--sukkur' :
                'mh-hub-tab--jalozai'
              return (
                <button
                  key={hub.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedHubId === hub.id}
                  onClick={() => selectHub(hub.id)}
                  className={`min-h-[44px] px-5 py-2.5 rounded-lg font-semibold text-sm sm:text-base transition-all ${hubTheme} ${
                    selectedHubId === hub.id ? 'mh-hub-tab--active shadow-md' : 'mh-hub-tab--inactive'
                  }`}
                >
                  {hub.location}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mh-locations-layout">
          <div className="mh-locations-map-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <MapPin className="h-5 w-5 text-emerald-400 shrink-0" aria-hidden />
              <span className="text-sm font-medium text-gray-200">{s.logisticsMap}</span>
            </div>
            <MaterialHubPakistanMap
              hubs={mockHubs}
              selectedHubId={selectedHubId}
              onSelectHub={selectHub}
              onOpenDetails={openHubDetails}
            />
          </div>

          <div className="mh-locations-panel-col hidden lg:block">
            <MaterialHubDetailsPanel hub={selectedHub} inventory={selectedInventory} variant="sidebar" />
          </div>
        </div>

        {panelOpen ? (
          <div className="mh-hub-modal" role="dialog" aria-modal="true" aria-label={s.hubNetworkTitle}>
            <button
              type="button"
              className="mh-hub-modal__backdrop"
              aria-label={s.closeHubDetails}
              onClick={() => setPanelOpen(false)}
            />
            <div className="mh-hub-modal__surface">
              <MaterialHubDetailsPanel
                hub={selectedHub}
                inventory={selectedInventory}
                variant="modal"
                onClose={() => setPanelOpen(false)}
              />
            </div>
          </div>
        ) : null}

        {!panelOpen ? (
          <div className="lg:hidden px-4 py-3 border-t border-white/10">
            <button
              type="button"
              className="w-full min-h-[44px] rounded-lg bg-emerald-600 text-white font-semibold"
              onClick={() => openHubDetails(selectedHub.id)}
            >
              {s.viewHubDetails.replace('{location}', selectedHub.location)}
            </button>
          </div>
        ) : null}
      </div>

      <p className="mh-map-footnote text-center text-sm max-w-2xl mx-auto px-4 py-4 mh-map-desc-card">{s.hubMapFootnote}</p>
    </div>
  )
}
