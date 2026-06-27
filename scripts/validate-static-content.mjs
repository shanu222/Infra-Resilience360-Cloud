/**
 * Validate src/data/static/*.json for empty seeds and placeholder-only pages.
 * Usage: node scripts/validate-static-content.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const staticDir = path.join(__dirname, '..', 'src', 'data', 'static')

const REQUIRED = [
  'homepage.json',
  'learn.json',
  'disaster-dashboard.json',
  'material-hubs.json',
  'pgbc.json',
  'infra-models.json',
  'retrofit.json',
  'best-practices.json',
  'portals.json',
  'readiness.json',
  'design-toolkit.json',
  'live-earthquake-map.json',
]

const issues = []
const ok = []

function isEmptyArray(v) {
  return Array.isArray(v) && v.length === 0
}

function checkFile(name) {
  const file = path.join(staticDir, name)
  if (!fs.existsSync(file)) {
    issues.push({ file: name, problem: 'missing file' })
    return
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  const row = { file: name, notes: [] }

  if (name === 'homepage.json') {
    const cards = raw.cards
    if (!Array.isArray(cards) || cards.length === 0) row.notes.push('homepage.cards empty')
    else ok.push(`${name}: ${cards.length} cards`)
    return
  }

  const seeds = raw.seeds
  const page = raw.page && typeof raw.page === 'object' ? raw.page : raw
  const elements = page?.elements
  if (elements && typeof elements === 'object' && Object.keys(elements).length === 0 && !seeds) {
    row.notes.push('page.elements empty (shell only)')
  }

  if (name === 'learn.json') {
    if (isEmptyArray(seeds?.videos)) row.problem = 'seeds.videos empty — run export-static-cms-content.mjs'
    else ok.push(`${name}: ${seeds.videos.length} videos`)
  }
  if (name === 'infra-models.json') {
    if (isEmptyArray(seeds?.models)) row.notes.push('seeds.models empty (runtime uses App bundled fallbacks)')
    else ok.push(`${name}: ${seeds.models.length} models`)
  }
  if (name === 'portals.json' && seeds) {
    ok.push(`${name}: portal seeds present`)
  }
  if (name === 'retrofit.json') {
    const cms = raw.cms
    const pages = cms?.pages
    if (!Array.isArray(pages) || pages.length === 0) row.notes.push('retrofit.cms.pages empty')
    else ok.push(`${name}: ${pages.length} retrofit pages`)
  }

  if (row.notes.length) issues.push(row)
  else if (!ok.some((s) => s.startsWith(name))) ok.push(`${name}: ok`)
}

for (const f of REQUIRED) checkFile(f)

console.info('\n=== Static content validation ===\n')
for (const line of ok) console.info('OK ', line)
for (const row of issues) {
  console.warn('WARN', row.file, '—', row.problem || row.notes?.join('; '))
}

const fail = issues.filter((r) => r.problem === 'missing file' || (r.file === 'homepage.json' && r.notes?.length))
if (fail.length) {
  console.error('\nValidation failed:', fail.length, 'blocking issue(s)')
  process.exit(1)
}
console.info('\nValidation complete (warnings may require MONGODB_URI export or bundled seeds).')
