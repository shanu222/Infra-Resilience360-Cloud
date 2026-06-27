/**
 * Priority media remediation: Disaster Dashboard + PGBC only.
 * - Copies/uploads canonical S3 keys expected by production UI
 * - Validates /static/media/local/* (HEAD, GET, Range)
 *
 * Usage:
 *   node scripts/remediate-priority-media.mjs disaster
 *   node scripts/remediate-priority-media.mjs pgbc
 *   node scripts/remediate-priority-media.mjs validate
 *   node scripts/remediate-priority-media.mjs all
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import {
  CopyObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')
const docsDir = path.join(repoRoot, 'docs')
const SHOULD_WRITE_REPORT = process.argv.includes('--report')

dotenv.config({ path: path.join(repoRoot, '.env') })

const BUCKET = process.env.S3_BUCKET || process.env.S3_MEDIA_BUCKET || 'pak-population-data'
const REGION = process.env.S3_REGION || process.env.AWS_REGION || 'eu-north-1'
const API_BASE = String(
  process.env.API_BASE ||
    process.env.VITE_SITE_URL ||
    'https://infra-resilience360-cloud-production.up.railway.app',
)
  .trim()
  .replace(/\/+$/, '')

const s3 = new S3Client({ region: REGION })

/** Local folder name ? production slug (guidanceVideoUrls) */
const DISASTER_LOCAL_TO_SLUG = [
  ['Cold wave', 'cold-wave'],
  ['Crop Fire', 'crop-fire'],
  ['Earthquake', 'earthquake'],
  ['Flood', 'flood'],
  ['Heatwave', 'heatwave'],
  ['Landslide', 'landslide'],
  ['Loadshedding', 'load-shedding'],
  ['Smog', 'smog'],
  ['Storm Cyclone', 'storm-cyclone'],
  ['Urban fire', 'urban-fire'],
]

/** Pascal-case S3 folder names that already hold full hazard sets */
const DISASTER_PASCAL_SOURCE = {
  earthquake: 'Earthquake',
  flood: 'Flood',
  heatwave: 'Heatwave',
  landslide: 'Landslide',
  'load-shedding': 'Loadshedding',
  smog: 'Smog',
}

const PGBC_EXACT_KEYS = {
  'All Codes/Building Code of Pakistan 2021/Building Code of Pakistan 2021.pdf':
    'resilience360/pgbc/All Codes/Building Code of Pakistan 2021/Building Code of Pakistan 2021.pdf',
  'All Codes/Green Building Code of Pakistan 2023/Green Building Code of Pakistan 2023.pdf':
    'resilience360/pgbc/All Codes/Green Building Code of Pakistan 2023/Green Building Code of Pakistan 2023.pdf',
  'All Codes/Building Code of Pakistan 2007/Building Code of Pakistan 2007.pdf':
    'resilience360/pgbc/All Codes/Building Code of Pakistan 2007/Building Code of Pakistan 2007.pdf',
  'All Codes/BCP-Energy-Provisions-2011/BCP-Energy-Provisions-2011.pdf':
    'resilience360/pgbc/All Codes/BCP-Energy-Provisions-2011/BCP-Energy-Provisions-2011.pdf',
  'All Codes/Building-Code-of-Pakistan-Fire-Safety-Provisions-2016/Building-Code-of-Pakistan-Fire-Safety-Provisions-2016.pdf':
    'resilience360/pgbc/All Codes/Building-Code-of-Pakistan-Fire-Safety-Provisions-2016/Building-Code-of-Pakistan-Fire-Safety-Provisions-2016.pdf',
  'All Codes/ecbc23/ecbc23.pdf': 'resilience360/pgbc/All Codes/ecbc23/ecbc23.pdf',
  'All Codes/Pakistan-Electric-Telecommunication-Safety-Code-PETSAC-2014/Pakistan-Electric-Telecommunication-Safety-Code-PETSAC-2014.pdf':
    'resilience360/pgbc/All Codes/Pakistan-Electric-Telecommunication-Safety-Code-PETSAC-2014/Pakistan-Electric-Telecommunication-Safety-Code-PETSAC-2014.pdf',
  'All Codes/standardization-of-building-codes-standards-and-specifications-for-low-cost-affordable-units-2021/standardization-of-building-codes-standards-and-specifications-for-low-cost-affordable-units-2021.pdf':
    'resilience360/pgbc/All Codes/standardization-of-building-codes-standards-and-specifications-for-low-cost-affordable-units-2021/standardization-of-building-codes-standards-and-specifications-for-low-cost-affordable-units-2021.pdf',
}

function proxyUrl(s3Key) {
  const enc = s3Key.split('/').filter(Boolean).map((s) => encodeURIComponent(s)).join('/')
  return `${API_BASE}/static/media/local/${enc}`
}

