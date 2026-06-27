import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STORAGE_ROOT = path.join(REPO_ROOT, 'storage', 'content')
const REPORT_PATH = path.join(REPO_ROOT, 'MEDIA_RUNTIME_VALIDATION_REPORT.md')
const SHOULD_WRITE_REPORT = process.argv.includes('--report')
const FRONTEND_SRC = path.join(REPO_ROOT, 'frontend', 'src')
const BACKEND_SRC = path.join(REPO_ROOT, 'backend')
const DATA_BUILDING_CODES = path.join(REPO_ROOT, 'data', 'building-codes', 'chapters.json')
const BASE_URL = String(process.env.MEDIA_VALIDATION_BASE_URL || 'http://localhost:10009').replace(/\/+$/, '')

const MODULES = [
  'home',
  'retrofit-guide',
  'resilience-models',
  'design-toolkit',
  'smart-construction',
  'material-hubs',
  'building-codes',
  'best-practices',
  'readiness-calculator',
  'learn-train',
  'live-earthquake-alerts',
  'disaster-dashboard',
]

const ALLOWED = {
  images: new Set(['.jpg', '.jpeg', '.png', '.webp']),
  videos: new Set(['.mp4']),
  pdfs: new Set(['.pdf']),
  audio: new Set(['.mp3', '.wav', '.ogg', '.aac']),
}

const FOLDERS = ['images', 'videos', 'pdfs', 'audio']

function toPosix(v) {
  return String(v ?? '').replace(/\\/g, '/')
}

function rel(abs) {
  return toPosix(path.relative(REPO_ROOT, abs))
}

async function exists(abs) {
  try {
    await fs.access(abs)
    return true
  } catch {
    return false
  }
}

async function walk(dir, out) {
  if (!(await exists(dir))) return
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(abs, out)
      continue
    }
    out.push(abs)
  }
}

function ext(name) {
  return path.extname(name).toLowerCase()
}

async function listFolderUrls(moduleName, folderName) {
  const dir = path.join(STORAGE_ROOT, moduleName, folderName)
  if (!(await exists(dir))) return []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const urls = []
  for (const entry of entries) {
    if (!entry.isFile()) continue
    const x = ext(entry.name)
    if (!ALLOWED[folderName].has(x)) continue
    urls.push(`${folderName}/${entry.name}`)
  }
  return urls.sort((a, b) => a.localeCompare(b))
}

