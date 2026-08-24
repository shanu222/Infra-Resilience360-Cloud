import { useState } from 'react'
import { Package, Building2 } from 'lucide-react'
import { mockHubs, mockInventory } from '@/config/materialHubCatalog'
import { formatMaterialStockQuantity } from '@/config/materialHubStockQuantities'
import { useMaterialHubStrings } from '@/hooks/useMaterialHubStrings'
import { usePortalLanguage } from '@/context/PortalLanguageContext'

export function LiveInventory() {
  const s = useMaterialHubStrings()
  const lang = usePortalLanguage()
  const [selectedHub, setSelectedHub] = useState<string>('all')

  const filteredInventory =
    selectedHub === 'all' ? mockInventory : mockInventory.filter((inv) => inv.hubId === selectedHub)

  const dateLocale = lang === 'ur' ? 'ur-PK' : 'en-US'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mh-page-header-glass text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{s.liveInvTitle}</h1>
        <p className="text-xl">{s.liveInvSubtitle}</p>
      </div>

      <div className="mh-inventory-filter rounded-xl p-6 mb-8">
        <label className="text-sm font-semibold mb-3 block">{s.liveInvFilterHub}</label>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedHub('all')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              selectedHub === 'all' ? 'mh-filter-btn--active shadow-md' : 'mh-filter-btn--inactive'
            }`}
          >
            {s.liveInvAllHubs}
          </button>
          {mockHubs.map((hub) => (
            <button
              key={hub.id}
              onClick={() => setSelectedHub(hub.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedHub === hub.id ? 'mh-filter-btn--active shadow-md' : 'mh-filter-btn--inactive'
              }`}
            >
              {hub.location}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {filteredInventory.map((hubInventory) => (
          <div key={hubInventory.hubId} className="mh-inventory-table-card rounded-xl overflow-hidden">
            <div className="mh-inventory-hub-head-wrap p-6 text-white">
              <div className="mh-inventory-hub-head flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-8 w-8" />
                  <div>
                    <h2 className="text-2xl font-bold">{hubInventory.hubName}</h2>
                    <p className="text-emerald-100 text-sm">
                      {s.liveInvLastUpdated}{' '}
                      {new Date(hubInventory.lastUpdated).toLocaleDateString(dateLocale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">100%</div>
                  <div className="text-emerald-100 text-sm">{s.stockAvailable}</div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="mh-inventory-table w-full">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">{s.liveInvThMaterial}</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">{s.quantity}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {hubInventory.materials.map((material) => (
                    <tr key={material.id} className="transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <Package className="h-5 w-5 text-gray-400" />
                          <div className="font-semibold">{material.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold">
                        {formatMaterialStockQuantity(material, hubInventory.hubId)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
