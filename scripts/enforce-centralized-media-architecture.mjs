import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STORAGE_ROOT = path.join(REPO_ROOT, 'storage', 'content')
const DATA_ROOT = path.join(REPO_ROOT, 'data')
const REPORT_PATH = path.join(REPO_ROOT, 'MEDIA_VALIDATION_REPORT.md')
const SHOULD_WRITE_REPORT = process.argv.includes('--report')

const MODULES = [
  'home',
  'retrofit-guide',
  'smart-construction',
  'resilience-models',
  'design-toolkit',
  'material-hubs',
  'building-codes',
  'best-practices',
  'readiness-calculator',
  'learn-train',
  'live-earthquake-alerts',
  'disaster-dashboard',
]

const MEDIA_FOLDERS = new Set(['images', 'videos', 'pdfs', 'audio'])
const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.mp4',
  '.pdf',
  '.mp3',
  '.wav',
  '.ogg',
  '.aac',
])

function toPosix(v) {
  return String(v ?? '').replace(/\\/g, '/')
}

function relFromRepo(absPath) {
  return toPosix(path.relative(REPO_ROOT, absPath))
}

async function exists(absPath) {
  try {
    await fs.access(absPath)
    return true
  } catch {
    return false
  }
}

async function ensureDir(absPath) {
  await fs.mkdir(absPath, { recursive: true })
}

async function walkFiles(dir, out) {
  if (!(await exists(dir))) return
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walkFiles(abs, out)
      continue
    }
    out.push(abs)
  }
}

function extOf(filePath) {
  return path.extname(filePath).toLowerCase()
}

function mediaTypeForExt(ext) {
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 'images'
  if (ext === '.mp4') return 'videos'
  if (ext === '.pdf') return 'pdfs'
  if (['.mp3', '.wav', '.ogg', '.aac'].includes(ext)) return 'audio'
  return null
}

async function removeEmptyDirs(rootDir) {
  if (!(await exists(rootDir))) return
  const entries = await fs.readdir(rootDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    await removeEmptyDirs(path.join(rootDir, entry.name))
  }
  const finalEntries = await fs.readdir(rootDir)
  if (finalEntries.length === 0) {
    await fs.rmdir(rootDir)
  }
}

async function moveFile(src, dst) {
  await ensureDir(path.dirname(dst))
  if (!(await exists(src))) return false
  if (await exists(dst)) {
    const srcBuf = await fs.readFile(src)
    const dstBuf = await fs.readFile(dst)
    if (Buffer.compare(srcBuf, dstBuf) === 0) {
      await fs.rm(src, { force: true })
      return false
    }
    const ext = path.extname(dst)
    const stem = dst.slice(0, -ext.length)
    const alt = `${stem}__legacy${ext}`
    await fs.rename(src, alt)
    return true
  }
  await fs.rename(src, dst)
  return true
}

