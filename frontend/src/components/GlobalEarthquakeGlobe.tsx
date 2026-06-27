import { useEffect, useMemo, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import { calculateSeismicImpact } from '../services/seismicImpact'
import {
  applyObservedBuildingCount,
  assessInfrastructureImpact,
  type InfrastructureImpactAssessment,
} from '../services/infrastructureAssessment'
import { fetchEarthquakeBuildingImpact, type EarthquakeBuildingImpactResponse } from '../services/earthquakeImpactApi'
import EarthquakeImpactDetails from './EarthquakeImpactDetails'
import SeismicLogicExplainer from './SeismicLogicExplainer'
import { CmsText } from './cms/CmsText'
import { appLocale } from '../i18n/appLocale'
import { usePageConfigElementsContext } from '../context/PageConfigElementsContext'

type GlobalEarthquake = {
  id: string
  magnitude: number
  place: string
  time: string
  depthKm: number
  lat: number
  lng: number
  url: string
}

type GlobePoint = {
  id: string
  lat: number
  lng: number
  altitude: number
  radius: number
  color: string
  label: string
}

type GlobalEarthquakeGlobeProps = {
  earthquakes: GlobalEarthquake[]
  selectedEarthquakeId?: string | null
  onSelectEarthquake?: (id: string) => void
  onRefreshEarthquakes?: () => void
  isRefreshing?: boolean
  focusToken?: number
}

function severityColor(magnitude: number): string {
  if (magnitude >= 6) return '#b91c1c'
  if (magnitude >= 5) return '#ea580c'
  if (magnitude >= 4) return '#ca8a04'
  return '#2563eb'
}

function formatLabel(quake: GlobalEarthquake, depthLabel: string): string {
  return [
    `<strong>M ${quake.magnitude.toFixed(1)}</strong>`,
    quake.place,
    `${depthLabel}: ${quake.depthKm.toFixed(1)} km`,
    new Date(quake.time).toLocaleString(),
  ].join('<br/>')
}

export default function GlobalEarthquakeGlobe({
  earthquakes,
  selectedEarthquakeId,
  onSelectEarthquake,
  onRefreshEarthquakes,
  isRefreshing = false,
  focusToken = 0,
}: GlobalEarthquakeGlobeProps) {
  const language = usePageConfigElementsContext()?.language ?? 'en'
  const t = appLocale[language]
  const containerRef = useRef<HTMLDivElement | null>(null)
  const globeStageRef = useRef<HTMLDivElement | null>(null)
  const globeRef = useRef<any>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [size, setSize] = useState({ width: 760, height: 460 })
  const [manualAltitude, setManualAltitude] = useState(1.2)
  const [cameraCenter, setCameraCenter] = useState({ lat: 20, lng: 15 })
  const [selectedImpactAssessment, setSelectedImpactAssessment] = useState<InfrastructureImpactAssessment | null>(null)
  const [isCalculatingImpact, setIsCalculatingImpact] = useState(false)
  const [showLogicExplainer, setShowLogicExplainer] = useState(false)
  const buildingImpactCacheRef = useRef<Map<string, EarthquakeBuildingImpactResponse>>(new Map())

  const selectedEarthquake = useMemo(
    () => earthquakes.find((quake) => quake.id === selectedEarthquakeId) ?? null,
    [earthquakes, selectedEarthquakeId],
  )

  useEffect(() => {
    const stage = globeStageRef.current
    if (!stage) return

    let resizeRaf = 0
    const updateSize = () => {
      const width = Math.max(280, Math.floor(stage.clientWidth - 12))
      const height = Math.max(260, Math.floor(stage.clientHeight - 12))
      setSize({ width, height })
    }

    updateSize()

    const observer = new ResizeObserver(() => {
      if (resizeRaf) window.cancelAnimationFrame(resizeRaf)
      resizeRaf = window.requestAnimationFrame(() => {
        resizeRaf = 0
        updateSize()
      })
    })
    observer.observe(stage)
    return () => {
      if (resizeRaf) window.cancelAnimationFrame(resizeRaf)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement
      setIsFullscreen(Boolean(fullscreenElement && containerRef.current && fullscreenElement.contains(containerRef.current)))
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    if (!globeRef.current) return

    if (earthquakes.length === 0) {
      const fallbackView = { lat: 20, lng: 15, altitude: 2.2 }
      setCameraCenter({ lat: fallbackView.lat, lng: fallbackView.lng })
      setManualAltitude(fallbackView.altitude)
      globeRef.current.pointOfView(fallbackView, 700)
      return
    }

    const target = selectedEarthquake ?? earthquakes[0]
    const altitude = selectedEarthquake ? 1.02 : 1.45
    setCameraCenter({ lat: target.lat, lng: target.lng })
    setManualAltitude(altitude)
    globeRef.current.pointOfView(
      {
        lat: target.lat,
        lng: target.lng,
        altitude,
      },
      900,
    )
  }, [earthquakes, selectedEarthquake, focusToken])

  const pointsData = useMemo<GlobePoint[]>(() => {
    return earthquakes.map((quake) => {
      const magnitude = Number.isFinite(quake.magnitude) ? quake.magnitude : 0
      return {
        id: quake.id,
        lat: quake.lat,
        lng: quake.lng,
        altitude: Math.max(0.01, Math.min(0.22, 0.02 + magnitude * 0.02)),
        radius: Math.max(0.08, Math.min(0.28, 0.08 + magnitude * 0.028)),
        color: severityColor(magnitude),
        label: formatLabel(quake, t.earthquakeUi.depthLabel),
      }
    })
  }, [earthquakes, t.earthquakeUi.depthLabel])

  const selectedPointData = useMemo<GlobePoint[]>(() => {
    if (!selectedEarthquake) return []

    return [
      {
        id: `selected-${selectedEarthquake.id}`,
        lat: selectedEarthquake.lat,
        lng: selectedEarthquake.lng,
        altitude: 0.24,
        radius: 0.42,
        color: '#ff2626',
        label: `⚠️ <strong>${t.earthquakeUi.selectedEarthquake}</strong><br/>${formatLabel(selectedEarthquake, t.earthquakeUi.depthLabel)}`,
      },
    ]
  }, [selectedEarthquake, t.earthquakeUi.depthLabel, t.earthquakeUi.selectedEarthquake])

  const ringData = useMemo(() => {
    if (!selectedEarthquake) return []
    return [selectedEarthquake]
  }, [selectedEarthquake])

  const handleToggleFullscreen = async () => {
    const container = containerRef.current
    if (!container) return

    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }

    await container.requestFullscreen()
  }

  const applyAltitude = (nextAltitude: number) => {
    const clamped = Math.max(0.78, Math.min(2.8, nextAltitude))
    setManualAltitude(clamped)
    globeRef.current?.pointOfView({ ...cameraCenter, altitude: clamped }, 350)
  }

  const handleZoomIn = () => {
    applyAltitude(manualAltitude - 0.2)
  }

  const handleZoomOut = () => {
    applyAltitude(manualAltitude + 0.2)
  }

  const handleResetView = () => {
    const fallback = earthquakes[0] ?? null
    const nextCenter = fallback ? { lat: fallback.lat, lng: fallback.lng } : { lat: 20, lng: 15 }
    const nextAltitude = fallback ? 1.45 : 2.2
    setCameraCenter(nextCenter)
    setManualAltitude(nextAltitude)
    globeRef.current?.pointOfView({ ...nextCenter, altitude: nextAltitude }, 650)
  }

  const handleEarthquakeClick = async (pointId: string) => {
    // Normalize the ID (remove 'selected-' prefix if present)
    const normalizedId = pointId.startsWith('selected-') ? pointId.replace('selected-', '') : pointId
    
    // Find the earthquake
    const earthquake = earthquakes.find((eq) => eq.id === normalizedId)
    if (!earthquake) return
    
    // Select the earthquake
    if (onSelectEarthquake) {
      onSelectEarthquake(normalizedId)
    }

    setIsCalculatingImpact(true)
    
    // Calculate seismic impact
    const seismicImpact = calculateSeismicImpact(
      earthquake.magnitude,
      earthquake.depthKm,
      earthquake.lat,
      earthquake.lng
    )
    
    // Assess infrastructure impact
    const baselineImpact = assessInfrastructureImpact(seismicImpact)
    setSelectedImpactAssessment(baselineImpact)

    try {
      const cachedImpact = buildingImpactCacheRef.current.get(normalizedId)
      const atlasImpact =
        cachedImpact ??
        (await fetchEarthquakeBuildingImpact({
          lat: earthquake.lat,
          lng: earthquake.lng,
          place: earthquake.place,
          radiusKm: seismicImpact.feltRadiusKm,
          populationExposed: seismicImpact.estimatedPopulationExposed,
        }))

      if (!cachedImpact) {
        const m = buildingImpactCacheRef.current
        m.set(normalizedId, atlasImpact)
        while (m.size > 48) {
          m.delete(m.keys().next().value as string)
        }
      }

      setSelectedImpactAssessment(
        applyObservedBuildingCount(baselineImpact, atlasImpact.estimatedBuildings, {
          source: atlasImpact.source,
          method: atlasImpact.method,
          accuracyMode: atlasImpact.accuracyMode,
          confidence: atlasImpact.confidence,
          note: atlasImpact.note,
        }),
      )
    } catch {
      // Keep baseline model if atlas lookup is unavailable.
    } finally {
      setIsCalculatingImpact(false)
    }
  }

  const handleCloseImpactAssessment = () => {
    setSelectedImpactAssessment(null)
  }

  const latestSyncLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const countriesCount = useMemo(() => {
    const countries = new Set(
      earthquakes
        .map((quake) => quake.place.split(',').at(-1)?.trim())
        .filter((country): country is string => Boolean(country)),
    )
    return countries.size
  }, [earthquakes])

  const averageMagnitude = useMemo(() => {
    if (!earthquakes.length) return 0
    const total = earthquakes.reduce((sum, quake) => sum + quake.magnitude, 0)
    return total / earthquakes.length
  }, [earthquakes])

  const maxMagnitude = useMemo(() => {
    if (!earthquakes.length) return 0
    return Math.max(...earthquakes.map((quake) => quake.magnitude))
  }, [earthquakes])

  const countryLabel = (place: string) => place.split(',').at(-1)?.trim() || t.earthquakeUi.globalCountryFallback

  const magnitudeBadgeClass = (magnitude: number) => {
    if (magnitude >= 6) return 'quake-mag-tier-veryhigh'
    if (magnitude >= 5) return 'quake-mag-tier-high'
    if (magnitude >= 4) return 'quake-mag-tier-medium'
    return 'quake-mag-tier-low'
  }

  const countryFlag = (label: string) => {
    const key = label.toLowerCase()
    if (key.includes('usa') || key.includes('united states')) return '🇺🇸'
    if (key.includes('mexico')) return '🇲🇽'
    if (key.includes('japan')) return '🇯🇵'
    if (key.includes('indonesia')) return '🇮🇩'
    if (key.includes('philippines')) return '🇵🇭'
    if (key.includes('turkey')) return '🇹🇷'
    if (key.includes('pakistan')) return '🇵🇰'
    if (key.includes('chile')) return '🇨🇱'
    if (key.includes('peru')) return '🇵🇪'
    if (key.includes('new zealand')) return '🇳🇿'
    return '🌍'
  }

  return (
    <div ref={containerRef} className={`earthquake-globe-wrap${isFullscreen ? ' earthquake-globe-wrap-fullscreen' : ''}`}>
      <div className="earthquake-monitor-canvas">
        <div className="earthquake-monitor-header">
          <CmsText as="div" className="earthquake-monitor-title" id="globe.monitor.title" fallback="Earthquake Live Monitor" />
          <div className="earthquake-monitor-status">
            <span className="earthquake-live-dot" />
            <CmsText as="span" id="globe.monitor.liveData" fallback="Live Data" />
            <CmsText as="small" id="globe.monitor.lastUpdated" fallback="Last Updated: Just Now" />
          </div>
          <div className="earthquake-monitor-actions">
            <button type="button" onClick={handleToggleFullscreen}>
              {isFullscreen ? (
                <CmsText as="span" id="globe.monitor.exitFullscreen" fallback="Exit Fullscreen" />
              ) : (
                <CmsText as="span" id="globe.monitor.fullscreen" fallback="Fullscreen" />
              )}
            </button>
            <button
              onClick={() => onRefreshEarthquakes?.()}
              disabled={isRefreshing}
              className="earthquake-refresh-btn"
              type="button"
            >
              {isRefreshing ? (
                <CmsText as="span" id="globe.monitor.syncing" fallback="Syncing..." />
              ) : (
                <CmsText as="span" id="globe.monitor.refresh" fallback="Refresh" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowLogicExplainer(true)}
              aria-label={t.earthquakeUi.viewCalculationFormulas}
              title={t.earthquakeUi.viewSeismicCalculationLogic}
              className="logic-formula-btn"
            >
              <CmsText as="span" id="globe.monitor.logicFormula" fallback="🧮 Logic/Formula" />
            </button>
          </div>
        </div>

        <div className="earthquake-monitor-body">
          <aside className="earthquake-monitor-left">
            <CmsText as="div" className="earthquake-activity-title" id="globe.activity.title" fallback="Recent Activity" />
            <div className="earthquake-activity-head">
              <CmsText as="span" id="globe.activity.colCountry" fallback="Country" />
              <CmsText as="span" id="globe.activity.colMagnitude" fallback="Magnitude" />
            </div>
            <div className="earthquake-activity-list">
              {earthquakes.slice(0, 8).map((quake) => {
                const country = countryLabel(quake.place)
                const magnitudeClass =
                  quake.magnitude >= 6
                    ? 'quake-entry-tier-veryhigh'
                    : quake.magnitude >= 5
                      ? 'quake-entry-tier-high'
                      : quake.magnitude >= 4
                        ? 'quake-entry-tier-medium'
                        : 'quake-entry-tier-low'

                return (
                  <button
                    key={quake.id}
                    className={`earthquake-activity-row ${magnitudeClass} ${selectedEarthquakeId === quake.id ? 'selected' : ''}`}
                    onClick={() => handleEarthquakeClick(quake.id)}
                    type="button"
                  >
                    <div className="earthquake-activity-left">
                      <span className="earthquake-flag" aria-hidden>
                        {countryFlag(country)}
                      </span>
                      <div className="earthquake-activity-text">
                        <strong>{country}</strong>
                        <small>{quake.place}</small>
                      </div>
                    </div>
                    <div className="earthquake-activity-mag">
                      <strong className={magnitudeBadgeClass(quake.magnitude)}>M {quake.magnitude.toFixed(1)}</strong>
                      <small>{new Date(quake.time).toLocaleTimeString()}</small>
                    </div>
                  </button>
                )
              })}
              {earthquakes.length === 0 && (
                <CmsText
                  as="p"
                  className="earthquake-floating-empty"
                  id="globe.activity.empty"
                  fallback="No global earthquakes available right now."
                />
              )}
            </div>
            {isCalculatingImpact && (
              <CmsText
                as="small"
                className="earthquake-impact-loading"
                id="globe.activity.updatingImpact"
                fallback="Updating Atlas building impact..."
              />
            )}
          </aside>

          <div className="earthquake-monitor-globe-area">
            <div ref={globeStageRef} className="earthquake-globe-stage">
              <Globe
                ref={globeRef}
                width={size.width}
                height={size.height}
                globeImageUrl="https://unpkg.com/three-globe/example/img/earth-day.jpg"
                bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundColor="rgba(0,0,0,0)"
                showAtmosphere
                atmosphereColor="#5ca8ff"
                atmosphereAltitude={0.2}
                pointsData={[...pointsData, ...selectedPointData]}
                pointLat="lat"
                pointLng="lng"
                pointAltitude="altitude"
                pointRadius="radius"
                pointColor="color"
                pointLabel="label"
                onPointClick={(point: { id?: string }) => {
                  const pointId = String(point?.id ?? '')
                  if (!pointId) return
                  handleEarthquakeClick(pointId)
                }}
                ringsData={ringData}
                ringLat="lat"
                ringLng="lng"
                ringColor={() => '#ff2626'}
                ringMaxRadius={3.6}
                ringPropagationSpeed={2.5}
                ringRepeatPeriod={700}
              />
            </div>

            <div className="earthquake-globe-tools">
              <button type="button" onClick={handleZoomIn} aria-label={t.earthquakeUi.zoomIn}>
                +
              </button>
              <button type="button" onClick={handleZoomOut} aria-label={t.earthquakeUi.zoomOut}>
                −
              </button>
              <button type="button" onClick={handleResetView} aria-label={t.earthquakeUi.resetView}>
                ⊗
              </button>
            </div>

            <CmsText as="div" className="earthquake-mini-map" id="globe.worldViewLabel" fallback="World View" />
          </div>
        </div>

        <div className="earthquake-monitor-foot">
          <div className="earthquake-legend-card">
            <CmsText as="h5" id="globe.legend.magnitudeScaleTitle" fallback="Magnitude Scale" />
            <div className="earthquake-legend-row">
              <span className="earthquake-legend-dot quake-mag-tier-low">•</span>
              <CmsText as="span" id="globe.legend.tierLt4" fallback={'M < 4.0'} />
              <span className="earthquake-legend-dot quake-mag-tier-medium">•</span>
              <CmsText as="span" id="globe.legend.tier4to5" fallback="4.0 - 5.0" />
              <span className="earthquake-legend-dot quake-mag-tier-high">•</span>
              <CmsText as="span" id="globe.legend.tier5to6" fallback="5.0 - 6.0" />
              <span className="earthquake-legend-dot quake-mag-tier-veryhigh">•</span>
              <CmsText as="span" id="globe.legend.tierGt6" fallback="> 6.0" />
            </div>
          </div>
          <div className="earthquake-stats-card">
            <CmsText as="h5" id="globe.stats.title" fallback="Global Statistics (24h)" />
            <div className="earthquake-stats-grid">
              <div>
                <CmsText as="small" id="globe.stats.label.totalEvents" fallback="Total Events" />
                <strong>{earthquakes.length}</strong>
              </div>
              <div>
                <CmsText as="small" id="globe.stats.label.avgMagnitude" fallback="Avg. Magnitude" />
                <strong>{averageMagnitude.toFixed(1)}</strong>
              </div>
              <div>
                <CmsText as="small" id="globe.stats.label.largest" fallback="Largest" />
                <strong>
                  M {maxMagnitude.toFixed(1)}
                </strong>
              </div>
              <div>
                <CmsText as="small" id="globe.stats.label.locations" fallback="Locations" />
                <strong>
                  {countriesCount}{' '}
                  <CmsText as="span" id="globe.stats.countriesWord" fallback="Countries" />
                </strong>
              </div>
            </div>
            <small className="earthquake-foot-sync">
              <CmsText as="span" id="globe.stats.syncedPrefix" fallback="Synced at" /> {latestSyncLabel}
            </small>
          </div>

      {/* Logic Explainer Modal */}
      {showLogicExplainer && (
        <SeismicLogicExplainer onClose={() => setShowLogicExplainer(false)} />
      )}
        </div>
      </div>
      
      {/* Impact Assessment Modal */}
      {selectedImpactAssessment && (
        <EarthquakeImpactDetails
          assessment={selectedImpactAssessment}
          onClose={handleCloseImpactAssessment}
        />
      )}
    </div>
  )
}
