/**
 * Probe static content media references ? S3 keys ? optional EC2 proxy HEAD/GET.
 *
 * Usage:
 *   node scripts/media-health-check.mjs
 *   API_BASE=https://infra-resilience360-cloud-production.up.railway.app node scripts/media-health-check.mjs
 *
 * Output: docs/MEDIA_HEALTH_REPORT.md
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')
const staticDir = path.join(repoRoot, 'frontend', 'src', 'data', 'static')
const reportPath = path.join(repoRoot, 'docs', 'MEDIA_HEALTH_REPORT.md')
const SHOULD_WRITE_REPORT = process.argv.includes('--report')

const BUCKET = String(process.env.S3_BUCKET || 'pak-population-data').trim()
const REGION = String(process.env.S3_REGION || 'eu-north-1').trim()
const API_BASE = String(process.env.API_BASE || process.env.VITE_SITE_URL || '').trim().replace(/\/+$/, '')
const S3_HOST = `${BUCKET}.s3.${REGION}.amazonaws.com`

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
]

/** @type {Map<string, { section: string, urls: Set<string> }>} */
const byKey = new Map()

function addRef(section, key, url) {
  const k = String(key || '').trim().replace(/^\/+/, '')
  if (!k) return
  let row = byKey.get(k)
  if (!row) {
    row = { section, urls: new Set() }
    byKey.set(k, row)
  }
  row.section = row.section || section
  if (url) row.urls.add(url)
}

function encodeProxyPath(key) {
  return key
    .split('/')
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join('/')
}

function proxyUrl(key) {
  const rel = `/static/media/local/${encodeProxyPath(key)}`
  return API_BASE ? `${API_BASE}${rel}` : rel
}

function collectFromValue(value, section, depth = 0) {
  if (depth > 14 || value == null) return
  if (typeof value === 'string') {
    const s = value.trim()
    if (/amazonaws\.com\//i.test(s)) {
      const m = s.match(/amazonaws\.com\/(.+?)(?:\?|$)/i)
      if (m) addRef(section, decodeURIComponent(m[1]), s)
    }
    if (s.includes('/static/media/local/')) {
      const idx = s.indexOf('/static/media/local/')
      const pathPart = s.slice(idx + '/static/media/local/'.length).split('?')[0]
      try {
        addRef(section, decodeURIComponent(pathPart), s)
      } catch {
        addRef(section, pathPart, s)
      }
    }
    if (/^(resilience360|resilience360-static|learn-and-train|homepage|pgbc|disaster-dashboard)\//i.test(s)) {
      addRef(section, s.replace(/^\/+/, ''), proxyUrl(s))
    }
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectFromValue(item, section, depth + 1)
    return
  }
  if (typeof value === 'object') {
    if (typeof value.s3Key === 'string') addRef(section, value.s3Key, proxyUrl(value.s3Key))
    if (Array.isArray(value.s3KeyAlternates)) {
      for (const alt of value.s3KeyAlternates) {
        if (typeof alt === 'string') addRef(section, alt, proxyUrl(alt))
      }
    }
    for (const v of Object.values(value)) collectFromValue(v, section, depth + 1)
  }
}

function loadLocalMapKeys() {
  const file = path.join(repoRoot, 'frontend', 'src', 'utils', 'contentMediaLocalMap.ts')
  const src = fs.readFileSync(file, 'utf8')
  const exactRe = /EXACT_LOCAL_TO_S3_KEY[^=]*=\s*\{([\s\S]*?)\n\}/m
  const m = src.match(exactRe)
  if (!m) return
  const keyRe = /:\s*'([^']+)'/g
  let km
  while ((km = keyRe.exec(m[1]))) {
    addRef('contentMediaLocalMap', km[1], proxyUrl(km[1]))
  }
}

async function headUrl(url, init = {}) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', ...init })
    return {
      status: res.status,
      ok: res.ok,
      contentType: res.headers.get('content-type') || '',
      acceptRanges: res.headers.get('accept-ranges') || '',
      contentLength: res.headers.get('content-length') || '',
    }
  } catch (e) {
    return { status: 0, ok: false, error: String(e?.message || e) }
  }
}

async function probeRange(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-1023' },
      redirect: 'follow',
    })
    return {
      status: res.status,
      ok: res.status === 206 || res.ok,
      contentRange: res.headers.get('content-range') || '',
    }
  } catch (e) {
    return { status: 0, ok: false, error: String(e?.message || e) }
  }
}