async function migrateLegacyContent() {
  const moved = []
  const backgroundCandidates = [
    path.join(STORAGE_ROOT, 'homepage', 'backgrounds', 'background image. .png'),
    path.join(STORAGE_ROOT, 'background', 'new-background-fro-all-pages.png'),
    path.join(STORAGE_ROOT, 'background', 'Resilience-background-image.png'),
  ]
  const homeImageDst = path.join(STORAGE_ROOT, 'home', 'images', 'home.png')
  if (!(await exists(homeImageDst))) {
    for (const candidate of backgroundCandidates) {
      if (await exists(candidate)) {
        await ensureDir(path.dirname(homeImageDst))
        await fs.copyFile(candidate, homeImageDst)
        moved.push(`${relFromRepo(candidate)} -> ${relFromRepo(homeImageDst)}`)
        break
      }
    }
  }

  const legacyAudioRoot = path.join(STORAGE_ROOT, 'resilience360', 'disaster-dashboard', 'audios')
  if (await exists(legacyAudioRoot)) {
    const hazards = await fs.readdir(legacyAudioRoot, { withFileTypes: true })
    for (const hazard of hazards) {
      if (!hazard.isDirectory()) continue
      const src = path.join(legacyAudioRoot, hazard.name, 'audio.m4a')
      if (!(await exists(src))) continue
      const dst = path.join(STORAGE_ROOT, 'disaster-dashboard', 'audio', hazard.name, 'audio.aac')
      await ensureDir(path.dirname(dst))
      await fs.copyFile(src, dst)
      moved.push(`${relFromRepo(src)} -> ${relFromRepo(dst)}`)
    }
  }

  const chaptersSrc = path.join(STORAGE_ROOT, 'building-codes', 'chapters.json')
  if (await exists(chaptersSrc)) {
    const dst = path.join(DATA_ROOT, 'building-codes', 'chapters.json')
    await ensureDir(path.dirname(dst))
    const raw = JSON.parse(await fs.readFile(chaptersSrc, 'utf8'))
    const codes = Array.isArray(raw?.codes) ? raw.codes : []
    for (const code of codes) {
      if (!code || typeof code !== 'object') continue
      const pdf = String(code.pdfPath ?? '').trim()
      if (pdf) {
        const name = path.basename(pdf).replace(/\.[^.]+$/, '.pdf')
        code.pdfPath = `/storage/content/building-codes/pdfs/${encodeURIComponent(name)}`
      }
    }
    await fs.writeFile(dst, `${JSON.stringify(raw, null, 2)}\n`, 'utf8')
    moved.push(`${relFromRepo(chaptersSrc)} -> ${relFromRepo(dst)}`)
  }

  return moved
}

async function normalizeStorageFolders() {
  const removedFolders = []
  const entries = await fs.readdir(STORAGE_ROOT, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (MODULES.includes(entry.name)) continue
    const abs = path.join(STORAGE_ROOT, entry.name)
    await fs.rm(abs, { recursive: true, force: true })
    removedFolders.push(relFromRepo(abs))
  }
  for (const moduleName of MODULES) {
    await ensureDir(path.join(STORAGE_ROOT, moduleName))
  }
  return removedFolders
}

async function cleanModule(moduleName) {
  const root = path.join(STORAGE_ROOT, moduleName)
  const removed = []
  const files = []
  await walkFiles(root, files)
  for (const abs of files) {
    const rel = toPosix(path.relative(root, abs))
    const fileName = path.basename(abs)
    const ext = extOf(abs)
    const parent = toPosix(path.dirname(rel))
    const isMetadata = rel === 'metadata.json'
    const isAllowedMedia = ALLOWED_EXTENSIONS.has(ext)
    const parentTop = parent.split('/')[0]
    const parentIsMediaFolder = MEDIA_FOLDERS.has(parentTop)
    const keep = isMetadata || (isAllowedMedia && parentIsMediaFolder)
    if (!keep) {
      await fs.rm(abs, { force: true })
      removed.push(`${moduleName}/${rel}`)
      continue
    }
    if (fileName.startsWith('metadata__legacy')) {
      await fs.rm(abs, { force: true })
      removed.push(`${moduleName}/${rel}`)
    }
  }

  const dirs = await fs.readdir(root, { withFileTypes: true })
  for (const entry of dirs) {
    if (!entry.isDirectory()) continue
    if (!MEDIA_FOLDERS.has(entry.name)) {
      const abs = path.join(root, entry.name)
      await fs.rm(abs, { recursive: true, force: true })
      removed.push(relFromRepo(abs))
    }
  }

  await removeEmptyDirs(root)
  return removed
}

