import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const MAP_PATH = path.join(ROOT, 'storage', 'reports', 'infra-models-local-media-map.json')
const CONFIG_PATH = path.join(ROOT, 'frontend', 'src', 'config', 'infraModels.ts')

async function main() {
  const [mapRaw, configRaw] = await Promise.all([fs.readFile(MAP_PATH, 'utf8'), fs.readFile(CONFIG_PATH, 'utf8')])
  const mapping = JSON.parse(mapRaw).mapping ?? []

  let next = configRaw
    .replace("localResilience360Url('infra-models', 'model pictures')", "localResilience360Url('infra-models', 'images')")
    .replace("localResilience360Url('infra-models', 'model pdfs')", "localResilience360Url('infra-models', 'pdfs')")
    .replace(/function buildS3ObjectUrl/g, 'function buildMediaObjectUrl')
    .replace(/buildS3ObjectUrl\(/g, 'buildMediaObjectUrl(')
    .replace(/^\s*imageFileNameCandidates:\s*\[[^\]]*\],\s*$/gm, '')
    .replace(/^\s*pdfFileNameCandidates:\s*\[[^\]]*\],\s*$/gm, '')

  for (const row of mapping) {
    const fromImage = row.sourceImage
    const fromPdf = row.sourcePdf
    const toImage = row.normalizedImage
    const toPdf = row.normalizedPdf
    next = next.replace(new RegExp(fromImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), toImage)
    next = next.replace(new RegExp(fromPdf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), toPdf)
  }

  await fs.writeFile(CONFIG_PATH, next, 'utf8')
  console.log(`updated=${path.relative(ROOT, CONFIG_PATH)}`)
}

main().catch((err) => {
  console.error('[update-infra-models-config-local-media] failed:', err)
  process.exit(1)
})

