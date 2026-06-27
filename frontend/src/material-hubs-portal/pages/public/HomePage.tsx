import { Link } from 'react-router'
import { MapPin, Package, Shield, GraduationCap, Building2 } from 'lucide-react'
import { mockHubs } from '@/config/materialHubCatalog'
import { useMaterialHubStrings } from '@/hooks/useMaterialHubStrings'

export function HomePage() {
  const s = useMaterialHubStrings()

  return (
    <div>
      <section className="mh-hero-glass text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto mh-hero-glass__panel">
            <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 max-w-full mh-hero-glass__badge px-4 py-2 rounded-full mb-6">
              <Shield className="h-5 w-5 shrink-0" />
              <span className="text-sm text-center max-w-full">{s.heroBadge}</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6">{s.heroTitle}</h1>

            <p className="text-xl md:text-2xl text-emerald-50 mb-8">{s.heroSubtitle}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/locations" className="mh-btn-3d mh-btn-3d--green text-lg">
                {s.ctaLocations}
              </Link>
              <Link to="/inventory" className="mh-btn-3d mh-btn-3d--blue text-lg">
                {s.ctaInventory}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="mh-stat-card mh-stat-card--green p-6">
            <div className="mh-stat-row flex items-center justify-between mb-4">
              <Building2 className="h-10 w-10 shrink-0" />
              <span className="mh-stat-number text-3xl shrink-0">{mockHubs.length}</span>
            </div>
            <p className="text-sm">{s.statHubs}</p>
          </div>

          <div className="mh-stat-card mh-stat-card--blue p-6 md:col-span-2">
            <div className="mh-stat-row flex items-center justify-between mb-4">
              <MapPin className="h-10 w-10 shrink-0" />
              <span className="mh-stat-number text-3xl shrink-0">4</span>
            </div>
            <p className="text-sm">{s.statRegions}</p>
          </div>

          <div className="mh-stat-card mh-stat-card--orange p-6">
            <div className="mh-stat-row flex items-center justify-between mb-4">
              <Shield className="h-10 w-10 shrink-0" />
              <span className="mh-stat-number text-3xl shrink-0">24/7</span>
            </div>
            <p className="text-sm">{s.statEmergency}</p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mh-cta-glass rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">{s.mapCtaTitle}</h2>
          <p className="text-lg max-w-2xl mx-auto mb-8">{s.mapCtaBody}</p>
          <Link to="/locations" className="mh-btn-3d mh-btn-3d--green">
            {s.mapCtaButton}
          </Link>
        </div>
      </section>

      <section className="mh-glass-section py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mh-section-header-glass text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{s.offerTitle}</h2>
            <p className="text-lg">{s.offerSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="mh-action-card mh-action-card--blue p-8">
              <div className="mh-action-icon w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <Package className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">{s.f1Title}</h3>
              <p className="mb-4">{s.inventoryFeatureBody}</p>
              <Link to="/inventory" className="mh-action-link">
                {s.f1Link}
              </Link>
            </div>

            <div className="mh-action-card mh-action-card--purple p-8">
              <div className="mh-action-icon w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">{s.trainingFeatureTitle}</h3>
              <p className="mb-4">{s.trainingFeatureBody}</p>
              <Link to="/training" className="mh-btn-3d mh-btn-3d--purple inline-block mt-2">
                {s.trainingExplore}
              </Link>
            </div>

            <div className="mh-action-card mh-action-card--teal p-8">
              <div className="mh-action-icon w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <MapPin className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">{s.f3Title}</h3>
              <p className="mb-4">{s.f3Body}</p>
              <Link to="/locations" className="mh-btn-3d mh-btn-3d--teal inline-block mt-2">
                {s.f3Link}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mh-request-materials rounded-2xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:pr-8">
              <h2 className="text-3xl font-bold mb-4">{s.needTitle}</h2>
              <p className="text-lg">{s.needBody}</p>
            </div>
            <div className="flex-shrink-0">
              <Link to="/inventory" className="mh-btn-3d mh-btn-3d--blue text-lg inline-block">
                {s.needCta}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
