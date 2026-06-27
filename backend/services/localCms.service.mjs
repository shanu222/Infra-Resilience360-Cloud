import fs from 'node:fs/promises'
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import {
  DATA_CMS_PAGES_DIR,
  DATA_DIR,
  STATIC_CMS_SRC_DIR,
} from '../config/localPaths.mjs'
import { readJsonFile } from './JsonDatabase.mjs'
import { rewriteMediaUrlsDeep } from './localUrlRewrite.mjs'
import { loadHomepageStaticDefaults } from '../homepageStaticDefaults.mjs'
import { loadRetrofitCmsStaticDefaults } from '../retrofitCmsStaticDefaults.mjs'

const FALLBACK_BG_VIDEO = '/static/media/local/resilience360/background/home.mp4'
const FALLBACK_BG_IMAGE = '/static/media/local/resilience360/background/home.jpg'

const PAGE_SLUG_ALIASES = {
  home: 'homepage',
  global: 'homepage',
  inframodels: 'infra-models',
  disasterdashboard: 'disaster-dashboard',
  materialhubs: 'material-hubs',
  bestpractices: 'best-practices',
  designtoolkit: 'design-toolkit',
  riskmaps: 'risk-maps',
  smartconstruction: 'smart-construction',
  retrofitcalculator: 'retrofit-calculator',
  applyregion: 'apply-region',
  liveearthquakemap: 'live-earthquake-map',
}

function normalizePageKey(raw) {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
  if (!s) return 'homepage'
  return PAGE_SLUG_ALIASES[s] ?? s
}

function pageJsonPath(slug) {
  return path.join(DATA_CMS_PAGES_DIR, `${slug}.json`)
}

function staticSrcPath(slug) {
  if (slug === 'homepage') return path.join(STATIC_CMS_SRC_DIR, 'homepage.json')
  return path.join(STATIC_CMS_SRC_DIR, `${slug}.json`)
}

async function loadPageBundle(slug) {
  const normalized = normalizePageKey(slug)
  const dataPath = pageJsonPath(normalized)
  const fromData = await readJsonFile(dataPath, null)
  if (fromData) return fromData
  const fromSrc = await readJsonFile(staticSrcPath(normalized), null)
  if (fromSrc) return fromSrc
  return null
}

function asPageRecord(bundle, slug) {
  if (!bundle || typeof bundle !== 'object') {
    return {
      page: slug,
      success: true,
      elements: {},
      mediaLibrary: [],
      updatedAt: null,
      backgroundMedia: { video: '', image: '' },
    }
  }
  const o = bundle
  if (o.page && typeof o.page === 'object' && !Array.isArray(o.page)) {
    return { ...(o.page) }
  }
  return { ...(o) }
}

function ensureBackgroundMedia(record) {
  const bm = record.backgroundMedia && typeof record.backgroundMedia === 'object' ? record.backgroundMedia : {}
  const video = String(bm.video || record.backgroundVideo || '').trim() || FALLBACK_BG_VIDEO
  const image = String(bm.image || record.backgroundImage || '').trim() || FALLBACK_BG_IMAGE
  return {
    ...record,
    backgroundMedia: { video, image },
    backgroundVideo: video,
    backgroundImage: image,
  }
}

export async function readLocalHomepageConfig() {
  const file = path.join(DATA_DIR, 'homepage.json')
  const raw = (await readJsonFile(file, null)) ?? (await readJsonFile(staticSrcPath('homepage'), null))
  const defaults = loadHomepageStaticDefaults()
  const base = raw && typeof raw === 'object' ? raw : defaults
  return rewriteMediaUrlsDeep(
    ensureBackgroundMedia({
      type: 'homepage_config',
      ...defaults,
      ...base,
    }),
  )
}

