/** Local-first media adapter with storage/content dedupe. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { MEDIA_ROOT } from './config/localPaths.mjs'

const HASH_INDEX_FILE = path.join(MEDIA_ROOT, '.hash-index.json')
const HASH_INDEX_VERSION = 1
let inMemoryHashIndex = null
let hashIndexReadyPromise = null

function toPosixPath(value) {
  return String(value ?? '').replace(/\\/g, '/')
}

function isWithinMediaRoot(absPath) {
  const root = path.resolve(MEDIA_ROOT)
  const target = path.resolve(absPath)
  const rel = path.relative(root, target)
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel)
}

async function sha256File(filePath) {
  const buf = await fs.readFile(filePath)
  return createHash('sha256').update(buf).digest('hex')
}

function sha256Buffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

async function walkFiles(dir, out) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === '.hash-index.json') continue
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walkFiles(abs, out)
      continue
    }
    out.push(abs)
  }
}

async function loadHashIndex() {
  try {
    const raw = await fs.readFile(HASH_INDEX_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    const entries = parsed && typeof parsed === 'object' ? parsed.entries : null
    if (parsed?.version === HASH_INDEX_VERSION && entries && typeof entries === 'object') {
      return entries
    }
  } catch {
    /* build fresh index */
  }
  const files = []
  await walkFiles(MEDIA_ROOT, files)
  const entries = {}
  for (const absFile of files) {
    try {
      const rel = toPosixPath(path.relative(MEDIA_ROOT, absFile))
      entries[await sha256File(absFile)] = rel
    } catch {
      /* skip unreadable files during index build */
    }
  }
  await fs.writeFile(
    HASH_INDEX_FILE,
    JSON.stringify({ version: HASH_INDEX_VERSION, generatedAt: new Date().toISOString(), entries }, null, 2),
    'utf8',
  )
  return entries
}

async function ensureHashIndex() {
  if (inMemoryHashIndex) return inMemoryHashIndex
  if (!hashIndexReadyPromise) {
    hashIndexReadyPromise = (async () => {
      await fs.mkdir(MEDIA_ROOT, { recursive: true })
      inMemoryHashIndex = await loadHashIndex()
      return inMemoryHashIndex
    })()
  }
  return hashIndexReadyPromise
}

async function persistHashIndex() {
  if (!inMemoryHashIndex) return
  await fs.writeFile(
    HASH_INDEX_FILE,
    JSON.stringify({ version: HASH_INDEX_VERSION, generatedAt: new Date().toISOString(), entries: inMemoryHashIndex }, null, 2),
    'utf8',
  )
}

export function logLocalMediaStartup() {
  console.log('[media] Local-first mode enabled (storage/content dedupe)')
}

export function isMediaUploadConfigured() {
  return true
}

export function normalizeMediaObjectKey(key) {
  try {
    const decoded = decodeURIComponent(String(key ?? '').trim())
    return decoded
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  } catch {
    return String(key ?? '')
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }
}

export function buildPublicMediaUrl(objectKey) {
  const key = normalizeMediaObjectKey(objectKey)
  const encoded = key
    .split('/')
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join('/')
  return `/storage/content/${encoded}`
}

export async function uploadBufferLocalDisabled({ key, buffer }) {
  const normalizedKey = normalizeMediaObjectKey(key)
  if (!normalizedKey) throw new Error('Missing media key.')
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new Error('Empty media buffer.')

  const hashIndex = await ensureHashIndex()
  const fileHash = sha256Buffer(buffer)
  const existingRel = String(hashIndex[fileHash] ?? '').trim()

  if (existingRel) {
    const existingAbs = path.join(MEDIA_ROOT, existingRel)
    try {
      await fs.access(existingAbs)
      return buildPublicMediaUrl(existingRel)
    } catch {
      delete hashIndex[fileHash]
    }
  }

  const targetAbs = path.join(MEDIA_ROOT, normalizedKey)
  if (!isWithinMediaRoot(targetAbs)) {
    throw new Error('Media key resolves outside storage/content.')
  }
  await fs.mkdir(path.dirname(targetAbs), { recursive: true })

  try {
    const existingHash = await sha256File(targetAbs)
    if (existingHash === fileHash) {
      hashIndex[fileHash] = toPosixPath(path.relative(MEDIA_ROOT, targetAbs))
      await persistHashIndex()
      return buildPublicMediaUrl(normalizedKey)
    }
  } catch {
    /* file absent or unreadable; proceed with write */
  }

  await fs.writeFile(targetAbs, buffer)
  hashIndex[fileHash] = toPosixPath(path.relative(MEDIA_ROOT, targetAbs))
  await persistHashIndex()
  return buildPublicMediaUrl(normalizedKey)
}

export async function deleteLocalObjectByPublicUrl() {
  return false
}
