import { useEffect } from 'react'
import { getLegalPageContent, LEGAL_LINKS } from './legalPages'

type LegalStandaloneAppProps = {
  pathname: string
}

export function LegalStandaloneApp({ pathname }: LegalStandaloneAppProps) {
  const page = getLegalPageContent(pathname)

  useEffect(() => {
    if (!page) return
    document.title = `${page.title} | Infra Resilience360`
    const description = page.description
    let meta = document.querySelector('meta[name=\"description\"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = description
  }, [page])

  if (!page) {
    return (
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem', lineHeight: 1.6 }}>
        <h1>Legal Information</h1>
        <p>The requested page is not available.</p>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem', lineHeight: 1.7 }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>{page.title}</h1>
        <p style={{ opacity: 0.85 }}>{page.description}</p>
      </header>

      <nav aria-label="Legal pages" style={{ marginBottom: '1.25rem' }}>
        {LEGAL_LINKS.map((link) => (
          <a key={link.path} href={link.path} style={{ marginRight: '0.9rem' }}>
            {link.title}
          </a>
        ))}
      </nav>

      {page.sections.map((section) => (
        <section key={section.title} style={{ marginBottom: '1.2rem' }}>
          <h2 style={{ marginBottom: '0.4rem' }}>{section.title}</h2>
          {section.body.map((line) => (
            <p key={line} style={{ margin: '0.4rem 0' }}>
              {line}
            </p>
          ))}
        </section>
      ))}
    </main>
  )
}
