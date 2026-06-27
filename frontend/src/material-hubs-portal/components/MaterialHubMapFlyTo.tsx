import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'

type MaterialHubMapFlyToProps = {
  target: LatLngExpression | null
  zoom?: number
}

export function MaterialHubMapFlyTo({ target, zoom = 8 }: MaterialHubMapFlyToProps) {
  const map = useMap()

  useEffect(() => {
    if (!target) return
    map.flyTo(target, zoom, { duration: 0.85 })
  }, [map, target, zoom])

  return null
}
