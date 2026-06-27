import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CONFIG_PATH = path.join(ROOT, 'frontend', 'src', 'config', 'infraModels.ts')
const JSON_OUT = path.join(ROOT, 'storage', 'reports', 'infra-models-validation.json')

const BASE_HTTP = String(process.env.INFRA_VALIDATE_BASE_URL || 'http://localhost:10000')

function parseModels(ts) {
  const blocks = [...ts.matchAll(/modelEntry\(\{([\s\S]*?)\}\)/g)].map((m) => m[1])
  return blocks.map((b) => ({
    id: b.match(/id:\s*'([^']+)'/)?.[1] ?? '',
    title: b.match(/title:\s*'([^']+)'/)?.[1] ?? '',
    imageFileName: b.match(/imageFileName:\s*'([^']+)'/)?.[1] ?? '',
    pdfFileName: b.match(/pdfFileName:\s*'([^']+)'/)?.[1] ?? '',
  }))
}

async function httpStatus(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal })
    return { ok: res.ok, status: res.status, contentType: res.headers.get('content-type') || '' }
  } catch (err) {
    return { ok: false, status: 0, contentType: '', error: err instanceof Error ? err.message : String(err) }
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  const ts = await fs.readFile(CONFIG_PATH, 'utf8')
  const models = parseModels(ts)

  const rows = []
  for (const model of models) {
    const imageRel = `content/resilience360/infra-models/images/${model.imageFileName}`
    const pdfRel = `content/resilience360/infra-models/pdfs/${model.pdfFileName}`
    const imagePath = path.join(ROOT, imageRel)
    const pdfPath = path.join(ROOT, pdfRel)

    const imageUrl = `${BASE_HTTP}/content/resilience360/infra-models/images/${encodeURIComponent(model.imageFileName)}`
    const pdfUrl = `${BASE_HTTP}/content/resilience360/infra-models/pdfs/${encodeURIComponent(model.pdfFileName)}`

     
    const imageHttp = await httpStatus(imageUrl)
     
    const pdfHttp = await httpStatus(pdfUrl)

    rows.push({
      id: model.id,
      title: model.title,
      image: {
        path: imageRel,
        exists: existsSync(imagePath),
        url: imageUrl,
        http: imageHttp,
      },
      pdf: {
        path: pdfRel,
        exists: existsSync(pdfPath),
        url: pdfUrl,
        http: pdfHttp,
      },
    })
  }

  const videoRel = 'content/resilience360/infra-models/videos/official-video.mp4'
  const videoUrl = `${BASE_HTTP}/content/resilience360/infra-models/videos/official-video.mp4`
  const videoPath = path.join(ROOT, videoRel)
  const videoHttp = await httpStatus(videoUrl)

  const summary = {
    totalModels: rows.length,
    imageExists: rows.filter((r) => r.image.exists).length,
    pdfExists: rows.filter((r) => r.pdf.exists).length,
    imageHttpOk: rows.filter((r) => r.image.http.ok).length,
    pdfHttpOk: rows.filter((r) => r.pdf.http.ok).length,
    videoExists: existsSync(videoPath),
    videoHttpOk: videoHttp.ok,
    allPass:
      rows.every((r) => r.image.exists && r.pdf.exists && r.image.http.ok && r.pdf.http.ok) &&
      existsSync(videoPath) &&
      videoHttp.ok,
  }

  await fs.mkdir(path.dirname(JSON_OUT), { recursive: true })
  await fs.writeFile(
    JSON_OUT,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseHttp: BASE_HTTP,
        summary,
        rows,
        video: { path: videoRel, exists: existsSync(videoPath), url: videoUrl, http: videoHttp },
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  console.log(`models=${summary.totalModels}`)
  console.log(`image_exists=${summary.imageExists}`)
  console.log(`pdf_exists=${summary.pdfExists}`)
  console.log(`image_http_ok=${summary.imageHttpOk}`)
  console.log(`pdf_http_ok=${summary.pdfHttpOk}`)
  console.log(`video_exists=${summary.videoExists ? 1 : 0}`)
  console.log(`video_http_ok=${summary.videoHttpOk ? 1 : 0}`)
  console.log(`all_pass=${summary.allPass ? 1 : 0}`)
}

main().catch((err) => {
  console.error('[validate-infra-models-local-media] failed:', err)
  process.exit(1)
})

