import { Link } from "react-router";
import { MapPin, Package, TrendingUp, Users, Shield, GraduationCap, Building2, AlertCircle } from "lucide-react";
import { useMaterialHubStrings } from "../../../i18n/materialHubStrings";
import { useLiveHubData } from "../../hooks/useLiveHubData";
import { HubCarousel } from "../../components/home/HubCarousel";
import { MaterialsGrid } from "../../components/home/MaterialsGrid";
import { InventoryChart } from "../../components/home/InventoryChart";
import { MATERIAL_HUB_SEED_ROWS, mapHubLocationToMaterialKey } from "../../data/materialHubCatalog";
import { resolvePortalAssetUrl } from "../../../utils/portalContentMedia";

const portalAsset = (relativePath: string) => resolvePortalAssetUrl(`assets/${relativePath.replace(/^assets\//, "")}`);

const hubImageByKey: Record<string, string> = {
  git: portalAsset("hubs/gilgit.jpg"),
  mzf: portalAsset("hubs/muzaffargarh.jpg"),
  skr: portalAsset("hubs/sukkur.jpg"),
};

const materialImageByName: Record<string, string> = {
  "bamboos (for joist)": portalAsset("materials/bamboo.jpg"),
  "bamboo (for purlins & walls)": portalAsset("materials/bamboo.jpg"),
  "bamboo (for ring beams)": portalAsset("materials/bamboo.jpg"),
  "wooden stick chick mat": portalAsset("materials/wooden-stick-chick-mat.jpg"),
  "polythene sheet": portalAsset("materials/polythene-sheet.jpg"),
  "cotton rope": portalAsset("materials/cotton-rope.jpg"),
  "steel girder (h beam)": portalAsset("materials/steel-girder.jpg"),
  cgi: portalAsset("materials/cgi-sheet.jpg"),
  "wooden planks 1": portalAsset("materials/wooden-plank.jpg"),
  "wooden planks 2": portalAsset("materials/wooden-plank.jpg"),
  "eps panels": portalAsset("materials/eps-panel.jpg"),
  pallets: portalAsset("materials/pallet.jpg"),
};

const mapMarkers = [
  { id: "m-git", label: "Gilgit", top: "18%", left: "63%" },
  { id: "m-mzf", label: "Muzaffargarh", top: "48%", left: "52%" },
  { id: "m-skr", label: "Sukkur", top: "62%", left: "43%" },
];

const normalizeMaterialName = (value: string) => value.trim().toLowerCase();