async function headKey(key) {
  try {
    const r = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return { exists: true, contentType: r.ContentType || '', size: r.ContentLength || 0 }
  } catch (e) {
    return { exists: false, error: e?.name || String(e) }
  }
}

async function copyKey(fromKey, toKey) {
  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${fromKey.split('/').map(encodeURIComponent).join('/')}`,
      Key: toKey,
    }),
  )
}

async function uploadFile(localPath, key, contentType) {
  const body = fs.readFileSync(localPath)
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

async function probeProxy(url) {
  const head = await fetch(url, { method: 'HEAD', redirect: 'follow' }).catch((e) => ({
    ok: false,
    status: 0,
    error: String(e?.message || e),
  }))
  let rangeStatus = 0
  let rangeOk = false
  if (head.ok) {
    const range = await fetch(url, { headers: { Range: 'bytes=0-1023' }, redirect: 'follow' }).catch(() => null)
    rangeStatus = range?.status || 0
    rangeOk = Boolean(range && (range.status === 206 || range.ok))
  }
  return {
    headOk: Boolean(head.ok),
    headStatus: head.status || 0,
    headType: head.headers?.get?.('content-type') || '',
    rangeOk,
    rangeStatus,
  }
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const map = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.pdf': 'application/pdf',
    '.m4a': 'audio/mp4',
    '.mp4': 'video/mp4',
  }
  return map[ext] || 'application/octet-stream'
}

function localDisasterImagePath(folderName) {
  const base = path.join(repoRoot, 'public', 'assets', 'for-disaster-dashboard', folderName)
  for (const name of ['Image.png', 'image.png']) {
    const p = path.join(base, name)
    if (fs.existsSync(p)) return p
  }
  return path.join(base, 'Image.png')
}

async function remediateDisaster() {
  const actions = []
  for (const [folder, slug] of DISASTER_LOCAL_TO_SLUG) {
    const canonicalImage = `resilience360/disaster-dashboard/${slug}/image.png`
    const canonicalAudio = `resilience360/disaster-dashboard/${slug}/audio.m4a`
    const localImage = localDisasterImagePath(folder)

    let imageAction = 'none'
    const imageHead = await headKey(canonicalImage)
    if (!imageHead.exists) {
      const pascal = DISASTER_PASCAL_SOURCE[slug]
      const pascalKey = pascal ? `resilience360/disaster-dashboard/${pascal}/image.png` : ''
      const kebabHead = slug.includes('-') ? await headKey(`resilience360/disaster-dashboard/${slug}/image.png`) : imageHead
      if (pascalKey) {
        const pascalHead = await headKey(pascalKey)
        if (pascalHead.exists) {
          await copyKey(pascalKey, canonicalImage)
          imageAction = `s3-copy:${pascalKey}`
        }
      }
      if (imageAction === 'none' && fs.existsSync(localImage)) {
        await uploadFile(localImage, canonicalImage, 'image/png')
        imageAction = `upload-local:${localImage}`
      }
    } else {
      imageAction = 'already-exists'
    }

    let audioAction = 'none'
    const audioHead = await headKey(canonicalAudio)
    if (!audioHead.exists) {
      const pascal = DISASTER_PASCAL_SOURCE[slug]
      if (pascal) {
        for (const audioName of ['audio.m4a', 'auio.m4a']) {
          const src = `resilience360/disaster-dashboard/${pascal}/${audioName}`
          const srcHead = await headKey(src)
          if (srcHead.exists) {
            await copyKey(src, canonicalAudio)
            audioAction = `s3-copy:${src}`
            break
          }
        }
      }
    } else {
      audioAction = 'already-exists'
    }

    actions.push({
      hazard: slug,
      localImage: fs.existsSync(localImage) ? localImage.replace(/\\/g, '/') : '',
      canonicalImage,
      canonicalAudio,
      imageAction,
      audioAction,
    })
  }
  return actions
}

async function remediatePgbc() {
  const actions = []
  for (const [rel, s3Key] of Object.entries(PGBC_EXACT_KEYS)) {
    const localPath = path.join(repoRoot, 'public', 'pgbc', rel)
    const head = await headKey(s3Key)
    let action = 'already-exists'
    if (!head.exists && fs.existsSync(localPath)) {
      await uploadFile(localPath, s3Key, 'application/pdf')
      action = `upload-local:${localPath}`
    } else if (!head.exists) {
      action = 'missing-local-and-s3'
    }
    actions.push({ rel, s3Key, localPath: fs.existsSync(localPath) ? localPath : '', action })
  }
  return actions
}

async function validateDisasterKeys() {
  const rows = []
  for (const [, slug] of DISASTER_LOCAL_TO_SLUG) {
    for (const kind of ['image.png', 'audio.m4a']) {
      const key = `resilience360/disaster-dashboard/${slug}/${kind}`
      const s3 = await headKey(key)
      const url = proxyUrl(key)
      const proxy = s3.exists ? await probeProxy(url) : { headOk: false, headStatus: 0, rangeOk: false, rangeStatus: 0, headType: '' }
      rows.push({ slug, kind, key, s3Exists: s3.exists, url, ...proxy })
    }
  }
  return rows
}

async function validatePgbcKeys() {
  const rows = []
  for (const [, s3Key] of Object.entries(PGBC_EXACT_KEYS)) {
    const s3 = await headKey(s3Key)
    const url = proxyUrl(s3Key)
    const proxy = s3.exists ? await probeProxy(url) : { headOk: false, headStatus: 0, rangeOk: false, rangeStatus: 0, headType: '' }
    const get = s3.exists
      ? await fetch(url, { headers: { Range: 'bytes=0-4095' }, redirect: 'follow' }).catch(() => null)
      : null
    rows.push({
      s3Key,
      s3Exists: s3.exists,
      url,
      ...proxy,
      getOk: Boolean(get?.ok || get?.status === 206),
      getStatus: get?.status || 0,
      getType: get?.headers?.get?.('content-type') || '',
    })
  }
  return rows
}

function mdTable(headers, rows) {
  const esc = (s) => String(s ?? '').replace(/\|/g, '\\|')
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${r.map(esc).join(' | ')} |`),
  ].join('\n')
}