async function main() {
  for (const name of SECTION_FILES) {
    const file = path.join(staticDir, name)
    if (!fs.existsSync(file)) continue
    const data = JSON.parse(fs.readFileSync(file, 'utf8'))
    const section = name.replace(/\.json$/, '')
    collectFromValue(data, section)
  }
  loadLocalMapKeys()
  addRef('homepage-default', 'resilience360/background/home.mp4', proxyUrl('resilience360/background/home.mp4'))
  addRef('homepage-default', 'resilience360/background/home.jpg', proxyUrl('resilience360/background/home.jpg'))

  const entries = [...byKey.entries()]
  const results = []
  const concurrency = 6

  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency)
    await Promise.all(
      batch.map(async ([key, meta]) => {
        const generatedUrl = proxyUrl(key)
        const directUrl = `https://${S3_HOST}/${encodeProxyPath(key)}`
        const directHead = await headUrl(directUrl)
        let proxyHead = null
        let rangeProbe = null
        if (API_BASE) {
          proxyHead = await headUrl(generatedUrl)
          if (/\.(mp4|webm|m4a|mp3|wav|mov)/i.test(key)) {
            rangeProbe = await probeRange(generatedUrl)
          }
        }
        results.push({
          key,
          section: meta.section,
          generatedUrl,
          directHead,
          proxyHead,
          rangeProbe,
        })
      }),
    )
  }

  const bySection = new Map()
  for (const r of results) {
    const sec = r.section || 'unknown'
    if (!bySection.has(sec)) bySection.set(sec, { total: 0, proxyOk: 0, proxyFail: 0, directOk: 0 })
    const row = bySection.get(sec)
    row.total += 1
    if (r.proxyHead?.ok) row.proxyOk += 1
    else if (API_BASE) row.proxyFail += 1
    if (r.directHead?.ok) row.directOk += 1
  }

  const proxyOk = results.filter((r) => r.proxyHead?.ok)
  const proxyFail = results.filter((r) => API_BASE && r.proxyHead && !r.proxyHead.ok)
  const videoRangeOk = results.filter((r) => r.rangeProbe?.status === 206)

  const lines = [
    '# Media Health Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Bucket: \`${BUCKET}\` (${REGION})`,
    API_BASE ? `API proxy: \`${API_BASE}\`` : 'API proxy: **not configured** (set `API_BASE` to probe `/static/media/local/*`)',
    '',
    '## Summary',
    '',
    `- Unique S3 keys referenced: **${results.length}**`,
    `- Direct S3 HEAD OK: **${results.filter((r) => r.directHead?.ok).length}** (403 expected on private bucket)`,
  ]
  if (API_BASE) {
    lines.push(`- Proxy HEAD OK: **${proxyOk.length}**`)
    lines.push(`- Proxy HEAD failed: **${proxyFail.length}**`)
    lines.push(`- Video Range (206) OK: **${videoRangeOk.length}**`)
  }
  lines.push('', '## By section', '', '| Section | Keys | Proxy OK | Proxy fail |', '| --- | ---: | ---: | ---: |')
  for (const [sec, row] of [...bySection.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`| ${sec} | ${row.total} | ${row.proxyOk} | ${row.proxyFail} |`)
  }

  if (proxyFail.length) {
    lines.push('', '## Proxy failures (sample)', '', '| Key | Status | Generated URL |', '| --- | --- | --- |')
    for (const r of proxyFail.slice(0, 40)) {
      lines.push(`| \`${r.key}\` | ${r.proxyHead?.status || r.proxyHead?.error || 'fail'} | ${r.generatedUrl} |`)
    }
    if (proxyFail.length > 40) lines.push('', `_and ${proxyFail.length - 40} more_`)
  }

  lines.push('', '## Notes', '')
  lines.push('- **Generated URL** uses the same encoding as `contentMediaResolver.buildS3ProxyMediaUrl`.')
  lines.push('- Direct S3 **403** is normal for private buckets; production must use EC2 `/static/media/local/*`.')
  lines.push('- Videos require **206 Partial Content** on Range requests (fixed in `streamS3ObjectToResponse`).')
  lines.push('- Vercel must set `VITE_SITE_URL` to your EC2 API host if not using the production default.')

  if (SHOULD_WRITE_REPORT) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8')
    console.info('wrote', path.relative(repoRoot, reportPath))
  }
  console.info(`keys ${results.length}, proxy ok ${proxyOk.length}, proxy fail ${proxyFail.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


