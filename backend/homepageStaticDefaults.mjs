/**
 * Loads the same JSON as `frontend/src/data/homepageStaticDefaults.json`.
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let cached = null

export function loadHomepageStaticDefaults() {
  if (!cached) {
    const jsonPath = path.join(__dirname, '..', 'frontend', 'src', 'data', 'homepageStaticDefaults.json')
    cached = JSON.parse(readFileSync(jsonPath, 'utf8'))
  }
  return cached
}

/** Strip non-persisted snapshot fields (API-only). */
export function getHomepageDefaultsForInsert() {
  const d = loadHomepageStaticDefaults()
  const { staticSnapshot: _s, ...rest } = d
  return rest
}
