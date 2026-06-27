import { DISASTER_DASHBOARD_BRAND } from '@/config/disasterDashboard'
import { DisasterCard } from '../components/DisasterCard'
import { useDisasterDashboardStrings } from '@/hooks/useDisasterDashboardStrings'
import { usePortalLanguage } from '@/context/PortalLanguageContext'
import { getLocalizedDisasters } from '@/i18n/disasterDashboardCatalogI18n'

export function Dashboard() {
  const s = useDisasterDashboardStrings()
  const lang = usePortalLanguage()
  const disasters = getLocalizedDisasters(lang)

  return (
    <div className="dd-page dd-page--dashboard">
      <div className="dd-page__bg" aria-hidden />
      <div className="dd-container">
        <header className="dd-hero dd-animate-in">
          <div className="dd-hero__panel">
            <h1 className="dd-hero__title">{s.title}</h1>
            <p className="dd-hero__lead">{s.dashboardLead}</p>
          </div>
        </header>

        <div className="dd-hazard-grid">
          {disasters.map((disaster, index) => (
            <div key={disaster.id} className="dd-animate-in" style={{ animationDelay: `${index * 45}ms` }}>
              <DisasterCard
                id={disaster.id}
                name={disaster.name}
                description={disaster.description}
                icon={disaster.icon}
                color={disaster.color}
              />
            </div>
          ))}
        </div>

        <p className="dd-footer-note">{s.footer}</p>
      </div>
      <div
        className="dd-page__watermark"
        style={{ backgroundImage: `url(${DISASTER_DASHBOARD_BRAND.backgroundImageUrl})` }}
        aria-hidden
      />
    </div>
  )
}