export function HomePage() {
  const t = useMaterialHubStrings();
  const { hubs, inventory, isLoading, error } = useLiveHubData();
  const totalCapacity = hubs.reduce((sum, hub) => sum + hub.capacity, 0);
  const avgStockPercentage = 100;
  const readyCount = hubs.filter((hub) => hub.status === 'ready').length;
  const moderateCount = hubs.filter((hub) => hub.status === 'moderate').length;
  const readyPercentage = hubs.length > 0 ? Math.round((readyCount / hubs.length) * 100) : 0;
  const moderatePercentage = hubs.length > 0 ? Math.round((moderateCount / hubs.length) * 100) : 0;

  const hubSlides = hubs
    .map((hub) => {
      const locationKey = mapHubLocationToMaterialKey(hub.location);
      if (!locationKey) {
        return null;
      }

      return {
        id: hub.id,
        name: hub.name,
        location: `${hub.location}, ${hub.district}`,
        imageUrl: hubImageByKey[locationKey],
      };
    })
    .filter((slide): slide is NonNullable<typeof slide> => Boolean(slide));

  const tableRows = MATERIAL_HUB_SEED_ROWS.map((row) => {
    const normalizedName = normalizeMaterialName(row.item_name);
    const resolveHubValue = (locationKey: "git" | "mzf" | "skr") => {
      const hub = hubs.find((item) => mapHubLocationToMaterialKey(item.location) === locationKey);
      const hubInventory = hub ? inventory.find((item) => item.hubId === hub.id) : null;
      const matchedMaterial = hubInventory?.materials.find((material) => normalizeMaterialName(material.name) === normalizedName);

      if (matchedMaterial) {
        return matchedMaterial.closing;
      }

      if (locationKey === "git") return row.git_quantity;
      if (locationKey === "mzf") return row.mzf_quantity;
      return row.skr_quantity;
    };

    return {
      id: normalizedName,
      material: row.item_name,
      imageUrl: materialImageByName[normalizedName] ?? portalAsset("materials/bamboo.jpg"),
      totalQty: row.total_quantity,
      gilgitQty: resolveHubValue("git"),
      muzaffargarhQty: resolveHubValue("mzf"),
      sukkurQty: resolveHubValue("skr"),
    };
  });

  const materialCards = MATERIAL_HUB_SEED_ROWS.slice(0, 8).map((row) => {
    const key = normalizeMaterialName(row.item_name);
    return {
      id: key,
      name: row.item_name,
      imageUrl: materialImageByName[key] ?? portalAsset("materials/bamboo.jpg"),
      quantity: row.total_quantity,
    };
  });

  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-10 text-gray-600">{t.loading}</div>;
  }

  if (error) {
    return <div className="max-w-7xl mx-auto px-4 py-10 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-1">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <img src={portalAsset("graphs/ndma-logo.png")} alt="NDMA" className="h-5 w-5 rounded-full" loading="lazy" decoding="async" />
              <span className="text-sm">{t.heroBadge}</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t.heroTitle}
            </h1>
            
            <p className="text-xl md:text-2xl text-emerald-50 mb-8">
              {t.heroSubtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/locations"
                className="px-8 py-4 bg-white text-emerald-600 rounded-lg hover:shadow-xl transition-all text-lg font-semibold"
              >
                {t.ctaLocations}
              </Link>
              <Link
                to="/inventory"
                className="px-8 py-4 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-all text-lg font-semibold"
              >
                {t.ctaInventory}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="group rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-emerald-100/80 p-6 shadow-md shadow-emerald-100/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-200/70">
            <div className="flex items-center justify-between mb-4">
              <Building2 className="h-10 w-10 text-emerald-700" />
              <span className="text-3xl font-bold text-gray-900">{hubs.length}</span>
            </div>
            <p className="text-sm text-gray-600">{t.statHubs}</p>
          </div>
          
          <div className="group rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50 to-teal-100/70 p-6 shadow-md shadow-cyan-100/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-200/70">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-10 w-10 text-blue-700" />
              <span className="text-3xl font-bold text-gray-900">{totalCapacity}</span>
            </div>
            <p className="text-sm text-gray-600">{t.statCapacity}</p>
          </div>
          
          <div className="group rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50 to-fuchsia-100/70 p-6 shadow-md shadow-purple-100/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-200/70">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-10 w-10 text-purple-700" />
              <span className="text-3xl font-bold text-gray-900">{avgStockPercentage}%</span>
            </div>
            <p className="text-sm text-gray-600">{t.statStock}</p>
          </div>
          
          <div className="group rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-orange-100/80 p-6 shadow-md shadow-amber-100/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-200/70">
            <div className="flex items-center justify-between mb-4">
              <Shield className="h-10 w-10 text-amber-700" />
              <span className="text-3xl font-bold text-gray-900">{hubs.length}</span>
            </div>
            <p className="text-sm text-gray-600">{t.statSplit}</p>
            <div className="mt-3 space-y-1 text-xs font-semibold">
              <div className="flex items-center justify-between text-green-700">
                <span>{t.statReady}</span>
                <span>{readyPercentage}% ({readyCount})</span>
              </div>
              <div className="flex items-center justify-between text-amber-700">
                <span>{t.statModerate}</span>
                <span>{moderatePercentage}% ({moderateCount})</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="group rounded-2xl border border-cyan-200/80 bg-gradient-to-br from-sky-50/90 via-cyan-50/85 to-blue-100/70 p-4 shadow-md shadow-cyan-100/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-200/70 sm:p-5">
            <h2 className="mb-3 text-2xl font-bold text-slate-900">{t.mapTitle}</h2>
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <img
                src={portalAsset("graphs/pakistan-map.png")}
                alt={t.mapAlt}
                className="h-[320px] w-full object-cover sm:h-[360px]"
                loading="lazy"
                decoding="async"
              />
              {mapMarkers.map((marker) => (
                <div
                  key={marker.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 px-2 py-1 text-[11px] font-semibold text-white shadow"
                  style={{ top: marker.top, left: marker.left }}
                >
                  {marker.label}
                </div>
              ))}
            </div>
          </article>

          <article className="group rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/85 to-fuchsia-100/70 p-4 shadow-md shadow-violet-100/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-200/70 sm:p-5">
            <h2 className="mb-3 text-2xl font-bold text-slate-900">{t.visualsTitle}</h2>
            <HubCarousel slides={hubSlides} intervalMs={4000} />
          </article>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <MaterialsGrid materials={materialCards} />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <InventoryChart rows={tableRows} />
      </section>

      {/* Disaster Readiness Index */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.readinessTitle}</h2>
          <p className="text-lg text-gray-600">{t.readinessSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hubs.map((hub) => (
            <div key={hub.id} className="group rounded-2xl border border-white/70 bg-white/75 backdrop-blur-md p-6 shadow-md shadow-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{hub.name}</h3>
                  <p className="text-sm text-gray-600">{hub.district}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  hub.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {hub.status === 'ready' ? `🟢 ${t.hubStatusReady}` : `🟡 ${t.hubStatusModerate}`}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">{t.stockLevel}</span>
                    <span className="font-semibold text-gray-900">100%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all bg-green-500"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">{t.damageLevel}</span>
                    <span className="font-semibold text-gray-900">{hub.damagePercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-red-500 transition-all"
                      style={{ width: `${hub.damagePercentage}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{t.capacityLabel.replace("{n}", String(hub.capacity))}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.offerTitle}</h2>
            <p className="text-lg text-gray-600">{t.offerSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/95 to-green-100/80 p-8 shadow-md shadow-emerald-100/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-200/70">
              <div className="bg-white/90 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <Package className="h-7 w-7 text-emerald-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t.f1Title}</h3>
              <p className="text-gray-600 mb-4">
                {t.f1Body}
              </p>
              <Link to="/inventory" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                {t.f1Link}
              </Link>
            </div>

            <div className="group rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/95 to-purple-100/75 p-8 shadow-md shadow-violet-100/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-200/70">
              <div className="bg-white/90 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <GraduationCap className="h-7 w-7 text-violet-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t.f2Title}</h3>
              <p className="text-gray-600 mb-4">
                {t.f2Body}
              </p>
              <Link to="/training" className="text-violet-700 hover:text-violet-800 font-semibold">
                {t.f2Link}
              </Link>
            </div>

            <div className="group rounded-2xl border border-cyan-200/80 bg-gradient-to-br from-blue-50/95 to-cyan-100/80 p-8 shadow-md shadow-cyan-100/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-200/70">
              <div className="bg-white/90 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <MapPin className="h-7 w-7 text-cyan-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t.f3Title}</h3>
              <p className="text-gray-600 mb-4">
                {t.f3Body}
              </p>
              <Link to="/locations" className="text-cyan-700 hover:text-cyan-800 font-semibold">
                {t.f3Link}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-emerald-600 to-blue-600 rounded-2xl p-8 md:p-12 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:pr-8">
              <h2 className="text-3xl font-bold mb-4">{t.needTitle}</h2>
              <p className="text-emerald-50 text-lg">
                {t.needBody}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                to="/inventory"
                className="px-8 py-4 bg-white text-emerald-600 rounded-lg hover:shadow-xl transition-all text-lg font-semibold inline-block"
              >
                {t.needCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Alert Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/95 to-yellow-100/85 p-6 shadow-md shadow-amber-100/70">
          <div className="flex items-start space-x-4">
            <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-amber-900 mb-2">{t.transparencyTitle}</h3>
              <p className="text-sm text-amber-800">
                {t.transparencyBody}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
