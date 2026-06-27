/** Remove empty directories under content/ (excluding resilience360 asset trees). */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT = path.join(ROOT, 'content')

function isDirEmpty(dir) {
  if (!fs.existsSync(dir)) return false
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  if (entries.length === 0) return true
  return entries.every((e) => e.name === '.keep')
}

function pruneEmpty(start) {
  if (!fs.existsSync(start)) return []
  const removed = []
  for (const entry of fs.readdirSync(start, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const full = path.join(start, entry.name)
    removed.push(...pruneEmpty(full))
    if (isDirEmpty(full)) {
      fs.rmSync(full, { recursive: true, force: true })
      removed.push(path.relative(ROOT, full).replace(/\\/g, '/'))
    }
  }
  return removed
}

const removed = pruneEmpty(CONTENT)
console.log('[prune-empty-content] removed', removed.length, 'dirs')
for (const r of removed) console.log(' -', r)
