/**
 * Bundled static CMS content (replaces GET /api/cms, /api/homepage-config, mapping defaults).
 */
import homepageJson from '../data/static/homepage.json'
import learnJson from '../data/static/learn.json'
import disasterDashboardJson from '../data/static/disaster-dashboard.json'
import materialHubsJson from '../data/static/material-hubs.json'
import pgbcJson from '../data/static/pgbc.json'
import infraModelsJson from '../data/static/infra-models.json'
import retrofitJson from '../data/static/retrofit.json'
import bestPracticesJson from '../data/static/best-practices.json'
import portalsJson from '../data/static/portals.json'
import readinessJson from '../data/static/readiness.json'
import designToolkitJson from '../data/static/design-toolkit.json'
import liveEarthquakeMapJson from '../data/static/live-earthquake-map.json'
import smartConstructionJson from '../data/static/smart-construction.json'
import retrofitCalculatorJson from '../data/static/retrofit-calculator.json'
import applyRegionJson from '../data/static/apply-region.json'
import riskMapsJson from '../data/static/risk-maps.json'
import type { HomepageConfigPayload } from '../types/homepageConfig'
import type { RetrofitCmsPayload } from '../types/retrofitCms'
import { mergeHomepagePublicPayload } from '../utils/homepageConfigMerge'
import { mergeRetrofitCmsPublicPayload } from '../utils/retrofitCmsMerge'
import type { CmsPageJson } from './cmsServiceTypes'
import type { CmsMappedSectionDocument } from './cmsReadAdapter'
import type { CmsSectionSeeds, LearnSeedsWithPriority } from './cmsSectionSeedAdapter'
import { normalizeElementsFromApi } from '../utils/normalizeCmsElements'
import { LEARN_TRAIN_ICON_MAP, LEARN_TRAIN_VIDEOS, learnTrainVideoUrl } from '../config/learnTrainVideos'
import { getMediaUrl } from '../utils/mediaUrl'

import { LOCAL_BACKGROUND_IMAGE_URL, LOCAL_BACKGROUND_VIDEO_URL } from '../config/localContent'

const FALLBACK_BG_VIDEO = LOCAL_BACKGROUND_VIDEO_URL
const FALLBACK_BG_IMAGE = LOCAL_BACKGROUND_IMAGE_URL

function normalizeStaticMediaUrl(raw: string): string {
  const value = String(raw ?? '').trim()
  if (!value) return ''
  if (value.startsWith('/storage/content/')) {
    return getMediaUrl(value.slice('/storage/content/'.length))
  }
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value)
      if (url.pathname.startsWith('/storage/content/')) {
        return getMediaUrl(url.pathname.slice('/storage/content/'.length))
      }
    } catch {
      /* keep original */
    }
  }
  return value
}

export type StaticPageBundle = {
  page?: Record<string, unknown>
  seeds?: Record<string, unknown>
  cms?: Record<string, unknown>
}

type PageConfigRecordPayload = {
  page: string
  elements: Record<string, unknown>
  updatedAt: string | null
  mediaLibrary?: unknown[]
  mergedMedia?: unknown[]
  success?: boolean
  title?: string
  sections?: unknown[]
}

function asPageBundle(raw: unknown, slug: string): StaticPageBundle {
  if (!raw || typeof raw !== 'object') {
    return { page: { page: slug, elements: {}, mediaLibrary: [], updatedAt: null } }
  }
  const o = raw as Record<string, unknown>
  if (o.page && typeof o.page === 'object' && !Array.isArray(o.page)) {
    return o as StaticPageBundle
  }
  return { page: o }
}

