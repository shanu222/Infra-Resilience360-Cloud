import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Repository root (Resilience360/) */
export const REPO_ROOT = path.resolve(__dirname, '..', '..')

export const CONTENT_DIR = path.join(REPO_ROOT, 'content')
export const STORAGE_DIR = path.join(REPO_ROOT, 'storage')
export const DATA_DIR = path.join(REPO_ROOT, 'data')
export const MEDIA_ROOT = (() => {
  const configured = String(process.env.MEDIA_ROOT ?? '').trim()
  if (!configured) return path.join(STORAGE_DIR, 'content')
  return path.isAbsolute(configured) ? configured : path.resolve(REPO_ROOT, configured)
})()

export const DATA_CMS_DIR = path.join(DATA_DIR, 'cms')
export const DATA_CMS_PAGES_DIR = path.join(DATA_CMS_DIR, 'pages')

export const STORAGE_UPLOADS_DIR = path.join(STORAGE_DIR, 'uploads')
export const STORAGE_REPORTS_DIR = path.join(STORAGE_DIR, 'reports')
export const STORAGE_GENERATED_DIR = path.join(STORAGE_DIR, 'generated')
export const STORAGE_EXPORTS_DIR = path.join(STORAGE_DIR, 'exports')
export const STORAGE_TEMP_DIR = path.join(STORAGE_DIR, 'temp')

export const PUBLIC_DIR = path.join(REPO_ROOT, 'frontend', 'public')
export const STATIC_CMS_SRC_DIR = path.join(REPO_ROOT, 'frontend', 'src', 'data', 'static')
export const SERVER_DATA_DIR = path.join(REPO_ROOT, 'backend', 'data')
