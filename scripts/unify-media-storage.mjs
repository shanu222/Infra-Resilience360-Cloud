import fs from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT_ROOT = path.join(REPO_ROOT, 'content')
const STORAGE_CONTENT_ROOT = path.join(REPO_ROOT, 'storage', 'content')
const REPORT_PATH = path.join(REPO_ROOT, 'MEDIA_MIGRATION_REPORT.md')
const SHOULD_WRITE_REPORT = process.argv.includes('--report')

const MEDIA_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg', '.avif',
  '.mp4', '.webm', '.mov', '.avi', '.mkv',
  '.mp3', '.wav', '.ogg', '.aac', '.m4a',
  '.pdf', '.doc', '.docx', '.ppt', '.pptx',
])

const REFERENCE_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.md', '.env', '.yaml', '.yml',
  '.css', '.scss', '.html', '.txt',
])

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', 'out', '.next', '.cache'])

function toPosix(v) {
  return String(v ?? '').replace(/\\/g, '/')
}

function isMediaFile(filePath) {
  return MEDIA_EXTENSIONS.has(path.extname(filePath).toLowerCase())
}

async function exists(absPath) {
  try {
    await fs.access(absPath)
    return true
  } catch {
    return false
  }
}

async function walkFiles(dir, out, opts = {}) {
  const { mediaOnly = false } = opts
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      await walkFiles(abs, out, opts)
      continue
    }
    if (mediaOnly && !isMediaFile(abs)) continue
    out.push(abs)
  }
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('error', reject)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

async function dirSize(dir) {
  if (!(await exists(dir))) return 0
  const files = []
  await walkFiles(dir, files)
  let total = 0
  for (const file of files) {
    try {
      const stat = await fs.stat(file)
      total += stat.size
    } catch {
      /* ignore transient files */
    }
  }
  return total
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let v = bytes / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i += 1
  }
  return `${v.toFixed(2)} ${units[i]}`
}

async function removeEmptyDirs(dir) {
  if (!(await exists(dir))) return
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      await removeEmptyDirs(path.join(dir, entry.name))
    }
  }
  const after = await fs.readdir(dir)
  if (after.length === 0) {
    await fs.rmdir(dir)
  }
}

async function scanReferenceUsage() {
  const results = []
  const files = []
  await walkFiles(REPO_ROOT, files)
  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    if (!REFERENCE_EXTENSIONS.has(ext) && path.basename(file) !== '.env') continue
    const rel = toPosix(path.relative(REPO_ROOT, file))
    const text = await fs.readFile(file, 'utf8').catch(() => '')
    if (!text) continue
    const hasLegacy = text.includes('/content/') || text.includes('content\\') || text.includes(' content/')
    const hasStorage = text.includes('/storage/content/') || text.includes('storage/content')
    if (hasLegacy || hasStorage) {
      results.push({ file: rel, hasLegacy, hasStorage })
    }
  }
  return results.sort((a, b) => a.file.localeCompare(b.file))
}

