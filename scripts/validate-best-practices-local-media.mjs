import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CONFIG_PATH = path.join(ROOT, 'frontend', 'src', 'config', 'bestPractices.ts')
const JSON_OUT = path.join(ROOT, 'storage', 'reports', 'best-practices-validation.json')

const BASE_HTTP = String(process.env.BP_VALIDATE_BASE_URL || 'http://localhost:10020')

function parseConfig(ts) {
  const blocks = [...ts.matchAll(/bestPracticeImage\(\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',/g)]
  return blocks.map((m) => ({
    hazard: m[1],
    id: m[2],
    title: m[3],
    folder: m[4],
    url: `/content/resilience360/best-practices/images/${m[1]}/${m[4]}/${m[4]}.jpg`,
    rel: `content/resilience360/best-practices/images/${m[1]}/${m[4]}/${m[4]}.jpg`,
  }))
}

async function httpHead(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, signal: controller.signal })
    return {
      ok: res.ok,
      status: res.status,
      contentType: res.headers.get('content-type') || '',
      servesImage: (res.headers.get('content-type') || '').startsWith('image/'),
    }
  } catch (err) {
    return { ok: false, status: 0, contentType: '', servesImage: false, error: err instanceof Error ? err.message : String(err) }
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  const ts = await fs.readFile(CONFIG_PATH, 'utf8')
  const items = parseConfig(ts)
  const checks = []

  for (const item of items) {
    const filePath = path.join(ROOT, item.rel)
    const fileExists = existsSync(filePath)
    const httpUrl = `${BASE_HTTP}${item.url}`
     
    const http = await httpHead(httpUrl)
    checks.push({ ...item, fileExists, httpStatus: http.status, contentType: http.contentType, servesImage: http.servesImage && fileExists })
  }

  const missingFiles = checks.filter((c) => !c.fileExists)
  const badResponses = checks.filter((c) => !c.servesImage)

  const summary = {
    expected: checks.length,
    fileExists: checks.filter((c) => c.fileExists).length,
    servesImage: checks.filter((c) => c.servesImage).length,
    missingFiles: missingFiles.map(({ id, folder }) => ({ id, folder })),
    badResponses: badResponses.map(({ id, status, contentType }) => ({ id, status, contentType })),
    allPass: missingFiles.length === 0 && badResponses.length === 0,
  }

  await fs.mkdir(path.dirname(JSON_OUT), { recursive: true })
  await fs.writeFile(JSON_OUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), baseHttp: BASE_HTTP, summary, checks }, null, 2)}\n`, 'utf8')

  console.log(`expected=${summary.expected}`)
  console.log(`file_exists=${summary.fileExists}`)
  console.log(`serves_image=${summary.servesImage}`)
  console.log(`all_pass=${summary.allPass ? 1 : 0}`)
  if (!summary.allPass) process.exitCode = 1
}

main().catch((err) => {
  console.error('[validate-best-practices-local-media] failed:', err)
  process.exit(1)
})
