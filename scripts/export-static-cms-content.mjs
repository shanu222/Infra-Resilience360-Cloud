/**
 * Export CMS/Mongo-shaped content into src/data/static/*.json
 * Usage: node scripts/export-static-cms-content.mjs
 * Optional: MONGODB_URI for live production snapshot
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadHomepageStaticDefaults } from '../server/homepageStaticDefaults.mjs'
import { loadRetrofitCmsStaticDefaults } from '../server/retrofitCmsStaticDefaults.mjs'
import { getCmsMappingDocuments } from '../server/cmsMappingCatalog.mjs'
import { buildBundledLearnSeeds } from '../server/bundledLearnVideoCatalog.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')
const outDir = path.join(repoRoot, 'src', 'data', 'static')
const bundledDir = path.join(repoRoot, 'src', 'data', 'bundled')

function readBundledJson(name) {
  const file = path.join(bundledDir, name)
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

const FALLBACK_BG_VIDEO =
  'https://pak-population-data.s3.eu-north-1.amazonaws.com/resilience360/background/home.mp4'
const FALLBACK_BG_IMAGE =
  'https://pak-population-data.s3.eu-north-1.amazonaws.com/resilience360/background/home.jpg'

const PAGE_SLUGS = [
  'homepage',
  'learn',
  'disaster-dashboard',
  'material-hubs',
  'pgbc',
  'infra-models',
  'retrofit',
  'best-practices',
  'portals',
  'readiness',
  'design-toolkit',
  'live-earthquake-map',
  'smart-construction',
  'retrofit-calculator',
  'apply-region',
  'risk-maps',
]

function writeJson(name, data) {
  const file = path.join(outDir, name)
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  console.info('wrote', path.relative(repoRoot, file))
}

function emptyPage(slug, extra = {}) {
  return {
    page: slug,
    success: true,
    title: slug,
    sections: [{ type: 'content', title: slug }],
    elements: {},
    mediaLibrary: [],
    updatedAt: '2026-06-01T00:00:00.000Z',
    backgroundMedia: { video: '', image: '' },
    ...extra,
  }
}

function mappingElementToPayload(el) {
  if (!el || typeof el !== 'object') return null
  const content = el.content && typeof el.content === 'object' ? el.content : {}
  const media = el.media && typeof el.media === 'object' ? el.media : {}
  const style = el.style && typeof el.style === 'object' ? el.style : {}
  const matchedId = String(el.meta?.matchedId || '').trim()
  if (!matchedId) return null
  const payload = {
    cmsType: String(el.meta?.type || 'content'),
    text: content.title ?? content.text ?? undefined,
    placeholder: content.subtitle ?? undefined,
    styles: {
      ...(style.colors && typeof style.colors === 'object' ? style.colors : {}),
      ...(style.typography && typeof style.typography === 'object' ? style.typography : {}),
    },
    media:
      media.image || media.video || media.icon ?
        {
          url: String(media.image || media.video || media.icon || '').trim() || undefined,
          type: media.video ? 'video' : media.icon ? 'icon' : 'image',
        }
      : undefined,
  }
  return { id: matchedId, payload }
}

function elementsFromMapping(sectionKey) {
  const docs = getCmsMappingDocuments()
  const doc = docs[sectionKey] ?? docs[sectionKey === 'learn' ? 'learnTrain' : sectionKey]
  if (!doc?.elements) return {}
  const out = {}
  for (const el of doc.elements) {
    const row = mappingElementToPayload(el)
    if (row) out[row.id] = row.payload
  }
  return out
}

function buildHomepagePayload() {
  const defaults = loadHomepageStaticDefaults()
  return {
    type: 'homepage_config',
    backgroundImage: FALLBACK_BG_IMAGE,
    backgroundVideo: FALLBACK_BG_VIDEO,
    isVideoEnabled: true,
    backgroundScope: defaults.backgroundScope || 'home',
    colors: defaults.colors,
    text: {
      title: defaults.text?.title ?? defaults.staticSnapshot?.heroTitle ?? '',
      subtitle: defaults.text?.subtitle ?? defaults.staticSnapshot?.heroSubtitle ?? '',
    },
    hero: {
      title: defaults.text?.title ?? defaults.staticSnapshot?.heroTitle ?? '',
      subtitle: defaults.text?.subtitle ?? defaults.staticSnapshot?.heroSubtitle ?? '',
    },
    footer: defaults.footer ?? { en: {}, ur: {} },
    cards: defaults.cards ?? [],
    updatedAt: '2026-06-01T00:00:00.000Z',
    backgroundMedia: {
      video: FALLBACK_BG_VIDEO,
      image: FALLBACK_BG_IMAGE,
    },
    mediaLibrary: [],
    staticSnapshot: defaults.staticSnapshot ?? {},
  }
}

function buildPortalsSeeds() {
  const els = elementsFromMapping('portals')
  return {
    pgbcSrc: '/pgbc/index.html',
    materialHubsSrc: '/material-hubs/index.html',
    retrofitCalculatorSrc: '/retrofit-calculator/index.html',
    smartConstructionSrc: '/smart-construction/index.html',
    disasterDashboardCandidates: ['/disaster-dashboard/index.html'],
    visibility: {
      pgbc: true,
      materialHubs: true,
      retrofitCalculator: true,
      smartConstruction: true,
      disasterDashboard: true,
    },
    elements: els,
  }
}

async function tryMongoPageConfigs() {
  const mongoUri = String(process.env.MONGODB_URI || '').trim()
  if (!mongoUri) return null
  try {
    const mongoose = (await import('mongoose')).default
    await mongoose.connect(mongoUri)
    const col = mongoose.connection.db.collection('page_config')
    const rows = await col.find({}).toArray()
    await mongoose.disconnect()
    const byPage = {}
    for (const row of rows) {
      const page = String(row.page || row.slug || '').trim().toLowerCase()
      if (!page) continue
      byPage[page] = {
        page,
        elements: row.elements ?? {},
        mediaLibrary: row.mediaLibrary ?? [],
        updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
        backgroundMedia: row.backgroundMedia ?? { video: '', image: '' },
        success: true,
      }
    }
    return byPage
  } catch (e) {
    console.warn('[export-static] Mongo export skipped:', e?.message || e)
    return null
  }
}

async function tryMongoLearnMedia() {
  const mongoUri = String(process.env.MONGODB_URI || '').trim()
  if (!mongoUri) return null
  try {
    const mongoose = (await import('mongoose')).default
    await mongoose.connect(mongoUri)
    const col = mongoose.connection.db.collection('cms_media_library')
    const rows = await col
      .find({ section: { $in: ['learn', 'learnTrain', 'learn-and-train'] }, isActive: { $ne: false } })
      .toArray()
    await mongoose.disconnect()
    const videos = []
    for (const row of rows) {
      const type = String(row.type || row.mediaType || '').toLowerCase()
      if (type && type !== 'video') continue
      const url = String(row.url || '').trim()
      const s3Key = String(row.s3Key || '').trim()
      if (!url && !s3Key) continue
      const id = String(row.matchedId || row.id || row.fileName || '').trim() || `learn-${videos.length}`
      videos.push({
        id,
        title: String(row.title || row.fileName || id).trim(),
        summary: String(row.summary || row.title || '').trim(),
        fileName: String(row.fileName || id).trim(),
        url: url || undefined,
        s3Key: s3Key || undefined,
        mediaId: row._id ? String(row._id) : undefined,
      })
    }
    return videos.length ? { videos, iconMap: {}, cmsPriority: true } : null
  } catch (e) {
    console.warn('[export-static] learn media export skipped:', e?.message || e)
    return null
  }
}

async function tryMongoHomepage() {
  const mongoUri = String(process.env.MONGODB_URI || '').trim()
  if (!mongoUri) return null
  try {
    const mongoose = (await import('mongoose')).default
    await mongoose.connect(mongoUri)
    const row = await mongoose.connection.db.collection('homepage_config').findOne({ docKey: 'singleton' })
    await mongoose.disconnect()
    return row
  } catch {
    return null
  }
}

async function main() {
  const mongoPages = await tryMongoPageConfigs()
  const mongoHomepage = await tryMongoHomepage()
  const mongoLearn = await tryMongoLearnMedia()
  const bundledInfra = readBundledJson('infraModelSpecs.json')
  const bundledRisk = readBundledJson('riskMapsSeeds.json')

  writeJson('homepage.json', mongoHomepage ? { ...buildHomepagePayload(), ...mongoHomepage } : buildHomepagePayload())

  const portals = buildPortalsSeeds()
  writeJson('portals.json', {
    page: emptyPage('portals', { elements: portals.elements }),
    seeds: {
      pgbcSrc: portals.pgbcSrc,
      materialHubsSrc: portals.materialHubsSrc,
      retrofitCalculatorSrc: portals.retrofitCalculatorSrc,
      smartConstructionSrc: portals.smartConstructionSrc,
      disasterDashboardCandidates: portals.disasterDashboardCandidates,
      visibility: portals.visibility,
    },
  })

  const retrofitDefaults = loadRetrofitCmsStaticDefaults()
  writeJson('retrofit.json', {
    page: emptyPage('retrofit', { elements: elementsFromMapping('retrofit') }),
    cms: retrofitDefaults,
  })

  const bundledLearn = buildBundledLearnSeeds()
  const learnSeeds = mongoLearn ?? bundledLearn
  writeJson('learn.json', {
    page: mongoPages?.learn ?? emptyPage('learn', { elements: elementsFromMapping('learnTrain') }),
    seeds: learnSeeds,
    categories: learnSeeds.categories ?? bundledLearn.categories ?? [],
  })

  const infraSeeds = {
    models: Array.isArray(bundledInfra?.models) ? bundledInfra.models : [],
    pdfMap: bundledInfra?.pdfMap && typeof bundledInfra.pdfMap === 'object' ? bundledInfra.pdfMap : {},
    cmsPriority: (bundledInfra?.models?.length ?? 0) > 0,
  }
  writeJson('infra-models.json', {
    page: mongoPages?.['infra-models'] ?? emptyPage('infra-models', { elements: elementsFromMapping('infraModels') }),
    seeds: infraSeeds,
  })

  writeJson('disaster-dashboard.json', {
    page: mongoPages?.['disaster-dashboard'] ?? emptyPage('disaster-dashboard'),
  })

  writeJson('material-hubs.json', {
    page: mongoPages?.['material-hubs'] ?? emptyPage('material-hubs'),
  })

  writeJson('pgbc.json', {
    page: mongoPages?.pgbc ?? emptyPage('pgbc'),
  })

  writeJson('best-practices.json', {
    page: mongoPages?.['best-practices'] ?? emptyPage('best-practices'),
  })

  writeJson('readiness.json', {
    page: mongoPages?.readiness ?? emptyPage('readiness', { elements: elementsFromMapping('riskMapsReadiness') }),
    seeds: {
      riskMaps: bundledRisk ?? { provinceRisk: {}, districtCenters: {} },
    },
  })

  if (bundledRisk) {
    writeJson('risk-maps.json', {
      page: mongoPages?.['risk-maps'] ?? emptyPage('risk-maps'),
      seeds: bundledRisk,
    })
  }

  writeJson('design-toolkit.json', {
    page: mongoPages?.['design-toolkit'] ?? emptyPage('design-toolkit'),
  })

  writeJson('live-earthquake-map.json', {
    page: mongoPages?.['live-earthquake-map'] ?? emptyPage('live-earthquake-map'),
  })

  for (const slug of PAGE_SLUGS) {
    const file = `${slug}.json`
    if (
      [
        'homepage.json',
        'learn.json',
        'disaster-dashboard.json',
        'material-hubs.json',
        'pgbc.json',
        'infra-models.json',
        'retrofit.json',
        'best-practices.json',
        'portals.json',
        'readiness.json',
        'design-toolkit.json',
        'live-earthquake-map.json',
      ].includes(file)
    ) {
      continue
    }
    writeJson(file, mongoPages?.[slug] ?? emptyPage(slug))
  }

  console.info('[export-static] done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