export async function readLocalCmsPage(page) {
  const slug = normalizePageKey(page)
  if (slug === 'homepage') {
    const hp = await readLocalHomepageConfig()
    return rewriteMediaUrlsDeep(
      ensureBackgroundMedia({
        page: 'homepage',
        success: true,
        title: String(hp.text?.title || hp.hero?.title || 'Infra Resilience360'),
        elements: {},
        mediaLibrary: [],
        updatedAt: hp.updatedAt ?? null,
        backgroundVideo: hp.backgroundVideo,
        backgroundImage: hp.backgroundImage,
        backgroundMedia: hp.backgroundMedia,
      }),
    )
  }
  const bundle = await loadPageBundle(slug)
  const record = asPageRecord(bundle, slug)
  return rewriteMediaUrlsDeep(ensureBackgroundMedia(record))
}

export async function readLocalRetrofitCms() {
  const file = path.join(DATA_DIR, 'retrofit-cms.json')
  const raw = (await readJsonFile(file, null)) ?? (await loadPageBundle('retrofit'))
  const defaults = loadRetrofitCmsStaticDefaults()
  const cms =
    raw?.cms && typeof raw.cms === 'object' ? raw.cms
    : raw && typeof raw === 'object' ? raw
    : {}
  return rewriteMediaUrlsDeep({
    ...defaults,
    ...cms,
    pages: Array.isArray(cms.pages) && cms.pages.length > 0 ? cms.pages : defaults.pages,
  })
}

export async function readLocalSectionManifest(section) {
  const slug = normalizePageKey(section)
  const page = await readLocalCmsPage(slug)
  const lib = Array.isArray(page.mediaLibrary) ? page.mediaLibrary : []
  const videos = []
  const images = []
  const documents = []
  const audio = []
  const groupedByFolder = {}

  for (const item of lib) {
    if (!item || typeof item !== 'object') continue
    const url = String(item.url || item.s3Url || '').trim()
    if (!url) continue
    const type = String(item.type || item.kind || '').toLowerCase()
    const folder = String(item.folder || item.hazard || 'default').trim() || 'default'
    const row = {
      id: String(item.id || item.matchedId || item._id || url),
      url: rewriteMediaUrlsDeep(url),
      type,
      folder,
      matchedId: item.matchedId,
      title: item.title,
      fileName: item.fileName,
      s3Key: item.s3Key,
      updatedAt: item.updatedAt,
    }
    if (!groupedByFolder[folder]) groupedByFolder[folder] = {}
    if (type === 'video' || url.endsWith('.mp4')) {
      videos.push(row)
      groupedByFolder[folder].video = row.url
    } else if (type === 'audio' || /\.(m4a|mp3|wav)$/i.test(url)) {
      audio.push(row)
      groupedByFolder[folder].audio = row.url
    } else if (type === 'pdf' || url.endsWith('.pdf')) {
      documents.push(row)
      groupedByFolder[folder].pdf = row.url
      groupedByFolder[folder].document = row.url
    } else {
      images.push(row)
      groupedByFolder[folder].image = row.url
    }
  }

  return {
    section: slug,
    updatedAt: page.updatedAt ?? new Date().toISOString(),
    videos,
    images,
    documents,
    audio: audio.length ? audio : undefined,
    groupedByFolder: Object.keys(groupedByFolder).length ? groupedByFolder : undefined,
  }
}

export async function ensureLocalCmsDataDirs() {
  await fs.mkdir(DATA_CMS_PAGES_DIR, { recursive: true })
}

export function listKnownPageSlugs() {
  const slugs = new Set(['homepage'])
  if (existsSync(STATIC_CMS_SRC_DIR)) {
    for (const name of readdirSync(STATIC_CMS_SRC_DIR)) {
      if (name.endsWith('.json')) slugs.add(name.replace(/\.json$/, ''))
    }
  }
  if (existsSync(DATA_CMS_PAGES_DIR)) {
    for (const name of readdirSync(DATA_CMS_PAGES_DIR)) {
      if (name.endsWith('.json')) slugs.add(name.replace(/\.json$/, ''))
    }
  }
  return [...slugs]
}

