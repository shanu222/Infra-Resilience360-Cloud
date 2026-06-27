import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const MIRROR_DIR = path.join(ROOT, 'storage', 'temp', 's3-mirror', 'resilience360')
const CONTENT_DIR = path.join(ROOT, 'content')
const DATA_IMPORTED_DIR = path.join(ROOT, 'data', 'imported', 'resilience360')
const PGBC_PUBLIC_DIR = path.join(ROOT, 'frontend', 'public', 'pgbc')
const REPORT_FILE = path.join(ROOT, 'storage', 'reports', 's3-local-migration-summary.json')

const MODULES = [
  'homepage',
  'retrofit-guide',
  'resilience-models',
  'design-toolkit',
  'smart-construction',
  'material-hubs',
  'building-codes',
  'best-practices',
  'learn',
  'disaster-dashboard',
  'live-earthquake-alerts',
]

function detectModule(relativePath) {
  const rel = relativePath.replace(/\\/g, '/').toLowerCase()
  const first = rel.split('/')[0] || ''
  const byFirst = {
    homepage: 'homepage',
    retrofit: 'retrofit-guide',
    'retrofit-guide': 'retrofit-guide',
    'infra-models': 'resilience-models',
    'resilience-models': 'resilience-models',
    'design-toolkit': 'design-toolkit',
    'smart-construction': 'smart-construction',
    'material-hubs': 'material-hubs',
    pgbc: 'building-codes',
    'building-codes': 'building-codes',
    'best-practices': 'best-practices',
    learn: 'learn',
    'learn-and-train': 'learn',
    'disaster-dashboard': 'disaster-dashboard',
    'global-watch': 'live-earthquake-alerts',
  }
  if (byFirst[first]) return byFirst[first]

  if (rel.includes('/material-hubs/')) return 'material-hubs'
  if (rel.includes('/disaster-dashboard/')) return 'disaster-dashboard'
  if (rel.includes('/infra-model')) return 'resilience-models'
  if (rel.includes('/retrofit')) return 'retrofit-guide'
  if (rel.includes('/building') || rel.includes('/pgbc/')) return 'building-codes'
  if (rel.includes('/learn')) return 'learn'
  if (rel.includes('/best-practices/')) return 'best-practices'
  return 'homepage'
}

function classifyType(ext, moduleName, fileName) {
  const e = ext.toLowerCase()
  if (['.mp4', '.mov', '.webm', '.m4v'].includes(e)) return 'videos'
  if (['.mp3', '.wav', '.m4a', '.aac', '.ogg'].includes(e)) return 'audios'
  if (e === '.pdf') return 'pdfs'
  if (['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif'].includes(e)) {
    if (moduleName === 'homepage') {
      const n = fileName.toLowerCase()
      if (n.includes('logo')) return 'logos'
      if (n.includes('icon')) return 'icons'
      if (n.includes('background')) return 'backgrounds'
    }
    return 'images'
  }
  if (e === '.geojson') return 'maps'
  if (['.csv', '.tif', '.tiff'].includes(e)) return 'datasets'
  if (e === '.json') return 'data'
  return 'files'
}

async function walk(dir) {
  const out = []
  const items = await fs.readdir(dir, { withFileTypes: true })
  for (const item of items) {
    const p = path.join(dir, item.name)
    if (item.isDirectory()) out.push(...(await walk(p)))
    else if (item.isFile()) out.push(p)
  }
  return out
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function main() {
  if (!existsSync(MIRROR_DIR)) {
    throw new Error(`S3 mirror not found: ${MIRROR_DIR}`)
  }

  const files = await walk(MIRROR_DIR)
  const summary = {
    scannedFiles: files.length,
    copiedMediaFiles: 0,
    copiedJsonFiles: 0,
    moduleCounts: Object.fromEntries(MODULES.map((m) => [m, 0])),
    missingSourceFiles: [],
  }

  const moduleFileMap = new Map(MODULES.map((m) => [m, []]))

  for (const absFile of files) {
    const rel = path.relative(MIRROR_DIR, absFile).replace(/\\/g, '/')
    const moduleName = detectModule(rel)
    const ext = path.extname(absFile)
    const baseName = path.basename(absFile)
    const kind = classifyType(ext, moduleName, baseName)

    const relParts = rel.split('/')
    const remainder = relParts.slice(1).join('/')
    const sourceTail = remainder || rel

    if (kind === 'data') {
      const dataDest = path.join(DATA_IMPORTED_DIR, rel)
      await ensureDir(path.dirname(dataDest))
      await fs.copyFile(absFile, dataDest)
      summary.copiedJsonFiles += 1
      continue
    }

    const targetBase = path.join(CONTENT_DIR, moduleName, kind)
    const targetFile = path.join(targetBase, sourceTail)
    await ensureDir(path.dirname(targetFile))
    await fs.copyFile(absFile, targetFile)

    const contentUrl = `/${path.relative(ROOT, targetFile).replace(/\\/g, '/')}`
    moduleFileMap.get(moduleName)?.push(contentUrl)
    summary.moduleCounts[moduleName] += 1
    summary.copiedMediaFiles += 1

    if (moduleName === 'building-codes' && rel.startsWith('pgbc/') && ext.toLowerCase() === '.pdf') {
      const publicPgbcDest = path.join(PGBC_PUBLIC_DIR, rel.slice('pgbc/'.length))
      await ensureDir(path.dirname(publicPgbcDest))
      await fs.copyFile(absFile, publicPgbcDest)
    }
  }

  for (const moduleName of MODULES) {
    const urls = moduleFileMap.get(moduleName) ?? []
    const byType = {
      images: urls.filter((u) => u.includes('/images/')).length,
      videos: urls.filter((u) => u.includes('/videos/')).length,
      audios: urls.filter((u) => u.includes('/audios/')).length,
      pdfs: urls.filter((u) => u.includes('/pdfs/')).length,
      maps: urls.filter((u) => u.includes('/maps/')).length,
      datasets: urls.filter((u) => u.includes('/datasets/')).length,
      files: urls.filter((u) => u.includes('/files/')).length,
      logos: urls.filter((u) => u.includes('/logos/')).length,
      icons: urls.filter((u) => u.includes('/icons/')).length,
      backgrounds: urls.filter((u) => u.includes('/backgrounds/')).length,
    }
    const meta = {
      section: moduleName,
      source: 's3-mirror-import',
      generatedAt: new Date().toISOString(),
      totalFiles: urls.length,
      byType,
      files: urls,
    }
    const metaPath = path.join(CONTENT_DIR, moduleName, 'metadata.json')
    await ensureDir(path.dirname(metaPath))
    await fs.writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8')
  }

  await ensureDir(path.dirname(REPORT_FILE))
  await fs.writeFile(REPORT_FILE, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')

  console.log(`scanned=${summary.scannedFiles}`)
  console.log(`copied_media=${summary.copiedMediaFiles}`)
  console.log(`copied_json=${summary.copiedJsonFiles}`)
  console.log(`report=${path.relative(ROOT, REPORT_FILE)}`)
}

main().catch((err) => {
  console.error('[migrate-s3-mirror-to-local] failed:', err)
  process.exit(1)
})

