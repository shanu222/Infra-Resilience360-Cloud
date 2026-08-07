import { getHelpCenterCopy } from '../help/helpCenterContent'
import type { Language } from '../types/sectionKeys'

export type HelpCenterPageProps = {
  language: Language
}

function scrollToHelpSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function HelpCenterPage({ language }: HelpCenterPageProps) {
  const copy = getHelpCenterCopy(language)
  const isUrdu = language === 'ur'

  return (
    <div className="panel section-panel section-help-center" dir={isUrdu ? 'rtl' : 'ltr'}>
      <header className="help-center-hero">
        <h2 className="help-center-title">{copy.pageTitle}</h2>
        <p className="help-center-lead">{copy.pageLead}</p>
      </header>

      <nav className="help-center-toc" aria-label={copy.tocLabel}>
        <p className="help-center-toc__label">{copy.tocLabel}</p>
        <div className="help-center-toc__chips" role="list">
          {copy.toc.map((item) => (
            <button
              key={item.id}
              type="button"
              className="help-center-toc__chip"
              role="listitem"
              onClick={() => scrollToHelpSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <section id="help-intro" className="help-center-card">
        <h3>{copy.intro.title}</h3>

        <div className="help-center-block">
          <h4>{copy.intro.whatIs.title}</h4>
          {copy.intro.whatIs.body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className="help-center-block">
          <h4>{copy.intro.why.title}</h4>
          {copy.intro.why.body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className="help-center-block">
          <h4>{copy.intro.who.title}</h4>
          <p>{copy.intro.who.intro}</p>
          <ul className="help-center-audience-list">
            {copy.intro.who.audiences.map((audience) => (
              <li key={audience}>{audience}</li>
            ))}
          </ul>
        </div>

        <div className="help-center-block">
          <h4>{copy.intro.capabilities.title}</h4>
          <ul>
            {copy.intro.capabilities.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="help-quick-start" className="help-center-card">
        <h3>{copy.quickStart.title}</h3>
        <p>{copy.quickStart.intro}</p>
        <ol className="help-center-steps">
          {copy.quickStart.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section id="help-retrofit" className="help-center-card">
        <h3>{copy.retrofit.title}</h3>

        <div className="help-center-block">
          <h4>{copy.retrofit.purpose.title}</h4>
          {copy.retrofit.purpose.body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className="help-center-block">
          <h4>{copy.retrofit.whenToUse.title}</h4>
          <ul>
            {copy.retrofit.whenToUse.scenarios.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="help-center-block">
          <h4>{copy.retrofit.workflowTitle}</h4>
          {copy.retrofit.steps.map((step) => (
            <article key={step.title} className="help-center-workflow-step">
              <h5>{step.title}</h5>
              {step.paragraphs.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {step.bullets && step.bullets.length > 0 ?
                <ul>
                  {step.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              : null}
            </article>
          ))}
        </div>

        <div className="help-center-block">
          <h4>{copy.retrofit.reviewTitle}</h4>
          {copy.retrofit.reviewBody.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <ul>
            {copy.retrofit.reviewOutputs.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="help-faq" className="help-center-card">
        <h3>{copy.faq.title}</h3>
        <div className="help-center-faq-list">
          {copy.faq.items.map((item) => (
            <details key={item.question} className="help-center-faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="help-tips" className="help-center-card">
        <h3>{copy.tips.title}</h3>
        <ul>
          {copy.tips.items.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <section id="help-coming-soon" className="help-center-card">
        <h3>{copy.comingSoon.title}</h3>
        <p>{copy.comingSoon.intro}</p>
        <div className="help-center-coming-grid">
          {copy.comingSoon.modules.map((module) => (
            <article key={module.name} className="help-center-coming-card">
              <h4>{module.name}</h4>
              <span className="help-center-coming-badge">{copy.comingSoon.badge}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
