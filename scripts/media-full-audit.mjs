/**
 * Full media delivery audit: static keys, proxy URLs, HEAD/Range against EC2 API.
 *
 * Usage:
 *   node scripts/media-full-audit.mjs
 *   API_BASE=https://infra-resilience360-cloud-production.up.railway.app node scripts/media-full-audit.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')
const staticDir = path.join(repoRoot, 'src', 'data', 'static')
const reportPath = path.join(repoRoot, 'docs', 'MEDIA_VALIDATION_REPORT.md')
const SHOULD_WRITE_REPORT = process.argv.includes('--report')

const API_BASE = String(process.env.API_BASE || process.env.VITE_SITE_URL || process.env.PUBLIC_API_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '')

const SECTION_FILES = [
  'homepage.json',
  'learn.json',
  'retrofit.json',
  'infra-models.json',
  'pgbc.json',
  'material-hubs.json',
  'best-practices.json',
  'portals.json',
  'readiness.json',
  'disaster-dashboard.json',
  'design-toolkit.json',
]

/** @type {Map<string, { sections: Set<string> }>} */
const keys = new Map()

function addKey(section, key) {
  const k = String(key || '').trim().replace(/^\/+/, '')
  if (!k) return
  let row = keys.get(k)
  if (!row) {
    row = { sections: new Set() }
    keys.set(k, row)
  }
  row.sections.add(section)
}

function proxyUrl(key) {
  const enc = key
    .split('/')
    .filter(Boolean)
    .map((s) => encodeURIComponent(s))
    .join('/')
  const rel = `/static/media/local/${enc}`
  return API_BASE ? `${API_BASE}${rel}` : rel
}

function collect(value, section, depth = 0) {
  if (depth > 14 || value == null) return
  if (typeof value === 'string') {
    const s = value.trim()
    if (s.includes('amazonaws.com')) {
      const m = s.match(/amazonaws\.com\/(.+?)(?:\?|$)/i)
      if (m) addKey(section, decodeURIComponent(m[1]))
    }
    if (s.includes('/static/media/local/')) {
      const i = s.indexOf('/static/media/local/')
      const p = s.slice(i + '/static/media/local/'.length).split('?')[0]
      try {
        addKey(section, decodeURIComponent(p))
      } catch {
        addKey(section, p)
      }
    }
    return
  }
  if (Array.isArray(value)) {
    for (const v of value) collect(v, section, depth + 1)
    return
  }
  if (typeof value === 'object') {
    if (typeof value.s3Key === 'string') addKey(section, value.s3Key)
    if (Array.isArray(value.s3KeyAlternates)) {
      for (const alt of value.s3KeyAlternates) {
        if (typeof alt === 'string') addKey(section, alt)
      }
    }
    for (const v of Object.values(value)) collect(v, section, depth + 1)
  }
}

async function head(url) {
  const t0 = Date.now()
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    return {
      ok: res.ok,
      status: res.status,
      ms: Date.now() - t0,
      contentType: res.headers.get('content-type') || '',
      contentLength: res.headers.get('content-length') || '',
      acceptRanges: res.headers.get('accept-ranges') || '',
    }
  } catch (e) {
    return { ok: false, status: 0, ms: Date.now() - t0, error: String(e?.message || e) }
  }
}

async function rangeProbe(url) {
  try {
    const res = await fetch(url, { headers: { Range: 'bytes=0-1023' } })
    return {
      ok: res.status === 206 || res.ok,
      status: res.status,
      contentRange: res.headers.get('content-range') || '',
    }
  } catch (e) {
    return { ok: false, status: 0, error: String(e?.message || e) }
  }
}

async function probeMediaApi(section) {
  if (!API_BASE) return { skipped: true }
  const url = `${API_BASE}/static/media?section=${encodeURIComponent(section)}`
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    const data = await res.json()
    const items = Array.isArray(data.media) ? data.media : Array.isArray(data.items) ? data.items : []
    const directS3 = items.filter((i) => String(i?.url || '').includes('amazonaws.com'))
    const proxy = items.filter((i) => String(i?.url || '').includes('/static/media/local/'))
    return { ok: res.ok, status: res.status, total: items.length, directS3: directS3.length, proxy: proxy.length }
  } catch (e) {
    return { ok: false, error: String(e?.message || e) }
  }
}

