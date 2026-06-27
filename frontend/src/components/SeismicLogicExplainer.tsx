import './SeismicLogicExplainer.css'
import { CmsText } from './cms/CmsText'
import { appLocale } from '../i18n/appLocale'
import { usePageConfigElementsContext } from '../context/PageConfigElementsContext'

type SeismicLogicExplainerProps = {
  onClose: () => void
}

export default function SeismicLogicExplainer({ onClose }: SeismicLogicExplainerProps) {
  const language = usePageConfigElementsContext()?.language ?? 'en'
  const t = appLocale[language]
  return (
    <div className="logic-explainer-overlay" onClick={onClose}>
      <div className="logic-explainer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="logic-explainer-header">
          <CmsText
            as="h3"
            id="seismicLogic.modalTitle"
            fallback="📐 Seismic Calculation Logic"
          />
          <button className="logic-explainer-close" onClick={onClose} aria-label={t.earthquakeUi.close}>
            ×
          </button>
        </div>

        <div className="logic-explainer-content">
          <section className="logic-section">
            <CmsText as="h4" id="seismicLogic.gmpe.heading" fallback="🌊 Ground Motion Intensity (GMPE)" />
            <div className="logic-formula">
              <code>MMI = a + b×M - c×log₁₀(R + depth_factor)</code>
            </div>
            <CmsText
              as="p"
              className="logic-description"
              id="seismicLogic.gmpe.intro"
              fallback="Modified Gutenberg-Richter attenuation model calculates Modified Mercalli Intensity (MMI) at any distance from epicenter."
            />
            <ul className="logic-params">
              <li>
                <CmsText
                  as="span"
                  id="seismicLogic.gmpe.param1"
                  fallback="a = 1.5 – Baseline intensity coefficient"
                />
              </li>
              <li>
                <CmsText
                  as="span"
                  id="seismicLogic.gmpe.param2"
                  fallback="b = 1.5 – Magnitude scaling factor"
                />
              </li>
              <li>
                <CmsText
                  as="span"
                  id="seismicLogic.gmpe.param3"
                  fallback="c = 3.5 – Distance attenuation coefficient"
                />
              </li>
              <li>
                <CmsText as="span" id="seismicLogic.gmpe.param4" fallback="M – Earthquake magnitude" />
              </li>
              <li>
                <CmsText as="span" id="seismicLogic.gmpe.param5" fallback="R – Distance from epicenter (km)" />
              </li>
              <li>
                <CmsText
                  as="span"
                  id="seismicLogic.gmpe.param6"
                  fallback="depth_factor = max(1, depth × 0.3) – Depth correction"
                />
              </li>
            </ul>
          </section>

          <section className="logic-section">
            <CmsText as="h4" id="seismicLogic.zones.heading" fallback="📍 Impact Zone Thresholds" />
            <ul className="logic-zones">
              <li>
                <CmsText
                  as="span"
                  id="seismicLogic.zones.primary"
                  fallback="Primary Zone: MMI ≥ 7 (Building damage begins)"
                />
              </li>
              <li>
                <CmsText
                  as="span"
                  id="seismicLogic.zones.secondary"
                  fallback="Secondary Zone: MMI ≥ 5 (Widely felt, minor damage)"
                />
              </li>
              <li>
                <CmsText
                  as="span"
                  id="seismicLogic.zones.felt"
                  fallback="Felt Zone: MMI ≥ 3 (Perceptible shaking)"
                />
              </li>
            </ul>
            <CmsText
              as="p"
              className="logic-description"
              id="seismicLogic.zones.note"
              fallback="Radius calculated via binary search to find distance where intensity equals threshold."
            />
          </section>

          <section className="logic-section">
            <CmsText as="h4" id="seismicLogic.area.heading" fallback="📏 Impact Area Calculation" />
            <div className="logic-formula">
              <code>Area = π × radius²</code>
            </div>
            <CmsText
              as="p"
              className="logic-description"
              id="seismicLogic.area.body"
              fallback="Each impact zone is modeled as a circular area centered on epicenter. All measurements in square kilometers."
            />
          </section>

          <section className="logic-section">
            <CmsText as="h4" id="seismicLogic.population.heading" fallback="👥 Population Exposure Estimation" />
            <div className="logic-formula">
              <code>Population = Felt Area (km²) × Density</code>
            </div>
            <ul className="logic-params">
              <li>
                <CmsText
                  as="span"
                  id="seismicLogic.population.li1"
                  fallback="Global average density: 60 people/km²"
                />
              </li>
              <li>
                <CmsText
                  as="span"
                  id="seismicLogic.population.li2"
                  fallback="Magnitude ≥ 6: 30 people/km² (larger events in less populated areas)"
                />
              </li>
              <li>
                <CmsText
                  as="span"
                  id="seismicLogic.population.li3"
                  fallback="Applied only to felt radius area (MMI ≥ 3)"
                />
              </li>
            </ul>
          </section>

          <section className="logic-section">
            <CmsText as="h4" id="seismicLogic.infra.heading" fallback="🏢 Infrastructure Estimation Method" />
            <div className="logic-subsection">
              <CmsText as="strong" id="seismicLogic.infra.residentialTitle" fallback="Residential Buildings" />
              <code>Buildings = Population ÷ 4 persons/unit × 250 units/1000 people</code>
            </div>
            <div className="logic-subsection">
              <CmsText
                as="strong"
                id="seismicLogic.infra.transportTitle"
                fallback="Transportation Infrastructure"
              />
              <code>Roads (km) = Area × 150 km/km²</code>
              <code>Bridges = Area × 0.8 bridges/km²</code>
            </div>
            <div className="logic-subsection">
              <CmsText
                as="strong"
                id="seismicLogic.infra.criticalTitle"
                fallback="Critical Facilities per 100,000 people"
              />
              <ul>
                <li>
                  <CmsText as="span" id="seismicLogic.infra.hospitals" fallback="Hospitals: 1.5" />
                </li>
                <li>
                  <CmsText as="span" id="seismicLogic.infra.schools" fallback="Schools: 25" />
                </li>
                <li>
                  <CmsText as="span" id="seismicLogic.infra.emergency" fallback="Emergency Services: 3" />
                </li>
              </ul>
            </div>
          </section>

          <section className="logic-section">
            <CmsText as="h4" id="seismicLogic.risk.heading" fallback="⚠️ Risk Level Determination" />
            <ul className="logic-risk">
              <li>
                <CmsText as="span" id="seismicLogic.risk.extreme" fallback="Extreme: M ≥ 7.0 or MMI ≥ 9" />
              </li>
              <li>
                <CmsText as="span" id="seismicLogic.risk.veryHigh" fallback="Very High: M ≥ 6.0 or MMI ≥ 7.5" />
              </li>
              <li>
                <CmsText as="span" id="seismicLogic.risk.high" fallback="High: M ≥ 5.0 or MMI ≥ 6.0" />
              </li>
              <li>
                <CmsText as="span" id="seismicLogic.risk.moderate" fallback="Moderate: M ≥ 4.0 or MMI ≥ 4.5" />
              </li>
              <li>
                <CmsText as="span" id="seismicLogic.risk.low" fallback={'Low: M < 4.0'} />
              </li>
            </ul>
          </section>

          <section className="logic-section logic-section-last">
            <CmsText as="h4" id="seismicLogic.assumptions.heading" fallback="📋 Assumptions & Limitations" />
            <ul className="logic-assumptions">
              <li>
                <CmsText as="span" id="seismicLogic.assumptions.a1" fallback="Circular impact zones centered on epicenter" />
              </li>
              <li>
                <CmsText
                  as="span"
                  id="seismicLogic.assumptions.a2"
                  fallback="Uniform population and infrastructure distribution"
                />
              </li>
              <li>
                <CmsText
                  as="span"
                  id="seismicLogic.assumptions.a3"
                  fallback="Global average density used (not actual regional data)"
                />
              </li>
              <li>
                <CmsText
                  as="span"
                  id="seismicLogic.assumptions.a4"
                  fallback="Linear infrastructure density ratios applied"
                />
              </li>
              <li>
                <CmsText
                  as="span"
                  id="seismicLogic.assumptions.a5"
                  fallback="No topographic or geological considerations"
                />
              </li>
              <li>
                <CmsText
                  as="span"
                  id="seismicLogic.assumptions.a6"
                  fallback="Infrastructure ratios based on global averages"
                />
              </li>
              <li>
                <CmsText
                  as="span"
                  id="seismicLogic.assumptions.a7"
                  fallback="Simplified attenuation model for general use"
                />
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
