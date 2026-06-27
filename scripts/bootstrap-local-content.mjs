/**
 * Bootstrap content/, storage/, and data/ for offline-first operation.
 * Creates only directories each module actually uses — no empty media placeholders.
 */
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CONTENT = path.join(ROOT, 'content')
const STORAGE = path.join(ROOT, 'storage')
const PUBLIC = path.join(ROOT, 'frontend', 'public')
const SRC_ASSETS = path.join(ROOT, 'frontend', 'src', 'assets')

/** Module path (under content/) → subfolders to ensure exist when bootstrapping. */
const MODULE_LAYOUT = {
  'best-practices': ['images', 'videos'],
  learn: ['videos'],
  'live-earthquake-alerts': ['feeds', 'cache'],
  'resilience360/best-practices': ['images'],
  'resilience360/infra-models': ['images', 'pdfs', 'videos'],
  'resilience360/disaster-dashboard': ['images', 'videos', 'audios'],
  'resilience360/background': [],
  homepage: [],
  'material-hubs': [],
  'building-codes': [],
  'design-toolkit': [],
  'disaster-dashboard': [],
  'readiness-calculator': [],
  'retrofit-guide': [],
  'smart-construction': [],
  'resilience-models': [],
}

const METADATA_STUBS = [
  'best-practices',
  'learn',
  'live-earthquake-alerts',
  'material-hubs',
  'building-codes',
  'design-toolkit',
  'disaster-dashboard',
  'readiness-calculator',
  'retrofit-guide',
  'smart-construction',
  'resilience-models',
  'homepage',
]

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function copyIfExists(src, dest) {
  if (!existsSync(src)) return false
  await ensureDir(path.dirname(dest))
  await fs.copyFile(src, dest)
  return true
}

async function bootstrapContentTree() {
  await ensureDir(CONTENT)

  for (const [modulePath, subfolders] of Object.entries(MODULE_LAYOUT)) {
    const base = path.join(CONTENT, ...modulePath.split('/'))
    await ensureDir(base)
    for (const sub of subfolders) {
      await ensureDir(path.join(base, sub))
    }
  }

  for (const section of METADATA_STUBS) {
    const metaPath = path.join(CONTENT, section, 'metadata.json')
    if (!existsSync(metaPath)) {
      await ensureDir(path.dirname(metaPath))
      await fs.writeFile(
        metaPath,
        `${JSON.stringify({ section, version: 1, source: 'local' }, null, 2)}\n`,
      )
    }
  }

  const bgCandidates = [
    path.join(SRC_ASSETS, 'backgrounds', 'background-video.mp4'),
    path.join(PUBLIC, 'assets', 'backgrounds', 'background-video.mp4'),
  ]
  const bgVideo = bgCandidates.find((p) => existsSync(p))
  if (bgVideo) {
    await copyIfExists(bgVideo, path.join(CONTENT, 'resilience360', 'background', 'home.mp4'))
    await copyIfExists(bgVideo, path.join(CONTENT, 'background', 'home.mp4'))
  }
}

async function bootstrapStorage() {
  for (const sub of ['uploads', 'reports', 'temp']) {
    await ensureDir(path.join(STORAGE, sub))
  }
}

async function main() {
  await bootstrapContentTree()
  await bootstrapStorage()
  console.log('[bootstrap] content/ and storage/ ready (module-specific layout only)')
}

main().catch((err) => {
  console.error('[bootstrap] failed:', err)
  process.exit(1)
})
