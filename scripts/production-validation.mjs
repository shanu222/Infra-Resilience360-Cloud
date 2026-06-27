import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const baseUrl = String(process.env.VALIDATION_BASE_URL ?? 'http://127.0.0.1:10031').replace(/\/+$/, '')
const reportPath = path.join(repoRoot, 'docs', 'PRODUCTION_VALIDATION_REPORT.md')

const modules = [
  'home',
  'retrofit-guide',
  'smart-construction',
  'resilience-models',
  'material-hubs',
  'building-codes',
  'best-practices',
  'readiness-calculator',
  'learn-train',
  'disaster-dashboard',
  'live-earthquake-alerts',
]

const mediaKinds = ['images', 'videos', 'pdfs', 'audio']

const endpointChecks = [
  '/api/health',
  '/api/earthquake/live',
  '/api/global-earthquakes',
  '/api/data/population/pakistan/pak_cog.tif',
  '/api/geo/pak-cog.tif',
]

function normalizeMediaUrl(value, moduleId) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (raw.startsWith('/storage/content/')) return raw
  if (raw.startsWith('/')) return `/storage/content/${moduleId}/${raw.replace(/^\/+/, '')}`
  return `/storage/content/${moduleId}/${raw}`
}

async function request(pathname, options = {}) {
  const url = `${baseUrl}${pathname}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function readJson(pathname) {
  const response = await request(pathname, { headers: { Accept: 'application/json' } })
  if (!response) return { status: 0, json: null }
  try {
    return { status: response.status, json: await response.json() }
  } catch {
    return { status: response.status, json: null }
  }
}

function classifyFailure(mediaPath) {
  const rel = decodeURIComponent(String(mediaPath ?? '').replace(/^\/storage\/content\/+/, ''))
  const abs = path.join(repoRoot, 'storage', 'content', rel)
  return fs
    .access(abs)
    .then(() => 'missing_r2_object_or_proxy')
    .catch(() => 'missing_local_and_r2')
}

async function validateModule(moduleId) {
  const result = {
    moduleId,
    metadataStatus: 0,
    mediaTotal: 0,
    mediaOk: 0,
    working: [],
    failed: [],
  }
  const payload = await readJson(`/api/content/${moduleId}`)
  result.metadataStatus = payload.status
  const metadata = payload.json?.metadata && typeof payload.json.metadata === 'object' ? payload.json.metadata : {}

  for (const kind of mediaKinds) {
    const items = Array.isArray(metadata[kind]) ? metadata[kind] : []
    for (const item of items) {
      const mediaUrl = normalizeMediaUrl(item, moduleId)
      if (!mediaUrl) continue
      result.mediaTotal += 1
      const response = await request(mediaUrl, {
        headers: {
          Range: 'bytes=0-1023',
          Origin: 'https://www.infraresilience.org',
        },
      })
      const status = response?.status ?? 0
      if (status === 200 || status === 206) {
        result.mediaOk += 1
        result.working.push({ url: mediaUrl, status })
      } else {
        const reason = await classifyFailure(mediaUrl)
        result.failed.push({ url: mediaUrl, status, reason })
      }
    }
  }
  return result
}

async function validateEndpoints() {
  const rows = []
  for (const pathname of endpointChecks) {
    const response = await request(pathname, {
      headers: pathname.includes('pak_cog') || pathname.includes('pak-cog') ? { Range: 'bytes=0-1023' } : {},
    })
    const status = response?.status ?? 0
    rows.push({ pathname, status, ok: status === 200 || status === 206 })
  }
  return rows
}

async function validateEarthquakeSource() {
  const payload = await readJson('/api/earthquake/live')
  const body = payload.json ?? {}
  const source = String(body.source ?? '').trim()
  const sourceLabel = String(body.sourceLabel ?? '').trim()
  const timestamp = String(body.timestamp ?? body.metadata?.generatedAt ?? '').trim()
  const statistics = body.statistics ?? {}
  const latestEvents = Array.isArray(body.latestEvents) ? body.latestEvents.length : 0
  return {
    status: payload.status,
    source,
    sourceLabel,
    timestamp,
    latestEvents,
    hasStatistics:
      statistics &&
      typeof statistics === 'object' &&
      ['total', 'significant', 'last24h', 'highestMagnitude'].every((k) => Object.prototype.hasOwnProperty.call(statistics, k)),
  }
}

async function listR2Objects() {
  const endpoint = String(process.env.R2_ENDPOINT ?? '').trim()
  const accountId = String(process.env.R2_ACCOUNT_ID ?? '').trim()
  const bucket = String(process.env.R2_BUCKET ?? '').trim()
  const accessKeyId = String(process.env.R2_ACCESS_KEY_ID ?? '').trim()
  const secretAccessKey = String(process.env.R2_SECRET_ACCESS_KEY ?? '').trim()
  const resolvedEndpoint = endpoint || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '')

  if (!resolvedEndpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return { skipped: true, reason: 'missing_r2_credentials', keys: [] }
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: resolvedEndpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  })

  const keys = []
  let token = undefined
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: token,
      }),
    )
    for (const item of page.Contents ?? []) {
      const key = String(item?.Key ?? '').trim()
      if (key) keys.push(key)
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (token)

  return { skipped: false, reason: '', keys }
}

async function main() {
  const moduleResults = []
  for (const moduleId of modules) {
    console.log(`[validation] module ${moduleId}...`)
    moduleResults.push(await validateModule(moduleId))
  }

  const endpointResults = await validateEndpoints()
  const earthquake = await validateEarthquakeSource()
  const r2 = await listR2Objects()

  const workingMedia = moduleResults.flatMap((x) => x.working)
  const failedMedia = moduleResults.flatMap((x) => x.failed.map((row) => ({ module: x.moduleId, ...row })))
  const expectedR2Keys = new Set(
    moduleResults.flatMap((x) =>
      [...x.working.map((row) => row.url), ...x.failed.map((row) => row.url)].map((url) =>
        String(url).replace(/^\/storage\/content\//, 'content/'),
      ),
    ),
  )
  const r2KeySet = new Set(r2.keys)
  const missingInR2 = []
  const malformedR2Keys = []
  if (!r2.skipped) {
    for (const key of expectedR2Keys) {
      if (!r2KeySet.has(key)) missingInR2.push(key)
    }
    for (const key of r2.keys) {
      if (key.startsWith('storage/content/') || key.startsWith('storage/storage/') || key.startsWith('content/content/')) {
        malformedR2Keys.push(key)
      }
    }
  }

  const lines = [
    '# Production Validation Report',
    '',
    `- Base URL: \`${baseUrl}\``,
    `- Generated at: ${new Date().toISOString()}`,
    '',
    '## Working Media',
    `- Total working media URLs: ${workingMedia.length}`,
    ...moduleResults.map((x) => `- ${x.moduleId}: ${x.mediaOk}/${x.mediaTotal} media URLs returned 200/206`),
    '',
    '## Missing Media',
    `- Total failing media URLs: ${failedMedia.length}`,
    ...failedMedia.map((row) => `- ${row.module}: ${row.url} -> ${row.status} (${row.reason})`),
    '',
    '## Fixed Metadata',
    '- No metadata structure changes were applied by this run.',
    '',
    '## Uploaded Objects',
    '- No automated R2 uploads were performed (requires R2 write credentials in execution environment).',
    '',
    '## R2 Consistency',
    `- R2 audit mode: ${r2.skipped ? `skipped (${r2.reason})` : 'executed'}`,
    `- Objects scanned: ${r2.keys.length}`,
    `- Malformed keys detected: ${malformedR2Keys.length}`,
    ...malformedR2Keys.map((key) => `- malformed: ${key}`),
    `- Missing expected keys in bucket listing: ${missingInR2.length}`,
    ...(r2.skipped
      ? ['- Missing-key comparison skipped because bucket listing is unavailable in this environment.']
      : missingInR2.slice(0, 200).map((key) => `- missing: ${key}`)),
    '',
    '## Broken URLs',
    ...failedMedia.map((row) => `- ${row.url}`),
    ...(failedMedia.length === 0 ? ['- None'] : []),
    '',
    '## Fixed URLs',
    '- R2 proxy normalization is handled in backend and validated via 200/206 checks.',
    '',
    '## GIS Changes',
    '- Added backend population raster proxy aliases:',
    '  - `/api/data/population/pakistan/pak_cog.tif`',
    '  - `/data/population/pakistan/pak_cog.tif`',
    '  - `/api/geo/pak-cog.tif` now falls back to `/storage/content/live-earthquake-alerts/pak_cog.tif` when local file is absent.',
    '',
    '## Earthquake Changes',
    `- /api/earthquake/live status: ${earthquake.status}`,
    `- source: ${earthquake.source || '(missing)'}`,
    `- sourceLabel: ${earthquake.sourceLabel || '(missing)'}`,
    `- timestamp present: ${earthquake.timestamp ? 'yes' : 'no'}`,
    `- statistics shape valid: ${earthquake.hasStatistics ? 'yes' : 'no'}`,
    `- latest events count: ${earthquake.latestEvents}`,
    '',
    '## Population Changes',
    ...endpointResults
      .filter((x) => x.pathname.includes('pak_cog') || x.pathname.includes('pak-cog'))
      .map((x) => `- ${x.pathname} -> ${x.status}`),
    '',
    '## Endpoint Validation',
    ...endpointResults.map((x) => `- ${x.pathname} -> ${x.status}`),
  ]

  await fs.mkdir(path.dirname(reportPath), { recursive: true })
  await fs.writeFile(reportPath, `${lines.join('\n')}\n`, 'utf8')

  console.log(
    JSON.stringify(
      {
        report: path.relative(repoRoot, reportPath).replace(/\\/g, '/'),
        failedMedia: failedMedia.length,
        endpointsFailed: endpointResults.filter((x) => !x.ok).length,
        earthquakeSourceLabel: earthquake.sourceLabel,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error('[production-validation] failed', error)
  process.exit(1)
})