async function main() {
  for (const name of SECTION_FILES) {
    const file = path.join(staticDir, name)
    if (!fs.existsSync(file)) continue
    const section = name.replace(/\.json$/, '')
    collect(JSON.parse(fs.readFileSync(file, 'utf8')), section)
  }

  const sampleKeys = [...keys.entries()].slice(0, 40)
  const proxyResults = []
  for (const [key] of sampleKeys) {
    const url = proxyUrl(key)
    const h = await head(url)
    const isVideo = /\.(mp4|webm|m4a|mov)/i.test(key)
    const r = isVideo && h.ok ? await rangeProbe(url) : null
    proxyResults.push({ key, url, head: h, range: r })
  }

  const apiSections = ['learn', 'homepage', 'infra-models', 'pgbc']
  const apiResults = []
  for (const sec of apiSections) {
    apiResults.push({ section: sec, ...(await probeMediaApi(sec)) })
  }

  const headOk = proxyResults.filter((r) => r.head.ok)
  const headFail = proxyResults.filter((r) => !r.head.ok && API_BASE)
  const rangeOk = proxyResults.filter((r) => r.range?.status === 206)
  const slow = proxyResults.filter((r) => r.head.ms > 8000)

  const lines = [
    '# Media Validation Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    API_BASE ? `API_BASE: \`${API_BASE}\`` : 'API_BASE: not set (proxy probes skipped)',
    '',
    '## Summary',
    '',
    `- Static keys catalogued: **${keys.size}**`,
    `- Proxy sample probed: **${proxyResults.length}**`,
    `- Proxy HEAD OK: **${headOk.length}**`,
    `- Proxy HEAD failed: **${headFail.length}**`,
    `- Video Range 206 OK: **${rangeOk.length}**`,
    `- Slow HEAD (>8s): **${slow.length}**`,
    '',
    '## GET /static/media (proxy URLs only)',
    '',
    '| Section | HTTP | Items | Proxy URLs | Direct S3 (bad) |',
    '| --- | --- | ---: | ---: | ---: |',
  ]
  for (const r of apiResults) {
    if (r.skipped) {
      lines.push(`| ${r.section} | skipped | — | — | — |`)
      continue
    }
    lines.push(`| ${r.section} | ${r.status ?? r.error ?? '—'} | ${r.total ?? 0} | ${r.proxy ?? 0} | ${r.directS3 ?? 0} |`)
  }

  if (headFail.length) {
    lines.push('', '## Proxy HEAD failures', '', '| Key | Status | ms |', '| --- | --- | ---: |')
    for (const r of headFail.slice(0, 25)) {
      lines.push(`| \`${r.key}\` | ${r.head.status || r.head.error} | ${r.head.ms} |`)
    }
  }

  lines.push('', '## Proxy HEAD OK (sample)', '', '| Key | Status | Content-Type | Accept-Ranges | ms |', '| --- | --- | --- | --- | ---: |')
  for (const r of headOk.slice(0, 15)) {
    lines.push(
      `| \`${r.key}\` | ${r.head.status} | ${r.head.contentType || '—'} | ${r.head.acceptRanges || '—'} | ${r.head.ms} |`,
    )
  }

  lines.push('', '## Deployment checklist', '')
  lines.push('1. Set `PUBLIC_API_BASE_URL` on EC2 to the public API origin.')
  lines.push('2. Set `VITE_SITE_URL` on Vercel to the same API origin and rebuild.')
  lines.push('3. Confirm `curl -I $API/static/media/local/resilience360/background/home.mp4` returns immediately.')
  lines.push('4. Confirm no `amazonaws.com` URLs in `GET /static/media?section=learn`.')

  if (SHOULD_WRITE_REPORT) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8')
    console.info('wrote', path.relative(repoRoot, reportPath))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