const PAGE_BUNDLES: Record<string, StaticPageBundle> = {
  learn: asPageBundle(learnJson, 'learn'),
  'disaster-dashboard': asPageBundle(disasterDashboardJson, 'disaster-dashboard'),
  'material-hubs': asPageBundle(materialHubsJson, 'material-hubs'),
  pgbc: asPageBundle(pgbcJson, 'pgbc'),
  'infra-models': asPageBundle(infraModelsJson, 'infra-models'),
  retrofit: asPageBundle(retrofitJson, 'retrofit'),
  'best-practices': asPageBundle(bestPracticesJson, 'best-practices'),
  portals: asPageBundle(portalsJson, 'portals'),
  readiness: asPageBundle(readinessJson, 'readiness'),
  'design-toolkit': asPageBundle(designToolkitJson, 'design-toolkit'),
  'live-earthquake-map': asPageBundle(liveEarthquakeMapJson, 'live-earthquake-map'),
  'smart-construction': asPageBundle(smartConstructionJson, 'smart-construction'),
  'retrofit-calculator': asPageBundle(retrofitCalculatorJson, 'retrofit-calculator'),
  'apply-region': asPageBundle(applyRegionJson, 'apply-region'),
  'risk-maps': asPageBundle(riskMapsJson, 'risk-maps'),
}

function normalizeSlug(page: string): string {
  const slug = String(page || 'homepage').trim().toLowerCase() || 'homepage'
  if (slug === 'home') return 'homepage'
  return slug
}

function pageRecordFromBundle(bundle: StaticPageBundle | undefined, slug: string): Record<string, unknown> {
  const raw = bundle?.page
  if (raw && typeof raw === 'object') return { ...(raw as Record<string, unknown>) }
  return {
    page: slug,
    success: true,
    elements: {},
    mediaLibrary: [],
    updatedAt: null,
    backgroundMedia: { video: '', image: '' },
  }
}

function ensureBackgroundMedia(data: Record<string, unknown>): CmsPageJson {
  const raw = data.backgroundMedia as unknown
  const prevBm =
    raw && typeof raw === 'object' && !Array.isArray(raw) ?
      {
        video: String((raw as { video?: unknown }).video ?? '').trim(),
        image: String((raw as { image?: unknown }).image ?? '').trim(),
      }
    : { video: '', image: '' }
  const bv = String(data.backgroundVideo ?? '').trim()
  const bi = String(data.backgroundImage ?? '').trim()
  return {
    ...data,
    backgroundMedia: {
      video: normalizeStaticMediaUrl(prevBm.video || bv) || FALLBACK_BG_VIDEO,
      image: normalizeStaticMediaUrl(prevBm.image || bi) || FALLBACK_BG_IMAGE,
    },
  } as CmsPageJson
}

export function getStaticHomepageConfig(): HomepageConfigPayload {
  const raw = homepageJson as Record<string, unknown>
  return mergeHomepagePublicPayload(raw, { cmsPriority: false })
}

export function getStaticCmsPage(page: string): CmsPageJson {
  const slug = normalizeSlug(page)
  if (slug === 'homepage') {
    const hp = getStaticHomepageConfig() as unknown as Record<string, unknown>
    return ensureBackgroundMedia({
      page: 'homepage',
      success: true,
      title: String(
        (hp.text as { title?: string } | undefined)?.title ??
          (hp.hero as { title?: string } | undefined)?.title ??
          'Infra Resilience360',
      ),
      elements: {},
      mediaLibrary: [],
      updatedAt: typeof hp.updatedAt === 'string' ? hp.updatedAt : null,
      backgroundVideo: hp.backgroundVideo,
      backgroundImage: hp.backgroundImage,
      backgroundMedia: hp.backgroundMedia,
    })
  }
  const bundle = PAGE_BUNDLES[slug]
  return ensureBackgroundMedia(pageRecordFromBundle(bundle, slug))
}

