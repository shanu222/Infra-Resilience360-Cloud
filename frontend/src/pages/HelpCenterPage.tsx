import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getHelpCenterCopy } from '../help/helpCenterContent'
import type { Language } from '../types/sectionKeys'

export type HelpCenterPageProps = {
  language: Language
}

type AccentTone = 'blue' | 'green' | 'orange' | 'purple' | 'teal' | 'grey'

const TOC_ICONS: Record<string, string> = {
  'help-intro': '📘',
  'help-quick-start': '🚀',
  'help-retrofit': '🧰',
  'help-faq': '❓',
  'help-tips': '💡',
  'help-coming-soon': '⏳',
}

const TOC_TONES: Record<string, AccentTone> = {
  'help-intro': 'blue',
  'help-quick-start': 'green',
  'help-retrofit': 'orange',
  'help-faq': 'purple',
  'help-tips': 'teal',
  'help-coming-soon': 'grey',
}

const STEP_ICONS = ['🏠', '📍', '📷', '🛠️', '🧮', '📋'] as const

const MODULE_ICONS: Record<string, string> = {
  'Resilience Infra Models': '🧱',
  'Design Toolkit': '🏗️',
  'Smart Construction': '📐',
  'Material Hubs': '🏗️',
  'Building Codes': '🏛️',
  'Best Practices': '📘',
  'Readiness Calculator': '📊',
  'Learn & Train': '📚',
  'Live Earthquake Alerts': '🌍',
  'Disaster Dashboard': '🚨',
}

/** UI-only badge targets — longest first so phrases match before shorter fragments. */
const BUTTON_BADGE_PATTERNS: Array<{ match: string; tone: 'primary' | 'secondary' | 'neutral' }> = [
  { match: 'Upload Defect Photos in Series (Image 1, 2, 3...)', tone: 'neutral' },
  { match: '🧮 Calculate Retrofit Estimated Cost', tone: 'secondary' },
  { match: 'Calculate Retrofit Estimated Cost', tone: 'secondary' },
  { match: '🔄 Analyzing Images + Generating Guidance...', tone: 'primary' },
  { match: '🛠️ Retrofit Guidance', tone: 'primary' },
  { match: 'Retrofit Guidance (Image-Based)', tone: 'neutral' },
  { match: 'Retrofit Guidance', tone: 'primary' },
  { match: '📍 Enter Location Manually', tone: 'secondary' },
  { match: 'Enter Location Manually', tone: 'secondary' },
  { match: '📍 Use My Location', tone: 'primary' },
  { match: 'Use My Location', tone: 'primary' },
  { match: '📡 Detecting Location...', tone: 'neutral' },
  { match: 'Use My Current Location', tone: 'primary' },
  { match: 'Confirm Rates & Continue', tone: 'primary' },
  { match: 'Calculate Cost Breakdown', tone: 'secondary' },
  { match: 'Download PDF Report', tone: 'secondary' },
  { match: 'Start AI Analysis', tone: 'primary' },
  { match: 'Change Location', tone: 'neutral' },
  { match: 'Select Image', tone: 'neutral' },
  { match: 'Change Image', tone: 'neutral' },
  { match: 'Share Summary', tone: 'neutral' },
  { match: 'Take Photo', tone: 'neutral' },
  { match: 'Choose from Gallery', tone: 'neutral' },
  { match: 'Upload Image', tone: 'neutral' },
  { match: 'Allow Location', tone: 'primary' },
  { match: 'Enter Manually', tone: 'secondary' },
  { match: 'Selected Photos', tone: 'neutral' },
  { match: 'Province (Pakistan)', tone: 'neutral' },
  { match: 'City / District (Pakistan)', tone: 'neutral' },
  { match: 'Location for Labor/Material Rates', tone: 'neutral' },
  { match: 'Retrofit Calculator', tone: 'secondary' },
  { match: 'Retrofit Guide', tone: 'primary' },
  { match: 'Final Report', tone: 'neutral' },
  { match: 'Cost Breakdown', tone: 'neutral' },
  { match: 'Detection Result', tone: 'neutral' },
  { match: 'Dashboard', tone: 'neutral' },
]

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function renderRichText(text: string): ReactNode {
  if (!text) return text
  const pattern = BUTTON_BADGE_PATTERNS.map((item) => escapeRegExp(item.match)).join('|')
  if (!pattern) return text
  const regex = new RegExp(`(${pattern})`, 'g')
  const parts = text.split(regex)
  if (parts.length === 1) return text

  return parts.map((part, index) => {
    const badge = BUTTON_BADGE_PATTERNS.find((item) => item.match === part)
    if (!badge) return <Fragment key={`t-${index}`}>{part}</Fragment>
    return (
      <span key={`b-${index}`} className={`hc-btn-badge hc-btn-badge--${badge.tone}`}>
        {part}
      </span>
    )
  })
}

function scrollToHelpSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function Callout({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'info' | 'tip' | 'important' | 'recommend' | 'when' | 'purpose'
  icon: string
  title: string
  children: ReactNode
}) {
  return (
    <aside className={`hc-callout hc-callout--${tone}`}>
      <div className="hc-callout__head">
        <span className="hc-callout__icon" aria-hidden>
          {icon}
        </span>
        <strong className="hc-callout__title">{title}</strong>
      </div>
      <div className="hc-callout__body">{children}</div>
    </aside>
  )
}

function SectionCard({
  id,
  tone,
  icon,
  title,
  children,
  delay = 0,
}: {
  id: string
  tone: AccentTone
  icon: string
  title: string
  children: ReactNode
  delay?: number
}) {
  return (
    <section
      id={id}
      className={`hc-section-card hc-section-card--${tone} hc-animate-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="hc-section-card__header">
        <span className="hc-section-card__icon" aria-hidden>
          {icon}
        </span>
        <h3 className="hc-section-card__title">{title}</h3>
      </header>
      <div className="hc-section-card__body">{children}</div>
    </section>
  )
}

export function HelpCenterPage({ language }: HelpCenterPageProps) {
  const copy = getHelpCenterCopy(language)
  const isUrdu = language === 'ur'
  const [activeSection, setActiveSection] = useState(copy.toc[0]?.id ?? 'help-intro')
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  const sectionIds = useMemo(() => copy.toc.map((item) => item.id), [copy.toc])

  useEffect(() => {
    const nodes = sectionIds
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node))
    if (nodes.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target?.id) setActiveSection(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.35, 0.55] },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [sectionIds])

  return (
    <div className="panel section-panel section-help-center" dir={isUrdu ? 'rtl' : 'ltr'}>
      <header className="hc-hero hc-animate-in">
        <div className="hc-hero__glow" aria-hidden />
        <div className="hc-hero__content">
          <span className="hc-hero__badge" aria-hidden>
            📖
          </span>
          <p className="hc-hero__eyebrow">{copy.tocLabel}</p>
          <h2 className="hc-hero__title">{copy.pageTitle}</h2>
          <p className="hc-hero__subtitle">{copy.pageLead}</p>
        </div>
      </header>

      <nav className="hc-sticky-nav" aria-label={copy.tocLabel}>
        <p className="hc-sticky-nav__label">{copy.tocLabel}</p>
        <div className="hc-sticky-nav__chips" role="list">
          {copy.toc.map((item) => {
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="listitem"
                className={`hc-sticky-nav__chip hc-sticky-nav__chip--${TOC_TONES[item.id] ?? 'blue'}${isActive ? ' is-active' : ''}`}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => scrollToHelpSection(item.id)}
              >
                <span aria-hidden>{TOC_ICONS[item.id] ?? '•'}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <SectionCard id="help-intro" tone="blue" icon="📘" title={copy.intro.title} delay={40}>
        <Callout tone="info" icon="ℹ" title={copy.intro.whatIs.title}>
          {copy.intro.whatIs.body.map((line) => (
            <p key={line}>{renderRichText(line)}</p>
          ))}
        </Callout>

        <Callout tone="purpose" icon="🎯" title={copy.intro.why.title}>
          {copy.intro.why.body.map((line) => (
            <p key={line}>{renderRichText(line)}</p>
          ))}
        </Callout>

        <Callout tone="when" icon="👥" title={copy.intro.who.title}>
          <p>{renderRichText(copy.intro.who.intro)}</p>
          <ul className="hc-audience-grid">
            {copy.intro.who.audiences.map((audience) => (
              <li key={audience} className="hc-audience-chip">
                {audience}
              </li>
            ))}
          </ul>
        </Callout>

        <Callout tone="recommend" icon="✔" title={copy.intro.capabilities.title}>
          <ul className="hc-capability-list">
            {copy.intro.capabilities.items.map((item) => (
              <li key={item}>{renderRichText(item)}</li>
            ))}
          </ul>
        </Callout>
      </SectionCard>

      <SectionCard id="help-quick-start" tone="green" icon="🚀" title={copy.quickStart.title} delay={80}>
        <p className="hc-section-lead">{renderRichText(copy.quickStart.intro)}</p>
        <ol className="hc-quick-timeline">
          {copy.quickStart.steps.map((step, index) => (
            <li key={step} className="hc-quick-timeline__item">
              <span className="hc-quick-timeline__num" aria-hidden>
                {index + 1}
              </span>
              <div className="hc-quick-timeline__card">
                <p>{renderRichText(step)}</p>
              </div>
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard id="help-retrofit" tone="orange" icon="🧰" title={copy.retrofit.title} delay={120}>
        <Callout tone="purpose" icon="ℹ" title={copy.retrofit.purpose.title}>
          {copy.retrofit.purpose.body.map((line) => (
            <p key={line}>{renderRichText(line)}</p>
          ))}
        </Callout>

        <Callout tone="when" icon="📍" title={copy.retrofit.whenToUse.title}>
          <ul className="hc-scenario-list">
            {copy.retrofit.whenToUse.scenarios.map((item) => (
              <li key={item}>{renderRichText(item)}</li>
            ))}
          </ul>
        </Callout>

        <div className="hc-workflow">
          <h4 className="hc-workflow__title">{copy.retrofit.workflowTitle}</h4>
          <ol className="hc-workflow-timeline">
            {copy.retrofit.steps.map((step, index) => (
              <li key={step.title} className="hc-workflow-timeline__item">
                <div className="hc-workflow-timeline__rail" aria-hidden>
                  <span className="hc-workflow-timeline__dot">{index + 1}</span>
                  {index < copy.retrofit.steps.length - 1 ? <span className="hc-workflow-timeline__line" /> : null}
                </div>
                <article className="hc-workflow-step-card">
                  <header className="hc-workflow-step-card__head">
                    <span className="hc-workflow-step-card__icon" aria-hidden>
                      {STEP_ICONS[index] ?? '•'}
                    </span>
                    <h5>{step.title}</h5>
                  </header>
                  {step.paragraphs.map((line) => (
                    <p key={line}>{renderRichText(line)}</p>
                  ))}
                  {step.bullets && step.bullets.length > 0 ?
                    <ul className="hc-workflow-bullets">
                      {step.bullets.map((bullet) => (
                        <li key={bullet}>{renderRichText(bullet)}</li>
                      ))}
                    </ul>
                  : null}
                </article>
              </li>
            ))}
          </ol>
        </div>

        <Callout tone="important" icon="⚠" title={copy.retrofit.reviewTitle}>
          {copy.retrofit.reviewBody.map((line) => (
            <p key={line}>{renderRichText(line)}</p>
          ))}
          <ul className="hc-review-list">
            {copy.retrofit.reviewOutputs.map((item) => (
              <li key={item}>{renderRichText(item)}</li>
            ))}
          </ul>
        </Callout>
      </SectionCard>

      <SectionCard id="help-faq" tone="purple" icon="❓" title={copy.faq.title} delay={160}>
        <div className="hc-faq-accordion" role="list">
          {copy.faq.items.map((item, index) => {
            const isOpen = openFaqIndex === index
            return (
              <div key={item.question} className={`hc-faq-item${isOpen ? ' is-open' : ''}`} role="listitem">
                <button
                  type="button"
                  className="hc-faq-item__trigger"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                >
                  <span className="hc-faq-item__q">{item.question}</span>
                  <span className="hc-faq-item__chevron" aria-hidden>
                    {isOpen ? '▾' : '▸'}
                  </span>
                </button>
                <div className="hc-faq-item__panel" hidden={!isOpen}>
                  <p>{renderRichText(item.answer)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard id="help-tips" tone="teal" icon="💡" title={copy.tips.title} delay={200}>
        <div className="hc-tips-grid">
          {copy.tips.items.map((tip, index) => (
            <article key={tip} className="hc-tip-card" style={{ animationDelay: `${220 + index * 40}ms` }}>
              <span className="hc-tip-card__icon" aria-hidden>
                ✔
              </span>
              <p>{renderRichText(tip)}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard id="help-coming-soon" tone="grey" icon="⏳" title={copy.comingSoon.title} delay={240}>
        <p className="hc-section-lead">{copy.comingSoon.intro}</p>
        <div className="hc-coming-grid">
          {copy.comingSoon.modules.map((module) => (
            <article key={module.name} className="hc-coming-card" aria-disabled="true">
              <span className="hc-coming-card__lock" aria-hidden>
                🔒
              </span>
              <span className="hc-coming-card__icon" aria-hidden>
                {MODULE_ICONS[module.name] ?? '📦'}
              </span>
              <h4>{module.name}</h4>
              <span className="hc-coming-card__badge">{copy.comingSoon.badge}</span>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
