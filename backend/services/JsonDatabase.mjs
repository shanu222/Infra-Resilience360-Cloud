import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { DATA_DIR } from '../config/localPaths.mjs'

export function collectionPath(name) {
  const safe = String(name ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '')
  if (!safe) throw new Error('Invalid JSON collection name')
  return path.join(DATA_DIR, `${safe}.json`)
}

export async function readJsonCollection(name, fallback = null) {
  const file = collectionPath(name)
  if (!existsSync(file)) return fallback
  try {
    const raw = await fs.readFile(file, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    console.error(`[JsonDatabase] failed to read ${file}:`, err)
    return fallback
  }
}

export async function writeJsonCollection(name, data) {
  const file = collectionPath(name)
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  return file
}

export async function readJsonFile(filePath, fallback = null) {
  if (!existsSync(filePath)) return fallback
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    console.error(`[JsonDatabase] failed to read ${filePath}:`, err)
    return fallback
  }
}
