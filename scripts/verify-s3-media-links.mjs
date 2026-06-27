/**
 * Audit S3 media keys referenced by static content and contentMediaLocalMap.
 * Read-only HEAD requests — does not modify bucket data.
 *
 * Usage: node scripts/verify-s3-media-links.mjs
 * Env: S3_BUCKET (default pak-population-data), S3_REGION (default eu-north-1)
 *      API_BASE — optional; also probes /static/media/local/{key} when set
 *
 * Output: docs/S3_MEDIA_AUDIT_REPORT.md
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')
const staticDir = path.join(repoRoot, 'src', 'data', 'static')
const reportPath = path.join(repoRoot, 'docs', 'S3_MEDIA_AUDIT_REPORT.md')
const SHOULD_WRITE_REPORT = process.argv.includes('--report')

const BUCKET = String(process.env.S3_BUCKET || 'pak-population-data').trim()
const REGION = String(process.env.S3_REGION || 'eu-north-1').trim()
const API_BASE = String(process.env.API_BASE || process.env.VITE_SITE_URL || '').trim().replace(/\/+$/, '')

const S3_HOST = `${BUCKET}.s3.${REGION}.amazonaws.com`

const SECTION_FILES = [
  'homepage.json',
  'learn.json',
  'disaster-dashboard.json',
  'material-hubs.json',
  'pgbc.json',
  'retrofit.json',
  'infra-models.json',
  'best-practices.json',
  'portals.json',
]

/** @type {Map<string, { sources: Set<string>, urls: Set<string> }>} */
const keys = new Map()

function addKey(key, source, url) {
  const k = String(key || '').trim().replace(/^\/+/, '')
  if (!k) return
  let row = keys.get(k)
  if (!row) {
    row = { sources: new Set(), urls: new Set() }
    keys.set(k, row)
  }
  row.sources.add(source)
  if (url) row.urls.add(url)
}

function collectFromUnknown(value, source, depth = 0) {
  if (depth > 12 || value == null) return
  if (typeof value === 'string') {
    const s = value.trim()
    if (/amazonaws\.com\//i.test(s)) {
      const m = s.match(/amazonaws\.com\/(.+?)(?:\?|$)/i)
      if (m) addKey(decodeURIComponent(m[1]), source, s)
    }
    if (s.startsWith('resilience360/') || s.startsWith('resilience360-static/') || s.startsWith('learn-and-train/')) {
      addKey(s, source, `https://${S3_HOST}/${s}`)
    }
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectFromUnknown(item, source, depth + 1)
    return
  }
  if (typeof value === 'object') {
    if (typeof value.s3Key === 'string') addKey(value.s3Key, source)
    for (const v of Object.values(value)) collectFromUnknown(v, source, depth + 1)
  }
}

function loadContentMediaMapKeys() {
  const file = path.join(repoRoot, 'src', 'utils', 'contentMediaLocalMap.ts')
  const src = fs.readFileSync(file, 'utf8')
  const exactRe = /EXACT_LOCAL_TO_S3_KEY[^=]*=\s*\{([\s\S]*?)\n\}/m
  const m = src.match(exactRe)
  if (!m) return
  const block = m[1]
  const keyRe = /:\s*'([^']+)'/g
  let km
  while ((km = keyRe.exec(block))) {
    addKey(km[1], 'contentMediaLocalMap.ts')
  }
}

async function headUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    const ct = res.headers.get('content-type') || ''
    return { ok: res.ok, status: res.status, contentType: ct }
  } catch (e) {
    return { ok: false, status: 0, contentType: '', error: String(e?.message || e) }
  }
}

