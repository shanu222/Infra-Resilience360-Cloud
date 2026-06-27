import fs from 'node:fs/promises'
import { createReadStream, existsSync } from 'node:fs'
import path from 'node:path'
import { MEDIA_ROOT, PUBLIC_DIR, REPO_ROOT } from '../config/localPaths.mjs'

const LEGACY_PUBLIC_PREFIXES = [
  { prefix: 'resilience360/pgbc/', publicSub: 'pgbc/' },
  { prefix: 'pgbc/', publicSub: 'pgbc/' },
  { prefix: 'resilience360-static/portals/material-hubs/', publicSub: 'material-hubs/' },
  { prefix: 'resilience360/portals/material-hubs/', publicSub: 'material-hubs/' },
]

function normalizeKey(rawKey) {
  return String(rawKey ?? '').trim().replace(/\\/g, '/').replace(/^\/+/, '')
}

function candidatePaths(objectKey) {
  const key = normalizeKey(objectKey)
  if (!key) return []

  const out = []
  const add = (p) => {
    if (p && !out.includes(p)) out.push(p)
  }

  add(path.join(MEDIA_ROOT, key))

  for (const rule of LEGACY_PUBLIC_PREFIXES) {
    if (key.startsWith(rule.prefix)) {
      add(path.join(PUBLIC_DIR, rule.publicSub, key.slice(rule.prefix.length)))
    }
  }

  if (key.startsWith('background/')) {
    add(path.join(MEDIA_ROOT, 'resilience360', key))
    add(path.join(PUBLIC_DIR, 'assets', 'backgrounds', path.basename(key)))
  }

  if (key.endsWith('home.mp4') || key.endsWith('home.jpg')) {
    add(path.join(PUBLIC_DIR, 'assets', 'backgrounds', path.basename(key)))
    add(path.join(PUBLIC_DIR, 'assets', 'backgrounds', 'background-video.mp4'))
    add(path.join(REPO_ROOT, 'frontend', 'src', 'assets', 'backgrounds', 'background-video.mp4'))
  }

  return out
}

export function resolveLocalMediaPath(objectKey) {
  for (const candidate of candidatePaths(objectKey)) {
    if (existsSync(candidate)) return candidate
  }
  return null
}

function guessContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const map = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.wav': 'audio/wav',
    '.json': 'application/json',
    '.geojson': 'application/geo+json',
  }
  return map[ext] ?? 'application/octet-stream'
}

export async function streamLocalMediaToResponse(objectKey, res, options = {}) {
  const filePath = resolveLocalMediaPath(objectKey)
  if (!filePath) {
    res.status(404).json({ error: 'Media not found', key: normalizeKey(objectKey) })
    return false
  }

  const stat = await fs.stat(filePath)
  const contentType = options.contentType ?? guessContentType(filePath)
  res.setHeader('Content-Type', contentType)
  res.setHeader('Accept-Ranges', 'bytes')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.setHeader('Content-Length', String(stat.size))
  createReadStream(filePath).pipe(res)
  return true
}

export function mediaKeyCandidates(rawKey) {
  const out = []
  const add = (k) => {
    const key = normalizeKey(k)
    if (key && !out.includes(key)) out.push(key)
  }

  const key = normalizeKey(rawKey)
  add(key)

  if (key.startsWith('resilience360/disaster-dashboard/')) {
    add(key.replace(/^resilience360\/disaster-dashboard\//, 'resilience360-static/disaster-dashboard/'))
  }
  if (key.startsWith('resilience360-static/disaster-dashboard/')) {
    add(key.replace(/^resilience360-static\/disaster-dashboard\//, 'resilience360/disaster-dashboard/'))
  }

  if (key.includes('/storm-cyclone/')) add(key.replace('/storm-cyclone/', '/cyclone/'))
  if (key.includes('/cyclone/')) add(key.replace('/cyclone/', '/storm-cyclone/'))

  if (/^learn-and-train\/[^/]+\/video\.mp4$/i.test(key)) {
    const slug = key.replace(/^learn-and-train\//i, '').replace(/\/video\.mp4$/i, '')
    add(`learn-and-train/${slug}.mp4`)
    add(`resilience360/learn/${slug}.mp4`)
  } else if (/^resilience360\/learn\/[^/]+\.mp4$/i.test(key)) {
    const slug = key.replace(/^resilience360\/learn\//i, '').replace(/\.mp4$/i, '')
    add(`learn-and-train/${slug}/video.mp4`)
    add(`learn-and-train/${slug}.mp4`)
  }

  if (/^home\/videos\/home\.mp4$/i.test(key)) {
    add('resilience360/background/home.mp4')
  }
  if (/^home\/images\/home\.(png|jpg|jpeg|webp)$/i.test(key)) {
    add('resilience360/background/home.jpg')
    add('resilience360/background/home.png')
  }

  if (key.startsWith('learn-train/')) {
    add(key.replace(/^learn-train\//, 'learn-and-train/'))
  }
  if (key.startsWith('learn-and-train/')) {
    add(key.replace(/^learn-and-train\//, 'learn-train/'))
  }

  if (key.startsWith('retrofit-guide/')) {
    add(key.replace(/^retrofit-guide\//, 'resilience360/retrofit-guide/'))
    add(key.replace(/^retrofit-guide\//, 'resilience360-static/retrofit-guide/'))
  }
  if (key.startsWith('smart-construction/')) {
    add(key.replace(/^smart-construction\//, 'resilience360/smart-construction/'))
    add(key.replace(/^smart-construction\//, 'resilience360-static/smart-construction/'))
  }
  if (key.startsWith('best-practices/')) {
    add(key.replace(/^best-practices\//, 'resilience360/best-practices/'))
    add(key.replace(/^best-practices\//, 'resilience360-static/best-practices/'))
  }
  if (key.startsWith('resilience-models/')) {
    add(key.replace(/^resilience-models\//, 'resilience360/resilience-models/'))
    add(key.replace(/^resilience-models\//, 'resilient-infra-models/'))
  }

  return out
}
