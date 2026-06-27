/**
 * Enterprise structure cleanup — removes unused empty dirs, legacy scaffolds,
 * obsolete scripts, and duplicate assets. Run: node scripts/cleanup-enterprise-structure.mjs
 */
import fs from 'node:fs/promises'
import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const removed = {
  directories: [],
  files: [],
  scripts: [],
  reportsMoved: [],
  errors: [],
}

async function removePath(rel) {
  const abs = path.join(ROOT, rel)
  if (!existsSync(abs)) return
  try {
    rmSync(abs, { recursive: true, force: true })
    removed.directories.push(rel)
  } catch (err) {
    removed.errors.push(`${rel}: ${err.message}`)
  }
}

async function removeFile(rel) {
  const abs = path.join(ROOT, rel)
  if (!existsSync(abs)) return
  try {
    await fs.unlink(abs)
    removed.files.push(rel)
  } catch (err) {
    removed.errors.push(`${rel}: ${err.message}`)
  }
}

const EMPTY_SCAFFOLD_DIRS = [
  'public',
  'src',
  'server',
  'test-results',
  'backend/cache',
  'backend/helpers',
  'backend/jobs',
  'backend/logs',
  'backend/models',
  'backend/scripts',
  'backend/utils',
  'backend/data/notifications',
  'data/config',
  'data/languages',
  'data/material-hubs',
  'data/readiness',
  'data/roles',
  'data/settings',
  'docs/api',
  'docs/operations',
  'docs/user-guide',
  'frontend/src/app',
  'frontend/src/features',
  'frontend/src/layouts',
  'frontend/src/routes',
  'frontend/src/retrofit-calculator-portal',
  'frontend/src/smart-construction-portal',
  'frontend/src/assets/animations',
  'frontend/src/assets/fonts',
  'frontend/src/assets/icons',
  'frontend/src/assets/maps',
  'frontend/src/assets/images/banners',
  'frontend/src/modules/live-earthquake-alerts/components',
  'frontend/src/modules/live-earthquake-alerts/hooks',
  'frontend/src/modules/live-earthquake-alerts/types',
  'frontend/src/modules/live-earthquake-alerts/utils',
  'modules/GBCP Portal',
  'storage/exports',
  'storage/generated',
  'storage/temp/infra-model-downloads',
  'storage/temp/s3-mirror',
  'content/learn-train',
  'content/resilience360-static',
]

const OBSOLETE_SCRIPTS = [
  'scripts/cms-static-assets-to-s3.mjs',
  'scripts/cms-retrofit-local-media-to-s3.mjs',
  'scripts/cms-portals-smart-material-static-to-s3.mjs',
  'scripts/cms-inframodels-static-to-s3.mjs',
  'scripts/cms-inframodels-pdf-static-to-s3.mjs',
  'scripts/cms-homepage-static-to-s3.mjs',
  'scripts/cms-bestpractices-static-to-s3.mjs',
  'scripts/phase2-upload-heavy-media-to-s3.mjs',
  'scripts/sync-s3.js',
  'scripts/run-sync-s3.mjs',
  'scripts/clean-invalid-mongo-media.mjs',
  'scripts/fix-learn-train-video-urls.mjs',
  'scripts/fix-media-urls.mjs',
  'scripts/seed-disaster-dashboard-pages.mjs',
  'scripts/s3-cors-disaster-media-bucket.json',
]

async function removeDuplicateInfraModelFiles() {
  const legacyRoot = path.join(ROOT, 'content', 'resilience-models')
  for (const sub of ['images', 'pdfs', 'videos', 'audios', 'datasets', 'maps', 'files']) {
    await removePath(path.join('content', 'resilience-models', sub).replace(/\\/g, '/'))
  }
}

async function moveRootReports() {
  const archiveDir = path.join(ROOT, 'docs', 'reports', 'archive', '2026-06-final')
  await fs.mkdir(archiveDir, { recursive: true })
  const entries = await fs.readdir(ROOT, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (!entry.name.endsWith('.md')) continue
    if (entry.name === 'README.md') continue
    const src = path.join(ROOT, entry.name)
    const dest = path.join(archiveDir, entry.name)
    try {
      await fs.rename(src, dest)
      removed.reportsMoved.push(entry.name)
    } catch (err) {
      removed.errors.push(`move ${entry.name}: ${err.message}`)
    }
  }
}

async function removeStrayRootFiles() {
  const entries = await fs.readdir(ROOT, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (entry.name.startsWith('{console.error')) {
      await removeFile(entry.name)
    }
  }
}

async function main() {
  for (const dir of EMPTY_SCAFFOLD_DIRS) {
    await removePath(dir)
  }

  await removeDuplicateInfraModelFiles()

  for (const script of OBSOLETE_SCRIPTS) {
    if (existsSync(path.join(ROOT, script))) {
      await removeFile(script)
      removed.scripts.push(script)
    }
  }

  await moveRootReports()
  await removeStrayRootFiles()

  const reportPath = path.join(ROOT, 'storage', 'reports', 'enterprise-cleanup-log.json')
  await fs.mkdir(path.dirname(reportPath), { recursive: true })
  await fs.writeFile(reportPath, `${JSON.stringify(removed, null, 2)}\n`)

  console.log('[cleanup] directories removed:', removed.directories.length)
  console.log('[cleanup] files removed:', removed.files.length)
  console.log('[cleanup] scripts removed:', removed.scripts.length)
  console.log('[cleanup] reports archived:', removed.reportsMoved.length)
  if (removed.errors.length) console.warn('[cleanup] errors:', removed.errors)
}

main().catch((err) => {
  console.error('[cleanup] failed:', err)
  process.exit(1)
})