export function getStaticPageConfigRecord(page: string): PageConfigRecordPayload {
  const slug = normalizeSlug(page)
  const data = getStaticCmsPage(slug) as Record<string, unknown>
  const rawLib = data.mediaLibrary
  const rawExtra = data.media
  const lib = Array.isArray(rawLib) ? rawLib : []
  const extra = Array.isArray(rawExtra) ? rawExtra : []
  const mergedMedia = [...lib, ...extra]
  return {
    page: typeof data.page === 'string' ? data.page : slug,
    elements: normalizeElementsFromApi(data.elements),
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : null,
    ...(lib.length ? { mediaLibrary: lib } : {}),
    ...(mergedMedia.length ? { mergedMedia } : {}),
    ...(typeof data.success === 'boolean' ? { success: data.success } : {}),
    ...(typeof data.title === 'string' ? { title: data.title } : {}),
    ...(Array.isArray(data.sections) ? { sections: data.sections as PageConfigRecordPayload['sections'] } : {}),
  }
}

export function getStaticRetrofitCms(): RetrofitCmsPayload {
  const bundle = asPageBundle(retrofitJson, 'retrofit')
  const raw = bundle.cms && typeof bundle.cms === 'object' ? bundle.cms : {}
  return mergeRetrofitCmsPublicPayload(raw as Record<string, unknown>, { cmsPriority: false })
}

export function getStaticLearnSeeds(): LearnSeedsWithPriority & { categories?: unknown[] } {
  const videos = LEARN_TRAIN_VIDEOS.map((video) => ({
    id: video.id,
    title: video.title,
    summary: video.summary,
    fileName: video.fileName,
    url: learnTrainVideoUrl(video.fileName),
    s3Key: `resilience360/learn/${video.fileName}`,
  }))
  return {
    videos: videos as LearnSeedsWithPriority['videos'],
    iconMap: { ...LEARN_TRAIN_ICON_MAP },
    categories: [],
    cmsPriority: videos.length > 0,
  }
}

export function getStaticInfraSeeds(): NonNullable<CmsSectionSeeds['infraModels']> {
  const seeds = asPageBundle(infraModelsJson, 'infra-models').seeds
  return {
    models: Array.isArray(seeds?.models) ? (seeds!.models as NonNullable<CmsSectionSeeds['infraModels']>['models']) : [],
    pdfMap:
      seeds?.pdfMap && typeof seeds.pdfMap === 'object' && !Array.isArray(seeds.pdfMap) ?
        (seeds.pdfMap as Record<string, string>)
      : {},
  }
}

export function getStaticRiskSeeds(): NonNullable<CmsSectionSeeds['riskMaps']> {
  const seeds = asPageBundle(readinessJson, 'readiness').seeds
  const riskFromReadiness =
    (seeds?.riskMaps as Record<string, unknown> | undefined) ??
    (seeds && !seeds.riskMaps && (seeds.provinceRisk || seeds.districtCenters) ? seeds : undefined)
  const riskMapsSeeds = asPageBundle(riskMapsJson, 'risk-maps').seeds
  const src = riskMapsSeeds ?? riskFromReadiness ?? seeds ?? {}
  return {
    provinceRisk:
      src.provinceRisk && typeof src.provinceRisk === 'object' && !Array.isArray(src.provinceRisk) ?
        (src.provinceRisk as NonNullable<CmsSectionSeeds['riskMaps']>['provinceRisk'])
      : {},
    districtCenters:
      src.districtCenters && typeof src.districtCenters === 'object' && !Array.isArray(src.districtCenters) ?
        (src.districtCenters as NonNullable<CmsSectionSeeds['riskMaps']>['districtCenters'])
      : {},
  }
}

export function getStaticPortalSeeds(): NonNullable<CmsSectionSeeds['portals']> {
  const seeds = (portalsJson as StaticPageBundle).seeds as Record<string, unknown> | undefined
  if (!seeds || typeof seeds !== 'object') {
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
    }
  }
  const visibilityRaw = seeds.visibility as Record<string, unknown> | undefined
  return {
    pgbcSrc: String(seeds.pgbcSrc ?? '/pgbc/index.html'),
    materialHubsSrc: String(seeds.materialHubsSrc ?? '/material-hubs/index.html'),
    retrofitCalculatorSrc: String(seeds.retrofitCalculatorSrc ?? '/retrofit-calculator/index.html'),
    smartConstructionSrc: String(seeds.smartConstructionSrc ?? '/smart-construction/index.html'),
    disasterDashboardCandidates: Array.isArray(seeds.disasterDashboardCandidates) ?
        (seeds.disasterDashboardCandidates as string[])
      : ['/disaster-dashboard/index.html'],
    visibility: {
      pgbc: visibilityRaw?.pgbc !== false,
      materialHubs: visibilityRaw?.materialHubs !== false,
      retrofitCalculator: visibilityRaw?.retrofitCalculator !== false,
      smartConstruction: visibilityRaw?.smartConstruction !== false,
      disasterDashboard: visibilityRaw?.disasterDashboard !== false,
    },
  }
}