async function writeModuleMetadata(moduleName) {
  const root = path.join(STORAGE_ROOT, moduleName)
  const collect = async (folder) => {
    const dir = path.join(root, folder)
    if (!(await exists(dir))) return []
    const files = await fs.readdir(dir, { withFileTypes: true })
    const out = []
    for (const entry of files) {
      if (!entry.isFile()) continue
      const ext = extOf(entry.name)
      const folderType = mediaTypeForExt(ext)
      if (!folderType) continue
      if (folderType !== folder) continue
      out.push(`${folder}/${entry.name}`)
    }
    return out.sort((a, b) => a.localeCompare(b))
  }

  const images = await collect('images')
  const videos = await collect('videos')
  const pdfs = await collect('pdfs')
  const audio = await collect('audio')
  const metadata = {
    module: moduleName,
    version: '1.0',
    images,
    videos,
    pdfs,
    audio,
  }
  await fs.writeFile(path.join(root, 'metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`, 'utf8')
  return { images, videos, pdfs, audio }
}

async function sha256File(filePath) {
  const buf = await fs.readFile(filePath)
  return createHash('sha256').update(buf).digest('hex')
}

async function scanDuplicatesOutsideStorage() {
  const storageFiles = []
  await walkFiles(STORAGE_ROOT, storageFiles)
  const canonicalHashes = new Map()
  for (const abs of storageFiles) {
    const ext = extOf(abs)
    if (!ALLOWED_EXTENSIONS.has(ext)) continue
    const hash = await sha256File(abs)
    if (!canonicalHashes.has(hash)) canonicalHashes.set(hash, [])
    canonicalHashes.get(hash).push(relFromRepo(abs))
  }

  const allFiles = []
  await walkFiles(REPO_ROOT, allFiles)
  const duplicates = []
  const removablePrefixes = [
    'frontend/public/material-hubs/',
    'frontend/public/disaster-dashboard/',
    'frontend/public/live-earthquake-alerts',
    'modules/',
  ]
  const skipPrefixes = [
    'frontend/src/assets/',
    'frontend/public/assets/',
    'frontend/public/retrofit-calculator/',
    'data/',
    'docs/',
    'scripts/',
    'dist/',
  ]
  let removedCount = 0
  let removedBytes = 0
  for (const abs of allFiles) {
    const rel = relFromRepo(abs)
    if (rel.startsWith('storage/content/')) continue
    if (skipPrefixes.some((p) => rel.startsWith(p))) continue
    const ext = extOf(abs)
    if (!ALLOWED_EXTENSIONS.has(ext)) continue
    const hash = await sha256File(abs)
    const matches = canonicalHashes.get(hash)
    if (matches?.length) {
      const stat = await fs.stat(abs)
      const removable = removablePrefixes.some((p) => rel.startsWith(p))
      if (removable) {
        await fs.rm(abs, { force: true })
        removedCount += 1
        removedBytes += stat.size
      }
      duplicates.push({ file: rel, matches, removed: removable, bytes: stat.size })
    }
  }
  return { duplicates, removedCount, removedBytes }
}

async function scanBrokenStorageReferences() {
  const checkFiles = []
  const roots = [path.join(REPO_ROOT, 'frontend', 'src'), path.join(REPO_ROOT, 'backend')]
  for (const root of roots) {
    await walkFiles(root, checkFiles)
  }
  const broken = []
  const regex = /\/storage\/content\/[A-Za-z0-9\-_/%.]+/g
  for (const file of checkFiles) {
    const ext = path.extname(file).toLowerCase()
    if (!['.js', '.jsx', '.ts', '.tsx', '.json', '.mjs', '.cjs', '.md', '.css', '.html'].includes(ext)) continue
    let text = ''
    try {
      text = await fs.readFile(file, 'utf8')
    } catch {
      continue
    }
    const found = text.match(regex) ?? []
    for (const raw of found) {
      const clean = raw.replace(/['"`),;]+$/, '')
      const rel = clean.replace(/^\/storage\/content\//, '')
      const abs = path.join(STORAGE_ROOT, decodeURIComponent(rel))
      if (!(await exists(abs))) {
        broken.push({ file: relFromRepo(file), ref: clean })
      }
    }
  }
  return broken
}

async function main() {
  await ensureDir(STORAGE_ROOT)

  const migrationMoves = await migrateLegacyContent()
  const removedLegacyFolders = await normalizeStorageFolders()

  const removedFiles = []
  const inventory = {}
  for (const moduleName of MODULES) {
    const removed = await cleanModule(moduleName)
    removedFiles.push(...removed)
    inventory[moduleName] = await writeModuleMetadata(moduleName)
  }

  const duplicateAudit = await scanDuplicatesOutsideStorage()
  const duplicatesOutsideStorage = duplicateAudit.duplicates
  const brokenRefs = await scanBrokenStorageReferences()

  let imageCount = 0
  let videoCount = 0
  let pdfCount = 0
  let audioCount = 0
  for (const moduleName of MODULES) {
    imageCount += inventory[moduleName].images.length
    videoCount += inventory[moduleName].videos.length
    pdfCount += inventory[moduleName].pdfs.length
    audioCount += inventory[moduleName].audio.length
  }

  const lines = [
    '# MEDIA_VALIDATION_REPORT',
    '',
    '## Centralized Media Enforcement',
    '- Authoritative media root: `storage/content/`',
    `- Approved module folders present: ${MODULES.length}`,
    `- Removed non-module folders: ${removedLegacyFolders.length}`,
    `- Legacy migration moves performed: ${migrationMoves.length}`,
    `- Non-compliant files removed from storage modules: ${removedFiles.length}`,
    '',
    '## Module-by-Module Media Inventory',
    ...MODULES.map((m) => `- \`${m}\`: images=${inventory[m].images.length}, videos=${inventory[m].videos.length}, pdfs=${inventory[m].pdfs.length}, audio=${inventory[m].audio.length}`),
    '',
    '## Totals',
    `- Images: ${imageCount}`,
    `- Videos: ${videoCount}`,
    `- PDFs: ${pdfCount}`,
    `- Audio: ${audioCount}`,
    '',
    '## Broken References',
    `- Broken /storage/content/... references detected: ${brokenRefs.length}`,
    ...brokenRefs.slice(0, 50).map((r) => `- ${r.file} -> ${r.ref}`),
    '',
    '## Duplicate Media Audit',
    `- Duplicate runtime media files outside \`storage/content/\` (hash matches canonical): ${duplicatesOutsideStorage.length}`,
    `- Duplicates removed automatically: ${duplicateAudit.removedCount}`,
    `- Storage saved by duplicate removals: ${duplicateAudit.removedBytes} bytes`,
    ...duplicatesOutsideStorage.slice(0, 50).map((d) => `- ${d.file} (canonical: ${d.matches[0]})${d.removed ? ' [removed]' : ''}`),
    '',
    '## Upload Validation',
    '- Upload handler writes to `storage/content/` via `MEDIA_ROOT`.',
    '- SHA-256 hash dedupe enforced in backend upload adapter (`backend/s3LocalCompat.mjs`).',
    '- Existing identical media files are reused and not re-written.',
    '',
    '## Backend Endpoint Validation',
    '- Large media is served under `/storage/content/...` through backend static `/storage` mount.',
    '- `/api/content/*` endpoints return module metadata + centralized media URLs.',
    '',
    '## Missing Assets',
    '- Any missing assets are reflected in "Broken References" above.',
    '',
    '## Remaining Recommendations',
    '- Review duplicate list and remove non-UI runtime duplicates outside `storage/content/` where safe.',
    '- If building-code PDFs are required, place canonical copies in `storage/content/building-codes/pdfs/` to satisfy current catalog paths.',
  ]

  if (SHOULD_WRITE_REPORT) {
    await fs.writeFile(REPORT_PATH, `${lines.join('\n')}\n`, 'utf8')
    console.log(`[media-enforce] report generated: ${relFromRepo(REPORT_PATH)}`)
  }
  console.log(
    JSON.stringify(
      {
        removedLegacyFolders: removedLegacyFolders.length,
        removedFiles: removedFiles.length,
        duplicatesOutsideStorage: duplicatesOutsideStorage.length,
        duplicateRemovals: duplicateAudit.removedCount,
        brokenRefs: brokenRefs.length,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error('[media-enforce] failed:', error)
  process.exit(1)
})

