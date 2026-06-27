import { useState } from 'react'
import type { InfrastructureImpactAssessment } from '../services/infrastructureAssessment'
import { formatInfrastructureCount, formatCurrency } from '../services/infrastructureAssessment'
import { getIntensityColor } from '../services/seismicImpact'
import SeismicLogicExplainer from './SeismicLogicExplainer'
import { CmsText } from './cms/CmsText'
import { appLocale } from '../i18n/appLocale'
import { usePageConfigElementsContext } from '../context/PageConfigElementsContext'
import './EarthquakeImpactDetails.css'

type EarthquakeImpactDetailsProps = {
  assessment: InfrastructureImpactAssessment
  onClose: () => void
}

export default function EarthquakeImpactDetails({
  assessment,
  onClose,
}: EarthquakeImpactDetailsProps) {
  const [showLogic, setShowLogic] = useState(false)
  const language = usePageConfigElementsContext()?.language ?? 'en'
  const t = appLocale[language]
  const {
    seismicAssessment,
    primaryZone,
    secondaryZone,
    totalInfrastructure,
    criticalInfraAtRisk,
    estimatedEconomicLoss,
    buildingCountSource,
  } = assessment

  const getRiskLevelColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'Extreme':
        return '#7f1d1d'
      case 'Very High':
        return '#b91c1c'
      case 'High':
        return '#dc2626'
      case 'Moderate':
        return '#f59e0b'
      default:
        return '#84cc16'
    }
  }

  return (
    <div className="earthquake-impact-overlay">
      <div className="earthquake-impact-modal">
        <div className="earthquake-impact-header">
          <CmsText as="h2" id="impact.modalTitle" fallback="🌍 Seismic Impact Assessment" />
          <div className="earthquake-impact-header-actions">
            <button
              className="logic-button"
              onClick={() => setShowLogic(true)}
              title={t.earthquakeUi.viewCalculationLogicAndFormulas}
              aria-label={t.earthquakeUi.showCalculationLogic}
            >
              <span className="logic-icon">🧮</span>
            </button>
            <button className="earthquake-impact-close" onClick={onClose} aria-label={t.earthquakeUi.close}>
              ×
            </button>
          </div>
        </div>

        <div className="earthquake-impact-body">
          {/* Overview Section */}
          <section className="earthquake-impact-section">
            <CmsText as="h3" id="impact.section.overview" fallback="📊 Event Overview" />
            <div className="earthquake-impact-grid-2">
              <div className="earthquake-impact-stat">
                <CmsText as="span" className="stat-label" id="impact.label.magnitude" fallback="Magnitude" />
                <span className="stat-value">M {seismicAssessment.magnitude.toFixed(1)}</span>
              </div>
              <div className="earthquake-impact-stat">
                <CmsText as="span" className="stat-label" id="impact.label.depth" fallback="Depth" />
                <span className="stat-value">{seismicAssessment.depthKm.toFixed(1)} km</span>
              </div>
              <div className="earthquake-impact-stat">
                <CmsText as="span" className="stat-label" id="impact.label.maxIntensity" fallback="Max Intensity" />
                <span
                  className="stat-value"
                  style={{ color: getIntensityColor(seismicAssessment.maxIntensity) }}
                >
                  MMI {seismicAssessment.maxIntensity.toFixed(1)}
                </span>
              </div>
              <div className="earthquake-impact-stat">
                <CmsText as="span" className="stat-label" id="impact.label.riskLevel" fallback="Risk Level" />
                <span
                  className="stat-value stat-badge"
                  style={{ backgroundColor: getRiskLevelColor(seismicAssessment.riskLevel) }}
                >
                  {seismicAssessment.riskLevel}
                </span>
              </div>
            </div>
          </section>

          {/* Impact Zones Section */}
          <section className="earthquake-impact-section">
            <CmsText as="h3" id="impact.section.zones" fallback="📍 Impact Zones" />
            <div className="earthquake-impact-zones">
              <div className="impact-zone severe">
                <div className="zone-header">
                  <CmsText as="span" className="zone-label" id="impact.zone.primaryLabel" fallback="🔴 Primary Impact Zone" />
                  <CmsText as="span" className="zone-desc" id="impact.zone.primaryDesc" fallback="Severe Shaking (MMI ≥ 7)" />
                </div>
                <div className="zone-stats">
                  <div>
                    <CmsText as="strong" id="impact.zone.primary.radiusLabel" fallback="Radius:" />{' '}
                    {seismicAssessment.primaryImpactRadiusKm} km
                  </div>
                  <div>
                    <CmsText as="strong" id="impact.zone.primary.areaLabel" fallback="Area:" />{' '}
                    {seismicAssessment.primaryImpactAreaSqKm.toLocaleString()} km²
                  </div>
                  <div>
                    <CmsText as="strong" id="impact.zone.primary.populationLabel" fallback="Population:" />{' '}
                    ~{primaryZone.populationAffected.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="impact-zone moderate">
                <div className="zone-header">
                  <CmsText as="span" className="zone-label" id="impact.zone.secondaryLabel" fallback="🟡 Secondary Impact Zone" />
                  <CmsText as="span" className="zone-desc" id="impact.zone.secondaryDesc" fallback="Moderate Shaking (MMI 5-7)" />
                </div>
                <div className="zone-stats">
                  <div>
                    <CmsText as="strong" id="impact.zone.secondary.radiusLabel" fallback="Radius:" />{' '}
                    {seismicAssessment.secondaryImpactRadiusKm} km
                  </div>
                  <div>
                    <CmsText as="strong" id="impact.zone.secondary.areaLabel" fallback="Area:" />{' '}
                    {seismicAssessment.secondaryImpactAreaSqKm.toLocaleString()} km²
                  </div>
                  <div>
                    <CmsText as="strong" id="impact.zone.secondary.populationLabel" fallback="Population:" />{' '}
                    ~{secondaryZone.populationAffected.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="impact-zone felt">
                <div className="zone-header">
                  <CmsText as="span" className="zone-label" id="impact.zone.feltLabel" fallback="🟢 Felt Radius" />
                  <CmsText as="span" className="zone-desc" id="impact.zone.feltDesc" fallback="Perceptible (MMI ≥ 3)" />
                </div>
                <div className="zone-stats">
                  <div>
                    <CmsText as="strong" id="impact.zone.felt.radiusLabel" fallback="Radius:" />{' '}
                    {seismicAssessment.feltRadiusKm} km
                  </div>
                  <div>
                    <CmsText as="strong" id="impact.zone.felt.areaLabel" fallback="Area:" />{' '}
                    {seismicAssessment.feltAreaSqKm.toLocaleString()} km²
                  </div>
                  <div>
                    <CmsText as="strong" id="impact.zone.felt.totalExposedLabel" fallback="Total Exposed:" />{' '}
                    ~{seismicAssessment.estimatedPopulationExposed.toLocaleString()}{' '}
                    <CmsText as="span" id="impact.zone.felt.peopleWord" fallback="people" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Infrastructure Assessment Section */}
          <section className="earthquake-impact-section">
            <CmsText as="h3" id="impact.section.infrastructure" fallback="🏗️ Infrastructure in Affected Area" />

            <div className="infrastructure-category">
              <CmsText as="h4" id="impact.category.buildings" fallback="🏢 Buildings" />
              <div className="earthquake-impact-grid-3">
                <div className="infra-stat">
                  <CmsText as="span" className="infra-label" id="impact.infra.residential" fallback="Residential" />
                  <span className="infra-value">
                    {formatInfrastructureCount(totalInfrastructure.buildings.residential, 'building')}
                  </span>
                </div>
                <div className="infra-stat">
                  <CmsText as="span" className="infra-label" id="impact.infra.commercial" fallback="Commercial" />
                  <span className="infra-value">
                    {formatInfrastructureCount(totalInfrastructure.buildings.commercial, 'building')}
                  </span>
                </div>
                <div className="infra-stat">
                  <CmsText as="span" className="infra-label" id="impact.infra.industrial" fallback="Industrial" />
                  <span className="infra-value">
                    {formatInfrastructureCount(totalInfrastructure.buildings.industrial, 'building')}
                  </span>
                </div>
              </div>
              <div className="infra-total">
                <CmsText as="strong" id="impact.infra.totalBuildingsLabel" fallback="Total Buildings:" />{' '}
                {formatInfrastructureCount(totalInfrastructure.buildings.total, 'building')}
              </div>
              {buildingCountSource && (
                <div className="infra-total">
                  <CmsText as="strong" id="impact.infra.buildingCountSourceLabel" fallback="Building Count Source:" />{' '}
                  {buildingCountSource.source} ({buildingCountSource.method}, {buildingCountSource.confidence} confidence)
                  <span
                    className={`accuracy-mode-badge ${
                      buildingCountSource.accuracyMode === 'WFS exact' ? 'accuracy-mode-badge-exact' : 'accuracy-mode-badge-fallback'
                    }`}
                  >
                    {buildingCountSource.accuracyMode}
                  </span>
                  {buildingCountSource.note ? ` - ${buildingCountSource.note}` : ''}
                </div>
              )}
            </div>

            <div className="infrastructure-category">
              <CmsText as="h4" id="impact.category.transportation" fallback="🚗 Transportation" />
              <div className="earthquake-impact-grid-3">
                <div className="infra-stat">
                  <CmsText as="span" className="infra-label" id="impact.infra.roads" fallback="Roads" />
                  <span className="infra-value">{totalInfrastructure.transportation.roadLengthKm.toLocaleString()} km</span>
                </div>
                <div className="infra-stat">
                  <CmsText as="span" className="infra-label" id="impact.infra.bridges" fallback="Bridges" />
                  <span className="infra-value">
                    {formatInfrastructureCount(totalInfrastructure.transportation.bridges, 'bridge')}
                  </span>
                </div>
                <div className="infra-stat">
                  <CmsText as="span" className="infra-label" id="impact.infra.railways" fallback="Railways" />
                  <span className="infra-value">{totalInfrastructure.transportation.railways.lengthKm} km</span>
                </div>
              </div>
            </div>

            <div className="infrastructure-category">
              <CmsText as="h4" id="impact.category.criticalFacilities" fallback="🏥 Critical Facilities" />
              <div className="earthquake-impact-grid-3">
                <div className="infra-stat">
                  <CmsText as="span" className="infra-label" id="impact.infra.hospitals" fallback="Hospitals" />
                  <span className="infra-value">{totalInfrastructure.criticalFacilities.hospitals}</span>
                </div>
                <div className="infra-stat">
                  <CmsText as="span" className="infra-label" id="impact.infra.schools" fallback="Schools" />
                  <span className="infra-value">{totalInfrastructure.criticalFacilities.schools}</span>
                </div>
                <div className="infra-stat">
                  <CmsText as="span" className="infra-label" id="impact.infra.emergencyServices" fallback="Emergency Services" />
                  <span className="infra-value">{totalInfrastructure.criticalFacilities.emergencyServices}</span>
                </div>
                <div className="infra-stat">
                  <CmsText as="span" className="infra-label" id="impact.infra.powerStations" fallback="Power Stations" />
                  <span className="infra-value">{totalInfrastructure.criticalFacilities.powerStations}</span>
                </div>
                <div className="infra-stat">
                  <CmsText as="span" className="infra-label" id="impact.infra.waterPlants" fallback="Water Plants" />
                  <span className="infra-value">{totalInfrastructure.criticalFacilities.waterTreatmentPlants}</span>
                </div>
              </div>
            </div>

            <div className="infrastructure-category">
              <CmsText as="h4" id="impact.category.utilities" fallback="⚡ Utilities" />
              <div className="earthquake-impact-grid-3">
                <div className="infra-stat">
                  <CmsText as="span" className="infra-label" id="impact.infra.powerLines" fallback="Power Lines" />
                  <span className="infra-value">{totalInfrastructure.utilities.electricityLines.toLocaleString()} km</span>
                </div>
                <div className="infra-stat">
                  <CmsText as="span" className="infra-label" id="impact.infra.waterPipes" fallback="Water Pipes" />
                  <span className="infra-value">{totalInfrastructure.utilities.waterPipes.toLocaleString()} km</span>
                </div>
                <div className="infra-stat">
                  <CmsText as="span" className="infra-label" id="impact.infra.cellTowers" fallback="Cell Towers" />
                  <span className="infra-value">{totalInfrastructure.utilities.communicationTowers}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Critical Infrastructure at Risk */}
          <section className="earthquake-impact-section">
            <CmsText as="h3" id="impact.section.criticalAtRisk" fallback="⚠️ Critical Infrastructure at Risk" />
            <div className="critical-infra-alert">
              {criticalInfraAtRisk.map((item, index) => (
                <div key={index} className="critical-infra-item">
                  <span className="critical-icon">🔴</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Economic Impact */}
          <section className="earthquake-impact-section">
            <CmsText as="h3" id="impact.section.economicLoss" fallback="💰 Estimated Economic Loss" />
            <div className="economic-loss-range">
              <div className="loss-estimate">
                <CmsText as="span" className="loss-label" id="impact.loss.lowLabel" fallback="Low Estimate" />
                <span className="loss-value">{formatCurrency(estimatedEconomicLoss.low, estimatedEconomicLoss.currency)}</span>
              </div>
              <div className="loss-estimate primary">
                <CmsText as="span" className="loss-label" id="impact.loss.mediumLabel" fallback="Medium Estimate" />
                <span className="loss-value">{formatCurrency(estimatedEconomicLoss.medium, estimatedEconomicLoss.currency)}</span>
              </div>
              <div className="loss-estimate">
                <CmsText as="span" className="loss-label" id="impact.loss.highLabel" fallback="High Estimate" />
                <span className="loss-value">{formatCurrency(estimatedEconomicLoss.high, estimatedEconomicLoss.currency)}</span>
              </div>
            </div>
            <CmsText
              as="p"
              className="economic-disclaimer"
              id="impact.economicDisclaimer"
              fallback="*Estimates based on statistical models and global averages. Actual losses may vary significantly based on local construction quality, preparedness, and response effectiveness."
            />
          </section>

          {/* Intensity Details */}
          <section className="earthquake-impact-section">
            <CmsText as="h3" id="impact.section.attenuation" fallback="📉 Intensity Attenuation" />
            <div className="intensity-zones-list">
              {seismicAssessment.intensityZones.slice(0, 6).map((zone, index) => (
                <div key={index} className="intensity-zone-item">
                  <span
                    className="intensity-badge"
                    style={{ backgroundColor: getIntensityColor(zone.intensityLevel) }}
                  >
                    MMI {zone.intensityLevel.toFixed(1)}
                  </span>
                  <div className="intensity-details">
                    <div><strong>{zone.shakeIntensity}</strong> {t.earthquakeUi.atWord} {zone.radiusKm} km</div>
                    <div className="intensity-desc">{zone.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Disclaimer */}
          <section className="earthquake-impact-disclaimer">
            <p>
              <CmsText
                as="strong"
                id="impact.footerNotePrefix"
                fallback="Note:"
              />{' '}
              <CmsText
                as="span"
                id="impact.footerNoteBody"
                fallback="This assessment uses simplified seismic attenuation models and statistical infrastructure density estimates. For precise impact analysis, consult with local seismologists and use region-specific GIS data. Infrastructure counts are approximate and based on global averages."
              />
            </p>
          </section>
        </div>

        <div className="earthquake-impact-footer">
          <button className="btn-primary" onClick={onClose} type="button">
            <CmsText as="span" id="impact.closeButton" fallback="Close Assessment" />
          </button>
        </div>
      </div>

      {/* Logic Explainer Modal */}
      {showLogic && <SeismicLogicExplainer onClose={() => setShowLogic(false)} />}
    </div>
  )
}
