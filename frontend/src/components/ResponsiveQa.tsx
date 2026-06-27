import { useEffect, useMemo, useState } from 'react'
import { CmsText } from './cms/CmsText'

type AuditStatus = 'pass' | 'fail'

type AuditResult = {
  id: string
  label: string
  width: number
  status: AuditStatus
  details: string[]
}

const viewportChecks = [
  { id: 'mobile-sm', width: 360, label: 'Mobile Small' },
  { id: 'mobile', width: 430, label: 'Mobile' },
  { id: 'tablet', width: 768, label: 'Tablet' },
  { id: 'laptop', width: 1024, label: 'Laptop' },
  { id: 'desktop', width: 1280, label: 'Desktop' },
]

const expectedColumns = (width: number): number => {
  if (width <= 700) return 1
  if (width <= 1100) return 2
  return 3
}

function ResponsiveQa() {
  const [results, setResults] = useState<AuditResult[]>([])
  const [running, setRunning] = useState(false)

  const summary = useMemo(() => {
    const passed = results.filter((result) => result.status === 'pass').length
    const failed = results.filter((result) => result.status === 'fail').length
    return { passed, failed, total: results.length }
  }, [results])

  const runAudit = async () => {
    setRunning(true)
    const nextResults: AuditResult[] = []

    for (const test of viewportChecks) {
      const iframe = document.createElement('iframe')
      iframe.width = String(test.width)
      iframe.height = '980'
      iframe.style.position = 'absolute'
      iframe.style.left = '-10000px'
      iframe.style.top = '0'
      iframe.style.visibility = 'hidden'
      iframe.src = `${window.location.pathname}?qaProbe=1`
      document.body.appendChild(iframe)

      const details: string[] = []
      let status: AuditStatus = 'pass'

      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(() => reject(new Error('Load timeout')), 12000)
          iframe.onload = () => {
            window.clearTimeout(timeout)
            resolve()
          }
        })

        await new Promise((resolve) => window.setTimeout(resolve, 350))

        const probeWindow = iframe.contentWindow
        const probeDocument = iframe.contentDocument

        if (!probeWindow || !probeDocument) {
          throw new Error('Probe document unavailable')
        }

        const bodyNoOverflow = probeDocument.documentElement.scrollWidth <= probeDocument.documentElement.clientWidth + 1
        if (!bodyNoOverflow) {
          status = 'fail'
          details.push('Horizontal overflow detected on root document.')
        }

        const nav = probeDocument.querySelector('.navbar') as HTMLElement | null
        if (nav) {
          const navNoOverflow = nav.scrollWidth <= nav.clientWidth + 1
          if (!navNoOverflow) {
            status = 'fail'
            details.push('Navbar content overflows horizontally.')
          }
        } else {
          status = 'fail'
          details.push('Navbar not found.')
        }

        const grid = probeDocument.querySelector('.home-card-grid') as HTMLElement | null
        if (grid) {
          const cards = Array.from(grid.querySelectorAll('.home-card')) as HTMLElement[]
          if (cards.length > 1) {
            const firstTop = cards[0].offsetTop
            const firstRowCount = cards.filter((card) => card.offsetTop === firstTop).length
            const expected = expectedColumns(test.width)
            if (firstRowCount !== expected) {
              status = 'fail'
              details.push(`Expected ${expected} cards in first row, got ${firstRowCount}.`)
            }
          }
        } else {
          status = 'fail'
          details.push('Home card grid not found.')
        }

        const mapHeightCheck = probeDocument.querySelector('.leaflet-map') as HTMLElement | null
        if (mapHeightCheck) {
          if (mapHeightCheck.clientHeight < 200) {
            status = 'fail'
            details.push('Map viewport too short (< 200px).')
          }
        }
      } catch (error) {
        status = 'fail'
        details.push(error instanceof Error ? error.message : 'Unknown QA error')
      } finally {
        iframe.remove()
      }

      if (details.length === 0) {
        details.push('All checks passed.')
      }

      nextResults.push({
        id: test.id,
        label: test.label,
        width: test.width,
        status,
        details,
      })
    }

    setResults(nextResults)
    setRunning(false)
  }

  useEffect(() => {
    void runAudit()
  }, [])

  return (
    <div className="qa-shell">
      <header className="qa-header">
        <CmsText as="h1" id="qa.title" fallback="Responsive QA Checklist" />
        <div className="qa-actions">
          <button type="button" onClick={runAudit} disabled={running}>
            {running ?
              <CmsText as="span" id="qa.running" fallback="Running..." />
            : <CmsText as="span" id="qa.runAgain" fallback="Run Again" />}
          </button>
          <a href={window.location.pathname}>
            <CmsText as="span" id="qa.backToApp" fallback="Back to App" />
          </a>
        </div>
      </header>

      <CmsText
        as="p"
        className="qa-note"
        id="qa.note"
        fallback="Auto-checking breakpoints at 360, 430, 768, 1024, and 1280 px."
      />

      <div className="qa-summary">
        <span>
          <CmsText as="span" id="qa.passedPrefix" fallback="Passed" />: {summary.passed}
        </span>
        <span>
          <CmsText as="span" id="qa.failedPrefix" fallback="Failed" />: {summary.failed}
        </span>
        <span>
          <CmsText as="span" id="qa.totalPrefix" fallback="Total" />: {summary.total}
        </span>
      </div>

      <div className="qa-list">
        {results.map((result) => (
          <article key={result.id} className={`qa-card ${result.status}`}>
            <h2>
              {result.label} ({result.width}px)
            </h2>
            <strong>{result.status.toUpperCase()}</strong>
            <ul>
              {result.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  )
}

export default ResponsiveQa
