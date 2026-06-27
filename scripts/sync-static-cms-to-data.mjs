/**
 * Sync bundled static CMS JSON (frontend/src/data/static) into data/ for Express local-first APIs.
 * Usage: node scripts/sync-static-cms-to-data.mjs
 */
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'frontend', 'src', 'data', 'static')
const DATA = path.join(ROOT, 'data')
const CMS_PAGES = path.join(DATA, 'cms', 'pages')

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function copyJson(src, dest) {
  if (!existsSync(src)) return false
  await ensureDir(path.dirname(dest))
  await fs.copyFile(src, dest)
  console.info('[sync] copied', path.relative(ROOT, dest))
  return true
}

async function writeDefault(name, data) {
  const dest = path.join(DATA, name)
  if (existsSync(dest)) return
  await ensureDir(DATA)
  await fs.writeFile(dest, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  console.info('[sync] created', path.relative(ROOT, dest))
}

async function main() {
  await ensureDir(CMS_PAGES)

  if (existsSync(SRC)) {
    const files = await fs.readdir(SRC)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      const slug = file.replace(/\.json$/, '')
      const src = path.join(SRC, file)
      if (slug === 'homepage') {
        await copyJson(src, path.join(DATA, 'homepage.json'))
      }
      await copyJson(src, path.join(CMS_PAGES, file))
      if (slug === 'retrofit') {
        try {
          const raw = JSON.parse(await fs.readFile(src, 'utf8'))
          const cms = raw?.cms && typeof raw.cms === 'object' ? raw.cms : raw
          await fs.writeFile(
            path.join(DATA, 'retrofit-cms.json'),
            `${JSON.stringify(cms, null, 2)}\n`,
            'utf8',
          )
          console.info('[sync] wrote data/retrofit-cms.json')
        } catch {
          /* ignore */
        }
      }
    }
  }

  await writeDefault('settings.json', {
    localFirst: true,
    apiPort: 10000,
    contentBase: '/content',
    mediaBase: '/static/media/local',
    cmsSource: 'data/',
  })

  await writeDefault('app-config.json', {
    name: 'Infra Resilience360',
    version: '1.0.0',
    localFirst: true,
  })

  await writeDefault('roles.json', {
    roles: [
      { id: 'public', label: 'Public' },
      { id: 'engineer', label: 'Engineer' },
      { id: 'admin', label: 'Administrator' },
    ],
  })

  await writeDefault('languages.json', {
    languages: [
      { code: 'en', label: 'English', direction: 'ltr' },
      { code: 'ur', label: 'اردو', direction: 'rtl' },
    ],
    default: 'en',
  })

  await writeDefault('module-config.json', {
    modules: [
      'retrofit-guide',
      'material-hubs',
      'building-codes',
      'best-practices',
      'learn-train',
      'disaster-dashboard',
      'live-earthquake-alerts',
      'resilience-models',
      'design-toolkit',
      'smart-construction',
      'readiness-calculator',
    ],
  })

  await writeDefault('navigation.json', {
    source: 'homepage',
    file: 'homepage.json',
  })

  await writeDefault('material-hubs.json', { hubs: [], entries: [] })

  console.info('[sync] Local CMS data ready under data/')
}

main().catch((err) => {
  console.error('[sync] failed:', err)
  process.exit(1)
})