async function writeDisasterRemediationPlan() {
  const rows = []
  for (const [folder, slug] of DISASTER_LOCAL_TO_SLUG) {
    const localPath = localDisasterImagePath(folder)
    const local = localPath.replace(/\\/g, '/').replace(`${repoRoot.replace(/\\/g, '/')}/`, '')
    const key = `resilience360/disaster-dashboard/${slug}/image.png`
    const audioKey = `resilience360/disaster-dashboard/${slug}/audio.m4a`
    const s3Img = await headKey(key)
    const s3Aud = await headKey(audioKey)
    const proxy = s3Img.exists ? await probeProxy(proxyUrl(key)) : { headOk: false, headStatus: 0 }
    let proxyStatus = 'missing-s3'
    if (s3Img.exists && proxy.headOk) proxyStatus = '200'
    else if (s3Img.exists && proxy.headStatus === 404) proxyStatus = '404'
    else if (s3Img.exists && proxy.headStatus === 504) proxyStatus = '504'
    else if (s3Img.exists) proxyStatus = String(proxy.headStatus || 'error')

    let action = 'verify-only'
    if (!s3Img.exists) action = 'upload-or-s3-copy-to-canonical-key'
    else if (proxyStatus === '504' || proxyStatus === '404') action = 'fix-proxy-or-duplicate-key'

    const referenced = `DisasterGuidanceMedia / templateUrls (${slug})`
    rows.push([local, key, proxyStatus, action, referenced, s3Aud.exists ? 'audio-ok' : 'audio-missing'])
  }

  const body = [
    '# Disaster Media Remediation Plan (Phase A)',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    'Production UI resolves hazard media via `resilience360/disaster-dashboard/{slug}/image.png` and `audio.m4a` (see `guidanceVideoUrls.ts`).',
    'Legacy S3 objects used **Pascal-case** folders (`Earthquake/`) while the app expects **lowercase kebab** slugs (`earthquake/`).',
    '',
    mdTable(
      ['Local path', 'Expected S3 key', 'Proxy status', 'Required action', 'Referenced by', 'Audio S3'],
      rows,
    ),
  ]
  if (SHOULD_WRITE_REPORT) {
    fs.writeFileSync(path.join(docsDir, 'DISASTER_MEDIA_REMEDIATION_PLAN.md'), body.join('\n'))
    console.info('[remediate] wrote DISASTER_MEDIA_REMEDIATION_PLAN.md')
  }
}

