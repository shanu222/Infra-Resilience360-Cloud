import fs from 'node:fs/promises'
import path from 'node:path'
import {
  STORAGE_EXPORTS_DIR,
  STORAGE_GENERATED_DIR,
  STORAGE_REPORTS_DIR,
  STORAGE_TEMP_DIR,
  STORAGE_UPLOADS_DIR,
} from '../config/localPaths.mjs'

const PATHS = {
  uploads: STORAGE_UPLOADS_DIR,
  exports: STORAGE_EXPORTS_DIR,
  generated: STORAGE_GENERATED_DIR,
  reports: STORAGE_REPORTS_DIR,
  temp: STORAGE_TEMP_DIR,
}

export class StorageService {
  static async ensureLayout() {
    await Promise.all(Object.values(PATHS).map((dir) => fs.mkdir(dir, { recursive: true })))
  }

  static listRoots() {
    return Object.fromEntries(Object.entries(PATHS).map(([k, dir]) => [k, dir.replace(/\\/g, '/')]))
  }

  static resolvePath(rootKey, fileName) {
    const root = PATHS[String(rootKey ?? '').trim()]
    if (!root) return null
    const cleanName = String(fileName ?? '').replace(/[\\/:*?"<>|]+/g, '-').trim()
    if (!cleanName) return null
    return path.join(root, cleanName)
  }
}
