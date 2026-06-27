import { useEffect, useMemo, useState } from "react";
import { MapPin, Package, TrendingUp, AlertCircle } from "lucide-react";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useLiveHubData } from "../../hooks/useLiveHubData";
import { useMaterialHubStrings } from "../../../i18n/materialHubStrings";
import type { FeatureCollection, Geometry } from "geojson";
import pakistanAdm1GeoJsonUrl from "../../../data/pakistan-adm1.geojson?url";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const PAKISTAN_GEOJSON_URL = pakistanAdm1GeoJsonUrl;
const PAKISTAN_CENTER: [number, number] = [30.3753, 69.3451];
const PAKISTAN_BOUNDS: L.LatLngBoundsExpression = [
  [23.5, 60.5],
  [37.5, 77.5],
];

const HUB_COVERAGE_BY_LOCATION: Record<string, string[]> = {
  gilgit: ['Gupis', 'Yasin', 'Darel', 'Tangir', 'Ghizer'],
  muzaffargarh: ['Muzaffargarh City', 'Kot Addu', 'Alipur', 'Jatoi'],
  sukkur: ['Sukkur City', 'Rohri', 'Pano Aqil', 'New Sukkur'],
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

function getCoverageAreas(location: string, district: string) {
  const locationKey = normalize(location);
  const preset = Object.keys(HUB_COVERAGE_BY_LOCATION).find((key) => locationKey.includes(key));
  if (preset) {
    return HUB_COVERAGE_BY_LOCATION[preset];
  }

  return [location, district, 'Nearby Tehsils', 'Rural Belt'];
}

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function PakistanViewportController({ boundary }: { boundary: FeatureCollection<Geometry> | null }) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();

      let targetBounds = L.latLngBounds(PAKISTAN_BOUNDS);

      if (boundary) {
        try {
          const geoBounds = L.geoJSON(boundary as never).getBounds();
          if (geoBounds.isValid()) {
            targetBounds = geoBounds;
          }
        } catch {
          // Ignore boundary parsing errors and use static Pakistan bounds.
        }
      }

      map.fitBounds(targetBounds, {
        padding: [20, 20],
        maxZoom: 6,
        animate: true,
        duration: 0.8,
      });
    }, 200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [boundary, map]);

  return null;
}

