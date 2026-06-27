import { useEffect, useMemo } from 'react'
import { GeoJSON, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { FeatureCollection, Geometry } from 'geojson'
import type { MaterialHub } from '@/config/materialHubCatalog'
import { MaterialHubMapFlyTo } from './MaterialHubMapFlyTo'
import 'leaflet/dist/leaflet.css'

import pakistanAdm1GeoJsonUrl from '@/data/pakistan-adm1.geojson?url'

const PAKISTAN_CENTER: [number, number] = [30.3753, 69.3451]
const HUB_BOUNDS_PADDING: [number, number] = [48, 48]

const HUB_MARKER_COLORS: Record<string, string> = {
  gb1: '#059669',
  mzg1: '#2563eb',
  sukkur1: '#7c3aed',
  jalozai1: '#dc2626',
}

function createHubIcon(hubId: string, active: boolean) {
  const color = HUB_MARKER_COLORS[hubId] ?? '#059669'
  return L.divIcon({
    className: 'mh-map-marker-wrap',
    html: `<span class="mh-map-marker${active ? ' is-active' : ''}" style="--mh-marker:${color}">
      <span class="mh-map-marker__pulse"></span>
      <span class="mh-map-marker__core"></span>
    </span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  })
}

function FitHubBounds({ hubs }: { hubs: MaterialHub[] }) {
  const map = useMap()

  useEffect(() => {
    if (hubs.length === 0) return
    const timer = window.setTimeout(() => {
      map.invalidateSize()
      const bounds = L.latLngBounds(hubs.map((h) => [h.coordinates[0], h.coordinates[1]] as [number, number]))
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: HUB_BOUNDS_PADDING, maxZoom: 6, animate: true })
      }
    }, 220)
    return () => window.clearTimeout(timer)
  }, [hubs, map])

  return null
}

function PakistanBoundaryLayer() {
  const [boundary, setBoundary] = useState<FeatureCollection<Geometry> | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetch(pakistanAdm1GeoJsonUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setBoundary(data as FeatureCollection<Geometry>)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!boundary) return null

  return (
    <GeoJSON
      data={boundary}
      style={{
        color: '#14532d',
        weight: 2,
        fillColor: '#10b981',
        fillOpacity: 0.22,
      }}
    />
  )
}

type MaterialHubPakistanMapProps = {
  hubs: MaterialHub[]
  selectedHubId: string
  onSelectHub: (hubId: string) => void
  onOpenDetails: (hubId: string) => void
}

export function MaterialHubPakistanMap({
  hubs,
  selectedHubId,
  onSelectHub,
  onOpenDetails,
}: MaterialHubPakistanMapProps) {
  const flyTarget = useMemo(() => {
    const hub = hubs.find((h) => h.id === selectedHubId)
    if (!hub) return null
    return [hub.coordinates[0], hub.coordinates[1]] as [number, number]
  }, [hubs, selectedHubId])

  return (
    <div className="mh-map-shell">
      <MapContainer
        center={PAKISTAN_CENTER}
        zoom={5}
        minZoom={4}
        maxZoom={10}
        scrollWheelZoom
        className="mh-map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PakistanBoundaryLayer />
        <FitHubBounds hubs={hubs} />
        <MaterialHubMapFlyTo target={flyTarget} zoom={8} />

        {hubs.map((hub) => {
          const active = hub.id === selectedHubId
          return (
            <Marker
              key={hub.id}
              position={[hub.coordinates[0], hub.coordinates[1]]}
              icon={createHubIcon(hub.id, active)}
              eventHandlers={{
                click: () => {
                  onSelectHub(hub.id)
                  onOpenDetails(hub.id)
                },
              }}
            />
          )
        })}
      </MapContainer>
    </div>
  )
}
