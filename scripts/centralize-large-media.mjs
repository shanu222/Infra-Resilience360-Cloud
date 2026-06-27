import fs from 'node:fs/promises'
import { createReadStream, existsSync } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')
const STORAGE_CONTENT_ROOT = path.join(REPO_ROOT, 'storage', 'content')
const REPORT_PATH = path.join(REPO_ROOT, 'MEDIA_CENTRALIZATION_REPORT.md')
const SHOULD_WRITE_REPORT = process.argv.includes('--report')

const MODULES = [
  'home',
  'retrofit-guide',
  'smart-construction',
  'resilience-models',
  'design-toolkit',
  'building-codes',
  'material-hubs',
  'best-practices',
  'readiness-calculator',
  'learn-train',
  'disaster-dashboard',
  'live-earthquake-alerts',
]

const FOLDERS = ['images', 'videos', 'pdfs', 'audio']

const EXTENSIONS = {
  images: new Set(['.jpg', '.jpeg', '.png', '.webp']),
  videos: new Set(['.mp4']),
  pdfs: new Set(['.pdf']),
  audio: new Set(['.mp3', '.wav', '.ogg', '.aac']),
}

const ALL_EXTENSIONS = new Set(Object.values(EXTENSIONS).flatMap((set) => [...set]))

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'storage'])

const SKIP_PATH_CONTAINS = [
  'frontend/src/assets/logos/',
  'frontend/src/assets/icons/',
  'frontend/src/assets/backgrounds/',
  'frontend/public/assets/branding/',
  'frontend/public/assets/icons/',
  'frontend/public/fonts/',
  'frontend/public/vendor/',
  'frontend/public/maps/',
  'frontend/public/pgbc/assets/',
  'modules/globalbuildingatlas/',
  'modules/ui design of live earthquake alerts/',
]

const SKIP_NAME_PATTERNS = [
  /favicon/i,
  /logo/i,
  /icon/i,
  /splash/i,
  /loader/i,
  /lottie/i,
  /background/i,
]

function normalize(p) {
  return p.replace(/\\/g, '/')
}

function moduleForPath(relativePath) {
  const p = normalize(relativePath).toLowerCase()
  if (p.includes('/retrofit')) return 'retrofit-guide'
  if (p.includes('/smart construction') || p.includes('/smart-construction')) return 'smart-construction'
  if (p.includes('/resilience-model') || p.includes('/infra-model')) return 'resilience-models'
  if (p.includes('/design-toolkit')) return 'design-toolkit'
  if (p.includes('/building-code') || p.includes('/pgbc')) return 'building-codes'
  if (p.includes('/material-hub') || p.includes('/material hubs')) return 'material-hubs'
  if (p.includes('/best-practice')) return 'best-practices'
  if (p.includes('/readiness')) return 'readiness-calculator'
  if (p.includes('/learn') || p.includes('/train')) return 'learn-train'
  if (p.includes('/disaster-dashboard') || p.includes('/disaster dashboard')) return 'disaster-dashboard'
  if (p.includes('/earthquake')) return 'live-earthquake-alerts'
  return 'home'
}

function folderForExt(ext) {
  const lower = ext.toLowerCase()
  if (EXTENSIONS.images.has(lower)) return 'images'
  if (EXTENSIONS.videos.has(lower)) return 'videos'
  if (EXTENSIONS.pdfs.has(lower)) return 'pdfs'
  if (EXTENSIONS.audio.has(lower)) return 'audio'
  return null
}

function shouldSkipFile(relativePath) {
  const n = normalize(relativePath).toLowerCase()
  if (SKIP_PATH_CONTAINS.some((frag) => n.includes(frag))) return true
  const base = path.basename(relativePath)
  if (SKIP_NAME_PATTERNS.some((pattern) => pattern.test(base))) return true
  return false
}

async function ensureLayout() {
  await fs.mkdir(STORAGE_CONTENT_ROOT, { recursive: true })
  await fs.rm(path.join(STORAGE_CONTENT_ROOT, 'shared'), { recursive: true, force: true })
  await fs.rm(path.join(STORAGE_CONTENT_ROOT, 'earthquake'), { recursive: true, force: true })
  await fs.rm(path.join(STORAGE_CONTENT_ROOT, 'live-earthquake'), { recursive: true, force: true })
  for (const moduleName of MODULES) {
    const root = path.join(STORAGE_CONTENT_ROOT, moduleName)
    await fs.rm(root, { recursive: true, force: true })
    await fs.mkdir(root, { recursive: true })
  }
}

async function walk(dir) {
  const files = []
  async function recurse(current) {
    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const absolute = path.join(current, entry.name)
      const relative = path.relative(REPO_ROOT, absolute)
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name.toLowerCase())) continue
        await recurse(absolute)
        continue
      }
      const ext = path.extname(entry.name).toLowerCase()
      if (!ALL_EXTENSIONS.has(ext)) continue
      if (shouldSkipFile(relative)) continue
      files.push({ absolute, relative, ext })
    }
  }
  await recurse(dir)
  return files
}