async function main() {
  const mode = process.argv[2] || 'all'
  if (SHOULD_WRITE_REPORT) {
    fs.mkdirSync(docsDir, { recursive: true })
  }

  if (mode === 'disaster' || mode === 'all') {
    await writeDisasterRemediationPlan()
    const actions = await remediateDisaster()
    const validation = await validateDisasterKeys()
    const lines = [
      '# Disaster Media Validation (Phase B)',
      '',
      `Generated: ${new Date().toISOString()}`,
      `API: \`${API_BASE}\``,
      '',
      '## Remediation actions',
      '',
      '```json',
      JSON.stringify(actions, null, 2),
      '```',
      '',
      '## Proxy validation',
      '',
      mdTable(
        ['Hazard', 'Asset', 'S3 key', 'S3', 'HEAD', 'Status', 'Range', 'Content-Type'],
        validation.map((r) => [
          r.slug,
          r.kind,
          r.key,
          r.s3Exists ? 'Yes' : 'No',
          r.headOk ? 'OK' : 'FAIL',
          r.headStatus,
          r.rangeOk ? 'OK' : 'FAIL',
          r.headType,
        ]),
      ),
    ]
    if (SHOULD_WRITE_REPORT) {
      fs.writeFileSync(path.join(docsDir, 'DISASTER_MEDIA_VALIDATION.md'), lines.join('\n'))
      console.info('[remediate] wrote DISASTER_MEDIA_VALIDATION.md')
    }
  }

  if (mode === 'pgbc' || mode === 'all') {
    const actions = await remediatePgbc()
    const validation = await validatePgbcKeys()
    const lines = [
      '# PGBC Media Validation (Phases C & D)',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Upload actions',
      '',
      '```json',
      JSON.stringify(actions, null, 2),
      '```',
      '',
      '## Proxy / PDF validation',
      '',
      mdTable(
        ['S3 key', 'S3', 'HEAD', 'Status', 'Range', 'GET', 'Content-Type'],
        validation.map((r) => [
          r.s3Key,
          r.s3Exists ? 'Yes' : 'No',
          r.headOk ? 'OK' : 'FAIL',
          r.headStatus,
          r.rangeOk ? 'OK' : 'FAIL',
          r.getOk ? 'OK' : 'FAIL',
          r.getType || r.headType,
        ]),
      ),
    ]
    if (SHOULD_WRITE_REPORT) {
      fs.writeFileSync(path.join(docsDir, 'PGBC_MEDIA_VALIDATION.md'), lines.join('\n'))
      console.info('[remediate] wrote PGBC_MEDIA_VALIDATION.md')
    }
  }

  if (mode === 'validate' || mode === 'all') {
    await writePlaybackReport()
  }
}

async function writePlaybackReport() {
  const learnKeys = [
    'learn-and-train/flood-barriers/video.mp4',
    'learn-and-train/monsoon-damages/video.mp4',
  ]
  const homepageKeys = ['resilience360/background/home.mp4', 'resilience360/background/home.jpg']

  const sections = []

  for (const key of homepageKeys) {
    const url = proxyUrl(key)
    const s3 = await headKey(key)
    const p = s3.exists ? await probeProxy(url) : { headOk: false, headStatus: 0, rangeOk: false, headType: '' }
    sections.push({ section: 'Homepage', key, ...p, s3Exists: s3.exists })
  }

  for (const key of learnKeys) {
    const url = proxyUrl(key)
    const s3 = await headKey(key)
    const p = s3.exists ? await probeProxy(url) : { headOk: false, headStatus: 0, rangeOk: false, headType: '' }
    sections.push({ section: 'Learn', key, ...p, s3Exists: s3.exists })
  }

  const disaster = await validateDisasterKeys()
  for (const r of disaster.filter((x) => x.kind === 'image.png')) {
    sections.push({
      section: 'Disaster Dashboard',
      key: r.key,
      s3Exists: r.s3Exists,
      headOk: r.headOk,
      headStatus: r.headStatus,
      rangeOk: r.rangeOk,
      headType: r.headType,
    })
  }

  const pgbc = await validatePgbcKeys()
  for (const r of pgbc.slice(0, 4)) {
    sections.push({
      section: 'PGBC',
      key: r.s3Key,
      s3Exists: r.s3Exists,
      headOk: r.headOk,
      headStatus: r.headStatus,
      rangeOk: r.rangeOk,
      headType: r.getType || r.headType,
    })
  }

  const lines = [
    '# Critical Media Playback Report (Phase E)',
    '',
    `Generated: ${new Date().toISOString()}`,
    `API: \`${API_BASE}\``,
    '',
    mdTable(
      ['Section', 'S3 key', 'In S3', 'HEAD', 'HTTP', 'Range', 'MIME'],
      sections.map((s) => [
        s.section,
        s.key,
        s.s3Exists ? 'Yes' : 'No',
        s.headOk ? 'OK' : 'FAIL',
        s.headStatus,
        s.rangeOk ? 'OK' : 'FAIL',
        s.headType,
      ]),
    ),
    '',
    '## Success criteria',
    '',
    '- All rows: S3 exists, HEAD 200, Range OK, correct MIME for type',
    '- Disaster: lowercase kebab keys under `resilience360/disaster-dashboard/{slug}/`',
    '- PGBC: exact `resilience360/pgbc/All Codes/...` paths used by `contentMediaResolver.js`',
  ]
  if (SHOULD_WRITE_REPORT) {
    fs.writeFileSync(path.join(docsDir, 'CRITICAL_MEDIA_PLAYBACK_REPORT.md'), lines.join('\n'))
    console.info('[remediate] wrote CRITICAL_MEDIA_PLAYBACK_REPORT.md')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