export function HubLocations() {
  const t = useMaterialHubStrings();
  const { hubs, inventory, isLoading, error } = useLiveHubData();
  const totalCapacity = hubs.reduce((sum, hub) => sum + hub.capacity, 0);
  const [selectedHubId, setSelectedHubId] = useState<string>("");
  const [pakistanBoundary, setPakistanBoundary] = useState<FeatureCollection<Geometry> | null>(null);

  const selectedHub = useMemo(() => {
    if (hubs.length === 0) {
      return null;
    }
    if (!selectedHubId) {
      return hubs[0];
    }
    return hubs.find((hub) => hub.id === selectedHubId) ?? hubs[0];
  }, [hubs, selectedHubId]);

  useEffect(() => {
    let cancelled = false;

    const loadBoundary = async () => {
      try {
        const response = await fetch(PAKISTAN_GEOJSON_URL);
        if (!response.ok) {
          return;
        }
        const geoJson = (await response.json()) as FeatureCollection<Geometry>;
        if (!cancelled) {
          setPakistanBoundary(geoJson);
        }
      } catch {
        // Keep map operational even if boundary overlay cannot be fetched.
      }
    };

    void loadBoundary();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-10 text-gray-600">{t.hubLocLoading}</div>;
  }

  if (error) {
    return <div className="max-w-7xl mx-auto px-4 py-10 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.hubLocTitle}</h1>
        <p className="text-xl text-gray-600">{t.hubLocSubtitle}</p>
      </div>

      {/* Interactive Global Map */}
      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-5 sm:p-8 mb-12 border-2 border-gray-200">
        <div className="flex items-center justify-center mb-4">
          <MapPin className="h-10 w-10 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">{t.hubLocMapTitle}</h3>
        <p className="text-center text-gray-600 max-w-3xl mx-auto mb-6">{t.hubLocMapDesc}</p>

        <div className="relative rounded-xl border border-gray-200 bg-white shadow-sm w-full h-full min-h-[500px] overflow-hidden">
          <MapContainer
            center={PAKISTAN_CENTER}
            zoom={5}
            minZoom={3}
            maxZoom={9}
            scrollWheelZoom
            className="w-full h-full min-h-[500px]"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <PakistanViewportController boundary={pakistanBoundary} />

            {pakistanBoundary && (
              <GeoJSON
                data={pakistanBoundary}
                style={{
                  color: "#14532d",
                  weight: 2,
                  fillColor: "#16a34a",
                  fillOpacity: 0.28,
                }}
              />
            )}

            {hubs.map((hub) => (
              <Marker
                key={hub.id}
                position={[hub.latitude, hub.longitude]}
                eventHandlers={{
                  click: () => setSelectedHubId(hub.id),
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{hub.name}</div>
                    <div>{hub.location}, {hub.district}</div>
                    <div className="text-xs mt-1">{hub.latitude.toFixed(4)}°N, {hub.longitude.toFixed(4)}°E</div>
                    <div className="text-xs mt-1">
                      {t.hubLocStock} {hub.stockPercentage}% | {t.hubLocDamage} {hub.damagePercentage}%
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {selectedHub && (
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-white/95 backdrop-blur-sm rounded-lg border border-emerald-200 shadow-lg p-4">
              <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase mb-1">{t.hubLocHubDetails}</p>
              <h4 className="text-base font-bold text-gray-900">{selectedHub.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{selectedHub.location}, {selectedHub.district}</p>
              <p className="text-xs text-gray-700 mb-1">
                {t.hubLocCoordinates} {selectedHub.latitude.toFixed(4)}°N, {selectedHub.longitude.toFixed(4)}°E
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                <div className="bg-emerald-50 rounded px-2 py-1">
                  {t.hubLocStock} {selectedHub.stockPercentage}%
                </div>
                <div className="bg-amber-50 rounded px-2 py-1">
                  {t.hubLocDamage} {selectedHub.damagePercentage}%
                </div>
                <div className="bg-blue-50 rounded px-2 py-1">
                  {t.hubLocCapacity} {selectedHub.capacity}
                </div>
                <div className="bg-slate-100 rounded px-2 py-1">
                  {t.hubLocStatus}{" "}
                  {selectedHub.status === "ready"
                    ? t.hubStatusReady
                    : selectedHub.status === "moderate"
                      ? t.hubStatusModerate
                      : selectedHub.status}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hub Details */}
      <div className="space-y-6">
        {hubs.map((hub) => {
          const hubInventory = inventory.find((item) => item.hubId === hub.id);
          const activeMaterialTypes = hubInventory?.materials.length ?? 0;

          return (
          <div key={hub.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-3">
              {/* Main Info */}
              <div className="lg:col-span-2 p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{hub.name}</h2>
                    <p className="text-gray-600 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {hub.location}, {hub.district}
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                    hub.status === 'ready' ? 'bg-green-100 text-green-700' :
                    hub.status === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {hub.status === 'ready'
                      ? t.hubLocFullyReady
                      : hub.status === 'moderate'
                        ? t.hubLocModerateLbl
                        : t.hubLocCritical}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Package className="h-4 w-4 mr-2" />
                      {t.hubLocStockLevel}
                    </div>
                    <div className="flex items-end space-x-2">
                      <span className="text-3xl font-bold text-gray-900">{hub.stockPercentage}%</span>
                      {hub.stockPercentage < 75 && (
                        <span className="text-sm text-amber-600 font-semibold mb-1">
                          {t.hubLocBelowThreshold}
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          hub.stockPercentage >= 75 ? 'bg-green-500' :
                          hub.stockPercentage >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${hub.stockPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {t.hubLocDamageRate}
                    </div>
                    <div className="flex items-end space-x-2">
                      <span className="text-3xl font-bold text-gray-900">{hub.damagePercentage}%</span>
                      {hub.damagePercentage > 10 && (
                        <span className="text-sm text-red-600 font-semibold mb-1">
                          {t.hubLocHighDamage}
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                      <div 
                        className="h-3 rounded-full bg-red-500 transition-all"
                        style={{ width: `${hub.damagePercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
          );
        })}
      </div>

      {/* Impact Areas Section */}
      <div className="mt-12 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">{t.hubLocStrategicTitle}</h2>
        <p className="text-emerald-50 mb-6">{t.hubLocStrategicBody}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="text-3xl font-bold mb-2">{totalCapacity}</div>
            <div className="text-emerald-50">{t.hubLocTotalHomes}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="text-3xl font-bold mb-2">3</div>
            <div className="text-emerald-50">{t.hubLocProvinces}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="text-3xl font-bold mb-2">24/7</div>
            <div className="text-emerald-50">{t.hubLocEmergency247}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
