import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let cached = null

export function loadRetrofitCmsStaticDefaults() {
  if (!cached) {
    const jsonPath = path.join(__dirname, '..', 'frontend', 'src', 'data', 'retrofitCmsStaticDefaults.json')
    cached = JSON.parse(readFileSync(jsonPath, 'utf8'))
  }
  return cached
}

export function getRetrofitCmsDefaultsForInsert() {
  return { ...loadRetrofitCmsStaticDefaults() }
}
