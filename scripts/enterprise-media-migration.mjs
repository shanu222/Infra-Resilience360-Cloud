import fs from 'node:fs/promises'
import { createReadStream, existsSync } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')
const STORAGE_ROOT = path.join(REPO_ROOT, 'storage')
const CONTENT_ROOT = path.join(STORAGE_ROOT, 'content')
const REPORT_PATH = path.join(REPO_ROOT, 'ENTERPRISE_MEDIA_MIGRATION_REPORT.md')
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
  'live-earthquake',
  'disaster-dashboard',
]

const SHARED_SUBDIRS = ['logos', 'icons', 'backgrounds', 'animations', 'ui', 'fonts']
const MEDIA_SUBDIRS = ['images', 'videos', 'pdfs', 'audio', 'thumbnails']

const EXT_TO_KIND = new Map([
  ['.png', 'images'],
  ['.jpg', 'images'],
  ['.jpeg', 'images'],
  ['.svg', 'images'],
  ['.webp', 'images'],
  ['.gif', 'images'],
  ['.ico', 'icons'],
  ['.mp4', 'videos'],
  ['.mov', 'videos'],
  ['.avi', 'videos'],
  ['.webm', 'videos'],
  ['.mp3', 'audio'],
  ['.aac', 'audio'],
  ['.wav', 'audio'],
  ['.ogg', 'audio'],
  ['.pdf', 'pdfs'],
  ['.docx', 'pdfs'],
  ['.ppt', 'pdfs'],
  ['.pptx', 'pdfs'],
  ['.zip', 'thumbnails'],
  ['.json', 'thumbnails'],
  ['.lottie', 'animations'],
  ['.glb', 'thumbnails'],
  ['.gltf', 'thumbnails'],
  ['.fbx', 'thumbnails'],
  ['.obj', 'thumbnails'],
  ['.ttf', 'fonts'],
  ['.otf', 'fonts'],
  ['.woff', 'fonts'],
  ['.woff2', 'fonts'],
])

const SCAN_EXTENSIONS = new Set([...EXT_TO_KIND.keys()])
const EXCLUDE_DIR_NAMES = new Set(['.git', 'node_modules'])
const EXCLUDE_PATH_PARTIALS = [
  '\\storage\\',
  '\\dist\\',
  '\\modules\\globalbuildingatlas\\',
  '\\modules\\ui design of live earthquake alerts\\',
]

function normalize(p) {
  return p.replace(/\\/g, '/')
}

function classifyModule(relativePath) {
  const p = normalize(relativePath).toLowerCase()
  if (p.includes('/retrofit') || p.includes('/cost-estimator')) return 'retrofit-guide'
  if (p.includes('/smart construction') || p.includes('/smart-construction')) return 'smart-construction'
  if (p.includes('/infra-model') || p.includes('/resilience-model')) return 'resilience-models'
  if (p.includes('/design-toolkit')) return 'design-toolkit'
  if (p.includes('/material-hub') || p.includes('/material hubs')) return 'material-hubs'
  if (p.includes('/building-code') || p.includes('/pgbc')) return 'building-codes'
  if (p.includes('/best-practice')) return 'best-practices'
  if (p.includes('/readiness')) return 'readiness-calculator'
  if (p.includes('/learn') || p.includes('/train')) return 'learn-train'
  if (p.includes('/earthquake')) return 'live-earthquake'
  if (p.includes('/disaster-dashboard') || p.includes('/disaster dashboard')) return 'disaster-dashboard'
  if (p.includes('/logo') || p.includes('/icon') || p.includes('/font') || p.includes('/branding') || p.includes('/background'))
    return 'shared'
  return 'home'
}

function classifyKind(relativePath) {
  const ext = path.extname(relativePath).toLowerCase()
  return EXT_TO_KIND.get(ext) ?? 'thumbnails'
}

function shouldIncludeJson(relativePath) {
  const p = `/${normalize(relativePath).toLowerCase()}/`
  if (p.includes('/content/')) return true
  if (p.includes('/data/')) return true
  if (p.includes('/frontend/src/data/static/')) return true
  return false
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

async function ensureStructure() {
  await ensureDir(CONTENT_ROOT)
  for (const moduleName of MODULES) {
    const moduleRoot = path.join(CONTENT_ROOT, moduleName)
    await ensureDir(moduleRoot)
    for (const sub of MEDIA_SUBDIRS) {
      await ensureDir(path.join(moduleRoot, sub))
    }
  }
  const sharedRoot = path.join(CONTENT_ROOT, 'shared')
  await ensureDir(sharedRoot)
  for (const sub of SHARED_SUBDIRS) {
    await ensureDir(path.join(sharedRoot, sub))
  }
  await ensureDir(path.join(STORAGE_ROOT, 'uploads'))
  await ensureDir(path.join(STORAGE_ROOT, 'data'))
  await ensureDir(path.join(STORAGE_ROOT, 'archive'))
}

async function walkFiles(rootDir) {
  const output = []
  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const absolute = path.join(currentDir, entry.name)
      const rel = path.relative(REPO_ROOT, absolute)
      const relLower = `/${normalize(rel).toLowerCase()}/`
      if (entry.isDirectory()) {
        if (EXCLUDE_DIR_NAMES.has(entry.name.toLowerCase())) continue
        if (EXCLUDE_PATH_PARTIALS.some((frag) => relLower.includes(frag.replace(/\\/g, '/')))) continue
        await walk(absolute)
        continue
      }
      const ext = path.extname(entry.name).toLowerCase()
      if (!SCAN_EXTENSIONS.has(ext)) continue
      if (ext === '.json' && !shouldIncludeJson(rel)) continue
      if (ext === '.json' && /(^|\/)(package-lock|package|tsconfig(\..*)?)\.json$/i.test(normalize(rel))) continue
      output.push({ absolute, relative: rel, ext })
    }
  }
  await walk(rootDir)
  return output
}

