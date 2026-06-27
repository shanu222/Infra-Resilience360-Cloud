/**
 * Audit local content media under public folders and emit migration mapping report.
 *
 * Usage: node scripts/generate-s3-media-migration-report.mjs
 * Output: docs/S3_MEDIA_MIGRATION_REPORT.md
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')
const SHOULD_WRITE_REPORT = process.argv.includes('--report')

const AUDIT_DIRS = [
  'public/pgbc',
  'public/material-hubs',
  'public/disaster-dashboard',
  'public/assets/pdfs',
  'public/assets/models',
  'public/assets/for-disaster-dashboard',
]

const MEDIA_EXT = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.mp4',
  '.webm',
  '.mov',
  '.m4v',
  '.m4a',
  '.mp3',
  '.wav',
  '.pdf',
])

/** @param {string} rel posix path from repo root */
function inferS3Destination(rel) {
  const p = rel.replace(/\\/g, '/').toLowerCase()
  const posix = rel.replace(/\\/g, '/')

  if (p.includes('/pgbc/') && p.endsWith('.pdf')) {
    const sub = posix.split('/pgbc/')[1]
    return `resilience360/pgbc/${sub}`
  }
  if (p.includes('/material-hubs/assets/guidance/')) {
    const file = path.basename(posix)
    const slug = file.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return `resilience360-static/portals/material-hubs/material-hubs-guidance-${slug}/${file}`
  }
  if (p.includes('/material-hubs/assets/hubs/')) {
    const file = path.basename(posix)
    const hub = file.replace(/\.[^.]+$/, '').toLowerCase()
    return `resilience360-static/portals/material-hubs/material-hubs-${hub}/${file}`
  }
  if (p.includes('/material-hubs/assets/materials/')) {
    const file = path.basename(posix)
    const id = file.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return `resilience360-static/portals/material-hubs/material-hubs-${id}/${file}`
  }
  if (p.includes('/for-disaster-dashboard/') || p.includes('/for disaster dashboard/')) {
    const parts = posix.split(/for-disaster-dashboard|for disaster dashboard/i)
    const tail = (parts[1] || '').replace(/^\/+/, '')
    const segs = tail.split('/').filter(Boolean)
    if (segs.length >= 2) {
      const folder = segs[0]
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
      const file = segs[1].toLowerCase()
      const kind = file.includes('video') ? 'video.mp4' : file.includes('audio') ? 'audio.m4a' : 'image.png'
      return `resilience360/disaster-dashboard/${folder}/${kind}`
    }
  }
  if (p.includes('/assets/pdfs/')) {
    const sub = posix.split('/assets/pdfs/')[1]
    return `resilience360/retrofit/${sub}`
  }
  if (p.includes('/assets/models/')) {
    const sub = posix.split('/assets/models/')[1]
    if (sub.toLowerCase().endsWith('.pdf')) {
      const folder = sub.split('/')[0].toLowerCase().replace(/[^a-z0-9-]+/g, '-')
      return `resilient-infra-models/${folder}/model.pdf`
    }
    return `resilience360/infra-models/${sub}`
  }
  return `resilience360-static/migrated/${posix.replace(/^public\//, '')}`
}

function inferComponent(rel) {
  const p = rel.replace(/\\/g, '/').toLowerCase()
  if (p.includes('/pgbc/')) return 'public/pgbc/script.js (PGBC portal)'
  if (p.includes('/material-hubs/')) return 'Material Hub Digital Portal'
  if (p.includes('/disaster-dashboard/') || p.includes('for-disaster-dashboard'))
    return 'Disaster Dashboard UX Flow'
  if (p.includes('/assets/pdfs/')) return 'src/App.tsx (retrofit)'
  if (p.includes('/assets/models/')) return 'src/App.tsx (infra models)'
  return 'src/utils/contentMediaResolver.ts'
}

function walk(dir, acc = []) {
  const abs = path.join(repoRoot, dir)
  if (!fs.existsSync(abs)) return acc
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name).replace(/\\/g, '/')
    const full = path.join(repoRoot, rel)
    if (entry.isDirectory()) {
      walk(rel, acc)
      continue
    }
    const ext = path.extname(entry.name).toLowerCase()
    if (!MEDIA_EXT.has(ext)) continue
  acc.push(rel)
  }
  return acc
}

function replacementUrl(s3Key) {
  const encoded = s3Key
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/')
  return `/static/media/local/${encoded}`
}

const rows = []
for (const root of AUDIT_DIRS) {
  for (const rel of walk(root)) {
    const s3 = inferS3Destination(rel)
    rows.push({
      local: rel,
      s3,
      component: inferComponent(rel),
      url: replacementUrl(s3),
    })
  }
}

rows.sort((a, b) => a.local.localeCompare(b.local))

const lines = [
  '# S3 content media migration report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  'Bucket: `pak-population-data`',
  '',
  'Roots: `resilience360/`, `resilience360-static/`',
  '',
  'Delivery: all replacement URLs use `/static/media/local/*` (same-origin proxy).',
  '',
  '| Local file | S3 destination | Component | Replacement URL |',
  '| --- | --- | --- | --- |',
]

for (const row of rows) {
  lines.push(`| \`${row.local}\` | \`${row.s3}\` | ${row.component} | \`${row.url}\` |`)
}

lines.push('')
lines.push(`Total audited media files: **${rows.length}**`)
lines.push('')
lines.push(
  'Local files are retained in the repository until S3 delivery is verified in production.',
)

const outPath = path.join(repoRoot, 'docs', 'S3_MEDIA_MIGRATION_REPORT.md')
if (SHOULD_WRITE_REPORT) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
  console.info(`Wrote ${rows.length} rows to ${outPath}`)
}


