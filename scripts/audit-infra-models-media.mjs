import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SHOULD_WRITE_REPORT = process.argv.includes('--report')

const REPORT_MD = path.join(ROOT, 'INFRA_MODELS_MEDIA_AUDIT.md')
const MISSING_JSON = path.join(ROOT, 'storage', 'reports', 'infra-models-missing-assets.json')

const AUDIT_SOURCES = {
  metadata: path.join(ROOT, 'content', 'resilience-models', 'metadata.json'),
  infraConfig: path.join(ROOT, 'frontend', 'src', 'config', 'infraModels.ts'),
  infraService: path.join(ROOT, 'frontend', 'src', 'services', 'infraModels.ts'),
  pageConfig: path.join(ROOT, 'data', 'cms', 'pages', 'infra-models.json'),
  staticJson: path.join(ROOT, 'frontend', 'src', 'data', 'static', 'infra-models.json'),
  backendResolver: path.join(ROOT, 'backend', 'services', 'localMediaResolver.mjs'),
}

const MEDIA_EXT_RE = /\.(mp4|mov|webm|m4v|mp3|wav|m4a|aac|ogg|pdf|png|jpe?g|webp|svg|gif|avif|tiff?|geojson|csv)$/i

function normSlashes(v) {
  return String(v ?? '').replace(/\\/g, '/')
}

function toFsPath(contentPath) {
  const p = String(contentPath ?? '').trim()
  if (!p.startsWith('/')) return null
  return path.join(ROOT, p.slice(1))
}

async function readJsonSafe(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

async function readTextSafe(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8')
  } catch {
    return ''
  }
}

function addRef(refs, source, rawPath) {
  const p = normSlashes(rawPath).trim()
  if (!p) return
  refs.push({ source, referencedPath: p })
}

