import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STORAGE_ROOT = path.join(REPO_ROOT, 'storage', 'content')

function normalizePath(value, moduleKey) {
  const raw = String(value ?? '').trim().replace(/\\/g, '/')
  if (!raw) return ''
  const prefix = `/storage/content/${moduleKey}/`
  if (raw.startsWith(prefix)) return raw.slice(prefix.length)
  if (raw.startsWith(`${moduleKey}/`)) return raw.slice(moduleKey.length + 1)
  if (raw.startsWith('/')) return raw.replace(/^\/+/, '')
  return raw
}

async function run() {
  const entries = await fs.readdir(STORAGE_ROOT, { withFileTypes: true })
  let updated = 0
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const moduleKey = entry.name
    const file = path.join(STORAGE_ROOT, moduleKey, 'metadata.json')
    try {
      const raw = JSON.parse(await fs.readFile(file, 'utf8'))
      const next = raw && typeof raw === 'object' ? { ...raw } : { module: moduleKey }
      for (const key of ['images', 'videos', 'pdfs', 'audio']) {
        const list = Array.isArray(next[key]) ? next[key] : []
        next[key] = list.map((v) => normalizePath(v, moduleKey)).filter(Boolean)
      }
      if (Array.isArray(next.models)) {
        next.models = next.models.map((model) => {
          const row = model && typeof model === 'object' ? { ...model } : {}
          if (row.image) row.image = normalizePath(row.image, moduleKey)
          if (row.pdf) row.pdf = normalizePath(row.pdf, moduleKey)
          return row
        })
      }
      await fs.writeFile(file, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
      updated += 1
    } catch {
      /* ignore modules without metadata */
    }
  }
  console.log(JSON.stringify({ updated }, null, 2))
}

run().catch((error) => {
  console.error('[normalize-metadata-relative-paths] failed', error)
  process.exit(1)
})

