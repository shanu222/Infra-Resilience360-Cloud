/**
 * Extract bundled public seeds from App.tsx (infra models, risk maps).
 * Output: src/data/bundled/*.json (safe — copies existing in-app defaults).
 *
 * Usage: node scripts/extract-bundled-seeds.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')
const appPath = path.join(repoRoot, 'src', 'App.tsx')
const outDir = path.join(repoRoot, 'src', 'data', 'bundled')

function extractBalancedBlock(src, startIdx, openChar, closeChar) {
  let depth = 0
  for (let i = startIdx; i < src.length; i++) {
    const ch = src[i]
    if (ch === openChar) depth++
    else if (ch === closeChar) {
      depth--
      if (depth === 0) return src.slice(startIdx, i + 1)
    }
  }
  return null
}

function extractConstValue(src, constName, openChar, closeChar) {
  const anchor = `const ${constName}`
  const i = src.indexOf(anchor)
  if (i < 0) throw new Error(`Could not find ${anchor}`)
  const eq = src.indexOf('=', i)
  const start = src.indexOf(openChar, eq)
  if (start < 0) throw new Error(`Could not find opening ${openChar} for ${constName}`)
  const block = extractBalancedBlock(src, start, openChar, closeChar)
  if (!block) throw new Error(`Unbalanced block for ${constName}`)
   
  return Function(`"use strict"; return (${block})`)()
}

function writeJson(name, data) {
  fs.mkdirSync(outDir, { recursive: true })
  const file = path.join(outDir, name)
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  console.info('wrote', path.relative(repoRoot, file))
}

function main() {
  const src = fs.readFileSync(appPath, 'utf8')
  const infraModels = extractConstValue(src, 'preloadedInfraModelSpecs', '[', ']')
  const provinceRisk = extractConstValue(src, 'provinceRisk', '{', '}')
  const districtCenters = extractConstValue(src, 'districtCenters', '{', '}')
  writeJson('infraModelSpecs.json', { models: infraModels, pdfMap: {} })
  writeJson('riskMapsSeeds.json', { provinceRisk, districtCenters })
  console.info('[extract-bundled-seeds] models:', infraModels.length)
}

main()