async function hashFile(filePath) {
  return await new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('error', reject)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

function uniquePath(dir, fileName) {
  const parsed = path.parse(fileName)
  let candidate = path.join(dir, fileName)
  let i = 1
  while (existsSync(candidate)) {
    candidate = path.join(dir, `${parsed.name}-${i}${parsed.ext}`)
    i += 1
  }
  return candidate
}

async function findBrokenReferences(items) {
  const sourceTextPaths = [
    path.join(REPO_ROOT, 'frontend'),
    path.join(REPO_ROOT, 'backend'),
    path.join(REPO_ROOT, 'modules'),
  ]
  const textFileExt = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html', '.md'])
  const textFiles = []

  async function walkText(current) {
    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const absolute = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name.toLowerCase())) continue
        await walkText(absolute)
        continue
      }
      const ext = path.extname(entry.name).toLowerCase()
      if (textFileExt.has(ext)) textFiles.push(absolute)
    }
  }

  for (const root of sourceTextPaths) {
    if (existsSync(root)) await walkText(root)
  }

  const lookup = new Map(items.map((item) => [path.basename(item.relative).toLowerCase(), 0]))
  for (const filePath of textFiles) {
    let text = ''
    try {
      text = await fs.readFile(filePath, 'utf8')
    } catch {
      continue
    }
    const lower = text.toLowerCase()
    for (const key of lookup.keys()) {
      if (lower.includes(key)) lookup.set(key, (lookup.get(key) ?? 0) + 1)
    }
  }

  return items.filter((item) => (lookup.get(path.basename(item.relative).toLowerCase()) ?? 0) === 0)
}

function metadataTemplate(moduleName) {
  return {
    module: moduleName,
    version: '1.0',
    images: [],
    videos: [],
    pdfs: [],
    audio: [],
  }
}

async function writeMetadata(metadataMap) {
  for (const moduleName of MODULES) {
    const metadata = metadataMap.get(moduleName) ?? metadataTemplate(moduleName)
    const filePath = path.join(STORAGE_CONTENT_ROOT, moduleName, 'metadata.json')
    await fs.writeFile(filePath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8')
  }
}

async function pruneEmptyMediaFolders() {
  for (const moduleName of MODULES) {
    const moduleRoot = path.join(STORAGE_CONTENT_ROOT, moduleName)
    for (const folder of FOLDERS) {
      const folderPath = path.join(moduleRoot, folder)
      if (!existsSync(folderPath)) continue
      const entries = await fs.readdir(folderPath)
      if (entries.length === 0) {
        await fs.rm(folderPath, { recursive: true, force: true })
      }
    }
  }
}

async function mergeLegacyEarthquakeFolder() {
  const legacyRoots = [
    path.join(STORAGE_CONTENT_ROOT, 'earthquake'),
    path.join(STORAGE_CONTENT_ROOT, 'live-earthquake'),
  ]
  const canonicalRoot = path.join(STORAGE_CONTENT_ROOT, 'live-earthquake-alerts')

  async function moveTree(current) {
    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const absolute = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await moveTree(absolute)
        continue
      }
      const ext = path.extname(entry.name).toLowerCase()
      const folder = folderForExt(ext)
      if (!folder) continue
      const targetDir = path.join(canonicalRoot, folder)
      await fs.mkdir(targetDir, { recursive: true })
      const target = uniquePath(targetDir, entry.name)
      await fs.copyFile(absolute, target)
    }
  }

  for (const legacyRoot of legacyRoots) {
    if (!existsSync(legacyRoot)) continue
    await moveTree(legacyRoot)
    await fs.rm(legacyRoot, { recursive: true, force: true })
  }
}

function sizeLabel(bytes) {
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}

