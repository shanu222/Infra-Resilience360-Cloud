import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Phone,
  Shield,
  Sparkles,
} from 'lucide-react'
import { DISASTER_DASHBOARD_DISASTERS } from '@/config/disasterDashboardCatalog'
import { disasterDashboardGuidanceMedia, preloadDisasterMedia } from '@/config/disasterDashboardMedia'
import { DisasterGuidanceMultimedia } from '../components/DisasterGuidanceMultimedia'
import { useMediaCandidates } from '../hooks/useMediaCandidates'
import { resolveLucideIcon } from '../utils/lucideIcon'
import { useDisasterDashboardStrings } from '@/hooks/useDisasterDashboardStrings'
import { usePortalLanguage } from '@/context/PortalLanguageContext'
import { resolveDisaster } from '@/i18n/disasterDashboardCatalogI18n'

function GuidanceList({ items, tone }: { items: string[]; tone: 'before' | 'during' | 'after' }) {
  const dot =
    tone === 'before' ? 'dd-guidance-dot--blue' : tone === 'during' ? 'dd-guidance-dot--red' : 'dd-guidance-dot--green'
  return (
    <ul className="dd-guidance-list">
      {items.map((item, index) => (
        <li key={index}>
          <span className={`dd-guidance-dot ${dot}`} aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function DisasterDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const s = useDisasterDashboardStrings()
  const lang = usePortalLanguage()
  const monthNames = s.monthsShort
  const baseDisaster = DISASTER_DASHBOARD_DISASTERS.find((d) => d.id === id)
  const disaster = baseDisaster ? resolveDisaster(baseDisaster, lang) : undefined
  const media = disaster ? disasterDashboardGuidanceMedia(disaster.id) : null
  const heroImage = useMediaCandidates(media?.imageCandidates ?? [])

  useEffect(() => {
    if (disaster?.id) preloadDisasterMedia(disaster.id)
  }, [disaster?.id])

  if (!disaster) {
    return (
      <div className="dd-page dd-page--detail flex items-center justify-center px-4">
        <div className="dd-glass-panel p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">{s.detail.disasterNotFound}</h2>
          <button type="button" onClick={() => navigate('/')} className="dd-btn dd-btn--primary">
            {s.detail.returnToDashboard}
          </button>
        </div>
      </div>
    )
  }

  const IconComponent = resolveLucideIcon(disaster.icon)
  const riskFactors = disaster.guidance.during.slice(0, 4)

  return (
    <div className="dd-page dd-page--detail">
      <div className="dd-page__bg" aria-hidden />
      <div className="dd-container dd-container--narrow">
        <button type="button" onClick={() => navigate('/')} className="dd-back-btn dd-animate-in">
          <ArrowLeft className="w-5 h-5 shrink-0" aria-hidden />
          {s.detail.backToDashboard}
        </button>

        <section className="dd-hero-banner dd-glass-panel dd-animate-in" aria-labelledby="dd-disaster-title">
          <div className="dd-hero-banner__media">
            {heroImage.src && !heroImage.failed ? (
              <img
                src={heroImage.src}
                alt=""
                className={`dd-hero-banner__img${heroImage.loaded ? ' is-loaded' : ''}`}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                onLoad={heroImage.onLoad}
                onError={heroImage.onError}
              />
            ) : (
              <div className={`dd-hero-banner__fallback ${disaster.color}`}>
                <IconComponent className="w-16 h-16 text-white opacity-90" aria-hidden />
              </div>
            )}
            <div className="dd-hero-banner__overlay" aria-hidden />
          </div>
          <div className="dd-hero-banner__content">
            <div className={`dd-hero-banner__icon ${disaster.color}`}>
              <IconComponent className="w-8 h-8 text-white" aria-hidden />
            </div>
            <h1 id="dd-disaster-title" className="dd-hero-banner__title">
              {disaster.name}
            </h1>
            <p className="dd-hero-banner__desc">{disaster.description}</p>
          </div>
        </section>

        <section className="dd-section dd-glass-panel dd-animate-in" aria-labelledby="dd-overview">
          <header className="dd-section__head">
            <div className="dd-section__icon">
              <Sparkles className="w-5 h-5" aria-hidden />
            </div>
            <h2 id="dd-overview" className="dd-section__title">
              {s.detail.overview}
            </h2>
          </header>
          <p className="dd-section__prose">{disaster.description}</p>
        </section>

        <section className="dd-section dd-glass-panel dd-animate-in" aria-labelledby="dd-history">
          <header className="dd-section__head">
            <div className="dd-section__icon">
              <Clock className="w-5 h-5" aria-hidden />
            </div>
            <h2 id="dd-history" className="dd-section__title">
              {s.detail.historicalEvents}
            </h2>
          </header>
          <div className="dd-timeline">
            {disaster.timeline.map((event, index) => (
              <div key={index} className="dd-timeline__item">
                <span className="dd-timeline__year">{event.year}</span>
                <span className="dd-timeline__duration">{event.duration}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="dd-section dd-glass-panel dd-animate-in" aria-labelledby="dd-seasonal">
          <header className="dd-section__head">
            <div className="dd-section__icon">
              <Calendar className="w-5 h-5" aria-hidden />
            </div>
            <h2 id="dd-seasonal" className="dd-section__title">
              {s.detail.seasonalInfo}
            </h2>
          </header>
          <p className="dd-section__prose mb-4">{disaster.seasonalPeriod}</p>
          <div className="dd-month-grid">
            {monthNames.map((month, index) => {
              const active = disaster.seasonalMonths.includes(index)
              return (
                <div key={month} className={`dd-month-cell${active ? ' is-active' : ''}`}>
                  {month}
                </div>
              )
            })}
          </div>
        </section>

        <section className="dd-section dd-glass-panel dd-animate-in" aria-labelledby="dd-risk">
          <header className="dd-section__head">
            <div className="dd-section__icon dd-section__icon--amber">
              <AlertTriangle className="w-5 h-5" aria-hidden />
            </div>
            <h2 id="dd-risk" className="dd-section__title">
              {s.detail.riskFactors}
            </h2>
          </header>
          <GuidanceList items={riskFactors} tone="during" />
        </section>

        <section className="dd-section dd-glass-panel dd-animate-in" aria-labelledby="dd-guidance">
          <header className="dd-section__head">
            <div className="dd-section__icon dd-section__icon--indigo">
              <BookOpen className="w-5 h-5" aria-hidden />
            </div>
            <h2 id="dd-guidance" className="dd-section__title">
              {s.detail.safetyGuidance}
            </h2>
          </header>

          <div className="dd-guidance-blocks">
            <article>
              <h3 className="dd-guidance-block__title">
                <Shield className="w-4 h-4 text-blue-600" aria-hidden />
                {s.guidanceUi.beforeTitle}
              </h3>
              <GuidanceList items={disaster.guidance.before} tone="before" />
            </article>
            <article>
              <h3 className="dd-guidance-block__title">
                <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden />
                {s.guidanceUi.duringTitle}
              </h3>
              <GuidanceList items={disaster.guidance.during} tone="during" />
            </article>
            <article>
              <h3 className="dd-guidance-block__title">
                <CheckCircle className="w-4 h-4 text-emerald-600" aria-hidden />
                {s.guidanceUi.afterTitle}
              </h3>
              <GuidanceList items={disaster.guidance.after} tone="after" />
            </article>
          </div>
        </section>

        <DisasterGuidanceMultimedia disasterId={disaster.id} disasterName={disaster.name} />

        <section className="dd-emergency dd-glass-panel dd-animate-in" aria-labelledby="dd-emergency">
          <Phone className="w-6 h-6 text-red-600 shrink-0" aria-hidden />
          <div>
            <h2 id="dd-emergency" className="dd-emergency__title">
              {s.detail.emergencyTitle}
            </h2>
            <p className="dd-emergency__text">{s.detail.emergencyLine}</p>
          </div>
        </section>
      </div>
    </div>
  )
}