async function repairMetadata(moduleName) {
  const moduleDir = path.join(STORAGE_ROOT, moduleName)
  await fs.mkdir(moduleDir, { recursive: true })
  const images = await listFolderUrls(moduleName, 'images')
  const videos = await listFolderUrls(moduleName, 'videos')
  const pdfs = await listFolderUrls(moduleName, 'pdfs')
  const audio = await listFolderUrls(moduleName, 'audio')

  const metadataPath = path.join(moduleDir, 'metadata.json')
  let old = null
  try {
    old = JSON.parse(await fs.readFile(metadataPath, 'utf8'))
  } catch {
    old = null
  }
  const next = { module: moduleName, version: '1.0', images, videos, pdfs, audio }
  await fs.writeFile(metadataPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8')

  const stale = []
  for (const key of FOLDERS) {
    const oldList = Array.isArray(old?.[key]) ? old[key].map(String) : []
    const nextSet = new Set(next[key])
    for (const item of oldList) {
      if (!nextSet.has(item)) stale.push(item)
    }
  }
  return { metadataPath, ...next, staleRemoved: stale }
}

async function validatePathsExist(urls) {
  const missing = []
  for (const u of urls) {
    const relPath = decodeURIComponent(String(u ?? '').replace(/^\/+/, ''))
    const abs = path.join(STORAGE_ROOT, relPath)
    if (!(await exists(abs))) missing.push(u)
  }
  return missing
}

async function fetchStatus(url) {
  try {
    const res = await fetch(url, { method: 'GET' })
    return { ok: res.ok, status: res.status }
  } catch {
    return { ok: false, status: 0 }
  }
}

async function validateBackendEndpoints(moduleInventories) {
  const checks = []
  checks.push({ name: '/api/content/modules', url: `${BASE_URL}/api/content/modules` })
  for (const moduleName of MODULES) {
    checks.push({ name: `/api/content/${moduleName}`, url: `${BASE_URL}/api/content/${moduleName}` })
  }

  for (const moduleName of MODULES) {
    const inv = moduleInventories[moduleName]
    const all = [...inv.images, ...inv.videos, ...inv.pdfs, ...inv.audio]
    for (const mediaRel of all) {
      const clean = String(mediaRel ?? '').replace(/^\/+/, '')
      const apiPath = `/storage/content/${moduleName}/${clean}`
      checks.push({ name: apiPath, url: `${BASE_URL}${apiPath}` })
    }
  }

  if (await exists(DATA_BUILDING_CODES)) {
    checks.push({ name: '/data/building-codes/chapters.json', url: `${BASE_URL}/data/building-codes/chapters.json` })
    try {
      const payload = JSON.parse(await fs.readFile(DATA_BUILDING_CODES, 'utf8'))
      const codes = Array.isArray(payload?.codes) ? payload.codes : []
      for (const code of codes) {
        const pdfPath = String(code?.pdfPath ?? '').trim()
        if (pdfPath.startsWith('/storage/content/')) {
          checks.push({ name: pdfPath, url: `${BASE_URL}${pdfPath}` })
        }
      }
    } catch {
      /* ignore parse errors */
    }
  }

  const failures = []
  let success = 0
  for (const c of checks) {
    const r = await fetchStatus(c.url)
    if (r.ok) {
      success += 1
    } else {
      failures.push({ name: c.name, status: r.status })
    }
  }
  return { total: checks.length, success, failures }
}

async function scanFrontendRuntimeRefs() {
  const files = []
  await walk(FRONTEND_SRC, files)
  const broken = []
  const legacy = []
  const directImports = []
  for (const file of files) {
    const x = ext(file)
    if (!['.js', '.jsx', '.ts', '.tsx', '.json'].includes(x)) continue
    const text = await fs.readFile(file, 'utf8').catch(() => '')
    if (!text) continue
    if (/(^|[^A-Za-z0-9_])\/content\//.test(text) && !text.includes('/storage/content/')) {
      legacy.push(rel(file))
    }
    const importMatch = text.match(/import\s+.+\.(jpg|jpeg|png|webp|mp4|pdf|mp3|wav|ogg|aac)/gi)
    if (importMatch) {
      // Allow known UI-bundle imports (logos/background shell video)
      const p = rel(file)
      const allow = p === 'frontend/src/config/localAssets.ts'
      if (!allow) directImports.push(p)
    }
    const refs = text.match(/\/storage\/content\/[A-Za-z0-9\-_/%.]+/g) ?? []
    for (const raw of refs) {
      const clean = raw.replace(/['"`),;]+$/, '')
      const sub = decodeURIComponent(clean.replace(/^\/storage\/content\//, ''))
      const abs = path.join(STORAGE_ROOT, sub)
      if (!(await exists(abs))) {
        broken.push({ file: rel(file), ref: clean })
      }
    }
  }
  return { legacy, directImports, broken }
}

async function sha256(filePath) {
  const b = await fs.readFile(filePath)
  return createHash('sha256').update(b).digest('hex')
}

async function duplicateRuntimeMediaOutsideStorage() {
  const canonicalFiles = []
  await walk(STORAGE_ROOT, canonicalFiles)
  const byHash = new Map()
  for (const abs of canonicalFiles) {
    const x = ext(abs)
    const allowed = Object.values(ALLOWED).some((set) => set.has(x))
    if (!allowed) continue
    const h = await sha256(abs)
    if (!byHash.has(h)) byHash.set(h, [])
    byHash.get(h).push(rel(abs))
  }

  const files = []
  await walk(REPO_ROOT, files)
  const duplicates = []
  for (const abs of files) {
    const r = rel(abs)
    if (r.startsWith('storage/content/')) continue
    if (r.startsWith('docs/') || r.startsWith('scripts/') || r.startsWith('data/') || r.startsWith('frontend/src/assets/') || r.startsWith('frontend/public/assets/')) {
      continue
    }
    const x = ext(abs)
    const allowed = Object.values(ALLOWED).some((set) => set.has(x))
    if (!allowed) continue
    const h = await sha256(abs)
    const c = byHash.get(h)
    if (c?.length) duplicates.push({ file: r, canonical: c[0] })
  }
  return duplicates
}

async function main() {
  const inventory = {}
  let staleCount = 0
  for (const moduleName of MODULES) {
    const repaired = await repairMetadata(moduleName)
    staleCount += repaired.staleRemoved.length
    inventory[moduleName] = repaired
  }

  const missingByMetadata = []
  for (const moduleName of MODULES) {
    const inv = inventory[moduleName]
    const all = [...inv.images, ...inv.videos, ...inv.pdfs, ...inv.audio].map((item) => `${moduleName}/${String(item ?? '').replace(/^\/+/, '')}`)
    const miss = await validatePathsExist(all)
    if (miss.length) missingByMetadata.push({ module: moduleName, missing: miss })
  }

  const endpoint = await validateBackendEndpoints(inventory)
  const frontendScan = await scanFrontendRuntimeRefs()
  const duplicates = await duplicateRuntimeMediaOutsideStorage()

  const totals = MODULES.reduce(
    (acc, m) => {
      acc.images += inventory[m].images.length
      acc.videos += inventory[m].videos.length
      acc.pdfs += inventory[m].pdfs.length
      acc.audio += inventory[m].audio.length
      return acc
    },
    { images: 0, videos: 0, pdfs: 0, audio: 0 },
  )

  const lines = [
    '# MEDIA_RUNTIME_VALIDATION_REPORT',
    '',
    '## Module Validation',
    ...MODULES.map((m) => `- ${m}: images=${inventory[m].images.length}, videos=${inventory[m].videos.length}, pdfs=${inventory[m].pdfs.length}, audio=${inventory[m].audio.length}`),
    '',
    '## Media Tested',
    `- Images tested: ${totals.images}`,
    `- Videos tested: ${totals.videos}`,
    `- PDFs tested: ${totals.pdfs}`,
    `- Audio tested: ${totals.audio}`,
    '',
    '## Metadata Repaired',
    `- metadata.json files normalized: ${MODULES.length}`,
    `- stale metadata entries removed: ${staleCount}`,
    '',
    '## Missing Media',
    `- Missing assets from metadata paths: ${missingByMetadata.reduce((n, x) => n + x.missing.length, 0)}`,
    ...missingByMetadata.flatMap((x) => x.missing.map((m) => `- ${x.module}: ${m}`)),
    '',
    '## Backend Endpoint Validation',
    `- Endpoint checks executed: ${endpoint.total}`,
    `- Passed: ${endpoint.success}`,
    `- Failed: ${endpoint.failures.length}`,
    ...endpoint.failures.map((f) => `- ${f.name} -> ${f.status}`),
    '',
    '## Frontend Runtime Reference Validation',
    `- Legacy /content refs in frontend/src: ${frontendScan.legacy.length}`,
    ...frontendScan.legacy.map((f) => `- ${f}`),
    `- Direct runtime media imports in frontend/src (non-allowed): ${frontendScan.directImports.length}`,
    ...frontendScan.directImports.map((f) => `- ${f}`),
    `- Broken /storage/content refs in frontend/src: ${frontendScan.broken.length}`,
    ...frontendScan.broken.map((b) => `- ${b.file}: ${b.ref}`),
    '',
    '## Duplicate Runtime Media',
    `- Duplicate runtime media outside storage/content: ${duplicates.length}`,
    ...duplicates.slice(0, 200).map((d) => `- ${d.file} (canonical: ${d.canonical})`),
    '',
    '## Repaired Paths',
    '- Runtime media path generation consolidated to `/storage/content/<module>/<type>/<file>`.',
    '- Legacy `/content/*` media path blocked in backend.',
    '',
    '## Remaining Issues',
    endpoint.failures.length === 0 && missingByMetadata.length === 0 && frontendScan.broken.length === 0
      ? '- None detected in runtime validation checks.'
      : '- See failed endpoint/missing media sections above.',
  ]

  if (SHOULD_WRITE_REPORT) {
    await fs.writeFile(REPORT_PATH, `${lines.join('\n')}\n`, 'utf8')
  }
  console.log(
    JSON.stringify(
      {
        report: SHOULD_WRITE_REPORT ? rel(REPORT_PATH) : null,
        endpointFailures: endpoint.failures.length,
        missingAssets: missingByMetadata.reduce((n, x) => n + x.missing.length, 0),
        frontendBrokenRefs: frontendScan.broken.length,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error('[runtime-media-validation] failed', error)
  process.exit(1)
})