async function main() {
  const inventory = await walk(REPO_ROOT)
  const brokenCandidates = await findBrokenReferences(inventory)

  const sizeByPath = new Map()
  for (const item of inventory) {
    const stat = await fs.stat(item.absolute)
    sizeByPath.set(item.absolute, stat.size)
  }

  const nameMap = new Map()
  for (const item of inventory) {
    const key = path.basename(item.relative).toLowerCase()
    if (!nameMap.has(key)) nameMap.set(key, [])
    nameMap.get(key).push(item)
  }
  const duplicateNames = [...nameMap.entries()].filter(([, entries]) => entries.length > 1)

  await ensureLayout()
  await mergeLegacyEarthquakeFolder()

  const hashMap = new Map()
  const moved = []
  const duplicatesByHash = []
  const metadata = new Map(MODULES.map((moduleName) => [moduleName, metadataTemplate(moduleName)]))

  for (const item of inventory) {
    const hash = await hashFile(item.absolute)
    const statSize = sizeByPath.get(item.absolute) ?? 0
    if (hashMap.has(hash)) {
      const existing = hashMap.get(hash)
      duplicatesByHash.push({
        duplicate: item.relative,
        canonical: existing.relative,
      })
      continue
    }

    const moduleName = moduleForPath(item.relative)
    const folder = folderForExt(item.ext)
    if (!folder || !MODULES.includes(moduleName)) continue

    const targetDir = path.join(STORAGE_CONTENT_ROOT, moduleName, folder)
    await fs.mkdir(targetDir, { recursive: true })
    const destination = uniquePath(targetDir, path.basename(item.relative))
    await fs.copyFile(item.absolute, destination)

    const stored = {
      relative: normalize(path.relative(REPO_ROOT, destination)),
      source: item.relative,
      moduleName,
      folder,
      size: statSize,
      hash,
    }
    hashMap.set(hash, stored)
    moved.push(stored)

    const moduleMeta = metadata.get(moduleName)
    moduleMeta[folder].push(`/${stored.relative}`)
  }

  for (const moduleName of MODULES) {
    const moduleMeta = metadata.get(moduleName)
    moduleMeta.images.sort()
    moduleMeta.videos.sort()
    moduleMeta.pdfs.sort()
    moduleMeta.audio.sort()
  }
  await writeMetadata(metadata)
  await pruneEmptyMediaFolders()

  const movedByModule = new Map()
  for (const file of moved) {
    if (!movedByModule.has(file.moduleName)) movedByModule.set(file.moduleName, [])
    movedByModule.get(file.moduleName).push(file)
  }

  const totalImages = moved.filter((m) => m.folder === 'images').length
  const totalVideos = moved.filter((m) => m.folder === 'videos').length
  const totalPdfs = moved.filter((m) => m.folder === 'pdfs').length
  const totalAudio = moved.filter((m) => m.folder === 'audio').length

  const totalBeforeBytes = inventory.reduce((sum, item) => sum + (sizeByPath.get(item.absolute) ?? 0), 0)
  const totalAfterBytes = moved.reduce((sum, item) => sum + item.size, 0)

  const reportLines = [
    '# MEDIA_CENTRALIZATION_REPORT',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Media inventory',
    `- Total inventory files (images/videos/pdfs/audio): ${inventory.length}`,
    `- Potential broken references (filename not found in code text scan): ${brokenCandidates.length}`,
    '',
    '## Files moved',
    `- Unique files centralized into storage/content: ${moved.length}`,
    `- Total images: ${totalImages}`,
    `- Total videos: ${totalVideos}`,
    `- Total PDFs: ${totalPdfs}`,
    `- Total audio files: ${totalAudio}`,
    '',
    '## Duplicate files',
    `- Duplicate filename groups detected: ${duplicateNames.length}`,
    `- Duplicate content files (by hash) skipped: ${duplicatesByHash.length}`,
    ...duplicatesByHash.slice(0, 150).map((entry) => `- ${entry.duplicate} -> canonical ${entry.canonical}`),
    '',
    '## Unused media deleted',
    '- No source media files were deleted automatically in this run.',
    '- Dead-source cleanup should be done after runtime validation and reference confirmation.',
    '',
    '## Module-wise statistics',
    ...MODULES.map((moduleName) => {
      const entries = movedByModule.get(moduleName) ?? []
      const images = entries.filter((e) => e.folder === 'images').length
      const videos = entries.filter((e) => e.folder === 'videos').length
      const pdfs = entries.filter((e) => e.folder === 'pdfs').length
      const audio = entries.filter((e) => e.folder === 'audio').length
      return `- ${moduleName}: images=${images}, videos=${videos}, pdfs=${pdfs}, audio=${audio}`
    }),
    '',
    '## Directory tree',
    ...MODULES.map((moduleName) => {
      const entries = movedByModule.get(moduleName) ?? []
      const types = [
        entries.some((e) => e.folder === 'images') ? 'images' : null,
        entries.some((e) => e.folder === 'videos') ? 'videos' : null,
        entries.some((e) => e.folder === 'pdfs') ? 'pdfs' : null,
        entries.some((e) => e.folder === 'audio') ? 'audio' : null,
      ].filter(Boolean)
      const suffix = types.length > 0 ? `{${types.join(',')},metadata.json}` : '{metadata.json}'
      return `- storage/content/${moduleName}/${suffix}`
    }),
    '',
    '## Size summary',
    `- Storage size before migration candidate set: ${totalBeforeBytes} bytes (${sizeLabel(totalBeforeBytes)})`,
    `- Storage size after centralization (unique files): ${totalAfterBytes} bytes (${sizeLabel(totalAfterBytes)})`,
    `- Space saved by duplicate removal: ${totalBeforeBytes - totalAfterBytes} bytes (${sizeLabel(totalBeforeBytes - totalAfterBytes)})`,
    '',
    '## Remaining issues',
    '- Some module/runtime references may still point to legacy public/content mirrors and should be normalized gradually.',
    '- Legacy duplicate source files remain in place to avoid runtime breakage and require staged removal after module-by-module QA.',
  ]

  console.log(`[media-centralize] inventory=${inventory.length} moved=${moved.length} hashDuplicates=${duplicatesByHash.length}`)
  if (SHOULD_WRITE_REPORT) {
    await fs.writeFile(REPORT_PATH, `${reportLines.join('\n')}\n`, 'utf8')
    console.log(`[media-centralize] report=${path.relative(REPO_ROOT, REPORT_PATH)}`)
  }
}

main().catch((error) => {
  console.error('[media-centralize] failed:', error)
  process.exit(1)
})