const MAPPING_SECTION_KEYS: Record<string, string> = {
  globalShell: 'globalShell',
  homepage: 'homepage',
  learnTrain: 'learnTrain',
  learn: 'learnTrain',
  infraModels: 'infraModels',
  riskMapsReadiness: 'riskMapsReadiness',
  riskMaps: 'riskMapsReadiness',
  readiness: 'riskMapsReadiness',
  retrofit: 'retrofit',
  portals: 'portals',
}

/** Minimal mapping sections for legacy adapters (no network). */
export function getStaticCmsMappedSection(section: string): CmsMappedSectionDocument | null {
  const key = MAPPING_SECTION_KEYS[String(section || '').trim()] ?? String(section || '').trim()
  if (!key) return null
  if (key === 'retrofit') {
    const cms = getStaticRetrofitCms() as unknown as Record<string, unknown>
    return { section: 'retrofit', docKey: 'static-retrofit', defaults: cms, elements: [] }
  }
  if (key === 'homepage') {
    const hp = getStaticHomepageConfig() as unknown as Record<string, unknown>
    return { section: 'homepage', docKey: 'static-homepage', defaults: hp, elements: [] }
  }
  if (key === 'portals') {
    const seeds = getStaticPortalSeeds()
    return {
      section: 'portals',
      docKey: 'static-portals',
      elements: [
        {
          meta: { matchedId: 'pgbc-portal', type: 'portal' },
          content: { sourceTemplate: seeds.pgbcSrc },
          visibility: { visible: seeds.visibility?.pgbc !== false },
        },
        {
          meta: { matchedId: 'material-hubs-portal', type: 'portal' },
          content: { sourceTemplate: seeds.materialHubsSrc },
          visibility: { visible: seeds.visibility?.materialHubs !== false },
        },
        {
          meta: { matchedId: 'retrofit-calculator-portal', type: 'portal' },
          content: { sourceTemplate: seeds.retrofitCalculatorSrc },
          visibility: { visible: seeds.visibility?.retrofitCalculator !== false },
        },
        {
          meta: { matchedId: 'smart-construction-portal', type: 'portal' },
          content: { sourceTemplate: seeds.smartConstructionSrc },
          visibility: { visible: seeds.visibility?.smartConstruction !== false },
        },
        {
          meta: { matchedId: 'disaster-dashboard-portal', type: 'portal' },
          content: { sourceCandidates: seeds.disasterDashboardCandidates },
          visibility: { visible: seeds.visibility?.disasterDashboard !== false },
        },
      ],
    }
  }
  const slug =
    key === 'learnTrain' ? 'learn'
    : key === 'infraModels' ? 'infra-models'
    : key === 'riskMapsReadiness' ? 'readiness'
    : null
  if (!slug) return null
  const bundle = PAGE_BUNDLES[slug]
  if (!bundle) return null
  const page = pageRecordFromBundle(bundle, slug)
  const elements = normalizeElementsFromApi(page.elements)
  return {
    section: key,
    docKey: `static-${slug}`,
    defaults: page,
    elements: Object.entries(elements).map(([matchedId, payload]) => ({
      meta: { matchedId, type: String((payload as { cmsType?: string }).cmsType ?? 'content') },
      content: payload as Record<string, unknown>,
    })),
  }
}