function extractQuotedMediaPaths(text) {
  const refs = []
  const re = /['"`]([^'"`\n]+(?:\.[a-z0-9]{2,8}))['"`]/gi
  let m
  while ((m = re.exec(text))) {
    const candidate = normSlashes(m[1]).trim()
    if (!MEDIA_EXT_RE.test(candidate)) continue
    if (candidate.includes('${')) continue
    refs.push(candidate)
  }
  return refs
}

function buildCanonicalContentPath(inputPath) {
  const p = normSlashes(inputPath)
  if (p.startsWith('/content/resilience360/infra-models/')) return p
  if (p.startsWith('/content/resilience-models/')) {
    return p.replace('/content/resilience-models/', '/content/resilience360/infra-models/')
  }
  if (p.startsWith('resilience360/infra-models/')) return `/content/${p}`
  if (p.startsWith('infra-models/')) return `/content/resilience360/${p}`
  return p.startsWith('/content/') ? p : `/content/resilience360/infra-models/${p.replace(/^\/+/, '')}`
}

function toS3KeyFromCanonical(canonicalPath) {
  const p = normSlashes(canonicalPath)
  if (!p.startsWith('/content/')) return ''
  return p.slice('/content/'.length)
}

async function findAlternativePathByName(fileName) {
  const targets = [
    path.join(ROOT, 'content', 'resilience-models'),
    path.join(ROOT, 'storage', 'temp', 's3-mirror', 'resilience360', 'infra-models'),
    path.join(ROOT, 'frontend', 'public', 'pgbc'),
  ]
  for (const base of targets) {
    if (!existsSync(base)) continue
    const stack = [base]
    while (stack.length) {
      const cur = stack.pop()
       
      const entries = await fs.readdir(cur, { withFileTypes: true })
      for (const entry of entries) {
        const full = path.join(cur, entry.name)
        if (entry.isDirectory()) stack.push(full)
        else if (entry.isFile() && entry.name.toLowerCase() === fileName.toLowerCase()) {
          return normSlashes(path.relative(ROOT, full))
        }
      }
    }
  }
  return ''
}

function parseInfraModelsRuntimeReferences(tsSource) {
  const refs = []
  const imageBaseMatch = tsSource.match(/INFRA_MODELS_IMAGE_BASE\s*=\s*`([^`]+)`/)
  const pdfBaseMatch = tsSource.match(/INFRA_MODELS_PDF_BASE\s*=\s*`([^`]+)`/)
  const officialVideoMatch = tsSource.match(/INFRA_MODELS_OFFICIAL_VIDEO_URL\s*=\s*localResilience360Url\('([^']+)',\s*'([^']+)'\)/)

  const imageBase = imageBaseMatch ? imageBaseMatch[1].replace(/\$\{[^}]+\}/g, '/content/resilience360/infra-models') : '/content/resilience360/infra-models/model%20pictures/'
  const pdfBase = pdfBaseMatch ? pdfBaseMatch[1].replace(/\$\{[^}]+\}/g, '/content/resilience360/infra-models') : '/content/resilience360/infra-models/model%20pdfs/'

  const imageNameRe = /imageFileName:\s*'([^']+)'/g
  const imageCandidateRe = /imageFileNameCandidates:\s*\[([^\]]+)\]/g
  const pdfNameRe = /pdfFileName:\s*'([^']+)'/g
  const pdfCandidateRe = /pdfFileNameCandidates:\s*\[([^\]]+)\]/g

  let m
  while ((m = imageNameRe.exec(tsSource))) refs.push(`${imageBase}${encodeURIComponent(m[1])}`)
  while ((m = pdfNameRe.exec(tsSource))) refs.push(`${pdfBase}${encodeURIComponent(m[1])}`)

  while ((m = imageCandidateRe.exec(tsSource))) {
    const vals = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    for (const v of vals) refs.push(`${imageBase}${encodeURIComponent(v)}`)
  }
  while ((m = pdfCandidateRe.exec(tsSource))) {
    const vals = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    for (const v of vals) refs.push(`${pdfBase}${encodeURIComponent(v)}`)
  }

  if (officialVideoMatch) {
    refs.push(`/content/resilience360/${officialVideoMatch[1]}/${officialVideoMatch[2]}`)
  }

  return refs.map((p) => decodeURIComponent(p))
}

async function main() {
  const refs = []

  const meta = await readJsonSafe(AUDIT_SOURCES.metadata, { files: [] })
  for (const fileRef of Array.isArray(meta?.files) ? meta.files : []) addRef(refs, 'metadata.json', fileRef)

  const infraConfig = await readTextSafe(AUDIT_SOURCES.infraConfig)
  for (const p of parseInfraModelsRuntimeReferences(infraConfig)) addRef(refs, 'frontend runtime (infraModels.ts)', p)

  const infraService = await readTextSafe(AUDIT_SOURCES.infraService)
  for (const p of extractQuotedMediaPaths(infraService)) {
    if (p.startsWith('http')) continue
    if (p.startsWith('/content/resilience360-static/infra-models/') || p.startsWith('/content/resilience360-static/infra-resilience/')) {
      addRef(refs, 'frontend runtime (infraModels service)', p)
    }
  }

  for (const sourceName of ['pageConfig', 'staticJson']) {
    const sourcePath = AUDIT_SOURCES[sourceName]
    const txt = await readTextSafe(sourcePath)
    for (const p of extractQuotedMediaPaths(txt)) {
      addRef(refs, `${sourceName} JSON`, p)
    }
  }

  const unique = new Map()
  for (const ref of refs) {
    const canonical = ref.referencedPath.startsWith('/content/resilience360-static/')
      ? ref.referencedPath
      : buildCanonicalContentPath(ref.referencedPath)
    const key = `${canonical}|${ref.source}`
    if (!unique.has(key)) unique.set(key, { ...ref, canonicalPath: canonical })
  }
  const rows = [...unique.values()]

  const auditRows = []
  const missingForDownload = []
  for (const row of rows) {
    const fsPath = toFsPath(row.canonicalPath)
    const exists = Boolean(fsPath && existsSync(fsPath))
    const fileName = path.basename(row.canonicalPath)
     
    const alt = exists ? '' : await findAlternativePathByName(fileName)
    const missing = !exists
    const broken = !exists
    auditRows.push({
      source: row.source,
      referencedPath: row.referencedPath,
      canonicalPath: row.canonicalPath,
      exists,
      actualLocalPath: exists ? normSlashes(path.relative(ROOT, fsPath)) : alt || '',
      missing,
      broken,
    })
    if (missing) {
      const key = toS3KeyFromCanonical(row.canonicalPath)
      if (key) missingForDownload.push({ key, canonicalPath: row.canonicalPath, source: row.source })
    }
  }

  const uniqueMissing = []
  const seen = new Set()
  for (const item of missingForDownload) {
    if (seen.has(item.key)) continue
    seen.add(item.key)
    uniqueMissing.push(item)
  }

  const md = [
    '# INFRA_MODELS_MEDIA_AUDIT',
    '',
    `- Module: Resilience Infra Models`,
    `- Target path checked: \`content/resilience360/infra-models/\``,
    `- Total references audited: ${auditRows.length}`,
    `- Missing references: ${auditRows.filter((r) => r.missing).length}`,
    '',
    '| Source | Referenced Path | Exists Locally | Actual Local Path | Missing | Broken Reference |',
    '|---|---|---|---|---|---|',
    ...auditRows.map((r) => `| ${r.source} | \`${r.canonicalPath}\` | ${r.exists ? 'Yes' : 'No'} | ${r.actualLocalPath ? `\`${r.actualLocalPath}\`` : '-'} | ${r.missing ? 'Yes' : 'No'} | ${r.broken ? 'Yes' : 'No'} |`),
    '',
  ].join('\n')

  if (SHOULD_WRITE_REPORT) {
    await fs.writeFile(REPORT_MD, `${md}\n`, 'utf8')
  }
  await fs.mkdir(path.dirname(MISSING_JSON), { recursive: true })
  await fs.writeFile(
    MISSING_JSON,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        module: 'infra-models',
        targetBase: 'content/resilience360/infra-models',
        missing: uniqueMissing,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  console.log(`audited=${auditRows.length}`)
  console.log(`missing=${auditRows.filter((r) => r.missing).length}`)
  console.log(`missing_download_keys=${uniqueMissing.length}`)
  if (SHOULD_WRITE_REPORT) {
    console.log(`report=${path.relative(ROOT, REPORT_MD)}`)
  }
}

main().catch((err) => {
  console.error('[audit-infra-models-media] failed:', err)
  process.exit(1)
})

