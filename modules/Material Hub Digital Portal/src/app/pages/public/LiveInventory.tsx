import { useEffect, useMemo, useState } from "react";
import { Package, TrendingDown, AlertCircle, Building2, ChevronDown } from "lucide-react";
import { useLiveHubData } from "../../hooks/useLiveHubData";
import { MATERIAL_HUB_SEED_ROWS } from "../../data/materialHubCatalog";
import { useMaterialHubStrings } from "../../../i18n/materialHubStrings";
import { usePortalLanguage } from "../../../i18n/portalLanguage";

type HubTableRow = {
  itemName: string;
  totalQuantity: number;
  hubQuantity: number;
  stockPercentage: number;
};

export function LiveInventory() {
  const t = useMaterialHubStrings();
  const lang = usePortalLanguage();
  const dateLocale = lang === "ur" ? "ur-PK" : "en-US";
  const { hubs, inventory, isLoading, error } = useLiveHubData();
  const [selectedHub, setSelectedHub] = useState<string>("all");
  const [activeHubId, setActiveHubId] = useState<string | null>(null);

  const normalizedSeedRows = useMemo(
    () => MATERIAL_HUB_SEED_ROWS.map((row) => ({
      ...row,
      normalizedName: row.item_name.toLowerCase(),
    })),
    [],
  );

  const filteredInventory = selectedHub === "all" 
    ? inventory 
    : inventory.filter(inv => inv.hubId === selectedHub);

  useEffect(() => {
    if (!activeHubId) return;
    const isVisible = filteredInventory.some((hubInventory) => hubInventory.hubId === activeHubId);
    if (!isVisible) {
      setActiveHubId(null);
    }
  }, [activeHubId, filteredInventory]);

  const toggleHub = (hubId: string) => {
    setActiveHubId((current) => (current === hubId ? null : hubId));
  };

  const mapHubInventoryRows = (hubMaterials: typeof inventory[number]["materials"]): HubTableRow[] => {
    return normalizedSeedRows.map((row) => {
      const match = hubMaterials.find((material) => material.name.toLowerCase() === row.normalizedName);
      const hubQuantity = match ? match.closing : 0;
      const totalQuantity = row.total_quantity;
      const stockPercentage = 100;

      return {
        itemName: row.item_name,
        totalQuantity,
        hubQuantity,
        stockPercentage,
      };
    });
  };

  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-10 text-gray-600">{t.liveInvLoading}</div>;
  }

  if (error) {
    return <div className="max-w-7xl mx-auto px-4 py-10 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.liveInvTitle}</h1>
        <p className="text-xl text-gray-600">{t.liveInvSubtitle}</p>
      </div>

      {/* Hub Filter */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
        <label className="text-sm font-semibold text-gray-700 mb-3 block">{t.liveInvFilterHub}</label>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedHub("all")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              selectedHub === "all"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t.liveInvAllHubs}
          </button>
          {hubs.map((hub) => (
            <button
              key={hub.id}
              onClick={() => setSelectedHub(hub.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedHub === hub.id
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {hub.location}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Cards */}
      <div className="space-y-8">
        {filteredInventory.map((hubInventory) => {
          const hubRows = mapHubInventoryRows(hubInventory.materials);
          const isExpanded = activeHubId === hubInventory.hubId;

          return (
          <div key={hubInventory.hubId} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            {/* Hub Header */}
            <button
              type="button"
              onClick={() => toggleHub(hubInventory.hubId)}
              aria-expanded={isExpanded}
              className="w-full text-left bg-gradient-to-r from-emerald-600 to-blue-600 p-6 text-white transition-all duration-300 hover:brightness-105 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-8 w-8" />
                  <div>
                    <h2 className="text-2xl font-bold">{hubInventory.hubName}</h2>
                    <p className="text-emerald-100 text-sm">
                      {t.liveInvLastUpdated}{" "}
                      {new Date(hubInventory.lastUpdated).toLocaleDateString(dateLocale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{hubRows.length}</div>
                  <div className="text-emerald-100 text-sm">{t.liveInvMaterialItems}</div>
                </div>
                <ChevronDown
                  className={`h-7 w-7 ml-4 text-white/90 transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`}
                />
              </div>
            </button>

            {/* Inventory Table */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[1600px]" : "max-h-0"}`}>
              {isExpanded && (
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t.liveInvThMaterial}</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">{t.liveInvThHubQty}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {hubRows.map((material) => (
                    <tr key={`${hubInventory.hubId}-${material.itemName}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <Package className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-semibold text-gray-900">{material.itemName}</div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${material.stockPercentage < 20 ? 'text-red-600' : 'text-blue-700'}`}>
                        {material.hubQuantity.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
              )}
            </div>

            {/* Alerts */}
            {isExpanded && hubRows.some(m => m.stockPercentage < 20) && (
              <div className="bg-amber-50 border-t border-amber-200 p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">{t.liveInvLowStockTitle}</p>
                    <p className="text-sm text-amber-800">
                      {t.liveInvLowStockBody.replace(
                        "{n}",
                        String(hubRows.filter((m) => m.stockPercentage < 20).length),
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 text-white shadow-lg">
          <Package className="h-10 w-10 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-2">
            {inventory.reduce((sum, hub) => sum + hub.materials.length, 0)}
          </div>
          <div className="text-emerald-100">{t.liveInvTotalTypes}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
          <TrendingDown className="h-10 w-10 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-2">
            {inventory.reduce((sum, hub) => 
              sum + hub.materials.reduce((s, m) => s + m.issued, 0), 0
            ).toLocaleString()}
          </div>
          <div className="text-blue-100">{t.liveInvTotalIssued}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
          <AlertCircle className="h-10 w-10 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-2">
            {inventory.reduce((sum, hub) => 
              sum + hub.materials.reduce((s, m) => s + m.damaged, 0), 0
            ).toLocaleString()}
          </div>
          <div className="text-purple-100">{t.liveInvTotalDamaged}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white shadow-lg">
          <Building2 className="h-10 w-10 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-2">{hubs.length}</div>
          <div className="text-orange-100">{t.liveInvActiveHubs}</div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <Package className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-blue-900 mb-2">{t.liveInvHowToReadTitle}</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • <strong>{t.liveInvThHubQty}:</strong> {t.liveInvHowToReadLi}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