async function fileHash(filePath) {
  return await new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('error', reject)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

function uniqueDestPath(destDir, fileName) {
  const parsed = path.parse(fileName)
  let candidate = path.join(destDir, fileName)
  let index = 1
  while (existsSync(candidate)) {
    candidate = path.join(destDir, `${parsed.name}-${index}${parsed.ext}`)
    index += 1
  }
  return candidate
}

function createEmptyMetadata(moduleName) {
  return {
    module: moduleName,
    version: '1.0',
    images: [],
    videos: [],
    pdfs: [],
    audio: [],
    thumbnails: [],
  }
}

async function writeMetadata(metadataMap) {
  for (const [moduleName, data] of metadataMap.entries()) {
    const metadataPath = path.join(CONTENT_ROOT, moduleName, 'metadata.json')
    await fs.writeFile(metadataPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  }
  const sharedMetadataPath = path.join(CONTENT_ROOT, 'shared', 'metadata.json')
  await fs.writeFile(
    sharedMetadataPath,
    `${JSON.stringify({ module: 'shared', version: '1.0', folders: SHARED_SUBDIRS }, null, 2)}\n`,
    'utf8',
  )
}

async function main() {
  await ensureStructure()
  const scanned = await walkFiles(REPO_ROOT)

  const metadata = new Map(MODULES.map((moduleName) => [moduleName, createEmptyMetadata(moduleName)]))
  const hashToCanonical = new Map()
  const duplicates = []
  const moved = []
  const extCounts = new Map()
  const moduleCounts = new Map()
  let storageBefore = 0
  let storageAfter = 0

  for (const file of scanned) {
    const stat = await fs.stat(file.absolute)
    storageBefore += stat.size
    extCounts.set(file.ext, (extCounts.get(file.ext) ?? 0) + 1)

    const moduleName = classifyModule(file.relative)
    moduleCounts.set(moduleName, (moduleCounts.get(moduleName) ?? 0) + 1)
    const kind = classifyKind(file.relative)
    const hash = await fileHash(file.absolute)

    if (hashToCanonical.has(hash)) {
      duplicates.push({
        hash,
        duplicate: file.relative,
        canonical: hashToCanonical.get(hash),
      })
      continue
    }

    let destDir
    if (moduleName === 'shared') {
      const sharedKind =
        kind === 'images'
          ? 'ui'
          : kind === 'videos'
            ? 'animations'
            : kind === 'pdfs'
              ? 'ui'
              : kind === 'audio'
                ? 'ui'
                : kind === 'icons'
                  ? 'icons'
                  : kind === 'fonts'
                    ? 'fonts'
                    : kind === 'backgrounds'
                      ? 'backgrounds'
                      : 'ui'
      destDir = path.join(CONTENT_ROOT, 'shared', sharedKind)
    } else {
      const normalizedKind =
        kind === 'icons' || kind === 'backgrounds' || kind === 'animations' || kind === 'fonts' ? 'thumbnails' : kind
      destDir = path.join(CONTENT_ROOT, moduleName, normalizedKind)
    }

    await ensureDir(destDir)
    const destination = uniqueDestPath(destDir, path.basename(file.relative))
    if (!normalize(file.absolute).startsWith(normalize(CONTENT_ROOT))) {
      await fs.copyFile(file.absolute, destination)
    }
    hashToCanonical.set(hash, path.relative(REPO_ROOT, destination))

    const relDest = normalize(path.relative(REPO_ROOT, destination))
    storageAfter += stat.size
    moved.push({ source: file.relative, destination: relDest, hash, size: stat.size, moduleName, kind })

    if (moduleName !== 'shared') {
      const bucket = metadata.get(moduleName)
      if (bucket && Object.prototype.hasOwnProperty.call(bucket, kind)) {
        bucket[kind].push(`/${relDest}`)
      } else if (bucket) {
        bucket.thumbnails.push(`/${relDest}`)
      }
    }
  }

  for (const value of metadata.values()) {
    for (const key of ['images', 'videos', 'pdfs', 'audio', 'thumbnails']) {
      value[key] = [...new Set(value[key])].sort()
    }
  }
  await writeMetadata(metadata)

  const sortedExt = [...extCounts.entries()].sort((a, b) => b[1] - a[1])
  const sortedModules = [...moduleCounts.entries()].sort((a, b) => b[1] - a[1])
  const savedBytes = storageBefore - storageAfter

  const report = [
    '# ENTERPRISE_MEDIA_MIGRATION_REPORT',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Complete media inventory',
    '',
    `- Total scanned media files: ${scanned.length}`,
    `- Unique authoritative files copied to storage/content: ${moved.length}`,
    `- Duplicate assets detected and skipped: ${duplicates.length}`,
    '',
    '### Inventory by extension',
    ...sortedExt.map(([ext, count]) => `- ${ext}: ${count}`),
    '',
    '### Inventory by module classification',
    ...sortedModules.map(([moduleName, count]) => `- ${moduleName}: ${count}`),
    '',
    '## Duplicate assets removed',
    '',
    `- Duplicates skipped by hash: ${duplicates.length}`,
    ...duplicates.slice(0, 200).map(
      (d) => `- ${d.duplicate} -> canonical: ${d.canonical}`,
    ),
    '',
    '## Unused assets removed',
    '',
    '- No source files were deleted automatically in this run.',
    '- Remaining cleanup should move verified-unused legacy assets to `storage/archive/` after runtime reference checks.',
    '',
    '## Files migrated per module',
    ...MODULES.map((moduleName) => {
      const bucket = metadata.get(moduleName) ?? createEmptyMetadata(moduleName)
      return [
        '',
        `### ${moduleName}`,
        `- images: ${bucket.images.length}`,
        `- videos: ${bucket.videos.length}`,
        `- pdfs: ${bucket.pdfs.length}`,
        `- audio: ${bucket.audio.length}`,
        `- thumbnails: ${bucket.thumbnails.length}`,
      ].join('\n')
    }),
    '',
    '## Shared assets extracted',
    '',
    `- Shared canonical files: ${moved.filter((m) => m.moduleName === 'shared').length}`,
    '',
    '## Storage directory tree',
    '',
    '- storage/content/home/*',
    '- storage/content/retrofit-guide/*',
    '- storage/content/smart-construction/*',
    '- storage/content/resilience-models/*',
    '- storage/content/design-toolkit/*',
    '- storage/content/material-hubs/*',
    '- storage/content/building-codes/*',
    '- storage/content/best-practices/*',
    '- storage/content/readiness-calculator/*',
    '- storage/content/learn-train/*',
    '- storage/content/live-earthquake/*',
    '- storage/content/disaster-dashboard/*',
    '- storage/content/shared/{logos,icons,backgrounds,animations,ui,fonts}',
    '',
    '## Backend endpoints created',
    '',
    '- GET /api/content/modules',
    '- GET /api/content/home',
    '- GET /api/content/retrofit-guide',
    '- GET /api/content/smart-construction',
    '- GET /api/content/material-hubs',
    '- GET /api/content/resilience-models',
    '- GET /api/content/design-toolkit',
    '- GET /api/content/building-codes',
    '- GET /api/content/best-practices',
    '- GET /api/content/readiness-calculator',
    '- GET /api/content/learn-train',
    '- GET /api/content/live-earthquake',
    '- GET /api/content/disaster-dashboard',
    '',
    '## Frontend references updated',
    '',
    '- Shared logo/background references moved to `/content/shared/...` in central config files.',
    '',
    '## Android changes',
    '',
    '- Media centralized server-side. Platform clients should consume backend `/content` and `/api/content/*` only.',
    '',
    '## iOS changes',
    '',
    '- Media centralized server-side. Platform clients should consume backend `/content` and `/api/content/*` only.',
    '',
    '## Size summary',
    '',
    `- Storage size before migration scan (sum of candidate files): ${storageBefore} bytes`,
    `- Storage size after canonical copy (unique hashes): ${storageAfter} bytes`,
    `- Space saved by duplicate removal (logical): ${savedBytes} bytes`,
    '',
    '## Remaining manual tasks',
    '',
    '- Run full UI verification for each module in local dev.',
    '- Move unused legacy artifacts from old module/public directories to `storage/archive/` after zero-reference validation.',
    '- Rebuild embedded portal bundles if they still carry legacy hardcoded asset URLs.',
  ].join('\n')

  console.log(`[media-migration] scanned=${scanned.length} unique=${moved.length} duplicates=${duplicates.length}`)
  if (SHOULD_WRITE_REPORT) {
    await fs.writeFile(REPORT_PATH, `${report}\n`, 'utf8')
    console.log(`[media-migration] report=${path.relative(REPO_ROOT, REPORT_PATH)}`)
  }
}

main().catch((error) => {
  console.error('[media-migration] failed:', error)
  process.exit(1)
})