async function main() {
  for (const name of SECTION_FILES) {
    const file = path.join(staticDir, name)
    if (!fs.existsSync(file)) continue
    const data = JSON.parse(fs.readFileSync(file, 'utf8'))
    collectFromUnknown(data, `static/${name}`)
  }
  loadContentMediaMapKeys()

  const learnCatalogPath = path.join(repoRoot, 'src', 'data', 'bundled', 'learnVideoCatalog.json')
  if (fs.existsSync(learnCatalogPath)) {
    const catalog = JSON.parse(fs.readFileSync(learnCatalogPath, 'utf8'))
    collectFromUnknown(catalog, 'bundled/learnVideoCatalog.json')
  }

  addKey('resilience360/background/home.mp4', 'homepage-default')
  addKey('resilience360/background/home.jpg', 'homepage-default')

  const duplicateCheck = new Map()
  for (const k of keys.keys()) {
    const norm = k.toLowerCase()
    const list = duplicateCheck.get(norm) || []
    list.push(k)
    duplicateCheck.set(norm, list)
  }
  const duplicates = [...duplicateCheck.entries()].filter(([, list]) => list.length > 1)

  const results = []
  const concurrency = 8
  const entries = [...keys.entries()]
  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency)
    await Promise.all(
      batch.map(async ([key, meta]) => {
        const direct = `https://${S3_HOST}/${key.split('/').map(encodeURIComponent).join('/')}`
        const directHead = await headUrl(direct)
        let proxyHead = null
        if (API_BASE) {
          proxyHead = await headUrl(`${API_BASE}/static/media/local/${key.split('/').map(encodeURIComponent).join('/')}`)
        }
        results.push({
          key,
          sources: [...meta.sources],
          direct,
          directHead,
          proxyHead,
        })
      }),
    )
  }

  const missing = results.filter((r) => !r.directHead.ok)
  const ok = results.filter((r) => r.directHead.ok)

  const lines = [
    '# S3 Media Audit Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Bucket: \`${BUCKET}\` (${REGION})`,
    API_BASE ? `API proxy base: \`${API_BASE}\`` : 'API proxy: not configured (direct S3 HEAD only)',
    '',
    '## Summary',
    '',
    `- Keys audited: **${results.length}**`,
    `- Direct S3 OK: **${ok.length}**`,
    `- Missing / error: **${missing.length}**`,
    `- Case-insensitive duplicate keys: **${duplicates.length}**`,
    '',
  ]

  if (missing.length) {
    lines.push('## Missing or broken keys', '', '| Key | Status | Sources |', '| --- | --- | --- |')
    for (const r of missing.slice(0, 80)) {
      lines.push(`| \`${r.key}\` | ${r.directHead.status || r.directHead.error || 'fail'} | ${r.sources.join(', ')} |`)
    }
    if (missing.length > 80) lines.push('', `_…and ${missing.length - 80} more_`)
    lines.push('')
  }

  if (duplicates.length) {
    lines.push('## Duplicate keys (case-insensitive)', '')
    for (const [, list] of duplicates.slice(0, 20)) {
      lines.push(`- ${list.map((k) => `\`${k}\``).join(', ')}`)
    }
    lines.push('')
  }

  lines.push('## Verified OK (sample)', '', '| Key | Content-Type |', '| --- | --- |')
  for (const r of ok.slice(0, 30)) {
    lines.push(`| \`${r.key}\` | ${r.directHead.contentType || '—'} |`)
  }

  const proxyOk = results.filter((r) => r.proxyHead?.ok)
  const proxyFail = results.filter((r) => r.proxyHead && !r.proxyHead.ok)
  if (API_BASE) {
    lines.push('## EC2 proxy (`/static/media/local/*`)', '')
    lines.push(`- Proxy OK: **${proxyOk.length}**`)
    lines.push(`- Proxy missing / error: **${proxyFail.length}**`)
    lines.push('')
  }

  lines.push('## Notes', '')
  lines.push('- This script performs read-only HTTP HEAD checks; it does not modify S3.')
  lines.push('- **403 on direct S3 HEAD** is expected for private buckets; staging/production serve media via EC2 `/static/media/local/*`.')
  lines.push('- All app-facing URLs should resolve through `/static/media/local/{key}` (see `contentMediaResolver.ts`).')
  lines.push('- Learn catalog is bundled in `src/data/static/learn.json` and `src/data/bundled/learnVideoCatalog.json` (no runtime CMS media API).')
  lines.push('- Re-run with `API_BASE=https://your-ec2-host` to validate proxy HEAD in addition to direct S3.')

  if (SHOULD_WRITE_REPORT) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8')
    console.info('wrote', path.relative(repoRoot, reportPath))
  }
  console.info(`OK ${ok.length} / ${results.length}, missing ${missing.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


