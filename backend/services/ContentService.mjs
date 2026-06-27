import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { DATA_DIR, MEDIA_ROOT } from '../config/localPaths.mjs'
import { readJsonFile } from './JsonDatabase.mjs'
import { mapStorageContentToPublicMediaUrl } from './localUrlRewrite.mjs'

const MODULE_KEYS = [
  'home',
  'retrofit-guide',
  'smart-construction',
  'resilience-models',
  'design-toolkit',
  'material-hubs',
  'building-codes',
  'best-practices',
  'readiness-calculator',
  'learn-train',
  'live-earthquake-alerts',
  'disaster-dashboard',
]

const MODULE_ALIASES = {
  learn: 'learn-train',
  'learn-train': 'learn-train',
  earthquake: 'live-earthquake-alerts',
  'live-earthquake': 'live-earthquake-alerts',
  'live-earthquake-alerts': 'live-earthquake-alerts',
}

const ALL_MODULE_KEYS = [...new Set([...MODULE_KEYS, ...Object.keys(MODULE_ALIASES)])]

const FOLDER_ALIASES = {
  audio: 'audio',
  audios: 'audio',
  images: 'images',
  videos: 'videos',
  pdfs: 'pdfs',
}

function resolveModuleKey(moduleKey) {
  const key = String(moduleKey ?? '').trim().toLowerCase()
  return MODULE_ALIASES[key] ?? key
}

function normalizeMetadataMediaPath(value, moduleKey) {
  const raw = String(value ?? '').trim().replace(/\\/g, '/')
  if (!raw) return ''
  const storagePrefix = `/storage/content/${moduleKey}/`
  if (raw.startsWith(storagePrefix)) return raw.slice(storagePrefix.length)
  if (raw.startsWith(`${moduleKey}/`)) return raw.slice(moduleKey.length + 1)
  if (raw.startsWith('/')) return raw.replace(/^\/+/, '')
  return raw
}

function toPublicMediaPath(value, moduleKey) {
  const rel = normalizeMetadataMediaPath(value, moduleKey)
  if (!rel) return ''
  return mapStorageContentToPublicMediaUrl(`/storage/content/${moduleKey}/${rel}`)
}

function normalizeMetadataShape(raw, moduleKey) {
  const base = raw && typeof raw === 'object' ? { ...raw } : { module: moduleKey }
  const folders = ['images', 'videos', 'pdfs', 'audio']
  for (const folder of folders) {
    const list = Array.isArray(base[folder]) ? base[folder] : []
    base[folder] = list.map((item) => normalizeMetadataMediaPath(item, moduleKey)).filter(Boolean)
  }
  if (Array.isArray(base.models)) {
    base.models = base.models.map((model) => {
      const row = model && typeof model === 'object' ? { ...model } : {}
      if (row.image) row.image = normalizeMetadataMediaPath(row.image, moduleKey)
      if (row.pdf) row.pdf = normalizeMetadataMediaPath(row.pdf, moduleKey)
      return row
    })
  }
  return base
}

function toPublicMetadataShape(raw, moduleKey) {
  const base = raw && typeof raw === 'object' ? { ...raw } : { module: moduleKey }
  const folders = ['images', 'videos', 'pdfs', 'audio']
  for (const folder of folders) {
    const list = Array.isArray(base[folder]) ? base[folder] : []
    base[folder] = list.map((item) => toPublicMediaPath(item, moduleKey)).filter(Boolean)
  }
  if (Array.isArray(base.models)) {
    base.models = base.models.map((model) => {
      const row = model && typeof model === 'object' ? { ...model } : {}
      if (row.image) row.image = toPublicMediaPath(row.image, moduleKey)
      if (row.pdf) row.pdf = toPublicMediaPath(row.pdf, moduleKey)
      return row
    })
  }
  return base
}

async function readMetadata(moduleKey) {
  const resolved = resolveModuleKey(moduleKey)
  const filePath = path.join(MEDIA_ROOT, resolved, 'metadata.json')
  const data = await readJsonFile(filePath, null)
  const normalized = normalizeMetadataShape(data ?? { module: resolved, source: 'local' }, resolved)
  return toPublicMetadataShape(normalized, resolved)
}

export class ContentService {
  static getModuleKeys() {
    return [...MODULE_KEYS]
  }

  static resolveModuleKey(moduleId) {
    return resolveModuleKey(moduleId)
  }

  static async listModules() {
    return Promise.all(
      MODULE_KEYS.map(async (key) => ({
        id: key,
        metadata: await readMetadata(key),
      })),
    )
  }

  static async getModule(moduleId) {
    const key = String(moduleId ?? '').trim().toLowerCase()
    const resolved = resolveModuleKey(key)
    if (!ALL_MODULE_KEYS.includes(resolved) && !MODULE_ALIASES[key]) return null
    return { id: resolved, metadata: await readMetadata(resolved) }
  }

  static async getReadinessQuestions() {
    const filePath = path.join(MEDIA_ROOT, 'readiness-calculator', 'questions.json')
    return (await readJsonFile(filePath, { questions: [] })) ?? { questions: [] }
  }

  static async getDisasterDashboardDataset() {
    const filePath = path.join(DATA_DIR, 'disaster-dashboard.json')
    return (await readJsonFile(filePath, { entries: [] })) ?? { entries: [] }
  }

  static async listContentFiles(moduleId, folder) {
    const resolved = resolveModuleKey(moduleId)
    if (!ALL_MODULE_KEYS.includes(resolved)) return []
    const sub = String(folder ?? '').trim().toLowerCase()
    const normalizedSub = FOLDER_ALIASES[sub] ?? sub
    const base = path.join(MEDIA_ROOT, resolved, normalizedSub)
    if (!existsSync(base)) return []
    const entries = await fs.readdir(base)
    return entries.map((name) =>
      mapStorageContentToPublicMediaUrl(`/storage/content/${resolved}/${normalizedSub}/${encodeURIComponent(name)}`),
    )
  }
}
