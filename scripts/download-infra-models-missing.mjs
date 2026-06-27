import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const BUCKET = 's3://pak-population-data'
const INPUT_JSON = path.join(ROOT, 'storage', 'reports', 'infra-models-missing-assets.json')
const OUTPUT_MD = path.join(ROOT, 'INFRA_MODELS_DOWNLOAD_REPORT.md')
const SHOULD_WRITE_REPORT = process.argv.includes('--report')
const TMP_ROOT = path.join(ROOT, 'storage', 'temp', 'infra-model-downloads')
const TARGET_BASE = path.join(ROOT, 'content', 'resilience360', 'infra-models')

const EXT_TO_KIND = new Map([
  ['.jpg', 'images'],
  ['.jpeg', 'images'],
  ['.png', 'images'],
  ['.webp', 'images'],
  ['.gif', 'images'],
  ['.svg', 'images'],
  ['.pdf', 'pdfs'],
  ['.mp4', 'videos'],
  ['.webm', 'videos'],
  ['.mov', 'videos'],
  ['.m4v', 'videos'],
  ['.mp3', 'audios'],
  ['.wav', 'audios'],
  ['.m4a', 'audios'],
  ['.aac', 'audios'],
  ['.ogg', 'audios'],
])

function norm(v) {
  return String(v ?? '').replace(/\\/g, '/').replace(/^\/+/, '')
}

function mediaKindFromName(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  return EXT_TO_KIND.get(ext) || 'files'
}

function buildTargetPath(fileName, kind) {
  return path.join(TARGET_BASE, kind, fileName)
}

function candidateKeys(originalKey) {
  const key = norm(originalKey)
  const out = [key]
  const add = (v) => {
    if (v && !out.includes(v)) out.push(v)
  }
  add(key.replace('/images/model pictures/', '/model pictures/'))
  add(key.replace('/pdfs/model pdfs/', '/model pdfs/'))
  add(key.replace('/videos/', '/'))
  add(key.replace('/files/', '/'))
  return out
}

async function runAwsCp(s3Key, destPath) {
  await fs.mkdir(path.dirname(destPath), { recursive: true })
  return new Promise((resolve) => {
    const child = spawn('aws', ['s3', 'cp', `${BUCKET}/${s3Key}`, destPath, '--only-show-errors'], {
      cwd: ROOT,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stderr = ''
    child.stderr.on('data', (d) => { stderr += d.toString() })
    child.on('close', (code) => resolve({ ok: code === 0, stderr: stderr.trim(), code }))
  })
}

async function main() {
  const input = JSON.parse(await fs.readFile(INPUT_JSON, 'utf8'))
  const missing = Array.isArray(input?.missing) ? input.missing : []

  const byTarget = new Map()
  for (const item of missing) {
    const key = norm(item?.key)
    const fileName = path.basename(key)
    const kind = mediaKindFromName(fileName)
    if (!['images', 'pdfs', 'videos', 'audios'].includes(kind)) continue
    const targetPath = buildTargetPath(fileName, kind)
    if (!byTarget.has(targetPath)) byTarget.set(targetPath, { fileName, kind, targetPath, keys: [] })
    const row = byTarget.get(targetPath)
    for (const k of candidateKeys(key)) if (!row.keys.includes(k)) row.keys.push(k)
  }

  await fs.mkdir(TMP_ROOT, { recursive: true })

  const downloaded = []
  const skipped = []
  const failed = []

  for (const item of byTarget.values()) {
    if (existsSync(item.targetPath)) {
      skipped.push({ ...item, reason: 'already_exists' })
      continue
    }

    const tmpPath = path.join(TMP_ROOT, `${Date.now()}-${item.fileName}`)
    let success = false
    let usedKey = ''
    let lastError = ''

    for (const s3Key of item.keys) {
      for (let attempt = 1; attempt <= 3; attempt += 1) {
         
        const res = await runAwsCp(s3Key, tmpPath)
        if (res.ok) {
          success = true
          usedKey = s3Key
          break
        }
        lastError = `${s3Key} (attempt ${attempt}): ${res.stderr || `exit ${res.code}`}`
      }
      if (success) break
    }

    if (!success) {
      failed.push({ ...item, error: lastError })
      continue
    }

    await fs.mkdir(path.dirname(item.targetPath), { recursive: true })
    await fs.rename(tmpPath, item.targetPath)
    downloaded.push({ ...item, s3Key: usedKey })
  }

  const md = [
    '# INFRA_MODELS_DOWNLOAD_REPORT',
    '',
    '- Module: Resilience Infra Models',
    '- Source bucket: `s3://pak-population-data`',
    '- Target root: `content/resilience360/infra-models/`',
    `- Unique missing targets from audit: ${byTarget.size}`,
    `- Downloaded: ${downloaded.length}`,
    `- Skipped (already local): ${skipped.length}`,
    `- Failed: ${failed.length}`,
    '',
    '## Downloaded',
    '',
    '| Type | File | S3 Key Used | Target |',
    '|---|---|---|---|',
    ...downloaded.map((r) => `| ${r.kind} | \`${r.fileName}\` | \`${r.s3Key}\` | \`${norm(path.relative(ROOT, r.targetPath))}\` |`),
    '',
    '## Skipped',
    '',
    '| Type | File | Reason | Target |',
    '|---|---|---|---|',
    ...skipped.map((r) => `| ${r.kind} | \`${r.fileName}\` | ${r.reason} | \`${norm(path.relative(ROOT, r.targetPath))}\` |`),
    '',
    '## Failed',
    '',
    '| Type | File | Error | Target |',
    '|---|---|---|---|',
    ...failed.map((r) => `| ${r.kind} | \`${r.fileName}\` | ${String(r.error || '').replace(/\|/g, '\\|')} | \`${norm(path.relative(ROOT, r.targetPath))}\` |`),
    '',
  ].join('\n')

  if (SHOULD_WRITE_REPORT) {
    await fs.writeFile(OUTPUT_MD, `${md}\n`, 'utf8')
  }

  console.log(`targets=${byTarget.size}`)
  console.log(`downloaded=${downloaded.length}`)
  console.log(`skipped=${skipped.length}`)
  console.log(`failed=${failed.length}`)
  if (SHOULD_WRITE_REPORT) {
    console.log(`report=${path.relative(ROOT, OUTPUT_MD)}`)
  }
}

main().catch((err) => {
  console.error('[download-infra-models-missing] failed:', err)
  process.exit(1)
})