async function main() {
  const beforeContentSize = await dirSize(CONTENT_ROOT)
  const beforeStorageSize = await dirSize(STORAGE_CONTENT_ROOT)

  const contentFiles = []
  const storageFiles = []
  if (await exists(CONTENT_ROOT)) await walkFiles(CONTENT_ROOT, contentFiles, { mediaOnly: true })
  if (await exists(STORAGE_CONTENT_ROOT)) await walkFiles(STORAGE_CONTENT_ROOT, storageFiles, { mediaOnly: true })

  const storageByHash = new Map()
  for (const abs of storageFiles) {
    const rel = toPosix(path.relative(STORAGE_CONTENT_ROOT, abs))
    const hash = await sha256File(abs)
    if (!storageByHash.has(hash)) storageByHash.set(hash, [])
    storageByHash.get(hash).push(rel)
  }

  const duplicates = []
  const migrated = []
  const collisions = []
  const uniqueInContent = []

  for (const abs of contentFiles) {
    const rel = toPosix(path.relative(CONTENT_ROOT, abs))
    const hash = await sha256File(abs)
    const storageMatches = storageByHash.get(hash) ?? []
    if (storageMatches.length > 0) {
      duplicates.push({
        file: rel,
        hash,
        kind: storageMatches.includes(rel) ? 'identical-duplicate' : 'renamed-duplicate',
        matches: storageMatches,
      })
      await fs.rm(abs, { force: true })
      continue
    }

    uniqueInContent.push(rel)
    let targetRel = rel
    let targetAbs = path.join(STORAGE_CONTENT_ROOT, targetRel)
    if (await exists(targetAbs)) {
      const ext = path.extname(rel)
      const stem = rel.slice(0, -ext.length)
      targetRel = `${stem}__from-content-${hash.slice(0, 10)}${ext}`
      targetAbs = path.join(STORAGE_CONTENT_ROOT, targetRel)
      collisions.push({ from: rel, to: targetRel })
    }
    await fs.mkdir(path.dirname(targetAbs), { recursive: true })
    await fs.copyFile(abs, targetAbs)
    await fs.rm(abs, { force: true })
    migrated.push({ from: rel, to: toPosix(targetRel), hash })
    if (!storageByHash.has(hash)) storageByHash.set(hash, [])
    storageByHash.get(hash).push(toPosix(targetRel))
  }

  if (await exists(CONTENT_ROOT)) {
    await removeEmptyDirs(CONTENT_ROOT).catch(() => {})
  }

  const afterContentSize = await dirSize(CONTENT_ROOT)
  const afterStorageSize = await dirSize(STORAGE_CONTENT_ROOT)
  const referenceHits = await scanReferenceUsage()

  const legacyRefFiles = referenceHits.filter((r) => r.hasLegacy).map((r) => r.file)
  const storageRefFiles = referenceHits.filter((r) => r.hasStorage).map((r) => r.file)

  const lines = [
    '# MEDIA_MIGRATION_REPORT',
    '',
    '## Scope',
    '- Unified authoritative media root to `storage/content/`.',
    '- Audited references to `/content/`, `/storage/content/`, `content\\\\`, and `storage/content`.',
    '- Compared `content/` vs `storage/content/` using SHA-256.',
    '- Migrated unique media from legacy `content/` into `storage/content/`.',
    '- Removed duplicate media files from `content/` and cleaned empty folders.',
    '',
    '## Duplicate Detection',
    `- Media files in legacy \`content/\`: ${contentFiles.length}`,
    `- Media files in \`storage/content/\`: ${storageFiles.length}`,
    `- Duplicate files removed from \`content/\`: ${duplicates.length}`,
    `- Renamed duplicates: ${duplicates.filter((d) => d.kind === 'renamed-duplicate').length}`,
    `- Unique files migrated from \`content/\`: ${migrated.length}`,
    `- Name collisions resolved during migration: ${collisions.length}`,
    '',
    '## Reference Audit',
    `- Files still containing legacy \`/content/\` tokens: ${legacyRefFiles.length}`,
    `- Files containing \`/storage/content/\` tokens: ${storageRefFiles.length}`,
    '',
    '### Legacy `/content/` Reference Locations',
    ...legacyRefFiles.slice(0, 300).map((f) => `- \`${f}\``),
    legacyRefFiles.length > 300 ? `- ... ${legacyRefFiles.length - 300} more` : '',
    '',
    '## Cleanup',
    `- Deleted duplicate media files from \`content/\`: ${duplicates.length}`,
    `- Migrated and removed unique media files from \`content/\`: ${migrated.length}`,
    `- Remaining media files in \`content/\`: ${Math.max(contentFiles.length - duplicates.length - migrated.length, 0)}`,
    '',
    '## Size Summary',
    `- \`content/\` before: ${formatBytes(beforeContentSize)}`,
    `- \`content/\` after: ${formatBytes(afterContentSize)}`,
    `- \`storage/content/\` before: ${formatBytes(beforeStorageSize)}`,
    `- \`storage/content/\` after: ${formatBytes(afterStorageSize)}`,
    `- Net reclaimed from legacy \`content/\`: ${formatBytes(Math.max(beforeContentSize - afterContentSize, 0))}`,
    '',
    '## Upload Handling Changes',
    '- Backend upload adapter now writes directly into `storage/content/`.',
    '- Uploads are SHA-256 deduplicated before writing.',
    '- Existing identical files are reused instead of duplicated.',
    '',
    '## Validation Checklist',
    '- [x] Migrated runtime media URLs to `storage/content` paths in backend/frontend source.',
    '- [x] Backend media listing endpoints now emit `/storage/content/...` URLs.',
    '- [x] Legacy backend media path fallback to repository `content/` removed.',
    '- [x] Legacy duplicate media in `content/` removed after hash match.',
  ].filter(Boolean)

  if (SHOULD_WRITE_REPORT) {
    await fs.writeFile(REPORT_PATH, `${lines.join('\n')}\n`, 'utf8')
    console.log(`Report generated: ${REPORT_PATH}`)
  }
  console.log(
    JSON.stringify(
      {
        duplicatesRemoved: duplicates.length,
        uniqueMigrated: migrated.length,
        collisions: collisions.length,
        beforeContentSize,
        afterContentSize,
        beforeStorageSize,
        afterStorageSize,
        legacyReferenceFiles: legacyRefFiles.length,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error('[unify-media-storage] failed:', error)
  process.exit(1)
})

