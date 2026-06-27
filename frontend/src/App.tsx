import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type SyntheticEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { ensureUrduPdfFont, pdfTx, setPdfBodyFont, setPdfBoldFont } from './utils/urduPdfSupport'
import { buildUrduAdvisoryAnswerElement, buildUrduRetrofitEstimateElement } from './utils/urduMainAppPdfHtml'
import ResponsiveQa from './components/ResponsiveQa'
import { fetchLiveAlerts, type LiveAlert } from './services/alerts'
import { buildApiTargets } from './services/apiBase'
import { getModuleMediaUrl } from './utils/mediaUrl'
import { mediaManager } from './services/mediaManager'
import { formatApiErrorMessage } from './utils/apiErrorMessage'
import { loadSharedAppState, saveSharedAppState } from './services/appStateSync'
import type { VisionAnalysisResult } from './services/vision'
import type { MlRetrofitEstimate } from './services/mlRetrofit'
import {
  type ConstructionGuidanceResult,
  type GuidanceStepImage,
} from './services/constructionGuidance'
import {
  districtRiskLookupByName,
  findDistrictRiskProfile,
  listDistrictsByProvince,
  type DistrictRiskProfile,
} from './data/ndmaRiskAtlas'
import { COASTAL_CITY_NAMES, pakistanCitiesByProvince } from './data/pakistanCitiesByProvince'
import { useLanguage } from './context/useLanguage'
import { bestPracticeUr } from './i18n/bestPracticeUr'
import type { HomepageConfigPayload } from './types/homepageConfig'
import { getStaticHomepageConfig } from './services/staticContent'
import {
  computeHomePresentation,
} from './utils/homepagePresentation'
import { GlobalBackgroundVideo } from './components/GlobalBackgroundVideo'
import { HomePageHomeBody } from './components/home/HomePageHomeBody'
import { HomePageCarouselBody } from './components/home/HomePageCarouselBody'
import { NdmaAuthorityBadge } from './components/home/NdmaAuthorityBadge'
import { NdmaHeaderLogo } from './components/home/NdmaHeaderLogo'
import { TopBarQuickControls } from './components/nav/TopBarQuickControls'
import { CmsSectionHeading } from './components/cms/CmsSectionHeading'
import { CmsText } from './components/cms/CmsText'
import UserLocationMiniMap from './components/UserLocationMiniMap'
import FireSafetyCalculator from './components/fire-safety/FireSafetyCalculator'
import EmbeddedEarthquakePage from './pages/EmbeddedEarthquakePage'
import RiskMap from './components/RiskMap'
import { BuildingCodesPage } from './pages/portals/BuildingCodesPage'
import { CostEstimatorPage } from './pages/portals/CostEstimatorPage'
import { DisasterDashboardPage } from './pages/portals/DisasterDashboardPage'
import { MaterialHubsPage } from './pages/portals/MaterialHubsPage'
import { SmartConstructionPage } from './pages/portals/SmartConstructionPage'
import { PageConfigElementsProvider } from './context/PageConfigElementsContext'
import { sectionKeyToPageSlug } from './utils/sectionPageSlug'
import { SHELL_PAGE_BACKGROUND_ID } from './constants/cmsShell'
import type { SectionKey } from './types/sectionKeys'
import { roleOptions } from './constants/homepageGrid'

const HOME_LAYOUT_LS_KEY = 'r360-home-layout'

function readHomeLayoutMode(): 'grid' | 'carousel' {
  try {
    return localStorage.getItem(HOME_LAYOUT_LS_KEY) === 'carousel' ? 'carousel' : 'grid'
  } catch {
    return 'grid'
  }
}
import { useRetrofitCms } from './hooks/useRetrofitCms'
import { retrofitCmsAttrs } from './utils/retrofitCmsAttrs'
import { learnRowDisplayTitle } from './utils/learnMediaTitle'
import { isExcludedLearnCatalogRow } from './utils/learnCatalogExclude'
import { isAwsPresignedUrl } from './utils/videoSourceValidation'
import { MEDIA_UNAVAILABLE_MESSAGE } from './utils/contentMediaConstants'
import { isCapacitorNativeRuntime } from './utils/capacitorRuntime'
import { inferVideoMime } from './utils/mediaMime'
import {
  APP_BRAND_ICON_URL,
  APP_BRAND_ICON_URL_CANDIDATES,
  DEFAULT_SHELL_LOGO_URL,
} from './services/globalShellConfig'
import {
  LEARN_VIDEO_BASE,
  LEARN_TRAIN_ICON_MAP,
  LEARN_TRAIN_VIDEOS,
  learnTrainPosterUrl,
  learnTrainVideoUrl,
} from './config/learnTrainVideos'
import { INFRA_MODELS, INFRA_MODELS_OFFICIAL_VIDEO_URL } from './config/infraModels'
import { BEST_PRACTICE_IMAGE_BY_ID, BEST_PRACTICES_IMAGE_CONFIG } from './config/bestPractices'
import { PersistentSectionHost } from './components/shell/PersistentSectionHost'
import {
  buildHrefWithAppSection,
  historyStateWithAppSection,
  readActiveSectionFromHistoryState,
  readPublicViewSectionFromUrl,
} from './routing/appSectionRouter'
import { preloadAppMedia } from './utils/preloadAppMedia'
import { preloadSectionModules } from './utils/preloadSectionModules'
import { earthquakePushNotificationService } from './services/earthquakePushNotifications'
import './styles/r360-section-panes.css'
let visionServicePromise: Promise<typeof import('./services/vision')> | null = null
let mlRetrofitServicePromise: Promise<typeof import('./services/mlRetrofit')> | null = null
let constructionGuidanceServicePromise: Promise<typeof import('./services/constructionGuidance')> | null = null
let advisoryServicePromise: Promise<typeof import('./services/advisory')> | null = null
let infraModelsMetadataPromise: Promise<Record<string, { image?: string; pdf?: string }> | null> | null = null
const infraImageSessionCache = new Set<string>()
const infraPdfSessionCache = new Set<string>()

const loadVisionService = () => (visionServicePromise ??= import('./services/vision'))
const loadMlRetrofitService = () => (mlRetrofitServicePromise ??= import('./services/mlRetrofit'))
const loadConstructionGuidanceService = () =>
  (constructionGuidanceServicePromise ??= import('./services/constructionGuidance'))
const loadAdvisoryService = () => (advisoryServicePromise ??= import('./services/advisory'))

function isLocalInfraMediaPath(url: string): boolean {
  const value = String(url ?? '').trim().toLowerCase()
  if (!value) return false
  return (
    value.includes('/content/resilience-models/') ||
    value.includes('/storage/content/resilience-models/')
  )
}

async function loadInfraModelsMetadataOnce(): Promise<Record<string, { image?: string; pdf?: string }> | null> {
  if (infraModelsMetadataPromise) return infraModelsMetadataPromise
  infraModelsMetadataPromise = (async () => {
    try {
      const response = await fetch(getModuleMediaUrl('resilience-models', 'metadata.json'), { cache: 'force-cache' })
      if (!response.ok) return null
      const payload = (await response.json()) as {
        models?: Array<{ id?: string; image?: string; pdf?: string }>
      }
      const rows = Array.isArray(payload?.models) ? payload.models : []
      const out: Record<string, { image?: string; pdf?: string }> = {}
      for (const row of rows) {
        const id = String(row?.id ?? '').trim()
        if (!id) continue
        const image = String(row?.image ?? '').trim()
        const pdf = String(row?.pdf ?? '').trim()
        out[id] = {
          image: isLocalInfraMediaPath(image) ? image : undefined,
          pdf: isLocalInfraMediaPath(pdf) ? pdf : undefined,
        }
      }
      return out
    } catch {
      return null
    }
  })()
  return infraModelsMetadataPromise
}

function preloadInfraImage(url: string) {
  const src = String(url ?? '').trim()
  if (!src || infraImageSessionCache.has(src)) return
  infraImageSessionCache.add(src)
  const img = new Image()
  img.decoding = 'async'
  img.src = src
}

function preloadInfraPdf(url: string) {
  const src = String(url ?? '').trim()
  if (!src || infraPdfSessionCache.has(src)) return
  infraPdfSessionCache.add(src)
  void fetch(src, { cache: 'force-cache' }).catch(() => {
    /* ignore preload failures */
  })
}

function preloadInfraVideo(url: string) {
  const src = String(url ?? '').trim()
  if (!src) return
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.src = src
  video.load()
}

const ModelBoardPdfViewer = memo(function ModelBoardPdfViewer({
  pdfCandidates,
  embedKey,
}: {
  pdfCandidates: string[]
  /** Remount embed only when model or CMS document version changes — not on unrelated re-renders. */
  embedKey: string
}) {
  const [hasPdfError, setHasPdfError] = useState(false)
  useEffect(() => {
    setHasPdfError(false)
  }, [embedKey])
  if (pdfCandidates.length === 0) return null
  const src = pdfCandidates[0]
  if (!src || hasPdfError) {
    return <p className="infra-model-hero-missing">PDF unavailable. Please try again later.</p>
  }

  return (
    <div className="infra-model-board-pdf-wrap">
      <embed
        key={`${embedKey}-embed`}
        src={src}
        type="application/pdf"
        width="100%"
        className="infra-model-board-pdf"
        onError={() => setHasPdfError(true)}
      />
    </div>
  )
})

const InfraModelHeroImage = memo(function InfraModelHeroImage({
  candidates,
  alt,
  className,
}: {
  candidates: string[]
  alt: string
  className?: string
}) {
  const [imageError, setImageError] = useState(false)
  useEffect(() => {
    setImageError(false)
  }, [candidates[0]])
  if (candidates.length === 0) return null
  if (imageError) {
    return <p className="infra-model-hero-missing">Image unavailable. Please try again later.</p>
  }
  const src = candidates[0] ?? ''
  if (!src) return <p className="infra-model-hero-missing">Image unavailable. Please try again later.</p>
  return (
    <div className="infra-model-image-wrap">
      <div className="infra-model-image-frame">
        <img
          src={src}
          alt={alt}
          className={`${className ?? ''} is-loaded`.trim()}
          loading="eager"
          decoding="auto"
          sizes="(max-width: 700px) 100vw, min(560px, 45vw)"
          onError={() => setImageError(true)}
        />
      </div>
    </div>
  )
})

const BestPracticeImage = memo(function BestPracticeImage({
  imageCandidates,
  title,
  className,
}: {
  imageCandidates: string[]
  title: string
  className?: string
}) {
  const [candidateIndex, setCandidateIndex] = useState(0)
  const [hasError, setHasError] = useState(false)
  const activeImage = imageCandidates[candidateIndex] ?? ''

  useEffect(() => {
    setCandidateIndex(0)
    setHasError(false)
  }, [imageCandidates.join('|')])

  if (!activeImage || hasError) {
    return <p className="best-practice-image-status">Image unavailable</p>
  }

  return (
    <div className="best-practice-image-wrap">
      <img
        className={className}
        src={activeImage}
        alt={title}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        onError={() => {
          if (candidateIndex < imageCandidates.length - 1) {
            setCandidateIndex((value) => value + 1)
          } else {
            setHasError(true)
          }
        }}
      />
    </div>
  )
})

type RetrofitImageSeriesResult = {
  id: string
  fileName: string
  previewUrl: string
  summary: string
  defectCount: number
  inferredAreaSqft: number
  severityScore: number
  affectedAreaPercent: number
  estimatedCost: number
  recommendedScope: 'Basic' | 'Standard' | 'Comprehensive'
  damageLevel: 'Low' | 'Medium' | 'High'
  urgencyLevel: 'routine' | 'priority' | 'critical'
  visibility: 'excellent' | 'good' | 'fair' | 'poor'
}

type RetrofitGuidanceResult = {
  id: string
  fileName: string
  summary: string
  safetyNote: string
  visibility: 'excellent' | 'good' | 'fair' | 'poor'
  recommendations: string[]
  defectFeatures?: VisionAnalysisResult['defectFeatures']
  structuredGuidance?: VisionAnalysisResult['structuredGuidance']
}

type RetrofitFinalEstimate = {
  estimateSource: 'ML Model' | 'Image-driven'
  province: string
  city: string
  imageCount: number
  totalAreaSqft: number
  durationWeeks: number
  totalCost: number
  minTotalCost: number
  maxTotalCost: number
  sqftRate: number
  locationFactor: number
  laborDaily: number
  materialIndex: number
  logisticsIndex: number
  equipmentIndex: number
  scope: 'Basic' | 'Standard' | 'Comprehensive'
  damageLevel: 'Low' | 'Medium' | 'High'
  urgencyLevel: 'routine' | 'priority' | 'critical'
  affectedAreaPercent: number
  severityScore: number
  mlModel?: string
  mlConfidence?: number
  guidance: string[]
}

type AlertFilterWindow = '24h' | '7d' | 'ongoing'

type HazardAlertOverlay = {
  id: string
  title: string
  type: 'Flood Warning' | 'Heavy Rain' | 'Earthquake' | 'Relief Point'
  severity: 'Low' | 'Medium' | 'High'
  advisory: string
  icon: string
  publishedAt: string
  isOngoing: boolean
  lat: number
  lng: number
}

type GlobalEarthquake = {
  id: string
  magnitude: number
  place: string
  time: string
  depthKm: number
  lat: number
  lng: number
  url: string
}

type HistoricalDisasterEvent = {
  id: string
  hazard: 'Flood' | 'Earthquake'
  title: string
  year: number
  lat: number
  lng: number
  extentKm: number
  livesLost: number
  economicCostUsdBn?: number
  affectedPeopleMillions?: number
  source: string
}

const EMERGENCY_KIT_ITEM_COUNT = 5
const EMERGENCY_KIT_LEGACY_LABELS = [
  'Drinking water (3-day supply)',
  'First aid kit and basic medicines',
  'Battery torch + power bank',
  'Important documents in waterproof pouch',
  'Emergency contacts list',
] as const

const parseEmergencyKitChecks = (raw: Record<string, boolean>): Record<string, boolean> => {
  const next: Record<string, boolean> = {}
  for (let i = 0; i < EMERGENCY_KIT_ITEM_COUNT; i += 1) {
    const key = String(i)
    if (raw[key] !== undefined) {
      next[key] = raw[key]
      continue
    }
    const legacy = EMERGENCY_KIT_LEGACY_LABELS[i]
    if (legacy && raw[legacy] !== undefined) {
      next[key] = raw[legacy]
    }
  }
  return next
}

const pakistanHistoricalDisasterEvents: HistoricalDisasterEvent[] = [
  {
    id: 'pk-eq-2005-kashmir',
    hazard: 'Earthquake',
    title: 'Kashmir Earthquake',
    year: 2005,
    lat: 34.49,
    lng: 73.63,
    extentKm: 130,
    livesLost: 87350,
    economicCostUsdBn: 5.2,
    affectedPeopleMillions: 3.5,
    source: 'Government of Pakistan / UN reports',
  },
  {
    id: 'pk-eq-2013-awaran',
    hazard: 'Earthquake',
    title: 'Awaran Earthquake',
    year: 2013,
    lat: 26.97,
    lng: 65.5,
    extentKm: 95,
    livesLost: 825,
    economicCostUsdBn: 0.25,
    source: 'USGS + provincial situation reports',
  },
  {
    id: 'pk-eq-2019-mirpur',
    hazard: 'Earthquake',
    title: 'Mirpur Earthquake',
    year: 2019,
    lat: 33.13,
    lng: 73.79,
    extentKm: 70,
    livesLost: 40,
    economicCostUsdBn: 0.09,
    source: 'NDMA / media-verified summaries',
  },
  {
    id: 'pk-flood-2010-super',
    hazard: 'Flood',
    title: 'Pakistan Super Floods',
    year: 2010,
    lat: 30.5,
    lng: 71.0,
    extentKm: 500,
    livesLost: 1985,
    economicCostUsdBn: 9.7,
    affectedPeopleMillions: 20,
    source: 'NDMA / World Bank / UN OCHA',
  },
  {
    id: 'pk-flood-2011-sindh',
    hazard: 'Flood',
    title: 'Sindh Floods',
    year: 2011,
    lat: 25.83,
    lng: 68.74,
    extentKm: 220,
    livesLost: 520,
    economicCostUsdBn: 2.0,
    affectedPeopleMillions: 9,
    source: 'Government of Sindh / UN humanitarian briefs',
  },
  {
    id: 'pk-flood-2014-chenab-jhelum',
    hazard: 'Flood',
    title: 'Jhelum-Chenab Basin Floods',
    year: 2014,
    lat: 32.5,
    lng: 74.2,
    extentKm: 170,
    livesLost: 367,
    economicCostUsdBn: 1.0,
    affectedPeopleMillions: 2.5,
    source: 'NDMA / PDMA Punjab / relief assessments',
  },
  {
    id: 'pk-flood-2022-monsoon',
    hazard: 'Flood',
    title: '2022 Monsoon Floods',
    year: 2022,
    lat: 26.2,
    lng: 68.5,
    extentKm: 380,
    livesLost: 1739,
    economicCostUsdBn: 30,
    affectedPeopleMillions: 33,
    source: 'NDMA + World Bank rapid damage assessment',
  },
]

const GLOBAL_EARTHQUAKE_FEED_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson'
const GLOBAL_EARTHQUAKE_FEED_URL_BACKUP = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'
const GLOBAL_EARTHQUAKE_PROXY_PREFIX = 'https://api.allorigins.win/raw?url='

type LearnTrainingVideo = {
  id: string
  title: string
  summary: string
  fileName: string
  /** Playback URL from CMS/Mongo (`videos[].url` for this card). */
  url?: string
  /** Optional S3 key for title fallback only (never used for playback URL construction). */
  s3Key?: string
  /** Mongo `cms_media_library` row id (admin PATCH). */
  mediaId?: string
}

const LEARN_VIDEO_UNAVAILABLE_MESSAGE = 'Video unavailable. Please try again later.'

/** Learn playback: prefer metadata URL, fallback to canonical static mapping. */
function resolveLearnVideoUrl(
  video: Pick<LearnTrainingVideo, 'id' | 'url' | 'fileName'>,
): string {
  const fileName = String(video?.fileName ?? '').trim()
  const canonicalUrl = fileName ? learnTrainVideoUrl(fileName) : ''
  const suppliedUrl = String(video?.url ?? '').trim()
  if (suppliedUrl && isAwsPresignedUrl(suppliedUrl)) {
    throw new Error(`[VIDEO ERROR] Expiring S3 URL for "${video?.id ?? 'unknown'}" is not allowed.`)
  }
  if (suppliedUrl) {
    return mediaManager.resolveRuntimeMediaUrl(suppliedUrl)
  }
  if (!canonicalUrl) {
    throw new Error(`[VIDEO ERROR] Missing Learn video URL: ${video?.id ?? 'unknown'}`)
  }
  if (!canonicalUrl.toLowerCase().startsWith(LEARN_VIDEO_BASE.toLowerCase())) {
    throw new Error(`[VIDEO ERROR] Learn URL must start with ${LEARN_VIDEO_BASE} (${video?.id ?? 'unknown'})`)
  }
  return mediaManager.resolveRuntimeMediaUrl(canonicalUrl)
}

const provinceRisk: Record<string, { earthquake: string; flood: string; infraRisk: string; landslide: string }> = {
  Punjab: { earthquake: 'Medium', flood: 'High', infraRisk: 'High', landslide: 'Low' },
  Sindh: { earthquake: 'Low', flood: 'Very High', infraRisk: 'Very High', landslide: 'Low' },
  Balochistan: { earthquake: 'High', flood: 'Medium', infraRisk: 'High', landslide: 'Medium' },
  KP: { earthquake: 'High', flood: 'High', infraRisk: 'High', landslide: 'High' },
  GB: { earthquake: 'Very High', flood: 'Medium', infraRisk: 'High', landslide: 'High' },
  AJK: { earthquake: 'Very High', flood: 'Medium', infraRisk: 'High', landslide: 'High' },
  ICT: { earthquake: 'Medium', flood: 'Medium', infraRisk: 'Medium', landslide: 'Low' },
}

type CityRateProfile = {
  laborDaily: number
  materialIndex: number
  logisticsIndex: number
  equipmentIndex?: number
}

const cityRateByProvince: Record<string, Record<string, CityRateProfile>> = {
  Punjab: {
    Lahore: { laborDaily: 3200, materialIndex: 1.1, logisticsIndex: 1.02 },
    Rawalpindi: { laborDaily: 3050, materialIndex: 1.08, logisticsIndex: 1.03 },
    Faisalabad: { laborDaily: 2800, materialIndex: 1.03, logisticsIndex: 1.01 },
    Multan: { laborDaily: 2750, materialIndex: 1.02, logisticsIndex: 1.01 },
    Gujranwala: { laborDaily: 2850, materialIndex: 1.04, logisticsIndex: 1.01 },
    Sialkot: { laborDaily: 2900, materialIndex: 1.05, logisticsIndex: 1.02 },
    Sargodha: { laborDaily: 2650, materialIndex: 1.01, logisticsIndex: 1 },
    Bahawalpur: { laborDaily: 2600, materialIndex: 1, logisticsIndex: 1.02 },
    'Rahim Yar Khan': { laborDaily: 2550, materialIndex: 0.99, logisticsIndex: 1.03 },
    'Dera Ghazi Khan': { laborDaily: 2520, materialIndex: 0.98, logisticsIndex: 1.04 },
    Sahiwal: { laborDaily: 2580, materialIndex: 0.99, logisticsIndex: 1.01 },
    Kasur: { laborDaily: 2620, materialIndex: 1, logisticsIndex: 1.01 },
  },
  Sindh: {
    Karachi: { laborDaily: 3500, materialIndex: 1.16, logisticsIndex: 1.04 },
    Hyderabad: { laborDaily: 2900, materialIndex: 1.07, logisticsIndex: 1.03 },
    Sukkur: { laborDaily: 2850, materialIndex: 1.05, logisticsIndex: 1.04 },
    Larkana: { laborDaily: 2750, materialIndex: 1.03, logisticsIndex: 1.05 },
    'Mirpur Khas': { laborDaily: 2680, materialIndex: 1.01, logisticsIndex: 1.05 },
    Nawabshah: { laborDaily: 2700, materialIndex: 1.02, logisticsIndex: 1.04 },
    Khairpur: { laborDaily: 2660, materialIndex: 1.01, logisticsIndex: 1.04 },
    Thatta: { laborDaily: 2720, materialIndex: 1.03, logisticsIndex: 1.06 },
    Badin: { laborDaily: 2700, materialIndex: 1.02, logisticsIndex: 1.06 },
  },
  Balochistan: {
    Quetta: { laborDaily: 3150, materialIndex: 1.12, logisticsIndex: 1.12 },
    Gwadar: { laborDaily: 3300, materialIndex: 1.17, logisticsIndex: 1.18 },
    Turbat: { laborDaily: 3000, materialIndex: 1.1, logisticsIndex: 1.15 },
    Khuzdar: { laborDaily: 2920, materialIndex: 1.08, logisticsIndex: 1.14 },
    Chaman: { laborDaily: 2880, materialIndex: 1.09, logisticsIndex: 1.16 },
    Sibi: { laborDaily: 2850, materialIndex: 1.07, logisticsIndex: 1.15 },
    Zhob: { laborDaily: 2820, materialIndex: 1.06, logisticsIndex: 1.16 },
  },
  KP: {
    Peshawar: { laborDaily: 3050, materialIndex: 1.09, logisticsIndex: 1.08 },
    Mardan: { laborDaily: 2850, materialIndex: 1.04, logisticsIndex: 1.06 },
    Swat: { laborDaily: 2950, materialIndex: 1.07, logisticsIndex: 1.11 },
    Abbottabad: { laborDaily: 3000, materialIndex: 1.08, logisticsIndex: 1.1 },
    Kohat: { laborDaily: 2800, materialIndex: 1.03, logisticsIndex: 1.08 },
    Bannu: { laborDaily: 2750, materialIndex: 1.02, logisticsIndex: 1.09 },
    'Dera Ismail Khan': { laborDaily: 2780, materialIndex: 1.03, logisticsIndex: 1.08 },
    Chitral: { laborDaily: 2980, materialIndex: 1.09, logisticsIndex: 1.14 },
    Mansehra: { laborDaily: 2900, materialIndex: 1.06, logisticsIndex: 1.11 },
  },
  GB: {
    Gilgit: { laborDaily: 3250, materialIndex: 1.15, logisticsIndex: 1.2 },
    Skardu: { laborDaily: 3350, materialIndex: 1.18, logisticsIndex: 1.23 },
    Hunza: { laborDaily: 3320, materialIndex: 1.17, logisticsIndex: 1.24 },
    Ghizer: { laborDaily: 3200, materialIndex: 1.14, logisticsIndex: 1.22 },
    Diamer: { laborDaily: 3180, materialIndex: 1.13, logisticsIndex: 1.23 },
    Ghanche: { laborDaily: 3300, materialIndex: 1.17, logisticsIndex: 1.24 },
    Astore: { laborDaily: 3220, materialIndex: 1.14, logisticsIndex: 1.22 },
    Kharmang: { laborDaily: 3280, materialIndex: 1.16, logisticsIndex: 1.23 },
    Nagar: { laborDaily: 3260, materialIndex: 1.15, logisticsIndex: 1.22 },
    Shigar: { laborDaily: 3320, materialIndex: 1.17, logisticsIndex: 1.24 },
  },
  ICT: {
    Islamabad: { laborDaily: 3150, materialIndex: 1.12, logisticsIndex: 1.03 },
  },
  AJK: {
    Muzaffarabad: { laborDaily: 2920, materialIndex: 1.06, logisticsIndex: 1.08 },
    Bagh: { laborDaily: 2840, materialIndex: 1.04, logisticsIndex: 1.07 },
    Bhimber: { laborDaily: 2800, materialIndex: 1.03, logisticsIndex: 1.06 },
    'Hattian Bala': { laborDaily: 2860, materialIndex: 1.04, logisticsIndex: 1.09 },
    Haveli: { laborDaily: 2850, materialIndex: 1.04, logisticsIndex: 1.08 },
    Kotli: { laborDaily: 2820, materialIndex: 1.03, logisticsIndex: 1.07 },
    Mirpur: { laborDaily: 2880, materialIndex: 1.05, logisticsIndex: 1.05 },
    Neelum: { laborDaily: 2900, materialIndex: 1.05, logisticsIndex: 1.12 },
    Poonch: { laborDaily: 2830, materialIndex: 1.03, logisticsIndex: 1.1 },
    Sudhnoti: { laborDaily: 2810, materialIndex: 1.03, logisticsIndex: 1.09 },
  },
}

const deriveEquipmentIndex = (cityRate: CityRateProfile): number => {
  if (typeof cityRate.equipmentIndex === 'number') {
    return cityRate.equipmentIndex
  }
  const derived = cityRate.materialIndex * 0.4 + cityRate.logisticsIndex * 0.6
  return Math.max(0.95, Math.min(1.35, Number(derived.toFixed(2))))
}

const coastalCities = new Set(COASTAL_CITY_NAMES)

const cityHazardOverrides: Record<
  string,
  {
    seismicZone: number
    floodDepth100y: number
    liquefaction: 'Low' | 'Medium' | 'High'
  }
> = {
  Lahore: { seismicZone: 2, floodDepth100y: 0.7, liquefaction: 'Low' },
  Islamabad: { seismicZone: 2, floodDepth100y: 0.55, liquefaction: 'Low' },
  Karachi: { seismicZone: 2, floodDepth100y: 1.9, liquefaction: 'Medium' },
  Peshawar: { seismicZone: 4, floodDepth100y: 1.2, liquefaction: 'Medium' },
  Quetta: { seismicZone: 5, floodDepth100y: 0.8, liquefaction: 'Medium' },
  Gilgit: { seismicZone: 5, floodDepth100y: 0.6, liquefaction: 'Low' },
  Skardu: { seismicZone: 5, floodDepth100y: 0.7, liquefaction: 'Low' },
  Thatta: { seismicZone: 2, floodDepth100y: 2.2, liquefaction: 'High' },
  Gwadar: { seismicZone: 3, floodDepth100y: 1.4, liquefaction: 'Medium' },
  Swat: { seismicZone: 4, floodDepth100y: 1.1, liquefaction: 'Low' },
  Hyderabad: { seismicZone: 2, floodDepth100y: 1.5, liquefaction: 'Medium' },
}

const getHazardOverlay = (province: string, city: string) => {
  const fallbackByProvince: Record<string, { seismicZone: number; floodDepth100y: number; liquefaction: 'Low' | 'Medium' | 'High' }> = {
    Punjab: { seismicZone: 2, floodDepth100y: 0.9, liquefaction: 'Low' },
    Sindh: { seismicZone: 2, floodDepth100y: 1.7, liquefaction: 'Medium' },
    Balochistan: { seismicZone: 4, floodDepth100y: 1.1, liquefaction: 'Medium' },
    KP: { seismicZone: 4, floodDepth100y: 1.2, liquefaction: 'Medium' },
    GB: { seismicZone: 5, floodDepth100y: 0.7, liquefaction: 'Low' },
    ICT: { seismicZone: 2, floodDepth100y: 0.55, liquefaction: 'Low' },
    AJK: { seismicZone: 4, floodDepth100y: 1.0, liquefaction: 'Medium' },
  }

  return cityHazardOverrides[city] ?? fallbackByProvince[province] ?? fallbackByProvince.Punjab
}

const globalPracticeLibrary: Record<
  'flood' | 'earthquake',
  Array<{
    id: string
    title: string
    region: string
    summary: string
    bcr: string
    steps: string[]
  }>
> = {
  flood: [
    {
      id: 'flood-raised-plinth',
      title: 'Raised Plinth and Flood-Resistant Envelope',
      region: 'Bangladesh Delta Housing',
      summary: 'Raised habitable floor with water-resistant lower envelope and rapid-drain edge channels.',
      bcr: '2.8',
      steps: ['Set flood design level', 'Raise plinth with compacted fill', 'Apply water-resistant coatings and drainage apron'],
    },
    {
      id: 'flood-backflow-sump',
      title: 'Backflow Prevention + Pump Sump',
      region: 'Netherlands Urban Blocks',
      summary: 'Stops sewer backflow and keeps critical rooms dry during surge and intense rainfall.',
      bcr: '2.2',
      steps: ['Install backflow valves', 'Create sump pit at low point', 'Provide dual power for pump operation'],
    },
    {
      id: 'flood-ground-store',
      title: 'Flood-Compatible Ground Storey Strategy',
      region: 'Thailand Riverside Communities',
      summary: 'Sacrificial/use-flexible ground floor with protected utilities and vertical evacuation route.',
      bcr: '2.5',
      steps: ['Relocate electrical panels upward', 'Use flood-compatible finishes', 'Mark vertical evacuation path'],
    },
    {
      id: 'flood-embankment-toe',
      title: 'Embankment Toe Protection + Drainage',
      region: 'Pakistan Indus Belt Pilots',
      summary: 'Combines slope protection and toe drainage to reduce erosion and approach failures.',
      bcr: '3.0',
      steps: ['Stabilize slope toe', 'Install sub-drain lines', 'Add vegetative cover for erosion control'],
    },
    {
      id: 'flood-utility-elevation',
      title: 'Critical Utility Elevation Protocol',
      region: 'US Gulf Coast Schools',
      summary: 'Elevates transformers, control panels, and backup systems above flood design level.',
      bcr: '3.3',
      steps: ['Audit utility points', 'Raise and anchor systems', 'Test post-flood quick-restart protocol'],
    },
    {
      id: 'flood-perimeter-detention',
      title: 'Perimeter Detention and Controlled Outflow',
      region: 'Singapore Urban Resilience Sites',
      summary: 'Short-term detention with controlled release lowers local flood peak around buildings.',
      bcr: '2.6',
      steps: ['Create detention pockets', 'Install controlled outflow points', 'Maintain desilting schedule'],
    },
    {
      id: 'flood-amphibious',
      title: 'Amphibious Foundation Retrofit',
      region: 'Netherlands Maas Communities',
      summary: 'Buoyant foundation guidance allows controlled vertical movement during flood surge while anchored in place.',
      bcr: '3.1',
      steps: ['Assess flood rise envelope', 'Install buoyant platform and vertical guideposts', 'Protect flexible utility connections'],
    },
    {
      id: 'flood-deployable-barrier',
      title: 'Deployable Flood Barrier Gate System',
      region: 'Germany Rhine Industrial Blocks',
      summary: 'Rapid-install panel barriers shield critical entry points and utility corridors during flash flood warnings.',
      bcr: '2.7',
      steps: ['Map vulnerable openings', 'Pre-stage modular barriers', 'Run deployment drills before monsoon peaks'],
    },
    {
      id: 'flood-sponge-streets',
      title: 'Green-Blue Sponge Streets',
      region: 'China Sponge City Program',
      summary: 'Permeable paving, bioswales, and pocket retention reduce street flooding and improve infiltration.',
      bcr: '2.9',
      steps: ['Replace impermeable lanes in phases', 'Add bioswale strips with native species', 'Schedule debris and sediment maintenance'],
    },
    {
      id: 'flood-utility-pods',
      title: 'Floating Emergency Utility Pods',
      region: 'Japan Coastal Municipalities',
      summary: 'Floating/raised utility pods preserve emergency power, water treatment, and communication during inundation.',
      bcr: '3.0',
      steps: ['Identify critical utility loads', 'Raise or float pod modules', 'Validate emergency transfer and restart protocol'],
    },
    {
      id: 'flood-smart-pump',
      title: 'Smart Pump Station with IoT Gate Control',
      region: 'South Korea Smart Flood Control',
      summary: 'Sensor-driven pump and sluice coordination cuts local backflow and urban flood duration.',
      bcr: '2.8',
      steps: ['Install water-level sensors', 'Automate pump/gate trigger thresholds', 'Maintain manual override for outages'],
    },
    {
      id: 'flood-school-layout',
      title: 'Flood-Resilient School Compound Layout',
      region: 'Philippines Typhoon Adaptation Schools',
      summary: 'Campus zoning places refuge, WASH, and lifeline systems at safer elevations for continuity.',
      bcr: '3.2',
      steps: ['Zone high-priority functions by elevation', 'Raise WASH and power controls', 'Mark protected evacuation circulation'],
    },
  ],
  earthquake: [
    {
      id: 'eq-masonry-bands',
      title: 'Masonry Confinement Bands Upgrade',
      region: 'Nepal Seismic Reconstruction',
      summary: 'Lintel/plinth/roof bands plus corner reinforcement to prevent brittle wall failures.',
      bcr: '3.4',
      steps: ['Install ring bands', 'Anchor corners and junctions', 'Retrofit openings with lintel confinement'],
    },
    {
      id: 'eq-soft-storey',
      title: 'Soft-Storey RC Frame Strengthening',
      region: 'Turkey School Retrofit Program',
      summary: 'Column jacketing and infill/shear elements for drift control at weak storeys.',
      bcr: '3.6',
      steps: ['Identify weak bays', 'Apply jacketing with confinement ties', 'Add targeted shear walls'],
    },
    {
      id: 'eq-roof-anchorage',
      title: 'Roof-to-Wall Anchorage and Diaphragm Ties',
      region: 'Chile Mid-Rise Housing',
      summary: 'Improves load path continuity and reduces out-of-plane wall collapse.',
      bcr: '3.1',
      steps: ['Check anchorage continuity', 'Install tie rods/connectors', 'Verify diaphragm action'],
    },
    {
      id: 'eq-bridge-joint',
      title: 'Bridge Approach Seismic Joint Retrofit',
      region: 'Japan Transport Corridors',
      summary: 'Joint restrainers and bearing upgrades reduce displacement and impact damage.',
      bcr: '3.8',
      steps: ['Retrofit restrainers', 'Upgrade bearings', 'Validate expansion and movement limits'],
    },
    {
      id: 'eq-non-structural',
      title: 'Non-Structural Hazard Mitigation Package',
      region: 'California Hospital Programs',
      summary: 'Secures parapets, equipment, and overhead services to cut injury/disruption risk.',
      bcr: '2.9',
      steps: ['Inventory non-structural hazards', 'Anchor equipment/services', 'Run shake scenario checks'],
    },
    {
      id: 'eq-performance-based',
      title: 'Performance-Based Retrofit Prioritization',
      region: 'New Zealand Public Assets',
      summary: 'Prioritizes interventions by life-safety and downtime impact with phased budgets.',
      bcr: '3.2',
      steps: ['Score life-safety hotspots', 'Assign phased retrofit packages', 'Track compliance after each phase'],
    },
    {
      id: 'eq-base-isolation',
      title: 'Base Isolation for Critical Buildings',
      region: 'Japan Essential Facilities Program',
      summary: 'Isolation bearings reduce transfer of seismic forces to superstructure and equipment.',
      bcr: '4.0',
      steps: ['Screen candidate critical buildings', 'Design bearing system and moat gaps', 'Commission monitoring and maintenance plan'],
    },
    {
      id: 'eq-brb',
      title: 'Buckling-Restrained Braced Frame Retrofit',
      region: 'United States Hospital Seismic Upgrades',
      summary: 'BRB systems provide stable energy dissipation and improved drift control under strong shaking.',
      bcr: '3.7',
      steps: ['Identify weak lateral bays', 'Install BRB braces with collector continuity', 'Verify story-drift and connection performance'],
    },
    {
      id: 'eq-damper-wall',
      title: 'Steel Damper Wall Retrofit',
      region: 'Taiwan High-Rise Seismic Program',
      summary: 'Supplemental damping walls absorb seismic energy and limit non-structural damage.',
      bcr: '3.5',
      steps: ['Place dampers at high-response floors', 'Anchor to primary frame', 'Inspect damper condition after events'],
    },
    {
      id: 'eq-rocking-core',
      title: 'Rocking Wall + Post-Tensioned Core System',
      region: 'New Zealand Low-Damage Design',
      summary: 'Self-centering systems reduce residual drift and post-earthquake downtime.',
      bcr: '3.9',
      steps: ['Model self-centering demand', 'Install post-tensioned rocking elements', 'Validate recentering in design checks'],
    },
    {
      id: 'eq-lifeline-restraint',
      title: 'Lifeline Utility Seismic Restraint Package',
      region: 'Chile Critical Infrastructure Standards',
      summary: 'Seismic restraints for MEP pipelines, tanks, and cable trays protect essential operations.',
      bcr: '3.3',
      steps: ['Inventory critical utility runs', 'Add braces and flexible joints', 'Perform shake-ready inspection checklist'],
    },
    {
      id: 'eq-infill-decoupling',
      title: 'Masonry Infill Decoupling Retrofit',
      region: 'Italy School Safety Retrofit',
      summary: 'Controlled infill-frame interaction reduces brittle failures and falling hazards.',
      bcr: '3.4',
      steps: ['Map vulnerable infill panels', 'Introduce decoupling gaps/connectors', 'Strengthen panel anchorage and edge details'],
    },
  ],
}

const resolveBestPracticeView = (
  practice: (typeof globalPracticeLibrary)['flood'][number],
  useUrdu: boolean,
) => {
  if (!useUrdu) {
    return {
      title: practice.title,
      region: practice.region,
      summary: practice.summary,
      steps: practice.steps,
    }
  }
  const ur = bestPracticeUr[practice.id]
  if (!ur) {
    return {
      title: practice.title,
      region: practice.region,
      summary: practice.summary,
      steps: practice.steps,
    }
  }
  return {
    title: ur.title,
    region: ur.region,
    summary: ur.summary,
    steps: ur.steps,
  }
}

const INFRA_MODEL_VISUAL_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="Model visual placeholder">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="960" height="540" fill="url(#bg)"/>
  <text x="480" y="248" text-anchor="middle" fill="#64748b" font-family="system-ui,Segoe UI,sans-serif" font-size="20" font-weight="600">Model illustration</text>
  <text x="480" y="286" text-anchor="middle" fill="#475569" font-family="system-ui,Segoe UI,sans-serif" font-size="15">Add a local image for this model folder, or open the PDF board.</text>
</svg>`,
)}`

const getVideoFailureMessage = (): string => MEDIA_UNAVAILABLE_MESSAGE

const getInfraModelCardIcon = (model: { id: string; title: string }) => {
  const signature = `${model.id} ${model.title}`.toLowerCase()
  if (signature.includes('flood')) return '🏠'
  if (signature.includes('school')) return '🏫'
  if (signature.includes('bridge')) return '🌉'
  if (signature.includes('shelter')) return '🛟'
  if (signature.includes('health')) return '🏥'
  if (signature.includes('water')) return '💧'
  if (signature.includes('utility')) return '⚡'
  if (signature.includes('drainage') || signature.includes('sponge')) return '🛣️'
  if (signature.includes('market')) return '🏬'
  if (signature.includes('eoc') || signature.includes('operations')) return '📡'
  return '🏗️'
}

const OFFICIAL_INFRA_VIDEO_CANDIDATES = [INFRA_MODELS_OFFICIAL_VIDEO_URL]
const EXPECTED_INFRA_MODEL_NAMES = new Set(INFRA_MODELS.map((model) => model.title))

const provinceCenters: Record<string, { lat: number; lng: number }> = {
  Punjab: { lat: 31.17, lng: 72.71 },
  Sindh: { lat: 26.87, lng: 68.37 },
  Balochistan: { lat: 28.49, lng: 65.1 },
  KP: { lat: 34.95, lng: 72.33 },
  GB: { lat: 35.8, lng: 74.5 },
}

const districtCenters: Record<string, { lat: number; lng: number }> = {
  Bahawalpur: { lat: 29.4, lng: 71.68 },
  Rajanpur: { lat: 29.1, lng: 70.33 },
  Lahore: { lat: 31.52, lng: 74.36 },
  Multan: { lat: 30.18, lng: 71.49 },
  Rawalpindi: { lat: 33.62, lng: 73.07 },
  Karachi: { lat: 24.86, lng: 67.01 },
  Larkana: { lat: 27.56, lng: 68.21 },
  Thatta: { lat: 24.75, lng: 67.92 },
  Sukkur: { lat: 27.71, lng: 68.84 },
  Peshawar: { lat: 34.01, lng: 71.58 },
  Swat: { lat: 34.8, lng: 72.35 },
  Chitral: { lat: 35.85, lng: 71.79 },
  Quetta: { lat: 30.18, lng: 66.97 },
  Gwadar: { lat: 25.12, lng: 62.33 },
  Khuzdar: { lat: 27.8, lng: 66.6 },
  Gilgit: { lat: 35.92, lng: 74.31 },
  Skardu: { lat: 35.3, lng: 75.63 },
}

const districtProvinceLookup = Object.entries(pakistanCitiesByProvince).reduce<Record<string, string>>((acc, [province, cities]) => {
  for (const city of cities) {
    acc[city] = province
  }
  return acc
}, {})

const toRadians = (value: number) => (value * Math.PI) / 180

const haversineDistanceKm = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
  const earthRadiusKm = 6371
  const deltaLat = toRadians(to.lat - from.lat)
  const deltaLng = toRadians(to.lng - from.lng)
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const findNearestCenterName = (
  source: { lat: number; lng: number },
  centers: Record<string, { lat: number; lng: number }>,
) => {
  let nearestName = ''
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const [name, point] of Object.entries(centers)) {
    const distance = haversineDistanceKm(source, point)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestName = name
    }
  }

  return nearestName
}

const getProvinceForDistrict = (district: string) => {
  const directProvince = districtProvinceLookup[district]
  if (directProvince) return directProvince
  const districtPoint = districtCenters[district]
  if (!districtPoint) return ''
  return findNearestCenterName(districtPoint, provinceCenters)
}

const provinceCatalog = ['Punjab', 'Sindh', 'Balochistan', 'KP', 'GB'] as const

const normalizeLocationToken = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const resolveProvinceFromText = (value?: string | null) => {
  if (!value) return ''
  const normalized = normalizeLocationToken(value)
  for (const province of provinceCatalog) {
    if (normalizeLocationToken(province) === normalized) return province
  }
  if (normalized.includes('khyber') || normalized.includes('pakhtunkhwa') || normalized === 'kp') return 'KP'
  if (normalized.includes('gilgit') || normalized.includes('baltistan') || normalized === 'gb') return 'GB'
  if (normalized.includes('baloch')) return 'Balochistan'
  if (normalized.includes('punjab')) return 'Punjab'
  if (normalized.includes('sindh')) return 'Sindh'
  if (normalized.includes('islamabad') || normalized === 'ict') return 'ICT'
  if (normalized.includes('azad') || normalized === 'ajk' || normalized.includes('jammukashmir')) return 'AJK'
  return ''
}

const resolveCityFromProvince = (province: string, rawCity?: string | null) => {
  const cities = pakistanCitiesByProvince[province] ?? []
  if (!rawCity || cities.length === 0) return cities[0] ?? 'Lahore'
  const normalizedRaw = normalizeLocationToken(rawCity)
  const exactMatch = cities.find((city) => normalizeLocationToken(city) === normalizedRaw)
  if (exactMatch) return exactMatch
  const partialMatch = cities.find((city) =>
    normalizeLocationToken(city).includes(normalizedRaw) || normalizedRaw.includes(normalizeLocationToken(city)),
  )
  return partialMatch ?? cities[0] ?? 'Lahore'
}

const toGpsLabel = (lat: number, lng: number) => `${lat.toFixed(4)}, ${lng.toFixed(4)}`

function readInitialSectionFromUrl(): SectionKey | null {
  return readPublicViewSectionFromUrl()
}

export type AppProps = Record<string, never>

const STATIC_INFRA_MODELS = INFRA_MODELS.map((model) => ({
  id: model.id,
  title: model.title,
  description: model.description,
  features: model.features,
  advantagesPakistan: model.advantagesPakistan,
  imageDataUrl: model.imageUrl,
}))

const STATIC_INFRA_MODEL_PDF_MAP: Record<string, string> = Object.fromEntries(
  INFRA_MODELS.map((model) => [model.id, model.pdfUrl]),
)

function App(_props: AppProps = {}) {
  const isAdminMode = false
  const isEditMode = false
  const appStateSyncHydratedRef = useRef(false)
  const appStateSyncTimerRef = useRef<number | null>(null)
  const [isQaRoute, setIsQaRoute] = useState<boolean>(() => window.location.hash === '#qa-responsive')
  const [showEarthquakeNotifyPrompt, setShowEarthquakeNotifyPrompt] = useState(false)
  const [earthquakeNotifyPermission, setEarthquakeNotifyPermission] = useState<NotificationPermission | 'unsupported'>(
    () => earthquakePushNotificationService.getPermissionState(),
  )
  const [earthquakeNotifySettings, setEarthquakeNotifySettings] = useState(() =>
    earthquakePushNotificationService.getSettings(),
  )
  const [earthquakeNotifyStatusMsg, setEarthquakeNotifyStatusMsg] = useState<string | null>(null)
  const [isSettingsCardViewport, setIsSettingsCardViewport] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(min-width: 1024px)').matches
  })
  const { language, setLanguage, t, isUrdu } = useLanguage()
  const [activeSection, setActiveSection] = useState<SectionKey | null>(() => readInitialSectionFromUrl())
  const [visitedSections, setVisitedSections] = useState<Set<SectionKey>>(() => {
    const initial = readInitialSectionFromUrl()
    return initial ? new Set([initial]) : new Set()
  })
  const [homeLayoutMode, setHomeLayoutMode] = useState<'grid' | 'carousel'>(() => readHomeLayoutMode())
  const [selectedRole, setSelectedRole] = useState<(typeof roleOptions)[number]>(() => 'Admin (Full Access)')
  const [homepageConfig] = useState<HomepageConfigPayload>(() => getStaticHomepageConfig())
  const [selectedProvince, setSelectedProvince] = useState('Punjab')
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [mapLayer, setMapLayer] = useState<'earthquake' | 'flood' | 'infraRisk'>('earthquake')
  const [alertFilterWindow, setAlertFilterWindow] = useState<AlertFilterWindow>('24h')
  const [selfAssessmentYearBuilt, setSelfAssessmentYearBuilt] = useState(2000)
  const [selfAssessmentConstruction, setSelfAssessmentConstruction] = useState('Reinforced Concrete')
  const [selfAssessmentDrainage, setSelfAssessmentDrainage] = useState<'Good' | 'Average' | 'Poor'>('Average')
  const [selfAssessmentSeismicZone, setSelfAssessmentSeismicZone] = useState<'Low' | 'Medium' | 'High'>('Medium')
  const [selfAssessmentFoundation, setSelfAssessmentFoundation] = useState<'Isolated Footing' | 'Raft' | 'Stone Masonry' | 'Unknown'>('Isolated Footing')
  const [emergencyKitChecks, setEmergencyKitChecks] = useState<Record<string, boolean>>(() => {
    const cached = localStorage.getItem('r360-emergency-kit-checks')
    if (!cached) return {}
    try {
      return parseEmergencyKitChecks(JSON.parse(cached) as Record<string, boolean>)
    } catch {
      return {}
    }
  })
  const [colorblindFriendlyMap] = useState(false)
  const [districtProfileSavedMsg] = useState<string | null>(null)
  const [locationAccessMsg, setLocationAccessMsg] = useState<string | null>(null)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [detectedUserLocation, setDetectedUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [hasTriedApplyAutoLocation, setHasTriedApplyAutoLocation] = useState(false)
  const [riskActionProgress, setRiskActionProgress] = useState(0)
  const [advisoryQuestion, setAdvisoryQuestion] = useState('')
  const [advisoryMessages, setAdvisoryMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([])
  const [isAskingAdvisory, setIsAskingAdvisory] = useState(false)
  const [advisoryError, setAdvisoryError] = useState<string | null>(null)
  const [advisoryCopyMsg, setAdvisoryCopyMsg] = useState<string | null>(null)
  const [structureReviewType, setStructureReviewType] = useState<'Home' | 'School' | 'Clinic' | 'Bridge' | 'Commercial' | 'Industrial'>('Home')
  const [cadNumFloors, setCadNumFloors] = useState(1)
  const [cadYearBuilt, setCadYearBuilt] = useState(2000)
  const [structureReviewGps, setStructureReviewGps] = useState('')
  const [structureReviewFile, setStructureReviewFile] = useState<File | null>(null)
  const [isSubmittingStructureReview, setIsSubmittingStructureReview] = useState(false)
  const [structureReviewResult, setStructureReviewResult] = useState<VisionAnalysisResult | null>(null)
  const [structureReviewError, setStructureReviewError] = useState<string | null>(null)
  const [isStructureReviewExpanded, setIsStructureReviewExpanded] = useState(false)
  const [buildingType, setBuildingType] = useState('Residential')
  const [, setLocationText] = useState('Lahore, Punjab')
  const [lifeline, setLifeline] = useState('No')
  const [structureType] = useState('Masonry House')
  const [retrofitCity, setRetrofitCity] = useState('Lahore')
  const [retrofitLocationMode, setRetrofitLocationMode] = useState<'auto' | 'manual'>('auto')
  const [retrofitAutoLocation, setRetrofitAutoLocation] = useState<{
    province: string
    city: string
    lat: number
    lng: number
  } | null>(null)
  const [retrofitAutoLocationPermissionGranted, setRetrofitAutoLocationPermissionGranted] = useState(false)
  const [retrofitManualProvince, setRetrofitManualProvince] = useState('Punjab')
  const [retrofitManualCity, setRetrofitManualCity] = useState('Lahore')
  const [retrofitImageSeriesFiles, setRetrofitImageSeriesFiles] = useState<File[]>([])
  const [retrofitImageSeriesPreviewUrls, setRetrofitImageSeriesPreviewUrls] = useState<string[]>([])
  const [retrofitImageSeriesResults, setRetrofitImageSeriesResults] = useState<RetrofitImageSeriesResult[]>([])
  const [retrofitGuidanceResults, setRetrofitGuidanceResults] = useState<RetrofitGuidanceResult[]>([])
  const [retrofitFinalEstimate, setRetrofitFinalEstimate] = useState<RetrofitFinalEstimate | null>(null)
  const [visionAnalysis, setVisionAnalysis] = useState<VisionAnalysisResult | null>(null)
  const [mlEstimate, setMlEstimate] = useState<MlRetrofitEstimate | null>(null)
  const [isGeneratingRetrofitGuidance, setIsGeneratingRetrofitGuidance] = useState(false)
  const [isCalculatingRetrofitEstimate, setIsCalculatingRetrofitEstimate] = useState(false)
  const [retrofitError, setRetrofitError] = useState<string | null>(null)
  const [alertLog, setAlertLog] = useState<LiveAlert[]>(() => {
    const cached = localStorage.getItem('r360-live-alerts')
    return cached ? JSON.parse(cached) : []
  })
  const [globalEarthquakes, setGlobalEarthquakes] = useState<GlobalEarthquake[]>(() => {
    const cached = localStorage.getItem('r360-global-earthquakes')
    return cached ? (JSON.parse(cached) as GlobalEarthquake[]) : []
  })
  const [, setIsLoadingGlobalEarthquakes] = useState(false)
  const [, setGlobalEarthquakeError] = useState<string | null>(null)
  const [, setGlobalEarthquakesSyncedAt] = useState<string | null>(() =>
    localStorage.getItem('r360-global-earthquakes-synced-at'),
  )
  const [showGlobalEarthquakesOnMap, setShowGlobalEarthquakesOnMap] = useState(false)
  const [globalEarthquakeMapFocusToken, setGlobalEarthquakeMapFocusToken] = useState(0)
  const [selectedGlobalEarthquakeId, setSelectedGlobalEarthquakeId] = useState<string | null>(null)
  const globalEarthquakeRequestInFlightRef = useRef(false)
  const globalEarthquakeAbortRef = useRef<AbortController | null>(null)
  const [bestPracticeHazard, setBestPracticeHazard] = useState<'flood' | 'earthquake'>('flood')
  const [bestPracticeImageLightbox, setBestPracticeImageLightbox] = useState<{ src: string; title: string } | null>(
    null,
  )
  const [applyProvince, setApplyProvince] = useState('Punjab')
  const [applyCity, setApplyCity] = useState('Lahore')
  const [applyHazard, setApplyHazard] = useState<'flood' | 'earthquake'>('flood')
  const [applyBestPracticeTitle, setApplyBestPracticeTitle] = useState(globalPracticeLibrary.flood[0]?.title ?? '')
  const [constructionGuidance, setConstructionGuidance] = useState<ConstructionGuidanceResult | null>(null)
  const [guidanceStepImages, setGuidanceStepImages] = useState<GuidanceStepImage[]>([])
  const [isGeneratingGuidance, setIsGeneratingGuidance] = useState(false)
  const [isGeneratingStepImages, setIsGeneratingStepImages] = useState(false)
  const [guidanceError, setGuidanceError] = useState<string | null>(null)
  const [isPreparingWordReport, setIsPreparingWordReport] = useState(false)
  const retrofitUploadInputRef = useRef<HTMLInputElement | null>(null)
  const [infraModelsError] = useState<string | null>(null)
  const [infraMediaByModelId, setInfraMediaByModelId] = useState<Record<string, { image?: string; pdf?: string }>>({})
  const [selectedInfraModelId, setSelectedInfraModelId] = useState<string | null>(null)
  const [infraModelCatalogQuery, setInfraModelCatalogQuery] = useState('')
  const [isInfraModelCatalogOpen, setIsInfraModelCatalogOpen] = useState(false)
  const [infraModelCatalogFocusIndex, setInfraModelCatalogFocusIndex] = useState(0)
  const infraModelCatalogRef = useRef<HTMLDivElement | null>(null)
  const [showInfraLayoutVideo, setShowInfraLayoutVideo] = useState(false)
  const [showReadinessLogicModal, setShowReadinessLogicModal] = useState(false)
  const [showFireSafetyLogicModal, setShowFireSafetyLogicModal] = useState(false)
  const [designProvince, setDesignProvince] = useState('Punjab')
  const [designCity, setDesignCity] = useState('Lahore')
  const [designSoilType, setDesignSoilType] = useState<'Rocky' | 'Sandy' | 'Clayey' | 'Silty' | 'Saline'>('Clayey')
  const [designHumidity, setDesignHumidity] = useState<'Low' | 'Medium' | 'High'>('Medium')
  const [slopeAngleDeg, setSlopeAngleDeg] = useState(18)
  const [slopeHeightM, setSlopeHeightM] = useState(4)
  const [shelterAreaSqm, setShelterAreaSqm] = useState(120)
  const [shelterOccupancyType, setShelterOccupancyType] = useState<'School' | 'Mosque' | 'House'>('School')
  const [designSummaryText] = useState<string | null>(null)
  const [showTrainingPrograms] = useState(false)
  const [activeLearnVideoId, setActiveLearnVideoId] = useState<string | null>(null)
  const [isLearnVideoVisible, setIsLearnVideoVisible] = useState(false)
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({
    windStormGuide: false,
    fieldImplementationChecklist: false,
    overallStructuralResilience: false,
    slopeStabilityEstimator: false,
    designKitCostEstimator: false,
    selfAssessment: false,
    fireSafetyCalculator: false,
    riskLocalAdvisoryChatbot: false,
    designSafeShelterCapacityPlanner: false,
    designRecommendedFoundation: false,
  })
  const [infraLayoutPlaybackSrc, setInfraLayoutPlaybackSrc] = useState('')
  const [infraLayoutVideoSourceIndex, setInfraLayoutVideoSourceIndex] = useState(0)
  const [learnVideoError, setLearnVideoError] = useState<string | null>(null)
  const [isLearnVideoMetadataReady, setIsLearnVideoMetadataReady] = useState(false)
  const [infraLayoutVideoError, setInfraLayoutVideoError] = useState<string | null>(null)
  const learnVideoRef = useRef<HTMLVideoElement | null>(null)
  const homeMetadataPrefetchDoneRef = useRef(false)
  const retrofitSectionRef = useRef<HTMLDivElement | null>(null)

  const retrofitLocaleBase = t.retrofit
  const {
    mergedRetrofit: cmsMergedRetrofit,
    retrofitCmsGlobalStyles,
    payload: retrofitCmsPayload,
  } = useRetrofitCms(language, retrofitLocaleBase)
  const effectiveLearnTrainingVideos = useMemo(() => {
    return LEARN_TRAIN_VIDEOS
      .filter(
        (v) =>
        !isExcludedLearnCatalogRow({
          id: v.id,
          title: v.title,
          summary: v.summary,
          fileName: v.fileName,
          url: learnTrainVideoUrl(v.fileName),
          s3Key: `resilience360/learn/${v.fileName}`,
        }),
      )
      .map((v) => ({
        ...v,
        url: String(v.url ?? '').trim() || learnTrainVideoUrl(v.fileName),
      }))
  }, [])
  const effectiveLearnVideoIconById: Record<string, string> = LEARN_TRAIN_ICON_MAP
  const effectiveProvinceRisk = provinceRisk
  const effectiveDistrictCenters = districtCenters

  useEffect(() => {
    const applyFromHistory = (state: unknown) => {
      const next = readActiveSectionFromHistoryState(state, window.location.href)
      setActiveSection(next)
      if (next) {
        setVisitedSections((previous) => {
          if (previous.has(next)) return previous
          const updated = new Set(previous)
          updated.add(next)
          return updated
        })
      }
    }
    applyFromHistory(history.state)
    const onPopState = (event: PopStateEvent) => {
      applyFromHistory(event.state)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  /** Bootstrap deep links so first Back returns to in-app Home (instead of exiting immediately). */
  useEffect(() => {
    try {
      const currentState = history.state
      const hasAppState =
        currentState !== null &&
        typeof currentState === 'object' &&
        'r360AppSection' in (currentState as Record<string, unknown>)

      if (hasAppState) return

      const deepLinkedSection = readPublicViewSectionFromUrl(window.location.href)
      if (!deepLinkedSection) {
        history.replaceState(historyStateWithAppSection(currentState, null), '', window.location.href)
        return
      }

      const initialHref = window.location.href
      const homeHref = buildHrefWithAppSection(initialHref, null)
      const deepHref = buildHrefWithAppSection(initialHref, deepLinkedSection)

      history.replaceState(historyStateWithAppSection(currentState, null), '', homeHref)
      history.pushState(historyStateWithAppSection(history.state, deepLinkedSection), '', deepHref)
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, [])

  // Infra Models are fully static from `src/config/infraModels.ts`.

  const mergedRetrofit = cmsMergedRetrofit


  const [appBrandIconIndex, setAppBrandIconIndex] = useState(0)
  const appBrandIconSrc = APP_BRAND_ICON_URL_CANDIDATES[appBrandIconIndex] ?? APP_BRAND_ICON_URL

  useEffect(() => {
    const id = 'r360-app-brand-icon-preload'
    const existing = document.getElementById(id)
    if (existing) return
    try {
      const link = document.createElement('link')
      link.id = id
      link.rel = 'preload'
      link.as = 'image'
      link.href = appBrandIconSrc
      document.head.appendChild(link)
      return () => link.remove()
    } catch {
      return undefined
    }
  }, [appBrandIconSrc])

  const retrofitCmsSectionStyle = useMemo((): CSSProperties | undefined => {
    const g = retrofitCmsGlobalStyles
    if (!g) return undefined
    const st: CSSProperties = {}
    if (g.backgroundColor) st.backgroundColor = g.backgroundColor
    if (g.textColor) st.color = g.textColor
    const tr = typeof g.transparency === 'number' ? g.transparency : 1
    if (tr < 1) st.opacity = tr
    return Object.keys(st).length > 0 ? st : undefined
  }, [retrofitCmsGlobalStyles])

  const riskMapUiLabels = useMemo(
    () => ({
      provinceView: t.riskMap.provinceView,
      backToProvinces: t.riskMap.backToProvinces,
      districtViewPrefix: t.riskMap.districtView,
      popupProvince: t.riskMap.popupProvince,
      popupType: t.riskMap.popupType,
      popupSeverity: t.riskMap.popupSeverity,
      layerEarthquake: t.riskMap.layerEarthquake,
      layerFlood: t.riskMap.layerFlood,
      layerInfraRisk: t.riskMap.layerInfraRisk,
      hazard: t.riskMap.hazard,
      year: t.riskMap.year,
      estimatedExtent: t.riskMap.estimatedExtent,
      livesLost: t.riskMap.livesLost,
      peopleAffected: t.riskMap.peopleAffected,
      economicCost: t.riskMap.economicCost,
      source: t.riskMap.source,
      depthKm: t.riskMap.depthKm,
      openDetails: t.riskMap.openDetails,
      yourLocation: t.riskMap.yourLocation,
      kmRadius: t.riskMap.kmRadius,
    }),
    [t.riskMap],
  )
  const isHomeView = !activeSection
  const homePresentation = useMemo(
    () =>
      computeHomePresentation({
        homepageConfig,
        selectedRole,
        language,
        t,
        isHomeView,
      }),
    [homepageConfig, selectedRole, language, t, isHomeView],
  )
  const {
    homeCardRows,
    homeHeroColorStyle,
    homeHeroTitleDisplay,
    homeHeroSubtitleDisplay,
    homeShellThemeVars,
  } = homePresentation

  /** Home page: show the original Live Earthquake Alerts tile in grid order. */
  const homeCardRowsForDisplay = useMemo(() => homeCardRows, [homeCardRows])


  const isApplyRegionView = activeSection === 'applyRegion'
  const isLearnView = activeSection === 'learn'
  const isBestPracticesView = activeSection === 'bestPractices' || isApplyRegionView
  const isRiskMapsView = activeSection === 'riskMaps'
  const isLiveEarthquakeMapView = activeSection === 'liveEarthquakeMap'
  const isReadinessView = activeSection === 'readiness'
  const ndmaBadgeTone: 'default' | 'home' | 'bestPractices' | 'riskMaps' | 'readiness' =
    isHomeView ? 'home'
    : isRiskMapsView || isLiveEarthquakeMapView ? 'riskMaps'
    : isBestPracticesView || isLearnView ? 'bestPractices'
    : isReadinessView ? 'readiness'
    : 'default'
  const useCarouselHomeLayout =
    isHomeView && homeLayoutMode === 'carousel' && !(isAdminMode && isEditMode)
  const interfaceToggleLabel = useMemo(
    () => (homeLayoutMode === 'carousel' ? 'Original Interface' : 'New Interface'),
    [homeLayoutMode],
  )
  const isEmbeddedPortalSection =
    activeSection === 'pgbc' ||
    activeSection === 'retrofitCalculator' ||
    activeSection === 'smartConstruction'
  const activeLearnVideo = useMemo(
    () => effectiveLearnTrainingVideos.find((video) => video.id === activeLearnVideoId) ?? null,
    [activeLearnVideoId, effectiveLearnTrainingVideos],
  )
  const filteredInfraModels = useMemo(() => {
    const query = infraModelCatalogQuery.trim().toLowerCase()
    if (!query) return STATIC_INFRA_MODELS
    return STATIC_INFRA_MODELS.filter((model) => {
      if (model.title.toLowerCase().includes(query)) return true
      if (model.description.toLowerCase().includes(query)) return true
      if (model.features.some((feature) => feature.toLowerCase().includes(query))) return true
      return model.advantagesPakistan.some((advantage) => advantage.toLowerCase().includes(query))
    })
  }, [infraModelCatalogQuery])
  const hasInfraCatalogMismatch = useMemo(() => {
    if (filteredInfraModels.length !== 16) return true
    const names = new Set(filteredInfraModels.map((model) => model.title))
    if (names.size !== 16) return true
    for (const expected of EXPECTED_INFRA_MODEL_NAMES) {
      if (!names.has(expected)) return true
    }
    return false
  }, [filteredInfraModels])
  const selectedInfraModel = useMemo(
    () => filteredInfraModels.find((model) => model.id === selectedInfraModelId) ?? null,
    [filteredInfraModels, selectedInfraModelId],
  )

  const bestPracticeImageById = BEST_PRACTICE_IMAGE_BY_ID
  const hasBestPracticeImageCatalogMismatch = useMemo(() => {
    if (BEST_PRACTICES_IMAGE_CONFIG.length !== 24) return true
    const uniqueIds = new Set(BEST_PRACTICES_IMAGE_CONFIG.map((item) => item.id))
    if (uniqueIds.size !== 24) return true
    const expectedPracticeIds = new Set([
      ...globalPracticeLibrary.flood.map((item) => item.id),
      ...globalPracticeLibrary.earthquake.map((item) => item.id),
    ])
    if (expectedPracticeIds.size !== 24) return true
    for (const id of expectedPracticeIds) {
      if (!bestPracticeImageById[id]?.imageUrl) return true
      if (!Array.isArray(bestPracticeImageById[id]?.imageCandidates) || bestPracticeImageById[id].imageCandidates.length === 0) {
        return true
      }
    }
    return false
  }, [])

  const selectedInfraModelPdfSrc = useMemo(() => {
    if (!selectedInfraModel) return undefined
    const fromMetadata = infraMediaByModelId[selectedInfraModel.id]?.pdf
    if (fromMetadata) return fromMetadata
    return STATIC_INFRA_MODEL_PDF_MAP[selectedInfraModel.id]
  }, [selectedInfraModel, infraMediaByModelId])

  const infraModelPdfCandidates = useMemo(() => {
    if (!selectedInfraModel) return []
    const primary = selectedInfraModelPdfSrc?.trim()
    return primary ? [primary] : []
  }, [selectedInfraModel, selectedInfraModelPdfSrc])

  const selectedInfraModelHeroImageSrc = useMemo(() => {
    if (!selectedInfraModel) return ''
    const fromMetadata = infraMediaByModelId[selectedInfraModel.id]?.image
    if (fromMetadata) return fromMetadata
    return selectedInfraModel.imageDataUrl
  }, [selectedInfraModel, infraMediaByModelId])

  const infraModelHeroCandidates = useMemo(() => {
    if (!selectedInfraModel) return []
    const primary = selectedInfraModelHeroImageSrc?.trim()
    return primary ? [primary] : [INFRA_MODEL_VISUAL_PLACEHOLDER]
  }, [selectedInfraModel, selectedInfraModelHeroImageSrc])

  const infraModelPdfEmbedKey = useMemo(
    () => {
      if (!selectedInfraModel) return 'none'
      return `${selectedInfraModel.id}|static-pdf`
    },
    [selectedInfraModel],
  )

  const openLearnVideoPlayer = useCallback(
    (videoId: string) => {
      setLearnVideoError(null)
      const selected = effectiveLearnTrainingVideos.find((video) => video.id === videoId) ?? null
      if (!selected) {
        setLearnVideoError(LEARN_VIDEO_UNAVAILABLE_MESSAGE)
        return
      }
      const selectedUrl = String(selected.url ?? '').trim() || learnTrainVideoUrl(selected.fileName)
      if (selectedUrl) {
        void mediaManager.preloadVideoMetadata(selectedUrl)
      }

      setIsLearnVideoMetadataReady(false)
      setActiveLearnVideoId(videoId)
      setIsLearnVideoVisible(true)
    },
    [effectiveLearnTrainingVideos],
  )

  const closeLearnVideoModal = useCallback(() => {
    setIsLearnVideoVisible(false)
    setActiveLearnVideoId(null)
    setLearnVideoError(null)
    setIsLearnVideoMetadataReady(false)
  }, [])

  useEffect(() => {
    if (activeSection !== 'learn' || !isLearnVideoVisible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLearnVideoModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeSection, isLearnVideoVisible, closeLearnVideoModal])

  useEffect(() => {
    if (activeSection !== 'learn' || !isLearnVideoVisible) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [activeSection, isLearnVideoVisible])

  /** Learn playback: strict static mapping from `LEARN_VIDEO_BASE` only. */
  const learnPlayerPlayback = useMemo(() => {
    if (activeSection !== 'learn' || !isLearnVideoVisible || !activeLearnVideo) {
      return { videoSrc: '', resolveError: null as string | null }
    }
    try {
      const finalUrl = resolveLearnVideoUrl(activeLearnVideo)
      return { videoSrc: finalUrl, resolveError: null }
    } catch {
      return { videoSrc: '', resolveError: LEARN_VIDEO_UNAVAILABLE_MESSAGE }
    }
  }, [activeSection, isLearnVideoVisible, activeLearnVideo])

  const infraLayoutVideoSourceCandidates = useMemo(() => {
    return OFFICIAL_INFRA_VIDEO_CANDIDATES.filter((source) => {
      const s = String(source ?? '').trim()
      if (!s) return false
      return /\/(content|storage\/content)\//i.test(s)
    })
  }, [])

  const activeInfraLayoutVideoSrc = infraLayoutVideoSourceCandidates[infraLayoutVideoSourceIndex] ?? ''
  const activeInfraMediaSrc = useMemo(() => {
    return INFRA_MODELS_OFFICIAL_VIDEO_URL
  }, [])
  const handleLearnVideoLoadError = useCallback((event: SyntheticEvent<HTMLVideoElement>) => {
    const el = event.currentTarget
    if (el.dataset.r360RetryPending !== '1') {
      el.dataset.r360RetryPending = '1'
      window.setTimeout(() => {
        try {
          el.load()
        } catch {
          /* no-op */
        }
      }, 220)
      return
    }
    el.dataset.r360RetryPending = '0'
    const message = LEARN_VIDEO_UNAVAILABLE_MESSAGE
    setLearnVideoError(message)
    void el
  }, [])

  const handleInfraLayoutVideoLoadError = useCallback((event: SyntheticEvent<HTMLVideoElement>) => {
    const el = event.currentTarget
    const message = getVideoFailureMessage()
    setInfraLayoutVideoError(message)
    void el
    setInfraLayoutVideoSourceIndex((previous) => {
      if (infraLayoutVideoSourceCandidates.length === 0) {
        return 0
      }
      if (previous >= infraLayoutVideoSourceCandidates.length - 1) {
        return 0
      }
      return previous + 1
    })
  }, [infraLayoutVideoSourceCandidates])

  const openInfraLayoutVideo = useCallback(() => {
    setInfraLayoutVideoError(null)
    const first = infraLayoutVideoSourceCandidates[0] ?? ''
    if (!first || !/\/(content|storage\/content)\//i.test(first)) {
      setInfraLayoutVideoError('Invalid video source.')
      return
    }
    setInfraLayoutPlaybackSrc(first)
    setInfraLayoutVideoSourceIndex(0)
    setShowInfraLayoutVideo(true)
  }, [infraLayoutVideoSourceCandidates])

  useEffect(() => {
    if (activeSection !== 'learn' || !isLearnVideoVisible || !learnPlayerPlayback.videoSrc) return
    const el = learnVideoRef.current
    if (el) {
      setIsLearnVideoMetadataReady(false)
      el.load()
    }
  }, [learnPlayerPlayback.videoSrc, activeSection, isLearnVideoVisible])

  useEffect(() => {
    if (!showInfraLayoutVideo) {
      setInfraLayoutPlaybackSrc('')
      setInfraLayoutVideoSourceIndex(0)
      return
    }

    setInfraLayoutVideoError(null)
    setInfraLayoutVideoSourceIndex(0)
    setInfraLayoutPlaybackSrc(infraLayoutVideoSourceCandidates[0] ?? '')
  }, [infraLayoutVideoSourceCandidates, showInfraLayoutVideo])

  const togglePanel = useCallback((panelKey: string) => {
    setExpandedPanels((previous) => ({
      ...previous,
      [panelKey]: !previous[panelKey],
    }))
  }, [])

  const navigateToSection = useCallback(
    (nextSection: SectionKey | null, opts?: { bypassEditLock?: boolean }) => {
      if (
        isAdminMode &&
        isEditMode &&
        !opts?.bypassEditLock &&
        nextSection !== 'disasterDashboard' &&
        nextSection !== 'liveEarthquakeMap'
      ) {
        return
      }
      if (nextSection === activeSection) return
      try {
        const nextUrl = buildHrefWithAppSection(window.location.href, nextSection)
        history.pushState(historyStateWithAppSection(history.state, nextSection), '', nextUrl)
      } catch {
        /* ignore invalid history / file URLs */
      }
      setActiveSection(nextSection)
      if (nextSection) {
        setVisitedSections((previous) => {
          if (previous.has(nextSection)) return previous
          const next = new Set(previous)
          next.add(nextSection)
          return next
        })
      }
    },
    [activeSection, isAdminMode, isEditMode],
  )

  useEffect(() => {
    preloadSectionModules()
    preloadAppMedia([DEFAULT_SHELL_LOGO_URL, APP_BRAND_ICON_URL, ...APP_BRAND_ICON_URL_CANDIDATES])
  }, [])

  useEffect(() => {
    if (activeSection !== null) return
    if (homeMetadataPrefetchDoneRef.current) return
    homeMetadataPrefetchDoneRef.current = true

    const targets = [
      '/api/content/learn-train',
      '/api/content/best-practices',
      '/api/content/material-hubs',
      '/api/content/disaster-dashboard',
      '/api/content/smart-construction',
    ]

    const runPrefetch = async () => {
      await Promise.allSettled(
        targets.flatMap((path) =>
          buildApiTargets(path).map((url) =>
            fetch(url, { cache: 'force-cache' }).catch(() => {
              /* prefetch best-effort */
            }),
          ),
        ),
      )
    }

    const win = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
      cancelIdleCallback?: (handle: number) => void
    }

    if (typeof window !== 'undefined' && typeof win.requestIdleCallback === 'function') {
      const idleId = win.requestIdleCallback(() => {
        void runPrefetch()
      }, { timeout: 3500 })
      return () => win.cancelIdleCallback?.(idleId)
    }

    const timer = window.setTimeout(() => {
      void runPrefetch()
    }, 900)
    return () => window.clearTimeout(timer)
  }, [activeSection])

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search)
      if (q.get('cms') === 'retrofit') {
        navigateToSection('retrofit')
      }
    } catch {
      /* ignore */
    }
  }, [navigateToSection])

  useEffect(() => {
    let active = true

    const hydrateSharedAppState = async () => {
      try {
        const sharedState = await loadSharedAppState()
        if (!active || !sharedState) return

        setEmergencyKitChecks(parseEmergencyKitChecks(sharedState.emergencyKitChecks))
      } finally {
        appStateSyncHydratedRef.current = true
      }
    }

    void hydrateSharedAppState()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.removeItem('r360-offline')
      localStorage.removeItem('r360-lightweight')
    } catch {
      /* ignore */
    }
    localStorage.setItem('r360-emergency-kit-checks', JSON.stringify(emergencyKitChecks))

    if (!appStateSyncHydratedRef.current) {
      return
    }

    if (appStateSyncTimerRef.current !== null) {
      window.clearTimeout(appStateSyncTimerRef.current)
    }

    appStateSyncTimerRef.current = window.setTimeout(() => {
      void saveSharedAppState({ emergencyKitChecks })
    }, 500)

    return () => {
      if (appStateSyncTimerRef.current !== null) {
        window.clearTimeout(appStateSyncTimerRef.current)
      }
    }
  }, [emergencyKitChecks])

  // Initialize push notifications for earthquake alerts
  useEffect(() => {
    try {
      void earthquakePushNotificationService.initialize()
      setEarthquakeNotifyPermission(earthquakePushNotificationService.getPermissionState())
      setEarthquakeNotifySettings(earthquakePushNotificationService.getSettings())
    } catch {
      /* keep app shell stable if push init fails */
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        if (earthquakePushNotificationService.shouldShowPrompt()) {
          setShowEarthquakeNotifyPrompt(true)
        }
      } catch {
        /* ignore prompt-check failures */
      }
    }, 1600)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setIsSettingsCardViewport(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const enableEarthquakeBrowserNotifications = useCallback(async () => {
    const permission = await earthquakePushNotificationService.requestPermissionFromUserGesture()
    setEarthquakeNotifyPermission(permission)
    if (permission === 'granted') {
      setEarthquakeNotifyStatusMsg('Permission granted.')
      setShowEarthquakeNotifyPrompt(false)
      return
    }
    setEarthquakeNotifyStatusMsg('Notifications were not enabled by the browser.')
    setShowEarthquakeNotifyPrompt(false)
  }, [])

  const maybeLaterEarthquakeNotifications = useCallback(() => {
    earthquakePushNotificationService.markPromptLater()
    setShowEarthquakeNotifyPrompt(false)
  }, [])

  const updateEarthquakeNotifySettings = useCallback(
    (patch: Partial<{ enabled: boolean; soundEnabled: boolean; threshold: number }>) => {
      const next = earthquakePushNotificationService.updateSettings(patch)
      setEarthquakeNotifySettings(next)
    },
    [],
  )

  const sendEarthquakeNotificationTest = useCallback(async () => {
    const ok = await earthquakePushNotificationService.showTestNotification()
    setEarthquakeNotifyStatusMsg(ok ? 'Test alert delivered.' : 'Test alert failed. Grant browser permission first.')
  }, [])

  const sendEarthquakeSoundTest = useCallback(async () => {
    const ok = await earthquakePushNotificationService.playTestSound()
    setEarthquakeNotifyStatusMsg(ok ? 'Alert sound played.' : 'Sound playback blocked by browser autoplay policy.')
  }, [])

  const toggleBrowserNotificationPreference = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        void enableEarthquakeBrowserNotifications()
        return
      }
      setEarthquakeNotifyStatusMsg('Browser notification permission can be changed from browser site settings.')
    },
    [enableEarthquakeBrowserNotifications],
  )

  const districtRiskLookup = useMemo(() => districtRiskLookupByName(), [])
  const availableMapDistricts = useMemo(() => listDistrictsByProvince(selectedProvince), [selectedProvince])
  const selectedDistrictProfile = useMemo<DistrictRiskProfile | null>(
    () => findDistrictRiskProfile(selectedProvince, selectedDistrict),
    [selectedDistrict, selectedProvince],
  )
  const riskValue =
    selectedDistrictProfile?.[mapLayer] ??
    effectiveProvinceRisk[selectedProvince]?.[mapLayer] ??
    'Low'
  const hazardAlertOverlay = useMemo<HazardAlertOverlay[]>(() => {
    const basePoint = selectedDistrict ? effectiveDistrictCenters[selectedDistrict] : provinceCenters[selectedProvince]
    const fallbackLat = basePoint?.lat ?? 30.2
    const fallbackLng = basePoint?.lng ?? 69.3

    const mapped = alertLog.slice(0, 8).map((alert, index) => {
      const lower = alert.title.toLowerCase()
      const inferredType: HazardAlertOverlay['type'] = lower.includes('rain') || lower.includes('flood')
        ? lower.includes('rain')
          ? 'Heavy Rain'
          : 'Flood Warning'
        : lower.includes('earthquake') || lower.includes('quake')
          ? 'Earthquake'
          : 'Relief Point'
      const severity: HazardAlertOverlay['severity'] = lower.includes('severe') || lower.includes('high')
        ? 'High'
        : lower.includes('moderate')
          ? 'Medium'
          : 'Low'
      const icon = inferredType === 'Flood Warning' ? '⚠️' : inferredType === 'Heavy Rain' ? '🌧️' : inferredType === 'Earthquake' ? '🧯' : '🛰️'
      const publishedAt = alert.publishedAt ?? new Date(Date.now() - index * 6 * 60 * 60 * 1000).toISOString()

      return {
        id: `overlay-${alert.id}`,
        title: alert.title,
        type: inferredType,
        severity,
        advisory: alert.summary ?? 'Follow district advisories and verify nearest shelter route.',
        icon,
        publishedAt,
        isOngoing: index % 3 === 0,
        lat: fallbackLat + ((index % 3) - 1) * 0.16,
        lng: fallbackLng + ((index % 2) - 0.5) * 0.22,
      }
    })

    return mapped
  }, [alertLog, selectedDistrict, selectedProvince, effectiveDistrictCenters])
  const filteredHazardAlerts = useMemo(() => {
    const now = Date.now()
    return hazardAlertOverlay.filter((item) => {
      if (alertFilterWindow === 'ongoing') return item.isOngoing
      const ageHours = (now - Date.parse(item.publishedAt)) / (1000 * 60 * 60)
      return alertFilterWindow === '24h' ? ageHours <= 24 : ageHours <= 24 * 7
    })
  }, [alertFilterWindow, hazardAlertOverlay])
  const availableRetrofitCities = useMemo(() => pakistanCitiesByProvince[selectedProvince] ?? [], [selectedProvince])
  const availableRetrofitManualCities = useMemo(
    () => pakistanCitiesByProvince[retrofitManualProvince] ?? [],
    [retrofitManualProvince],
  )
  const effectiveRetrofitLocation = useMemo(() => {
    const manualProvince = retrofitManualProvince || 'Punjab'
    const manualCity = retrofitManualCity || pakistanCitiesByProvince[manualProvince]?.[0] || 'Lahore'
    const manual = {
      source: 'manual' as const,
      province: manualProvince,
      city: manualCity,
      label: `Manual Location: ${manualCity}, ${manualProvince}`,
    }

    if (retrofitLocationMode === 'auto' && retrofitAutoLocationPermissionGranted && retrofitAutoLocation) {
      return {
        source: 'auto' as const,
        province: retrofitAutoLocation.province,
        city: retrofitAutoLocation.city,
        label: `Auto-detected Location: ${retrofitAutoLocation.city}, ${retrofitAutoLocation.province} (GPS: ${toGpsLabel(retrofitAutoLocation.lat, retrofitAutoLocation.lng)})`,
      }
    }

    return manual
  }, [
    retrofitAutoLocation,
    retrofitAutoLocationPermissionGranted,
    retrofitLocationMode,
    retrofitManualCity,
    retrofitManualProvince,
  ])
  const availableApplyCities = useMemo(() => pakistanCitiesByProvince[applyProvince] ?? [], [applyProvince])
  const availableApplyBestPractices = useMemo(() => globalPracticeLibrary[applyHazard], [applyHazard])
  const availableDesignCities = useMemo(() => pakistanCitiesByProvince[designProvince] ?? [], [designProvince])
  const visibleGlobalPractices = useMemo(() => globalPracticeLibrary[bestPracticeHazard], [bestPracticeHazard])

  useEffect(() => {
    if (!availableRetrofitCities.includes(retrofitCity)) {
      setRetrofitCity(availableRetrofitCities[0] ?? '')
    }
  }, [availableRetrofitCities, retrofitCity])

  useEffect(() => {
    if (!availableRetrofitManualCities.includes(retrofitManualCity)) {
      setRetrofitManualCity(availableRetrofitManualCities[0] ?? '')
    }
  }, [availableRetrofitManualCities, retrofitManualCity])

  useEffect(() => {
    return () => {
      retrofitImageSeriesPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [retrofitImageSeriesPreviewUrls])

  useEffect(() => {
    if (!availableApplyCities.includes(applyCity)) {
      setApplyCity(availableApplyCities[0] ?? '')
    }
  }, [availableApplyCities, applyCity])

  useEffect(() => {
    if (!availableApplyBestPractices.some((item) => item.title === applyBestPracticeTitle)) {
      setApplyBestPracticeTitle(availableApplyBestPractices[0]?.title ?? '')
    }
  }, [availableApplyBestPractices, applyBestPracticeTitle])

  useEffect(() => {
    if (!availableDesignCities.includes(designCity)) {
      setDesignCity(availableDesignCities[0] ?? '')
    }
  }, [availableDesignCities, designCity])

  useEffect(() => {
    if (activeSection !== 'infraModels') return
    let cancelled = false
    void loadInfraModelsMetadataOnce().then((map) => {
      if (!map || cancelled) return
      setInfraMediaByModelId((prev) => ({ ...prev, ...map }))
    })
    return () => {
      cancelled = true
    }
  }, [activeSection])

  useEffect(() => {
    if (activeSection !== 'infraModels' || filteredInfraModels.length === 0) return
    const first = filteredInfraModels[0]
    const firstImage = infraMediaByModelId[first.id]?.image || first.imageDataUrl
    const firstPdf = infraMediaByModelId[first.id]?.pdf || STATIC_INFRA_MODEL_PDF_MAP[first.id]
    if (firstImage) preloadInfraImage(firstImage)
    if (firstPdf) preloadInfraPdf(firstPdf)
    preloadInfraVideo(INFRA_MODELS_OFFICIAL_VIDEO_URL)
  }, [activeSection, filteredInfraModels, infraMediaByModelId])

  useEffect(() => {
    if (!selectedInfraModelId) return
    if (!filteredInfraModels.some((model) => model.id === selectedInfraModelId)) {
      setSelectedInfraModelId(null)
    }
  }, [filteredInfraModels, selectedInfraModelId])

  useEffect(() => {
    if (selectedInfraModelId || filteredInfraModels.length === 0) return
    setSelectedInfraModelId(filteredInfraModels[0].id)
  }, [filteredInfraModels, selectedInfraModelId])

  useEffect(() => {
    if (!isInfraModelCatalogOpen) return
    const selectedIndex = filteredInfraModels.findIndex((model) => model.id === selectedInfraModelId)
    setInfraModelCatalogFocusIndex(selectedIndex >= 0 ? selectedIndex : 0)
  }, [isInfraModelCatalogOpen, filteredInfraModels, selectedInfraModelId])

  useEffect(() => {
    if (!isInfraModelCatalogOpen) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!infraModelCatalogRef.current?.contains(target)) {
        setIsInfraModelCatalogOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsInfraModelCatalogOpen(false)
      }
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isInfraModelCatalogOpen])

  useEffect(() => {
    if (!selectedDistrict) return
    if (!availableMapDistricts.includes(selectedDistrict)) {
      setSelectedDistrict(null)
    }
  }, [availableMapDistricts, selectedDistrict])

  useEffect(() => {
    setRiskActionProgress(12)
    const timer = window.setTimeout(() => setRiskActionProgress(selectedDistrict ? 100 : 54), 260)
    return () => window.clearTimeout(timer)
  }, [selectedDistrict, mapLayer])

  useEffect(() => {
    setBestPracticeImageLightbox(null)
  }, [bestPracticeHazard])

  useEffect(() => {
    if (activeSection !== 'bestPractices') setBestPracticeImageLightbox(null)
  }, [activeSection])

  useEffect(() => {
    if (!bestPracticeImageLightbox) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setBestPracticeImageLightbox(null)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [bestPracticeImageLightbox])

  useEffect(() => {
    if (activeSection !== 'readiness') {
      setShowReadinessLogicModal(false)
      setShowFireSafetyLogicModal(false)
    }
  }, [activeSection])

  useEffect(() => {
    if (!showReadinessLogicModal && !showFireSafetyLogicModal) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowReadinessLogicModal(false)
        setShowFireSafetyLogicModal(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showReadinessLogicModal, showFireSafetyLogicModal])

  const generateApplyAreaGuidance = async (bestPracticeNameOverride?: string) => {
    setGuidanceError(null)
    setConstructionGuidance(null)
    setGuidanceStepImages([])
    setIsGeneratingGuidance(true)

    try {
      const { generateConstructionGuidance, generateGuidanceStepImages } = await loadConstructionGuidanceService()
      const selectedBestPracticeName = bestPracticeNameOverride ?? applyBestPracticeTitle

      const guidance = await generateConstructionGuidance({
        province: applyProvince,
        city: applyCity,
        hazard: applyHazard,
        structureType,
        bestPracticeName: selectedBestPracticeName,
      })

      setConstructionGuidance(guidance)

      setIsGeneratingStepImages(true)

      try {
        const stepsForImages = isUrdu ? guidance.stepsUrdu : guidance.steps
        const imageResult = await generateGuidanceStepImages({
          province: applyProvince,
          city: applyCity,
          hazard: applyHazard,
          structureType,
          bestPracticeName: selectedBestPracticeName,
          steps: stepsForImages,
        })

        if (imageResult.images.length < guidance.steps.length) {
          throw new Error('AI image generation returned incomplete step visuals. Please try again.')
        }
        setGuidanceStepImages(imageResult.images)
      } catch (error) {
        setGuidanceError(error instanceof Error ? error.message : 'Step image generation failed.')
      } finally {
        setIsGeneratingStepImages(false)
      }
    } catch (error) {
      setGuidanceError(error instanceof Error ? error.message : 'Guidance generation failed.')
    } finally {
      setIsGeneratingGuidance(false)
    }
  }

  const downloadApplyGuidanceWordReport = async () => {
    if (!constructionGuidance) return

    setIsPreparingWordReport(true)

    try {
      const { generateGuidanceStepImages } = await loadConstructionGuidanceService()
      const reportLanguage = isUrdu ? 'urdu' : 'english'
      let reportImages = guidanceStepImages
      const isEnglishReport = reportLanguage === 'english'
      const reportSteps = isEnglishReport ? constructionGuidance.steps : constructionGuidance.stepsUrdu

      if (reportImages.length < reportSteps.length) {
        try {
          const imageResult = await generateGuidanceStepImages({
            province: applyProvince,
            city: applyCity,
            hazard: applyHazard,
            structureType,
            bestPracticeName: applyBestPracticeTitle,
            steps: reportSteps,
          })

          if (imageResult.images.length < reportSteps.length) {
            setGuidanceError(t.applyRegion.guidanceReportBlocked)
            return
          }

          reportImages = imageResult.images
          setGuidanceStepImages(imageResult.images)
        } catch (error) {
          setGuidanceError(error instanceof Error ? error.message : t.applyRegion.guidanceReportImageFailed)
          return
        }
      }

      const toImageBytes = (dataUrl: string): Uint8Array => {
      const base64 = dataUrl.split(',')[1] ?? ''
      const binary = window.atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
      }
      return bytes
    }

      const getImageSize = (dataUrl: string): Promise<{ width: number; height: number }> =>
      new Promise((resolve) => {
        const img = new window.Image()
        img.onload = () => {
          const maxWidth = 560
          const naturalWidth = img.naturalWidth || 1024
          const naturalHeight = img.naturalHeight || 768
          const ratio = naturalHeight / naturalWidth
          const width = Math.min(maxWidth, naturalWidth)
          const height = Math.max(220, Math.round(width * ratio))
          resolve({ width, height })
        }
        img.onerror = () => resolve({ width: 520, height: 320 })
        img.src = dataUrl
      })

      const { AlignmentType, Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } = await import('docx')

      const renderedAt = new Date().toLocaleString()
      const reportTitle = isEnglishReport ? t.applyRegion.wordReportTitleEnglish : t.applyRegion.wordReportTitleUrdu
      const areaLabel = isEnglishReport ? 'Area' : 'علاقہ'
      const hazardLabel = isEnglishReport ? 'Hazard' : 'خطرہ'
      const bestPracticeLabel = isEnglishReport ? 'Best Practice' : 'بہترین طریقہ کار'
      const generatedLabel = isEnglishReport ? 'Generated' : 'تیار کردہ وقت'
      const summaryHeading = isEnglishReport ? 'Executive Summary' : 'خلاصہ'
      const materialsHeading = isEnglishReport ? 'Recommended Materials' : 'تجویز کردہ مواد'
      const safetyHeading = isEnglishReport ? 'Safety Requirements' : 'حفاظتی ہدایات'
      const stepLabel = isEnglishReport ? 'Step' : 'مرحلہ'
      const keyChecksHeading = isEnglishReport ? 'Key Checks' : 'اہم جانچ نکات'
      const stepVisualCaption = isEnglishReport ? 'Step visual' : 'مرحلے کی تصویر'
      const reportSummary = isEnglishReport ? constructionGuidance.summary : constructionGuidance.summaryUrdu
      const reportMaterials = isEnglishReport ? constructionGuidance.materials : constructionGuidance.materialsUrdu
      const reportSafety = isEnglishReport ? constructionGuidance.safety : constructionGuidance.safetyUrdu
      const docChildren = [
      new Paragraph({
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: reportTitle, bold: true, size: 34 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 260 },
        children: [
          new TextRun({
            text: `${areaLabel}: ${applyCity}, ${applyProvince}   |   ${hazardLabel}: ${applyHazard}   |   ${bestPracticeLabel}: ${applyBestPracticeTitle}   |   ${generatedLabel}: ${renderedAt}`,
            size: 20,
          }),
        ],
      }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, text: summaryHeading }),
      new Paragraph({ text: reportSummary, spacing: { after: 220 } }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, text: materialsHeading }),
      ...reportMaterials.map((item) => new Paragraph({ text: item, bullet: { level: 0 } })),
      new Paragraph({ text: '', spacing: { after: 120 } }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, text: safetyHeading }),
      ...reportSafety.map((item) => new Paragraph({ text: item, bullet: { level: 0 } })),
      new Paragraph({ text: '', spacing: { after: 140 } }),
    ]

      for (const [index, step] of reportSteps.entries()) {
        const image = isEnglishReport
          ? reportImages.find((item) => item.stepTitle === step.title) ?? reportImages[index]
          : reportImages[index]

        docChildren.push(
        new Paragraph({ heading: HeadingLevel.HEADING_2, text: `${stepLabel} ${index + 1}: ${step.title}`, spacing: { before: 240, after: 80 } }),
        new Paragraph({ text: step.description, spacing: { after: 100 } }),
        new Paragraph({ text: keyChecksHeading, heading: HeadingLevel.HEADING_3 }),
        ...step.keyChecks.map((item) => new Paragraph({ text: item, bullet: { level: 0 } })),
      )

        if (image?.imageDataUrl) {
          const imageBytes = toImageBytes(image.imageDataUrl)
          const imageSize = await getImageSize(image.imageDataUrl)

          docChildren.push(
          new Paragraph({ text: '', spacing: { after: 80 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: imageBytes,
                type: 'png',
                transformation: {
                  width: imageSize.width,
                  height: imageSize.height,
                },
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [new TextRun({ text: `${stepLabel} ${index + 1} ${stepVisualCaption}`, italics: true, size: 18 })],
          }),
        )
        }
      }

      const report = new Document({
        sections: [
          {
            children: docChildren,
          },
        ],
      })

      const blob = await Packer.toBlob(report)
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `resilience360-guidance-report-${reportLanguage}-${applyProvince}-${applyCity}-${Date.now()}.docx`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      window.URL.revokeObjectURL(url)
    } finally {
      setIsPreparingWordReport(false)
    }
  }

  const designHazardOverlay = useMemo(() => getHazardOverlay(designProvince, designCity), [designProvince, designCity])

  const materialSuitability = useMemo(() => {
    const recommendations: string[] = []
    const flags: string[] = []

    if (designHazardOverlay.seismicZone >= 4) {
      recommendations.push('Ductile RCC frame with confined masonry infill')
      recommendations.push('Stone masonry only with proper confinement and bands')
      flags.push('Unreinforced masonry (URM) is unsafe for this seismic zone')
    } else {
      recommendations.push('Confined masonry with reinforced bands')
      recommendations.push('RCC with corrosion-protected reinforcement')
    }

    if (designHumidity === 'High' || designSoilType === 'Saline') {
      recommendations.push('Lime-stabilized blocks with damp-proof layer')
      flags.push('Saline/humid conditions require sulfate-resistant cement')
    }

    if (designSoilType === 'Clayey') {
      flags.push('Clayey soil: settlement risk, avoid shallow unreinforced footings')
    }

    if (designHazardOverlay.floodDepth100y >= 1.5) {
      recommendations.push('Flood-resistant plinth and water-resistant lower finishes')
      flags.push('Flood depth >1.5m: avoid untreated mud walls at base level')
    }

    return {
      recommendations,
      flags,
    }
  }, [designHazardOverlay.floodDepth100y, designHazardOverlay.seismicZone, designHumidity, designSoilType])

  const slopeEstimator = useMemo(() => {
    const angleFactor = slopeAngleDeg / 30
    const heightFactor = slopeHeightM / 5
    const soilFactor = designSoilType === 'Rocky' ? 0.8 : designSoilType === 'Sandy' ? 1.05 : designSoilType === 'Clayey' ? 1.2 : 1.1
    const riskIndex = angleFactor * 40 + heightFactor * 35 + soilFactor * 25

    const stabilityClass = riskIndex >= 95 ? 'High Risk' : riskIndex >= 70 ? 'Moderate Risk' : 'Low Risk'
    const wallType = riskIndex >= 95 ? 'Reinforced concrete cantilever wall' : riskIndex >= 70 ? 'Gravity wall with toe key' : 'Dry/lean concrete retaining wall'
    const embedment = Math.max(0.8, Math.round((slopeHeightM * (riskIndex >= 95 ? 0.35 : riskIndex >= 70 ? 0.28 : 0.22)) * 10) / 10)
    const drainage = riskIndex >= 70 ? 'Provide weep holes + perforated back drain + geotextile filter' : 'Provide basic back drain and weep holes'

    return { stabilityClass, wallType, embedment, drainage }
  }, [designSoilType, slopeAngleDeg, slopeHeightM])

  const shelterCapacityPlan = useMemo(() => {
    const areaPerPerson = shelterOccupancyType === 'School' ? 1.2 : shelterOccupancyType === 'Mosque' ? 1 : 1.5
    const maxCapacity = Math.max(5, Math.floor(shelterAreaSqm / areaPerPerson))

    const layout = [
      'Keep 1.2m minimum circulation aisle',
      'Reserve corner zone for first aid and women/children support',
      'Provide separate WASH access and ventilation path',
    ]

    return { maxCapacity, areaPerPerson, layout }
  }, [shelterAreaSqm, shelterOccupancyType])

  const foundationRecommendation = useMemo(() => {
    const soil = designSoilType
    const flood = designHazardOverlay.floodDepth100y
    const seismic = designHazardOverlay.seismicZone

    if (flood >= 1.6 || soil === 'Saline') {
      return {
        type: 'Pile foundation with elevated plinth beam',
        risks: ['Differential settlement risk in saturated layers', 'Corrosion risk in saline moisture'],
      }
    }
    if (seismic >= 4 || soil === 'Sandy') {
      return {
        type: 'Raft foundation with tie beams',
        risks: ['Liquefaction-induced settlement if compaction is weak'],
      }
    }
    if (soil === 'Clayey') {
      return {
        type: 'Strip footing with moisture control and tie beams',
        risks: ['Shrink-swell movement under seasonal moisture variation'],
      }
    }

    return {
      type: 'Conventional strip footing',
      risks: ['Verify bearing capacity with local geotechnical check'],
    }
  }, [designHazardOverlay.floodDepth100y, designHazardOverlay.seismicZone, designSoilType])

  const windStormGuide = useMemo(() => {
    const coastal = coastalCities.has(designCity)
    return {
      roofAngle: coastal ? '22°–30°' : '18°–25°',
      openings: coastal ? 'Openings ≤20% on windward wall with storm shutters' : 'Openings ≤30% with lintel anchorage',
      tieBeams: coastal ? 'Continuous tie beams with corrosion-resistant anchors at all wall junctions' : 'Tie beams at plinth/lintel/roof levels',
      note: coastal ? 'High storm exposure: prioritize roof hold-down anchors and edge detailing.' : 'Standard wind resistance detailing is sufficient with proper anchorage.',
    }
  }, [designCity])

  const nonStructuralChecklist = useMemo(
    () => [
      'Anchor rooftop solar panels with wind-rated brackets',
      'Brace overhead and wall-mounted water tanks',
      'Fix tall shelves/cabinets to structural walls',
      'Anchor internal partitions and suspended services',
      'Secure inverter/battery racks and electrical panels above flood line',
    ],
    [],
  )

  const readinessScore = useMemo(() => {
    // Start with base score of 100 (perfect building)
    let score = 100
    
    // 1. AGE FACTOR (Based on building codes evolution in Pakistan)
    // Pakistan adopted seismic provisions in Building Code of Pakistan 1986
    // Building Code of Pakistan revised in 2007 with stricter standards
    const currentYear = new Date().getFullYear()
    const buildingAge = currentYear - selfAssessmentYearBuilt
    
    if (selfAssessmentYearBuilt >= 2007) {
      // Modern codes (BCP 2007+): minimal penalty
      score -= Math.min(buildingAge * 0.3, 5) // Max 5 points for aging
    } else if (selfAssessmentYearBuilt >= 1990) {
      // Post-1986 BCP adoption, pre-2007 revision
      score -= 12 + Math.min(buildingAge * 0.5, 10) // 12-22 point penalty
    } else if (selfAssessmentYearBuilt >= 1975) {
      // Pre-code era with some engineering standards
      score -= 25 + Math.min(buildingAge * 0.3, 8) // 25-33 point penalty
    } else {
      // Very old structures, pre-modern engineering
      score -= 35 // Maximum age penalty
    }
    
    // 2. CONSTRUCTION TYPE (Structural system performance)
    // Based on seismic performance data from Pakistan earthquakes (2005 Kashmir, etc.)
    if (selfAssessmentConstruction === 'Reinforced Concrete') {
      // RC frames: good ductility when properly designed
      score -= 0 // Reference case
    } else if (selfAssessmentConstruction === 'Steel Frame') {
      // Steel: excellent ductility, better performance
      score += 5 // Bonus for superior system
    } else if (selfAssessmentConstruction === 'Unreinforced Masonry') {
      // URM: brittle failure, poor seismic performance
      score -= 25 // Major penalty for high-risk system
    }
    
    // 3. DRAINAGE (Flood resilience and foundation protection)
    // Based on Pakistan's monsoon flooding patterns and soil degradation
    if (selfAssessmentDrainage === 'Good') {
      score += 5 // Well-protected foundation
    } else if (selfAssessmentDrainage === 'Average') {
      score -= 8 // Moderate flood risk
    } else if (selfAssessmentDrainage === 'Poor') {
      // Poor drainage: waterlogging, foundation undermining, soil bearing capacity loss
      score -= 18 // Significant risk factor
    }
    
    // 4. SEISMIC ZONE (Based on Pakistan Seismic Hazard Map)
    // Zone 4: High (Balochistan, KPK, Northern Areas, AJK)
    // Zone 3: Medium (Punjab border regions)
    // Zone 2: Low (Southern Sindh, Central Punjab)
    if (selfAssessmentSeismicZone === 'High') {
      // Zone 4: PGA 0.32g-0.48g, MMI VIII-IX expected
      score -= 15 // Maximum seismic hazard
    } else if (selfAssessmentSeismicZone === 'Medium') {
      // Zone 3: PGA 0.16g-0.32g, MMI VII-VIII expected
      score -= 8 // Moderate seismic hazard
    } else {
      // Zone 2: PGA <0.16g, MMI VI-VII expected
      score -= 3 // Low but non-zero seismic risk
    }
    
    // 5. FOUNDATION TYPE (Load transfer and stability)
    if (selfAssessmentFoundation === 'Raft') {
      // Mat foundation: best for poor soil, distributes load uniformly
      score += 8 // Best foundation system
    } else if (selfAssessmentFoundation === 'Isolated Footing') {
      // Spread footings: good for competent soil
      score += 3 // Standard good practice
    } else if (selfAssessmentFoundation === 'Stone Masonry') {
      // Traditional masonry: susceptible to differential settlement
      score -= 10 // Substandard foundation
    } else if (selfAssessmentFoundation === 'Unknown') {
      // Unknown foundation: cannot assess structural integrity
      score -= 15 // Major uncertainty penalty
    }
    
    // 6. BUILDING TYPE (Occupancy and consequence factor)
    if (buildingType === 'Residential') {
      // Lower occupancy, simpler systems
      score += 0 // Reference case
    } else if (buildingType === 'Commercial') {
      // Higher occupancy, more complex systems
      score -= 5 // Requires higher standards
    } else if (buildingType === 'Critical Infrastructure') {
      // Hospitals, fire stations, emergency centers
      // Must remain operational post-disaster (Importance Factor 1.5)
      score -= 12 // Much higher performance requirements
    }
    
    // 7. LIFELINE PRESENCE (Backup systems and resilience)
    if (lifeline === 'Yes') {
      // Backup power, water, communications
      score += 8 // Significant resilience improvement
    } else {
      score -= 5 // Dependent on external utilities
    }
    
    // Ensure score stays within valid range
    const finalScore = Math.max(0, Math.min(100, Math.round(score)))
    
    return finalScore
  }, [
    selfAssessmentYearBuilt,
    selfAssessmentConstruction,
    selfAssessmentDrainage,
    selfAssessmentSeismicZone,
    selfAssessmentFoundation,
    buildingType,
    lifeline,
  ])

  const readinessRiskLabel = useMemo(() => {
    if (readinessScore >= 80) return t.readiness.riskLow
    if (readinessScore >= 60) return t.readiness.riskModerate
    if (readinessScore >= 40) return t.readiness.riskHigh
    return t.readiness.riskVeryHigh
  }, [readinessScore, t.readiness])

  const readinessGaugeAngle = useMemo(() => Math.round((readinessScore / 100) * 180), [readinessScore])

  const readinessCustomRecommendation = useMemo(() => {
    const recommendations: string[] = []
    const R = t.readiness.reco

    if (selfAssessmentConstruction === 'Unreinforced Masonry') {
      recommendations.push(R.urmUrgent)
      recommendations.push(R.urmRetrofit)
    }

    if (selfAssessmentFoundation === 'Unknown') {
      recommendations.push(R.foundationUnknown)
    }

    if (selfAssessmentFoundation === 'Stone Masonry') {
      recommendations.push(R.stoneMasonry)
    }

    if (selfAssessmentYearBuilt < 1990) {
      recommendations.push(R.oldBuilding)
    }

    if (selfAssessmentDrainage === 'Poor') {
      recommendations.push(R.drainagePoor1)
      recommendations.push(R.drainagePoor2)
    } else if (selfAssessmentDrainage === 'Average') {
      recommendations.push(R.drainageAvg)
    }

    if (selfAssessmentSeismicZone === 'High') {
      recommendations.push(R.seismicHigh1)
      recommendations.push(R.seismicHigh2)
      if (buildingType === 'Critical Infrastructure') {
        recommendations.push(R.seismicCritical)
      }
    }

    if (lifeline === 'No') {
      recommendations.push(R.lifeline1)
      recommendations.push(R.lifeline2)
    }

    if (buildingType === 'Critical Infrastructure') {
      recommendations.push(R.criticalBuilding)
    }

    recommendations.push(R.annualInspect)
    recommendations.push(R.evacuationPlan)

    return recommendations.slice(0, 4).join('. ') + '.'
  }, [
    selfAssessmentYearBuilt,
    selfAssessmentConstruction,
    selfAssessmentDrainage,
    selfAssessmentSeismicZone,
    selfAssessmentFoundation,
    buildingType,
    lifeline,
    t.readiness.reco,
  ])

  const isQuotaError = useCallback(
    (message: string): boolean =>
      /\b429\b|\b422\b|quota|insufficient_quota|billing|rate\s*limit|requested model|not supported by any provider|provider you have enabled|unsupported model|unprocessable|status code \(no body\)/i.test(
        message,
      ),
    [],
  )

  const handleRetrofitSeriesUpload = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }

    const incomingFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    if (incomingFiles.length === 0) {
      return
    }

    const nextFiles = [...retrofitImageSeriesFiles, ...incomingFiles]
    const nextPreviews = [...retrofitImageSeriesPreviewUrls, ...incomingFiles.map((file) => URL.createObjectURL(file))]

    setRetrofitImageSeriesFiles(nextFiles)
    setRetrofitImageSeriesPreviewUrls(nextPreviews)
    setRetrofitImageSeriesResults([])
    setRetrofitGuidanceResults([])
    setRetrofitFinalEstimate(null)
    setRetrofitError(null)
  }

  const openRetrofitCalculatorPage = useCallback(() => {
    setRetrofitError(null)
    navigateToSection('retrofitCalculator')
  }, [navigateToSection])

  const calculateRetrofitEstimateFromSeries = async () => {
    if (retrofitImageSeriesFiles.length === 0) {
      setRetrofitError(t.errors.uploadPhotosFirst)
      return
    }

    const locationProvince = effectiveRetrofitLocation.province
    const locationCity = effectiveRetrofitLocation.city

    if (!locationProvince || !locationCity) {
      setRetrofitError(t.errors.selectProvinceCity)
      return
    }

    setIsCalculatingRetrofitEstimate(true)
    setRetrofitError(null)
    setMlEstimate(null)
    setVisionAnalysis(null)
    setRetrofitImageSeriesResults([])
    setRetrofitFinalEstimate(null)

    try {
      const provinceProfile = effectiveProvinceRisk[locationProvince] ?? effectiveProvinceRisk.Punjab
      const cityRates = cityRateByProvince[locationProvince]?.[locationCity] ?? {
        laborDaily: 2600,
        materialIndex: 1,
        logisticsIndex: 1,
        equipmentIndex: 1,
      }
      const equipmentIndex = deriveEquipmentIndex(cityRates)
      const laborFactor = cityRates.laborDaily / 2600
      const locationFactor = laborFactor * 0.45 + cityRates.materialIndex * 0.45 + cityRates.logisticsIndex * 0.1

      const structureFactor: Record<string, number> = {
        'Masonry House': 1,
        'RC Frame': 1.2,
        'School Block': 1.35,
        'Bridge Approach': 1.5,
      }
      const damageFactor: Record<'Low' | 'Medium' | 'High', number> = {
        Low: 1,
        Medium: 1.22,
        High: 1.48,
      }
      const scopeRate: Record<'Basic' | 'Standard' | 'Comprehensive', number> = {
        Basic: 320,
        Standard: 740,
        Comprehensive: 1250,
      }

      const mapScope = (scope: 'basic' | 'standard' | 'comprehensive'): 'Basic' | 'Standard' | 'Comprehensive' => {
        if (scope === 'basic') return 'Basic'
        if (scope === 'comprehensive') return 'Comprehensive'
        return 'Standard'
      }

      const mapDamage = (level: 'low' | 'medium' | 'high'): 'Low' | 'Medium' | 'High' => {
        if (level === 'low') return 'Low'
        if (level === 'high') return 'High'
        return 'Medium'
      }

      const visibilityPenalty: Record<'excellent' | 'good' | 'fair' | 'poor', number> = {
        excellent: 0.1,
        good: 0.14,
        fair: 0.2,
        poor: 0.26,
      }

      const hazardFactor =
        provinceProfile.earthquake === 'Very High' || provinceProfile.flood === 'Very High'
          ? 1.15
          : provinceProfile.earthquake === 'High' || provinceProfile.flood === 'High'
            ? 1.08
            : 1

      const defectProfileTotals: Partial<
        Record<'crack' | 'spalling' | 'corrosion' | 'moisture' | 'deformation' | 'other', number>
      > = {}
      const structureBaseAreaSqft: Record<string, number> = {
        'Masonry House': 520,
        'RC Frame': 760,
        'School Block': 980,
        'Bridge Approach': 1200,
      }
      const practicalGuidance = new Set<string>()
      const imageResults: RetrofitImageSeriesResult[] = []
      let severityAccumulator = 0
      let affectedAccumulator = 0
      let uncertaintyAccumulator = 0

      for (let index = 0; index < retrofitImageSeriesFiles.length; index += 1) {
        const file = retrofitImageSeriesFiles[index]
        const previewUrl = retrofitImageSeriesPreviewUrls[index] ?? URL.createObjectURL(file)

        try {
          const { analyzeBuildingWithVision } = await loadVisionService()
          const analysis = await analyzeBuildingWithVision({
            image: file,
            structureType,
            province: locationProvince,
            location: `${locationCity}, ${locationProvince}, Pakistan`,
            riskProfile: `earthquake=${provinceProfile.earthquake}, flood=${provinceProfile.flood}, landslide=${provinceProfile.landslide}`,
          })

          if (index === 0) {
            setVisionAnalysis(analysis)
          }

          const defects = analysis.defects ?? []
          defects.forEach((defect) => {
            defectProfileTotals[defect.type] = (defectProfileTotals[defect.type] ?? 0) + 1
          })

          analysis.priorityActions.forEach((action) => {
            practicalGuidance.add(action)
          })
          analysis.retrofitPlan.immediate.forEach((item) => {
            practicalGuidance.add(`Immediate: ${item}`)
          })
          analysis.retrofitPlan.shortTerm.forEach((item) => {
            practicalGuidance.add(`Short-term: ${item}`)
          })
          analysis.retrofitPlan.longTerm.forEach((item) => {
            practicalGuidance.add(`Long-term: ${item}`)
          })

          const inferredSeverityScore = defects.length
            ? Math.round(
                defects.reduce(
                  (sum, defect) =>
                    sum + (defect.severity === 'high' ? 85 : defect.severity === 'medium' ? 60 : 35) * defect.confidence,
                  0,
                ) / defects.length,
              )
            : 42

          const inferredAffectedAreaPercent = Math.max(
            12,
            Math.min(90, 18 + defects.length * 7 + defects.filter((defect) => defect.severity === 'high').length * 8),
          )

          const scoreSignals = analysis.costSignals
          const severityScore = Math.max(0, Math.min(100, Number(scoreSignals?.severityScore) || inferredSeverityScore))
          const affectedAreaPercent = Math.max(
            8,
            Math.min(100, Number(scoreSignals?.estimatedAffectedAreaPercent) || inferredAffectedAreaPercent),
          )

          const qualityVisibility = analysis.imageQuality.visibility
          const recommendedScope = scoreSignals ? mapScope(scoreSignals.recommendedScope) : severityScore >= 72 ? 'Comprehensive' : severityScore >= 48 ? 'Standard' : 'Basic'
          const damageLevel = scoreSignals
            ? mapDamage(scoreSignals.assessedDamageLevel)
            : severityScore >= 72
              ? 'High'
              : severityScore >= 45
                ? 'Medium'
                : 'Low'
          const urgencyLevel = scoreSignals
            ? scoreSignals.urgencyLevel
            : severityScore >= 72
              ? 'critical'
              : severityScore >= 48
                ? 'priority'
                : 'routine'

          const inferredAreaSqft = Math.max(
            220,
            Math.min(
              2400,
              Math.round(
                (structureBaseAreaSqft[structureType] ?? 520) *
                  (0.75 + affectedAreaPercent / 135) *
                  (0.82 + severityScore / 180) *
                  (0.9 + Math.min(8, defects.length) * 0.045),
              ),
            ),
          )

          const urgencyBoost: Record<'routine' | 'priority' | 'critical', number> = {
            routine: 1,
            priority: 1.08,
            critical: 1.18,
          }

          const baseCost =
            inferredAreaSqft *
            scopeRate[recommendedScope] *
            (structureFactor[structureType] ?? 1) *
            damageFactor[damageLevel] *
            (0.92 + (severityScore / 100) * 0.34) *
            Math.max(0.45, Math.min(1.2, affectedAreaPercent / 100 + 0.25)) *
            urgencyBoost[urgencyLevel] *
            locationFactor

          const estimatedCost = baseCost * hazardFactor * 1.12

          imageResults.push({
            id: `${Date.now()}-${index}-${file.name}`,
            fileName: file.name,
            previewUrl,
            summary: analysis.summary,
            defectCount: defects.length,
            inferredAreaSqft,
            severityScore,
            affectedAreaPercent,
            estimatedCost,
            recommendedScope,
            damageLevel,
            urgencyLevel,
            visibility: qualityVisibility,
          })

          severityAccumulator += severityScore
          affectedAccumulator += affectedAreaPercent
          uncertaintyAccumulator += visibilityPenalty[qualityVisibility]
        } catch (error) {
          const fallbackMessage = error instanceof Error ? error.message : 'Image analysis failed'
          if (!isQuotaError(fallbackMessage)) {
            throw error
          }

          const fallbackSignals = {
            severityScore: 55,
            affectedAreaPercent: 30,
            urgencyLevel: 'priority' as const,
            recommendedScope: 'Standard' as const,
            damageLevel: 'Medium' as const,
            visibility: 'good' as const,
          }

          const fallbackAreaSqft = Math.max(
            220,
            Math.min(2200, Math.round((structureBaseAreaSqft[structureType] ?? 520) * 0.95)),
          )

          const fallbackBase =
            fallbackAreaSqft *
            scopeRate[fallbackSignals.recommendedScope] *
            (structureFactor[structureType] ?? 1) *
            damageFactor[fallbackSignals.damageLevel] *
            locationFactor
          const fallbackCost = fallbackBase * hazardFactor * 1.12

          imageResults.push({
            id: `${Date.now()}-${index}-${file.name}`,
            fileName: file.name,
            previewUrl,
            summary: 'AI unavailable for this image. ML-ready fallback assumptions applied.',
            defectCount: 0,
            inferredAreaSqft: fallbackAreaSqft,
            severityScore: fallbackSignals.severityScore,
            affectedAreaPercent: fallbackSignals.affectedAreaPercent,
            estimatedCost: fallbackCost,
            recommendedScope: fallbackSignals.recommendedScope,
            damageLevel: fallbackSignals.damageLevel,
            urgencyLevel: fallbackSignals.urgencyLevel,
            visibility: fallbackSignals.visibility,
          })

          severityAccumulator += fallbackSignals.severityScore
          affectedAccumulator += fallbackSignals.affectedAreaPercent
          uncertaintyAccumulator += visibilityPenalty[fallbackSignals.visibility]
        }
      }

      if (imageResults.length === 0) {
        throw new Error('No valid image analysis result generated. Please upload clearer images and retry.')
      }

      setRetrofitImageSeriesResults(imageResults)

      const totalAreaSqft = Math.max(
        220,
        imageResults.reduce((sum, item) => sum + item.inferredAreaSqft, 0),
      )

      const avgSeverityScore = Math.round(severityAccumulator / imageResults.length)
      const avgAffectedAreaPercent = Math.round(affectedAccumulator / imageResults.length)
      const avgUncertaintyPenalty = uncertaintyAccumulator / imageResults.length
      const highestUrgency = imageResults.some((item) => item.urgencyLevel === 'critical')
        ? 'critical'
        : imageResults.some((item) => item.urgencyLevel === 'priority')
          ? 'priority'
          : 'routine'

      const highCount = imageResults.filter((item) => item.damageLevel === 'High').length
      const lowCount = imageResults.filter((item) => item.damageLevel === 'Low').length
      const aggregateDamageLevel: 'Low' | 'Medium' | 'High' =
        highCount >= Math.ceil(imageResults.length / 2)
          ? 'High'
          : lowCount >= Math.ceil(imageResults.length / 2)
            ? 'Low'
            : 'Medium'

      const aggregateScope: 'Basic' | 'Standard' | 'Comprehensive' =
        avgSeverityScore >= 72 ? 'Comprehensive' : avgSeverityScore >= 48 ? 'Standard' : 'Basic'

      let ml: MlRetrofitEstimate | null = null

      try {
        const { getMlRetrofitEstimate } = await loadMlRetrofitService()
        ml = await getMlRetrofitEstimate({
          structureType,
          province: locationProvince,
          city: locationCity,
          areaSqft: totalAreaSqft,
          severityScore: avgSeverityScore,
          affectedAreaPercent: avgAffectedAreaPercent,
          urgencyLevel: highestUrgency,
          laborDaily: cityRates.laborDaily,
          materialIndex: cityRates.materialIndex,
          equipmentIndex,
          logisticsIndex: cityRates.logisticsIndex,
          defectProfile: defectProfileTotals,
          imageQuality: avgUncertaintyPenalty >= 0.22 ? 'poor' : avgUncertaintyPenalty >= 0.18 ? 'fair' : 'good',
        })

        setMlEstimate(ml)
      } catch {
        ml = null
        setMlEstimate(null)
      }

      const baseRateFromImages = imageResults.reduce((sum, item) => sum + item.estimatedCost, 0) / totalAreaSqft
      const mlBaseRate = ml?.predictedCostPerSqft ?? baseRateFromImages
      const adjustedBase = mlBaseRate * totalAreaSqft
      const hazardAdjusted = adjustedBase * hazardFactor
      const contingency = hazardAdjusted * 0.12
      const totalCost = hazardAdjusted + contingency

      const spread = ml
        ? Math.max(0.1, Math.min(0.28, 0.22 - ml.confidence * 0.12))
        : Math.max(0.12, Math.min(0.34, avgUncertaintyPenalty + 0.1))

      const estimatedDuration = ml?.predictedDurationWeeks
        ? ml.predictedDurationWeeks
        : Math.max(
            2,
            Math.round((totalAreaSqft / 540) * (aggregateScope === 'Comprehensive' ? 1.4 : aggregateScope === 'Standard' ? 1.1 : 0.9)),
          )

      const finalScope: 'Basic' | 'Standard' | 'Comprehensive' = ml
        ? ml.predictedScope === 'comprehensive'
          ? 'Comprehensive'
          : ml.predictedScope === 'basic'
            ? 'Basic'
            : 'Standard'
        : aggregateScope

      const finalDamage: 'Low' | 'Medium' | 'High' = ml
        ? ml.predictedDamage === 'high'
          ? 'High'
          : ml.predictedDamage === 'low'
            ? 'Low'
            : 'Medium'
        : aggregateDamageLevel

      setRetrofitFinalEstimate({
        estimateSource: ml ? 'ML Model' : 'Image-driven',
        province: locationProvince,
        city: locationCity,
        imageCount: imageResults.length,
        totalAreaSqft,
        durationWeeks: estimatedDuration,
        totalCost,
        minTotalCost: totalCost * (1 - spread),
        maxTotalCost: totalCost * (1 + spread),
        sqftRate: totalCost / totalAreaSqft,
        locationFactor,
        laborDaily: cityRates.laborDaily,
        materialIndex: cityRates.materialIndex,
        logisticsIndex: cityRates.logisticsIndex,
        equipmentIndex,
        scope: finalScope,
        damageLevel: finalDamage,
        urgencyLevel: highestUrgency,
        affectedAreaPercent: avgAffectedAreaPercent,
        severityScore: avgSeverityScore,
        mlModel: ml?.model,
        mlConfidence: ml?.confidence,
        guidance:
          ml?.guidance && ml.guidance.length > 0
            ? ml.guidance
            : Array.from(practicalGuidance).length > 0
              ? Array.from(practicalGuidance)
              : imageResults.flatMap((item) => [`${item.fileName}: ${item.summary}`]),
      })
    } catch (error) {
      const message = formatApiErrorMessage(error, t.errors.retrofitEstimateFailed)
      setRetrofitError(message)
      setRetrofitImageSeriesResults([])
      setRetrofitFinalEstimate(null)
    } finally {
      setIsCalculatingRetrofitEstimate(false)
    }
  }

  void calculateRetrofitEstimateFromSeries

  const generateRetrofitGuidanceFromSeries = async () => {
    if (retrofitImageSeriesFiles.length === 0) {
      setRetrofitError(t.errors.retrofitPhotosBeforeGuidance)
      return
    }

    const locationProvince = effectiveRetrofitLocation.province
    const locationCity = effectiveRetrofitLocation.city

    if (!locationProvince || !locationCity) {
      setRetrofitError(t.errors.selectProvinceCity)
      return
    }

    setIsGeneratingRetrofitGuidance(true)
    setRetrofitError(null)
    setRetrofitGuidanceResults([])

    try {
      const provinceProfile = effectiveProvinceRisk[locationProvince] ?? effectiveProvinceRisk.Punjab
      const riskProfile = `EQ:${provinceProfile.earthquake}, Flood:${provinceProfile.flood}, Landslide:${provinceProfile.landslide}`
      const guidanceResults: RetrofitGuidanceResult[] = []
      const { analyzeBuildingWithVision } = await loadVisionService()

      for (let index = 0; index < retrofitImageSeriesFiles.length; index += 1) {
        const file = retrofitImageSeriesFiles[index]
        const analysis = await analyzeBuildingWithVision({
          image: file,
          structureType,
          province: locationProvince,
          location: `${locationCity}, ${locationProvince}, Pakistan`,
          riskProfile,
        })

        const recommendations = [
          ...analysis.priorityActions,
          ...analysis.retrofitPlan.immediate,
          ...analysis.retrofitPlan.shortTerm,
          ...(analysis.structuredGuidance?.retrofitMethods ?? []).map((step) => `${step.technique}: ${step.targetCondition}`),
        ]
        const uniqueRecommendations = Array.from(new Set(recommendations.map((item) => item.trim()).filter(Boolean))).slice(0, 8)

        guidanceResults.push({
          id: `guidance-${Date.now()}-${index}`,
          fileName: file.name || `Image ${index + 1}`,
          summary: analysis.summary,
          safetyNote: analysis.safetyNote,
          visibility: analysis.imageQuality.visibility,
          recommendations: uniqueRecommendations,
          defectFeatures: analysis.defectFeatures,
          structuredGuidance: analysis.structuredGuidance,
        })
      }

      setRetrofitGuidanceResults(guidanceResults)
    } catch (error) {
      setRetrofitError(formatApiErrorMessage(error, t.errors.retrofitAnalysisFailed ?? 'The AI analysis service is currently unavailable. Please try again shortly.'))
    } finally {
      setIsGeneratingRetrofitGuidance(false)
    }
  }

  const downloadRetrofitEstimate = async () => {
    if (!retrofitFinalEstimate) {
      setRetrofitError(t.errors.calculateFirst)
      return
    }

    if (isUrdu) {
      const { createUrduPdfHost, appendUrduPdfRoot, downloadUrduHtmlAsPdf, removeUrduPdfHost } = await import(
        './utils/urduHtmlToPdf'
      )
      const provinceProfile = effectiveProvinceRisk[retrofitFinalEstimate.province] ?? effectiveProvinceRisk.Punjab
      const defectCount = retrofitImageSeriesResults.reduce((sum, item) => sum + item.defectCount, 0)
      const summary =
        retrofitImageSeriesResults[0]?.summary ?? visionAnalysis?.summary ?? mergedRetrofit.pdfNoModelSummary
      const clippedSummary = summary.length > 110 ? `${summary.slice(0, 107)}...` : summary

      const bodyLines = [
        `${mergedRetrofit.pdfDate} ${new Date().toLocaleString()}`,
        `${mergedRetrofit.pdfProvince} ${retrofitFinalEstimate.province}`,
        `${mergedRetrofit.pdfCityDistrict} ${retrofitFinalEstimate.city}`,
        `${mergedRetrofit.pdfStructureType} ${structureType}`,
        `${mergedRetrofit.pdfEstimateSource} ${retrofitFinalEstimate.estimateSource}`,
        `${mergedRetrofit.pdfRetrofitScope} ${retrofitFinalEstimate.scope}`,
        `${mergedRetrofit.pdfDefectSeverity} ${retrofitFinalEstimate.damageLevel}`,
        `${mergedRetrofit.pdfAnalyzedPhotos} ${retrofitFinalEstimate.imageCount}`,
        `${mergedRetrofit.pdfInferredArea} ${retrofitFinalEstimate.totalAreaSqft.toLocaleString()} ${mergedRetrofit.sqFt}`,
        `${mergedRetrofit.pdfEstimatedDuration} ${retrofitFinalEstimate.durationWeeks} ${mergedRetrofit.pdfWeeks}`,
        `${mergedRetrofit.pdfLocationCostFactor} ${retrofitFinalEstimate.locationFactor.toFixed(2)}x`,
        `${mergedRetrofit.pdfEstimatedTotal} PKR ${Math.round(retrofitFinalEstimate.totalCost).toLocaleString()}`,
        `${mergedRetrofit.pdfEstimatedRange} PKR ${Math.round(retrofitFinalEstimate.minTotalCost).toLocaleString()} - PKR ${Math.round(retrofitFinalEstimate.maxTotalCost).toLocaleString()}`,
        `${mergedRetrofit.pdfEffectiveRate} PKR ${Math.round(retrofitFinalEstimate.sqftRate).toLocaleString()}/${mergedRetrofit.sqFt}`,
        `${mergedRetrofit.pdfAffectedAreaAvg} ${Math.round(retrofitFinalEstimate.affectedAreaPercent)}%`,
        `${mergedRetrofit.pdfUrgency} ${retrofitFinalEstimate.urgencyLevel}`,
      ]

      const hazardBullets = [
        `- ${mergedRetrofit.pdfEarthquake}: ${provinceProfile.earthquake}`,
        `- ${mergedRetrofit.pdfFlood}: ${provinceProfile.flood}`,
        `- ${mergedRetrofit.pdfLandslide}: ${provinceProfile.landslide}`,
      ]

      const el = buildUrduRetrofitEstimateElement({
        mainTitle: mergedRetrofit.pdfMainTitle,
        bodyLines,
        hazardHeading: mergedRetrofit.pdfHazardProfile,
        hazardBullets,
        summaryLine: `${mergedRetrofit.pdfModelSummary} ${clippedSummary}`,
        defectsLine: `${mergedRetrofit.pdfDetectedDefects} ${defectCount}`,
      })
      const host = createUrduPdfHost()
      appendUrduPdfRoot(host, el)
      try {
        await downloadUrduHtmlAsPdf({
          element: el,
          filename: `resilience360-retrofit-estimate-${Date.now()}.pdf`,
          scale: 2,
        })
      } finally {
        removeUrduPdfHost(host)
      }
      return
    }

    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pw = doc.internal.pageSize.getWidth()
    const margin = 14
    const edgeX = isUrdu ? pw - margin : margin
    const align = isUrdu ? ('right' as const) : ('left' as const)
    const tx = (s: string) => pdfTx(isUrdu, s)

    if (isUrdu) {
      await ensureUrduPdfFont(doc)
    } else {
      doc.setFont('helvetica', 'normal')
    }

    const provinceProfile = effectiveProvinceRisk[retrofitFinalEstimate.province] ?? effectiveProvinceRisk.Punjab
    const defectCount = retrofitImageSeriesResults.reduce((sum, item) => sum + item.defectCount, 0)

    let y = 18
    const line = (text: string, delta = 8) => {
      doc.text(tx(text), edgeX, y, { align })
      y += delta
    }

    setPdfBoldFont(doc, isUrdu)
    doc.setFontSize(16)
    line(mergedRetrofit.pdfMainTitle, 10)
    setPdfBodyFont(doc, isUrdu)
    doc.setFontSize(11)
    line(`${mergedRetrofit.pdfDate} ${new Date().toLocaleString()}`)
    line(`${mergedRetrofit.pdfProvince} ${retrofitFinalEstimate.province}`)
    line(`${mergedRetrofit.pdfCityDistrict} ${retrofitFinalEstimate.city}`)
    line(`${mergedRetrofit.pdfStructureType} ${structureType}`)
    line(`${mergedRetrofit.pdfEstimateSource} ${retrofitFinalEstimate.estimateSource}`)
    line(`${mergedRetrofit.pdfRetrofitScope} ${retrofitFinalEstimate.scope}`)
    line(`${mergedRetrofit.pdfDefectSeverity} ${retrofitFinalEstimate.damageLevel}`)
    line(`${mergedRetrofit.pdfAnalyzedPhotos} ${retrofitFinalEstimate.imageCount}`)
    line(
      `${mergedRetrofit.pdfInferredArea} ${retrofitFinalEstimate.totalAreaSqft.toLocaleString()} ${mergedRetrofit.sqFt}`,
    )
    line(`${mergedRetrofit.pdfEstimatedDuration} ${retrofitFinalEstimate.durationWeeks} ${mergedRetrofit.pdfWeeks}`)
    line(`${mergedRetrofit.pdfLocationCostFactor} ${retrofitFinalEstimate.locationFactor.toFixed(2)}x`)
    line(`${mergedRetrofit.pdfEstimatedTotal} PKR ${Math.round(retrofitFinalEstimate.totalCost).toLocaleString()}`)
    line(
      `${mergedRetrofit.pdfEstimatedRange} PKR ${Math.round(retrofitFinalEstimate.minTotalCost).toLocaleString()} - PKR ${Math.round(retrofitFinalEstimate.maxTotalCost).toLocaleString()}`,
    )
    line(
      `${mergedRetrofit.pdfEffectiveRate} PKR ${Math.round(retrofitFinalEstimate.sqftRate).toLocaleString()}/${mergedRetrofit.sqFt}`,
    )
    line(`${mergedRetrofit.pdfAffectedAreaAvg} ${Math.round(retrofitFinalEstimate.affectedAreaPercent)}%`)
    line(`${mergedRetrofit.pdfUrgency} ${retrofitFinalEstimate.urgencyLevel}`)

    line(mergedRetrofit.pdfHazardProfile, 8)
    const bulletX = isUrdu ? pw - margin - 4 : margin + 4
    doc.text(tx(`- ${mergedRetrofit.pdfEarthquake}: ${provinceProfile.earthquake}`), bulletX, y, { align })
    y += 8
    doc.text(tx(`- ${mergedRetrofit.pdfFlood}: ${provinceProfile.flood}`), bulletX, y, { align })
    y += 8
    doc.text(tx(`- ${mergedRetrofit.pdfLandslide}: ${provinceProfile.landslide}`), bulletX, y, { align })
    y += 12

    const summary =
      retrofitImageSeriesResults[0]?.summary ?? visionAnalysis?.summary ?? mergedRetrofit.pdfNoModelSummary
    const clippedSummary = summary.length > 110 ? `${summary.slice(0, 107)}...` : summary
    const summaryLine = `${mergedRetrofit.pdfModelSummary} ${clippedSummary}`
    const maxW = pw - margin * 2
    const summaryLines = doc.splitTextToSize(tx(summaryLine), maxW)
    summaryLines.forEach((sl: string) => {
      doc.text(sl, edgeX, y, { align })
      y += 6
    })
    line(`${mergedRetrofit.pdfDetectedDefects} ${defectCount}`)

    const filename = `resilience360-retrofit-estimate-${Date.now()}.pdf`
    doc.save(filename)
  }

  const answerLocalAdvisory = (question: string) => {
    const lower = question.toLowerCase()
    const profile = selectedDistrictProfile
    if (!profile) {
      return isUrdu
        ? 'براہِ کرم پہلے صوبہ اور ضلع منتخب کریں تاکہ میں مقامی رسک ایکشن دے سکوں۔'
        : 'Please select your province and district first so I can provide local NDMA-style risk actions.'
    }

    const nextStep = isUrdu
      ? 'اگلا قدم: ضلعی رپورٹ ڈاؤن لوڈ کریں اور کمیونٹی پلان شیئر کریں۔'
      : "Here's what you can do next: download the district report and share the checklist with your community."

    if (lower.includes('flood')) {
      return isUrdu
        ? `${profile.district}: سیلاب رسک ${profile.flood} ہے۔ پلنتھ اونچی کریں، نکاسی صاف رکھیں، اور برقی پوائنٹس محفوظ کریں۔ ${nextStep}`
        : `${profile.district}: flood risk is ${profile.flood}. Prioritize plinth elevation, drain clearance, and safe power routing. ${nextStep}`
    }
    if (lower.includes('earthquake') || lower.includes('seismic')) {
      return isUrdu
        ? `${profile.district}: زلزلہ رسک ${profile.earthquake} ہے۔ کنفائنمنٹ بینڈ، روف وال اینکرنگ، اور سیڑھی کور کی مضبوطی پر توجہ دیں۔ ${nextStep}`
        : `${profile.district}: earthquake risk is ${profile.earthquake}. Focus on confinement bands, roof-wall anchorage, and stair core safety. ${nextStep}`
    }
    if (lower.includes('school') || lower.includes('hospital') || lower.includes('critical')) {
      return isUrdu
        ? `${profile.district} میں اہم عمارتوں کے لیے پہلے نان اسٹرکچرل خطرات دور کریں، پھر اسٹرکچرل کمزوریوں پر کام کریں۔ آغاز: ${profile.resilienceActions[0]}`
        : `For critical facilities in ${profile.district}, first retrofit non-structural hazards, then structural weak points. Start with: ${profile.resilienceActions[0]}`
    }
    if (lower.includes('cost') || lower.includes('budget')) {
      return isUrdu
        ? `ضلع کے مطابق لاگت کے لیے Retrofit Guide کھولیں۔ ${profile.district} میں آغاز ان اقدامات سے کریں: ${profile.resilienceActions.slice(0, 2).join(' | ')}۔`
        : `Open Retrofit Guide for district-adjusted costing. For ${profile.district}, begin with high-impact actions: ${profile.resilienceActions.slice(0, 2).join(' | ')}.`
    }

    return isUrdu
      ? `${profile.district} میں انفرا رسک ${profile.infraRisk} ہے۔ بنیادی کمزوری: ${profile.dominantStructure}۔ تجویز کردہ اقدامات: ${profile.resilienceActions.join(' | ')}`
      : `${profile.district} infrastructure risk is ${profile.infraRisk}. Dominant vulnerability: ${profile.dominantStructure}. Recommended actions: ${profile.resilienceActions.join(' | ')}`
  }

  const sendLocalAdvisoryQuestion = async () => {
    const question = advisoryQuestion.trim()
    if (!question) return

    setAdvisoryError(null)
    setIsAskingAdvisory(true)
    setAdvisoryMessages((messages) => [...messages, { role: 'user', text: question }])
    setAdvisoryQuestion('')

    try {
      const { askLocalAdvisory } = await loadAdvisoryService()
      const result = await askLocalAdvisory({
        question,
        province: selectedProvince,
        district: selectedDistrict,
        riskLayer: mapLayer,
        riskValue,
        language: isUrdu ? 'Urdu' : 'English',
        districtProfile: selectedDistrictProfile,
      })

      setAdvisoryMessages((messages) => [...messages, { role: 'assistant', text: result.answer }])
    } catch (error) {
      const fallback = answerLocalAdvisory(question)
      setAdvisoryMessages((messages) => [...messages, { role: 'assistant', text: fallback }])
      setAdvisoryError(error instanceof Error ? error.message : t.errors.advisoryAiUnavailable)
    } finally {
      setIsAskingAdvisory(false)
    }
  }

  const downloadLatestAdvisoryAnswerPdf = async () => {
    const latestAssistant = [...advisoryMessages].reverse().find((message) => message.role === 'assistant')
    const latestQuestion = [...advisoryMessages].reverse().find((message) => message.role === 'user')
    if (!latestAssistant) return

    if (isUrdu) {
      const { createUrduPdfHost, appendUrduPdfRoot, downloadUrduHtmlAsPdf, removeUrduPdfHost } = await import(
        './utils/urduHtmlToPdf'
      )
      const districtLabel = selectedDistrict ?? t.riskMap.advisoryPdfNotSelected
      const provinceLine = t.riskMap.advisoryPdfProvinceLine
        .replace('{province}', selectedProvince)
        .replace('{district}', districtLabel)
        .replace('{layer}', mapLayer)
        .replace('{risk}', riskValue)

      const el = buildUrduAdvisoryAnswerElement({
        title: t.riskMap.advisoryPdfTitle,
        provinceLine,
        generatedLine: `${t.riskMap.advisoryPdfGenerated} ${new Date().toLocaleString()}`,
        questionBlock: latestQuestion
          ? `${t.riskMap.advisoryPdfQuestionPrefix} ${latestQuestion.text}`
          : undefined,
        answerBlock: `${t.riskMap.advisoryPdfAnswerPrefix} ${latestAssistant.text}`,
      })
      const host = createUrduPdfHost()
      appendUrduPdfRoot(host, el)
      try {
        await downloadUrduHtmlAsPdf({
          element: el,
          filename: `resilience360-advisory-answer-${selectedProvince}-${selectedDistrict ?? 'district'}-${Date.now()}.pdf`,
          scale: 2,
        })
      } finally {
        removeUrduPdfHost(host)
      }
      return
    }

    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pw = doc.internal.pageSize.getWidth()
    const margin = 12
    const edgeX = isUrdu ? pw - margin : margin
    const align = isUrdu ? ('right' as const) : ('left' as const)
    const tx = (s: string) => pdfTx(isUrdu, s)
    const width = pw - margin * 2

    if (isUrdu) {
      await ensureUrduPdfFont(doc)
    } else {
      doc.setFont('helvetica', 'normal')
    }

    let cursorY = 18

    setPdfBoldFont(doc, isUrdu)
    doc.setFontSize(14)
    doc.text(tx(t.riskMap.advisoryPdfTitle), edgeX, cursorY, { align })
    cursorY += 8

    setPdfBodyFont(doc, isUrdu)
    doc.setFontSize(10)
    const districtLabel = selectedDistrict ?? t.riskMap.advisoryPdfNotSelected
    const provinceLine = t.riskMap.advisoryPdfProvinceLine
      .replace('{province}', selectedProvince)
      .replace('{district}', districtLabel)
      .replace('{layer}', mapLayer)
      .replace('{risk}', riskValue)
    doc.text(tx(provinceLine), edgeX, cursorY, { align })
    cursorY += 7
    doc.text(tx(`${t.riskMap.advisoryPdfGenerated} ${new Date().toLocaleString()}`), edgeX, cursorY, { align })
    cursorY += 8

    if (latestQuestion) {
      const questionLines = doc.splitTextToSize(tx(`${t.riskMap.advisoryPdfQuestionPrefix} ${latestQuestion.text}`), width)
      setPdfBoldFont(doc, isUrdu)
      doc.text(questionLines, edgeX, cursorY, { align })
      cursorY += questionLines.length * 5 + 3
      setPdfBodyFont(doc, isUrdu)
    }

    const answerLines = doc.splitTextToSize(tx(`${t.riskMap.advisoryPdfAnswerPrefix} ${latestAssistant.text}`), width)
    doc.text(answerLines, edgeX, cursorY, { align })

    doc.save(`resilience360-advisory-answer-${selectedProvince}-${selectedDistrict ?? 'district'}-${Date.now()}.pdf`)
  }

  const copyLatestAdvisoryAnswer = async () => {
    const latestAssistant = [...advisoryMessages].reverse().find((message) => message.role === 'assistant')
    if (!latestAssistant) return

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(latestAssistant.text)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = latestAssistant.text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }

      setAdvisoryCopyMsg(t.errors.advisoryCopied)
      window.setTimeout(() => setAdvisoryCopyMsg(null), 1800)
    } catch {
      setAdvisoryCopyMsg(t.errors.advisoryCopyFailed)
      window.setTimeout(() => setAdvisoryCopyMsg(null), 1800)
    }
  }

  const requestCurrentUserLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setRetrofitAutoLocationPermissionGranted(false)
      setLocationAccessMsg(t.errors.geolocationUnsupported)
      window.setTimeout(() => setLocationAccessMsg(null), 3000)
      return
    }

    setIsDetectingLocation(true)
    setLocationAccessMsg(t.errors.geolocationRequesting)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const rawLat = position.coords.latitude
        const rawLng = position.coords.longitude
        const lat = rawLat.toFixed(6)
        const lng = rawLng.toFixed(6)
        const gpsText = `${lat}, ${lng}`
        setRetrofitAutoLocationPermissionGranted(true)
        setDetectedUserLocation({ lat: rawLat, lng: rawLng })
        const nearestDistrict = findNearestCenterName({ lat: rawLat, lng: rawLng }, effectiveDistrictCenters)
        const nearestProvince = getProvinceForDistrict(nearestDistrict) || findNearestCenterName({ lat: rawLat, lng: rawLng }, provinceCenters)
        const nearestDistrictsInProvince = nearestProvince ? listDistrictsByProvince(nearestProvince) : []
        const hasDistrictInDropdown = nearestDistrictsInProvince.includes(nearestDistrict)
        const nearestProvinceCities = nearestProvince ? (pakistanCitiesByProvince[nearestProvince] ?? []) : []

        let resolvedProvince = nearestProvince || 'Punjab'
        let resolvedCity = hasDistrictInDropdown
          ? nearestDistrict
          : nearestProvinceCities[0] || pakistanCitiesByProvince[resolvedProvince]?.[0] || 'Lahore'
        let reverseReadableLocation = ''

        setStructureReviewGps(gpsText)

        if (nearestProvince) {
          setSelectedProvince(nearestProvince)
          setApplyProvince(nearestProvince)
          setDesignProvince(nearestProvince)
        }

        if (nearestDistrict && hasDistrictInDropdown) {
          setSelectedDistrict(nearestDistrict)
          setApplyCity(nearestDistrict)
        } else {
          setSelectedDistrict(null)
          if (nearestProvinceCities.length > 0) {
            setApplyCity(nearestProvinceCities[0])
          }
        }

        const districtProfileForHazard = nearestProvince
          ? findDistrictRiskProfile(nearestProvince, hasDistrictInDropdown ? nearestDistrict : null)
          : null
        const provinceProfileForHazard = nearestProvince ? effectiveProvinceRisk[nearestProvince] : null
        const districtFlood = districtProfileForHazard?.flood === 'Very High' || districtProfileForHazard?.flood === 'High'
        const districtEarthquake =
          districtProfileForHazard?.earthquake === 'Very High' || districtProfileForHazard?.earthquake === 'High'
        const provinceFlood = provinceProfileForHazard?.flood === 'Very High' || provinceProfileForHazard?.flood === 'High'
        const provinceEarthquake =
          provinceProfileForHazard?.earthquake === 'Very High' || provinceProfileForHazard?.earthquake === 'High'

        if ((districtFlood && !districtEarthquake) || (provinceFlood && !provinceEarthquake)) {
          setApplyHazard('flood')
        } else if ((districtEarthquake && !districtFlood) || (provinceEarthquake && !provinceFlood)) {
          setApplyHazard('earthquake')
        }

        try {
          const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
          const reverseResponse = await fetch(reverseUrl, {
            headers: { 'Accept-Language': 'en' },
          })

          if (reverseResponse.ok) {
            const reverseData = (await reverseResponse.json()) as {
              display_name?: string
              address?: {
                city?: string
                town?: string
                village?: string
                county?: string
                state?: string
                province?: string
              }
            }

            const address = reverseData.address ?? {}
            const reverseProvince = resolveProvinceFromText(address.state) || resolveProvinceFromText(address.province)
            const reverseCityCandidate = address.city || address.town || address.village || address.county

            if (reverseProvince) {
              resolvedProvince = reverseProvince
              resolvedCity = resolveCityFromProvince(reverseProvince, reverseCityCandidate || nearestDistrict)
            }

            if (reverseData.display_name) {
              reverseReadableLocation = reverseData.display_name
              setLocationText(`${reverseData.display_name} (${gpsText})`)
            } else {
              setLocationText(`${t.errors.exactGpsLabel} ${gpsText}`)
            }
          } else {
            setLocationText(`${t.errors.exactGpsLabel} ${gpsText}`)
          }
        } catch {
          setLocationText(`${t.errors.exactGpsLabel} ${gpsText}`)
        }

        setRetrofitAutoLocation({
          province: resolvedProvince,
          city: resolvedCity,
          lat: rawLat,
          lng: rawLng,
        })

        if (resolvedProvince) {
          setRetrofitCity(resolveCityFromProvince(resolvedProvince, resolvedCity))
        }

        if (reverseReadableLocation) {
          setLocationAccessMsg(
            t.errors.geolocationAutoDetected
              .replace('{city}', resolvedCity)
              .replace('{province}', resolvedProvince)
              .replace('{gps}', toGpsLabel(rawLat, rawLng)),
          )
        }

        if (nearestProvince && nearestDistrict && hasDistrictInDropdown) {
          setLocationAccessMsg(
            t.errors.geolocationMappedDistrict.replace('{district}', nearestDistrict).replace('{province}', nearestProvince),
          )
        } else if (nearestProvince) {
          setLocationAccessMsg(t.errors.geolocationMappedProvince.replace('{province}', nearestProvince))
        } else {
          setLocationAccessMsg(t.errors.geolocationExactSuccess)
        }
        setIsDetectingLocation(false)
        window.setTimeout(() => setLocationAccessMsg(null), 3000)
      },
      (error) => {
        setRetrofitAutoLocationPermissionGranted(false)
        let message = t.errors.geolocationUnable
        if (error.code === error.PERMISSION_DENIED) message = t.errors.geolocationDenied
        if (error.code === error.POSITION_UNAVAILABLE) message = t.errors.geolocationUnavailable
        if (error.code === error.TIMEOUT) message = t.errors.geolocationTimeout

        setLocationAccessMsg(message)
        setIsDetectingLocation(false)
        window.setTimeout(() => setLocationAccessMsg(null), 3500)
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      },
    )
  }, [effectiveDistrictCenters, effectiveProvinceRisk, t.errors])

  useEffect(() => {
    if (activeSection !== 'applyRegion') {
      setHasTriedApplyAutoLocation(false)
      return
    }

    if (hasTriedApplyAutoLocation) return
    setHasTriedApplyAutoLocation(true)

    if (!detectedUserLocation) {
      requestCurrentUserLocation()
    }
  }, [activeSection, detectedUserLocation, hasTriedApplyAutoLocation, requestCurrentUserLocation])

  const submitStructureRiskReview = async () => {
    if (!structureReviewFile) {
      setStructureReviewError(t.errors.structureReviewFileRequired)
      return
    }

    setIsSubmittingStructureReview(true)
    setStructureReviewError(null)

    try {
      const { analyzeBuildingWithVision } = await loadVisionService()
      const profileText = selectedDistrictProfile
        ? `earthquake=${selectedDistrictProfile.earthquake}, flood=${selectedDistrictProfile.flood}, infra=${selectedDistrictProfile.infraRisk}`
        : `earthquake=${effectiveProvinceRisk[selectedProvince]?.earthquake ?? '—'}, flood=${effectiveProvinceRisk[selectedProvince]?.flood ?? '—'}, infra=${effectiveProvinceRisk[selectedProvince]?.infraRisk ?? '—'}`

      const result = await analyzeBuildingWithVision({
        image: structureReviewFile,
        structureType: structureReviewType,
        province: selectedProvince,
        location: `${selectedDistrict ?? 'District'} ${structureReviewGps ? `(${structureReviewGps})` : ''} | floors=${cadNumFloors} | built=${cadYearBuilt}`,
        riskProfile: `${profileText}, cadFile=${structureReviewFile.name}, format=${structureReviewFile.type || 'unknown'}`,
      })

      setStructureReviewResult(result)
    } catch (error) {
      setStructureReviewResult(null)
      setStructureReviewError(formatApiErrorMessage(error, t.errors.structureReviewFailed))
    } finally {
      setIsSubmittingStructureReview(false)
    }
  }

  const loadLiveAlerts = useCallback(async () => {
    try {
      const latest = await fetchLiveAlerts()
      setAlertLog(latest)
      localStorage.setItem('r360-live-alerts', JSON.stringify(latest))
    } catch {
      /* keep cached alertLog when feed fails */
    }
  }, [])

  const loadGlobalEarthquakes = useCallback(async () => {
    if (globalEarthquakeRequestInFlightRef.current) return
    globalEarthquakeRequestInFlightRef.current = true
    setIsLoadingGlobalEarthquakes(true)
    setGlobalEarthquakeError(null)
    globalEarthquakeAbortRef.current?.abort()
    const controller = new AbortController()
    globalEarthquakeAbortRef.current = controller
    const timer = window.setTimeout(() => controller.abort(), 16000)

    try {
      const fetchLiveFeed = async (feedUrl: string) => {
        const separator = feedUrl.includes('?') ? '&' : '?'
        const cacheBustedUrl = `${feedUrl}${separator}_ts=${Date.now()}`
        const response = await fetch(cacheBustedUrl, {
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })

        if (!response.ok) {
          throw new Error(`Live earthquake feed request failed with status ${response.status}.`)
        }

        return (await response.json()) as {
          features?: Array<{
            id?: string
            properties?: {
              mag?: number | null
              place?: string
              time?: number
              url?: string
            }
            geometry?: {
              coordinates?: number[]
            }
          }>
        }
      }

      const targets = [
        ...buildApiTargets('/api/global-earthquakes'),
        GLOBAL_EARTHQUAKE_FEED_URL,
        GLOBAL_EARTHQUAKE_FEED_URL_BACKUP,
        `${GLOBAL_EARTHQUAKE_PROXY_PREFIX}${encodeURIComponent(GLOBAL_EARTHQUAKE_FEED_URL)}`,
        `${GLOBAL_EARTHQUAKE_PROXY_PREFIX}${encodeURIComponent(GLOBAL_EARTHQUAKE_FEED_URL_BACKUP)}`,
      ]

      let payload: {
        features?: Array<{
          id?: string
          properties?: {
            mag?: number | null
            place?: string
            time?: number
            url?: string
          }
          geometry?: {
            coordinates?: number[]
          }
        }>
      } | null = null

      for (const target of [...new Set(targets)]) {
        try {
          const candidate = await fetchLiveFeed(target)
          if ((candidate.features?.length ?? 0) > 0) {
            payload = candidate
            break
          }
        } catch {
          // try next target
        }
      }

      if (!payload) {
        throw new Error('No live earthquake targets responded with data.')
      }

      // Pakistan bounds for prioritization
      const PAKISTAN_BOUNDS = {
        minLat: 23.0,
        maxLat: 37.0,
        minLng: 60.0,
        maxLng: 78.0,
      }

      const isInPakistan = (coords: number[]) => {
        const lng = Number(coords[0] ?? 0)
        const lat = Number(coords[1] ?? 0)
        return lat >= PAKISTAN_BOUNDS.minLat && lat <= PAKISTAN_BOUNDS.maxLat &&
               lng >= PAKISTAN_BOUNDS.minLng && lng <= PAKISTAN_BOUNDS.maxLng
      }

      // Separate Pakistan and global earthquakes
      const allFeatures = payload.features ?? []
      const pakistanFeatures = allFeatures.filter(f => isInPakistan(f.geometry?.coordinates ?? []))
      const globalFeatures = allFeatures.filter(f => !isInPakistan(f.geometry?.coordinates ?? []))

      // Prioritize Pakistan earthquakes: show all Pakistan quakes + recent global ones
      const prioritized = [
        ...pakistanFeatures,
        ...globalFeatures.sort((a, b) => Number(b.properties?.time ?? 0) - Number(a.properties?.time ?? 0)).slice(0, 50)
      ]

      const latest = prioritized
        .sort((a, b) => Number(b.properties?.time ?? 0) - Number(a.properties?.time ?? 0))
        .slice(0, 100)
        .map((feature, index) => {
          const coords = feature.geometry?.coordinates ?? []
          const lng = Number(coords[0] ?? 0)
          const lat = Number(coords[1] ?? 0)
          const depthKm = Number(coords[2] ?? 0)
          const magnitude = Number(feature.properties?.mag ?? 0)
          return {
            id: String(feature.id ?? `eq-${index}`),
            magnitude,
            place: String(feature.properties?.place ?? 'Unknown location'),
            time: new Date(Number(feature.properties?.time ?? Date.now())).toISOString(),
            depthKm,
            lat,
            lng,
            url: String(feature.properties?.url ?? 'https://earthquake.usgs.gov/earthquakes/'),
          }
        })
        .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))

      const syncedAt = new Date().toISOString()
      setGlobalEarthquakesSyncedAt(syncedAt)

      setGlobalEarthquakes(latest)
      localStorage.setItem('r360-global-earthquakes', JSON.stringify(latest))
      localStorage.setItem('r360-global-earthquakes-synced-at', syncedAt)

      if (latest.length > 0) {
        const stillExists = latest.some((item) => item.id === selectedGlobalEarthquakeId)
        setSelectedGlobalEarthquakeId(stillExists ? selectedGlobalEarthquakeId : latest[0].id)
        setShowGlobalEarthquakesOnMap(false)
        setGlobalEarthquakeMapFocusToken((value) => value + 1)
      }
    } catch {
      setGlobalEarthquakeError(t.errors.globalEarthquakeFeedFailed)
    } finally {
      window.clearTimeout(timer)
      if (globalEarthquakeAbortRef.current === controller) {
        globalEarthquakeAbortRef.current = null
      }
      globalEarthquakeRequestInFlightRef.current = false
      setIsLoadingGlobalEarthquakes(false)
    }
  }, [selectedGlobalEarthquakeId, t.errors.globalEarthquakeFeedFailed])

  useEffect(() => {
    return () => {
      globalEarthquakeAbortRef.current?.abort()
      globalEarthquakeAbortRef.current = null
      globalEarthquakeRequestInFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    if (activeSection !== 'riskMaps') return
    if (alertLog.length === 0) {
      void loadLiveAlerts()
    }
  }, [activeSection, alertLog.length, loadLiveAlerts])

  useEffect(() => {
    if (activeSection !== 'riskMaps') return
    if (globalEarthquakes.length === 0) {
      void loadGlobalEarthquakes()
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void loadGlobalEarthquakes()
    }, 180000)

    return () => window.clearInterval(timer)
  }, [activeSection, globalEarthquakes.length, loadGlobalEarthquakes])

  useEffect(() => {
    const onHashChange = () => {
      setIsQaRoute(window.location.hash === '#qa-responsive')
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const pageSlugForCms = sectionKeyToPageSlug(activeSection)

  const pageConfigContextValue = useMemo(
    () => ({
      pageSlug: pageSlugForCms,
      elements: {},
      reload: async () => {},
      language,
      loadStatus: 'ready' as const,
      loadError: null,
    }),
    [pageSlugForCms, language],
  )

  if (isQaRoute) {
    return (
      <PageConfigElementsProvider value={pageConfigContextValue}>
        <ResponsiveQa />
      </PageConfigElementsProvider>
    )
  }

  const notificationPermissionLabel =
    earthquakeNotifyPermission === 'granted' ? 'Granted'
    : earthquakeNotifyPermission === 'denied' ? 'Denied'
    : earthquakeNotifyPermission === 'unsupported' ? 'Unsupported'
    : 'Not Requested'
  const notificationPermissionTone =
    earthquakeNotifyPermission === 'granted' ? 'is-granted'
    : earthquakeNotifyPermission === 'denied' ? 'is-denied'
    : earthquakeNotifyPermission === 'unsupported' ? 'is-unsupported'
    : 'is-pending'

  const notificationSettingsPanel = (
    <>
      <h3 className="settings-card__title">Settings</h3>
      <p className="settings-card__subtitle">Notification Preferences</p>
      <div className="settings-card__group" role="group" aria-label="Notification settings">
        <label className="switch-row">
          <span className="settings-card__switch-label">
            <span className="settings-card__icon" aria-hidden>
              🌍
            </span>
            <span>Enable Earthquake Alerts</span>
          </span>
          <input
            type="checkbox"
            checked={earthquakeNotifySettings.enabled}
            onChange={(event) => updateEarthquakeNotifySettings({ enabled: event.target.checked })}
          />
        </label>
        <label className="switch-row">
          <span className="settings-card__switch-label">
            <span className="settings-card__icon" aria-hidden>
              🔔
            </span>
            <span>Enable Browser Notifications</span>
          </span>
          <input
            type="checkbox"
            checked={earthquakeNotifyPermission === 'granted'}
            onChange={(event) => toggleBrowserNotificationPreference(event.target.checked)}
          />
        </label>
        <label className="switch-row">
          <span className="settings-card__switch-label">
            <span className="settings-card__icon" aria-hidden>
              🔊
            </span>
            <span>Enable Notification Sound</span>
          </span>
          <input
            type="checkbox"
            checked={earthquakeNotifySettings.soundEnabled}
            onChange={(event) => updateEarthquakeNotifySettings({ soundEnabled: event.target.checked })}
          />
        </label>
      </div>
      <div className="settings-card__actions">
        <button type="button" onClick={sendEarthquakeNotificationTest} disabled={earthquakeNotifyPermission !== 'granted'}>
          Test Notification
        </button>
        <button type="button" onClick={sendEarthquakeSoundTest}>
          Test Sound
        </button>
      </div>
      <p className="settings-card__meta">
        Permission:{' '}
        <span className={`settings-permission-badge ${notificationPermissionTone}`}>
          {notificationPermissionLabel}
        </span>
      </p>
      {earthquakeNotifyStatusMsg ? <p className="settings-card__status">{earthquakeNotifyStatusMsg}</p> : null}
    </>
  )

  const renderSectionContent = (section: SectionKey) => {
    const rf = (pageId: 'main' | 'analysis' | 'estimate', key: string) =>
      retrofitCmsAttrs(pageId, key, retrofitCmsPayload.pages, false)

    if (section === 'bestPractices') {
      return (
        <Fragment>
          <div className="panel section-panel section-best-practices">
            <CmsSectionHeading fallback={t.sections.bestPractices} />
            <CmsText id="sectionIntro" fallback={t.homeCards.bestPractices.subtitle} className="section-lead" />
            <div className="inline-controls best-practices-controls">
              <label className="best-practices-label">
                {t.bestPractices.hazardType}
                <select
                  value={bestPracticeHazard}
                  onChange={(event) => setBestPracticeHazard(event.target.value as 'flood' | 'earthquake')}
                >
                  <option value="flood">{t.bestPractices.flood}</option>
                  <option value="earthquake">{t.bestPractices.earthquake}</option>
                </select>
              </label>
            </div>

            {visibleGlobalPractices.map((practice) => {
              const view = resolveBestPracticeView(practice, isUrdu)
              const practiceImage = bestPracticeImageById[practice.id]
              const practiceImageUrl = practiceImage?.imageUrl ?? ''
              const practiceImageCandidates = practiceImage?.imageCandidates ?? []
              const openPracticeLightbox = () => {
                if (practiceImageUrl) setBestPracticeImageLightbox({ src: practiceImageUrl, title: view.title })
              }

              return (
                <details key={practice.id} className="best-practice-item">
                  <summary>{view.title}</summary>
                  <div className="best-practice-item-content">
                    <div className="best-practice-item-text">
                      <p>{view.summary}</p>

                      <div className="best-practice-media-col">
                        <figure className="best-practice-figure">
                          <button
                            type="button"
                            className="best-practice-thumb-wrap"
                            onClick={openPracticeLightbox}
                            aria-label={`${t.bestPractices.openFullScreen}: ${view.title}`}
                          >
                            <BestPracticeImage className="practice-image-thumb" imageCandidates={practiceImageCandidates} title={view.title} />
                            <span className="best-practice-thumb-overlay" aria-hidden="true">
                              <span className="best-practice-expand-glyph">⤢</span>
                            </span>
                          </button>
                          <figcaption className="best-practice-media-caption">
                            <span className="best-practice-media-hint">{t.bestPractices.imagePreviewHint}</span>
                            <button type="button" className="best-practice-open-full" onClick={openPracticeLightbox}>
                              {t.bestPractices.openFullScreen}
                            </button>
                          </figcaption>
                        </figure>
                      </div>

                      <p className="best-practice-tech-heading">
                        <strong>Technical Notes</strong>
                      </p>
                      <ul className="best-practice-tech-notes">
                        {view.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ul>
                      <p>
                        <strong>{t.bestPractices.globalReference}</strong> {view.region}
                      </p>
                      <p>
                        <strong>{t.bestPractices.benefitCostRatio}</strong> {practice.bcr}
                      </p>
                      <button
                        className="best-practice-action"
                        onClick={() => {
                          setApplyHazard(bestPracticeHazard)
                          setApplyBestPracticeTitle(practice.title)
                          navigateToSection('applyRegion')
                        }}
                      >
                        <CmsText as="span" id="block.bestPracticesConstructInRegion" fallback={t.bestPractices.constructInRegion} />
                      </button>
                    </div>
                  </div>
                </details>
              )
            })}

            {hasBestPracticeImageCatalogMismatch && <p role="alert">Best Practices catalog mismatch. Expected 24 image mappings.</p>}
          </div>

          {bestPracticeImageLightbox ?
            createPortal(
              <div
                className="best-practice-lightbox r360-fullscreen-overlay"
                role="dialog"
                aria-modal="true"
                aria-label={bestPracticeImageLightbox.title}
                onClick={() => setBestPracticeImageLightbox(null)}
              >
                <div className="best-practice-lightbox-inner r360-fullscreen-overlay__panel" onClick={(event) => event.stopPropagation()}>
                  <div className="best-practice-lightbox-toolbar">
                    <p className="best-practice-lightbox-title r360-fullscreen-overlay__title">{bestPracticeImageLightbox.title}</p>
                    <button
                      type="button"
                      className="best-practice-lightbox-close"
                      onClick={() => setBestPracticeImageLightbox(null)}
                      aria-label={t.bestPractices.closeFullScreen}
                    >
                      ×
                    </button>
                  </div>
                  <div className="best-practice-lightbox-stage">
                    <img
                      className="best-practice-lightbox-img"
                      src={bestPracticeImageLightbox.src}
                      alt={bestPracticeImageLightbox.title}
                      decoding="async"
                    />
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}
        </Fragment>
      )
    }

    if (section === 'liveEarthquakeMap') {
      return (
        <EmbeddedEarthquakePage title={t.riskMap.liveEarthquakeAlerts} language={language} />
      )
    }

    if (section === 'riskMaps') {
      const layerDisplayLabel =
        mapLayer === 'infraRisk' ? t.riskMap.layerInfraRisk : mapLayer === 'flood' ? t.riskMap.layerFlood : t.riskMap.layerEarthquake
      return (
        <div className="panel section-panel section-risk-maps risk-zone-dashboard">
          <h2 className="risk-zone-title">
            <CmsText as="span" id="mainTitle" fallback={t.sections.riskMaps} />
            <span>
              <CmsText as="span" id="titleExplore" fallback={t.riskMap.titleExplore} />
            </span>
          </h2>
          <div className="context-split-layout risk-zone-top-grid">
            <aside className="context-left-panel risk-zone-summary-card">
              <CmsText as="h3" id="block.selectionSummary" fallback={t.riskMap.selectionSummary} />
              <p>
                <strong>{t.riskMap.province}:</strong> {selectedProvince}
              </p>
              <p>
                <strong>{t.riskMap.district}:</strong> {selectedDistrict ?? t.riskMap.allDistricts}
              </p>
              <p>
                <strong>{t.riskMap.layer}:</strong> {layerDisplayLabel}
              </p>
              <p>
                <strong>{t.riskMap.selectedRisk}:</strong> {riskValue}
              </p>
            </aside>
            <div className="inline-controls risk-primary-controls">
              <label>
                {t.riskMap.layer}
                <select value={mapLayer} onChange={(event) => setMapLayer(event.target.value as typeof mapLayer)}>
                  <option value="earthquake">{t.riskMap.layerEarthquake}</option>
                  <option value="flood">{t.riskMap.layerFlood}</option>
                  <option value="infraRisk">{t.riskMap.layerInfraRisk}</option>
                </select>
              </label>
              <label>
                {t.riskMap.province}
                <select
                  value={selectedProvince}
                  onChange={(event) => {
                    setSelectedProvince(event.target.value)
                    setSelectedDistrict(null)
                  }}
                >
                  {Object.keys(effectiveProvinceRisk).map((province) => (
                    <option key={province}>{province}</option>
                  ))}
                </select>
                </label>
              <label>
                {t.riskMap.district}
                <select value={selectedDistrict ?? ''} onChange={(event) => setSelectedDistrict(event.target.value || null)}>
                  <option value="">{t.riskMap.selectDistrict}</option>
                  {availableMapDistricts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t.riskMap.alertWindow}
                <select value={alertFilterWindow} onChange={(event) => setAlertFilterWindow(event.target.value as AlertFilterWindow)}>
                  <option value="24h">{t.riskMap.last24h}</option>
                  <option value="7d">{t.riskMap.last7d}</option>
                  <option value="ongoing">{t.riskMap.ongoing}</option>
                </select>
              </label>
            </div>
          </div>
          <div className="inline-controls risk-action-controls">
            <button onClick={requestCurrentUserLocation} disabled={isDetectingLocation}>
              {isDetectingLocation ? t.riskMap.detectingLocation : t.riskMap.useMyLocation}
            </button>
          </div>
          {locationAccessMsg && <p>{locationAccessMsg}</p>}
          {districtProfileSavedMsg && <p>{districtProfileSavedMsg}</p>}
          <div className="alerts risk-progress-panel">
            <p>
              {t.riskMap.loadingProgress} <strong>{riskActionProgress}%</strong>
            </p>
            <progress value={riskActionProgress} max={100} />
          </div>
          <div className="map-fullscreen-actions">
            <button
              type="button"
              className="map-fullscreen-launch"
              onClick={() => {
                const fullscreenMapUrl = `${import.meta.env.BASE_URL}pakistan-risk-map-fullscreen.html#autofs=1`
                window.open(fullscreenMapUrl, '_blank', 'noopener,noreferrer')
              }}
            >
              {t.riskMap.fullscreenMap}
            </button>
          </div>
          <RiskMap
            layer={mapLayer}
            selectedProvince={selectedProvince}
            selectedDistrict={selectedDistrict}
            riskByProvince={effectiveProvinceRisk}
            districtRiskLookup={districtRiskLookup}
            alertMarkers={filteredHazardAlerts}
            globalEarthquakeMarkers={globalEarthquakes}
            historicalDisasterEvents={pakistanHistoricalDisasterEvents}
            showGlobalEarthquakeMarkers={showGlobalEarthquakesOnMap}
            globalEarthquakeFocusToken={globalEarthquakeMapFocusToken}
            userLocationMarker={detectedUserLocation}
            colorblindFriendly={colorblindFriendlyMap}
            onSelectProvince={setSelectedProvince}
            onSelectDistrict={setSelectedDistrict}
            uiLabels={riskMapUiLabels}
          />
          <div className="risk-source-strip">
            <p>
              {t.riskMap.boundaryStrip} {selectedProvince}
              {selectedDistrict ? ` • ${selectedDistrict}` : ''}
            </p>
            <p>
              {t.riskMap.selectedRiskLevel} <strong>{riskValue}</strong>
            </p>
          </div>

          {selectedDistrict && (
            <div className="retrofit-model-output risk-card">
              <CmsText as="h3" id="block.districtActionPanel" fallback={t.riskMap.districtActionPanel} />
              <p>
                {t.riskMap.districtSelected} <strong>{selectedDistrict}</strong>
              </p>
              <p>
                {t.riskMap.dominantStructure}{' '}
                <strong>{selectedDistrictProfile?.dominantStructure ?? t.riskMap.localSurveyRequired}</strong>
              </p>
              {selectedDistrictProfile && (
                <p>
                  {t.riskMap.vulnerabilityScore}{' '}
                  <strong>
                    {selectedDistrictProfile.structureScores.earthquake.toFixed(2)} /{' '}
                    {selectedDistrictProfile.structureScores.flood.toFixed(2)}
                  </strong>
                </p>
              )}
              <ul>
                {(selectedDistrictProfile?.resilienceActions ?? [
                  t.riskMap.defaultResilienceAction1,
                  t.riskMap.defaultResilienceAction2,
                  t.riskMap.defaultResilienceAction3,
                ]).map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="risk-insights-grid">
            <div className="global-earthquake-panel global-earthquake-alerts-card risk-card risk-earthquake-card">
              <div className="global-earthquake-alerts-head">
                <CmsText as="h3" id="block.liveEarthquakeAlertsTitle" fallback={t.riskMap.liveEarthquakeAlerts} />
              </div>
              <button
                type="button"
                className="global-earthquake-launch-btn"
                onClick={() => navigateToSection('liveEarthquakeMap', { bypassEditLock: true })}
              >
                {t.riskMap.viewLiveAlerts}
              </button>
            </div>

            <div className="retrofit-model-output risk-card risk-chatbot-card">
              <h3>
                <button type="button" className="section-collapsible-toggle" onClick={() => togglePanel('riskLocalAdvisoryChatbot')} aria-expanded={expandedPanels.riskLocalAdvisoryChatbot}>
                  <CmsText as="span" id="block.localAdvisoryChatbot" fallback={t.riskMap.localAdvisoryChatbot} />
                  <span>{expandedPanels.riskLocalAdvisoryChatbot ? '▾' : '▸'}</span>
                </button>
              </h3>
              {expandedPanels.riskLocalAdvisoryChatbot && (
                <>
                  <CmsText id="block.chatbotHint" fallback={t.riskMap.chatbotHint} />
                  <form
                    className="inline-controls"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void sendLocalAdvisoryQuestion()
                    }}
                  >
                    <input
                      type="text"
                      value={advisoryQuestion}
                      onChange={(event) => setAdvisoryQuestion(event.target.value)}
                      placeholder={t.riskMap.chatPlaceholder}
                      aria-label={t.riskMap.chatPlaceholder}
                    />
                    <button type="submit" disabled={isAskingAdvisory}>
                      {isAskingAdvisory ? t.riskMap.thinking : t.riskMap.ask}
                    </button>
                  </form>
                  {advisoryError && <p>{advisoryError}</p>}
                  {advisoryMessages.length > 0 && (
                    <>
                      {advisoryMessages.slice(-6).map((message, idx) => (
                        <p key={`${message.role}-${idx}`}>
                          <strong>{message.role === 'user' ? t.riskMap.you : t.riskMap.advisor}:</strong> {message.text}
                        </p>
                      ))}
                      <div className="inline-controls">
                        <button onClick={() => void downloadLatestAdvisoryAnswerPdf()}>
                          <CmsText as="span" id="block.riskDownloadLatestPdf" fallback={t.riskMap.downloadLatestPdf} />
                        </button>
                        <button onClick={() => { void copyLatestAdvisoryAnswer() }}>
                          <CmsText as="span" id="block.riskCopyAnswer" fallback={t.riskMap.copyAnswer} />
                        </button>
                      </div>
                      {advisoryCopyMsg && <p>{advisoryCopyMsg}</p>}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="retrofit-model-output risk-card cad-review-card" style={{ padding: '1.1rem 1.2rem', lineHeight: 1.45 }}>
            <button
              type="button"
              onClick={() => setIsStructureReviewExpanded((prev) => !prev)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.22)',
                color: '#ffffff',
                boxShadow: 'none',
                padding: '0.6rem 0.7rem',
                borderRadius: '8px',
                marginBottom: '0.55rem',
              }}
              aria-expanded={isStructureReviewExpanded}
              aria-controls="structure-review-panel"
            >
              <CmsText
                as="span"
                id="block.structureReviewTitle"
                fallback={t.riskMap.structureReviewTitle}
                style={{ fontSize: '1.08rem', fontWeight: 700, textAlign: 'left' } satisfies CSSProperties}
              />
              <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>{isStructureReviewExpanded ? t.riskMap.collapse : t.riskMap.expand}</span>
            </button>

            {isStructureReviewExpanded && (
              <div id="structure-review-panel">
                <CmsText
                  id="block.cadReviewIntro"
                  fallback={t.cadReview.intro}
                  style={{ fontSize: '0.88rem', color: '#dbe6f5', marginTop: 0, marginBottom: '0.9rem' } satisfies CSSProperties}
                />

                <div className="cad-step-card" style={{ backgroundColor: '#f8f9ff', color: '#1b2430', padding: '0.85rem 0.95rem', borderRadius: '8px', marginBottom: '0.8rem', borderLeft: '4px solid #007bff' }}>
                  <CmsText
                    as="h4"
                    id="block.cadStep1Title"
                    fallback={t.cadReview.step1Title}
                    style={{ marginTop: 0, marginBottom: '0.3rem', color: '#005fd1', fontSize: '0.95rem', lineHeight: 1.3 } satisfies CSSProperties}
                  />
                  <p style={{ marginTop: 0, marginBottom: '0.4rem', fontSize: '0.84rem', lineHeight: 1.4, color: '#1b2430' }}>
                    {t.cadReview.acceptedFiles} <strong>{t.cadReview.fileFormats}</strong>
                  </p>
                  <input
                    type="file"
                    accept=".dwg,.dxf,.ifc,.pdf,image/*"
                    onChange={(event) => setStructureReviewFile(event.target.files?.[0] ?? null)}
                  />
                  {structureReviewFile && <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', color: '#2d7d46' }}>✓ {structureReviewFile.name}</p>}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void submitStructureRiskReview()
                  }}
                >
                <div className="cad-step-card" style={{ backgroundColor: '#fff8f0', color: '#1b2430', padding: '0.85rem 0.95rem', borderRadius: '8px', marginBottom: '0.8rem', borderLeft: '4px solid #fd7e14' }}>
                  <CmsText
                    as="h4"
                    id="block.cadStep2Title"
                    fallback={t.cadReview.step2Title}
                    style={{ marginTop: 0, marginBottom: '0.3rem', color: '#c65d00', fontSize: '0.95rem', lineHeight: 1.3 } satisfies CSSProperties}
                  />
                  <div className="inline-controls" style={{ alignItems: 'stretch', gap: '0.7rem' }}>
                    <label style={{ color: '#1b2430' }}>
                      {t.cadReview.structureType}
                      <select value={structureReviewType} onChange={(event) => setStructureReviewType(event.target.value as typeof structureReviewType)}>
                        <option value="Home">{t.cadReview.optHome}</option>
                        <option value="School">{t.cadReview.optSchool}</option>
                        <option value="Clinic">{t.cadReview.optClinic}</option>
                        <option value="Bridge">{t.cadReview.optBridge}</option>
                        <option value="Commercial">{t.cadReview.optCommercial}</option>
                        <option value="Industrial">{t.cadReview.optIndustrial}</option>
                      </select>
                    </label>
                    <label style={{ color: '#1b2430' }}>
                      {t.cadReview.floors}
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={cadNumFloors}
                        onChange={(event) => setCadNumFloors(Math.max(1, Number(event.target.value) || 1))}
                      />
                    </label>
                    <label style={{ color: '#1b2430' }}>
                      {t.cadReview.yearBuiltLabel}
                      <input
                        type="number"
                        min={1900}
                        max={new Date().getFullYear()}
                        value={cadYearBuilt}
                        onChange={(event) => setCadYearBuilt(Math.min(new Date().getFullYear(), Math.max(1900, Number(event.target.value) || 2000)))}
                      />
                    </label>
                    <label style={{ color: '#1b2430' }}>
                      {t.cadReview.gpsOptional}
                      <input
                        type="text"
                        value={structureReviewGps}
                        onChange={(event) => setStructureReviewGps(event.target.value)}
                        placeholder="29.40, 71.68"
                      />
                    </label>
                  </div>
                </div>

                <div className="cad-step-card" style={{ backgroundColor: '#f0fff4', color: '#1b2430', padding: '0.85rem 0.95rem', borderRadius: '8px', marginBottom: '0.8rem', borderLeft: '4px solid #28a745' }}>
                  <CmsText
                    as="h4"
                    id="block.cadStep3Title"
                    fallback={t.cadReview.step3Title}
                    style={{ marginTop: 0, marginBottom: '0.3rem', color: '#157347', fontSize: '0.95rem', lineHeight: 1.3 } satisfies CSSProperties}
                  />
                  <CmsText
                    id="block.cadStep3Lead"
                    fallback={t.cadReview.step3Lead}
                    style={{ marginTop: 0, marginBottom: '0.35rem', fontSize: '0.84rem', lineHeight: 1.4, color: '#1b2430' } satisfies CSSProperties}
                  />
                  <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.85rem', lineHeight: 1.38, color: '#1b2430' }}>
                    <li style={{ color: '#1b2430' }}>{t.cadReview.layerColumns}</li>
                    <li style={{ color: '#1b2430' }}>{t.cadReview.layerBeams}</li>
                    <li style={{ color: '#1b2430' }}>{t.cadReview.layerSlabs}</li>
                    <li style={{ color: '#1b2430' }}>{t.cadReview.layerWalls}</li>
                  </ul>
                </div>

                <div className="cad-step-card" style={{ backgroundColor: '#fff3f0', color: '#1b2430', padding: '0.85rem 0.95rem', borderRadius: '8px', marginBottom: '0.85rem', borderLeft: '4px solid #dc3545' }}>
                  <CmsText
                    as="h4"
                    id="block.cadStep4Title"
                    fallback={t.cadReview.step4Title}
                    style={{ marginTop: 0, marginBottom: '0.3rem', color: '#b42318', fontSize: '0.95rem', lineHeight: 1.3 } satisfies CSSProperties}
                  />
                  <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.85rem', lineHeight: 1.38, color: '#1b2430' }}>
                    <li style={{ color: '#1b2430' }}>
                      <strong style={{ color: '#1b2430' }}>{t.cadReview.ruleAc318Label}</strong> {t.cadReview.ruleAc318Desc}
                    </li>
                    <li style={{ color: '#1b2430' }}>
                      <strong style={{ color: '#1b2430' }}>{t.cadReview.ruleFemaLabel}</strong> {t.cadReview.ruleFemaDesc}
                    </li>
                    <li style={{ color: '#1b2430' }}>
                      <strong style={{ color: '#1b2430' }}>{t.cadReview.ruleBcLabel}</strong> {t.cadReview.ruleBcDesc}
                    </li>
                    <li style={{ color: '#1b2430' }}>
                      <strong style={{ color: '#1b2430' }}>{t.cadReview.rulePbcLabel}</strong> {t.cadReview.rulePbcDesc}
                    </li>
                    <li style={{ color: '#1b2430' }}>
                      <strong style={{ color: '#1b2430' }}>{t.cadReview.ruleGridLabel}</strong> {t.cadReview.ruleGridDesc}
                    </li>
                    <li style={{ color: '#1b2430' }}>
                      <strong style={{ color: '#1b2430' }}>{t.cadReview.ruleVertLabel}</strong> {t.cadReview.ruleVertDesc}
                    </li>
                  </ul>
                </div>

                <button type="submit" disabled={isSubmittingStructureReview || !structureReviewFile}>
                  {isSubmittingStructureReview ? t.cadReview.runningAnalysis : t.cadReview.runReview}
                </button>
                {structureReviewError && <p style={{ color: '#ffd4d4' }}>{structureReviewError}</p>}
                </form>
                {structureReviewResult && (
                  <div className="retrofit-ai-guidance" style={{ marginTop: '0.7rem' }}>
                    <p style={{ margin: '0.1rem 0 0.35rem 0' }}>
                      <strong>{t.cadReview.engineeringSummary}</strong> {structureReviewResult.summary}
                    </p>
                    <p style={{ margin: '0.1rem 0 0.5rem 0' }}>
                      <strong>{t.cadReview.riskScoreLabel}</strong>{' '}
                      {Math.min(100, Math.max(30, 45 + structureReviewResult.defects.length * 9 + (riskValue === 'Very High' ? 22 : riskValue === 'High' ? 14 : 8)))}/100
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1rem', lineHeight: 1.35 }}>
                      {structureReviewResult.priorityActions.slice(0, 6).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => {
                        navigateToSection('designToolkit')
                      }}
                    >
                      {t.cadReview.openDesignGuide}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <CmsText id="block.recommendationFooter" fallback={t.riskMap.recommendationFooter} />
        </div>
      )
    }

    if (section === 'designToolkit') {
      const materialSafetyLabel = materialSuitability.flags.length >= 3 ? 'Moderate' : materialSuitability.flags.length >= 1 ? 'Good' : 'Excellent'
      const materialSafetyLabelDisplay =
        materialSafetyLabel === 'Moderate' ? t.designToolkit.moderate : materialSafetyLabel === 'Good' ? t.designToolkit.good : t.designToolkit.excellent
      const floodRiskBand = designHazardOverlay.floodDepth100y >= 1.5 ? 'High' : designHazardOverlay.floodDepth100y >= 0.8 ? 'Medium' : 'Low'
      const floodRiskBandDisplay =
        floodRiskBand === 'High' ? t.designToolkit.high : floodRiskBand === 'Medium' ? t.designToolkit.medium : t.designToolkit.low
      const windExposureLabelDisplay = coastalCities.has(designCity) ? t.designToolkit.coastalHigh : t.designToolkit.inlandModerate
      const designSoilDisplay: Record<(typeof designSoilType), string> = {
        Rocky: t.designToolkit.rocky,
        Sandy: t.designToolkit.sandy,
        Clayey: t.designToolkit.clayey,
        Silty: t.designToolkit.silty,
        Saline: t.designToolkit.saline,
      }
      const designHumidityDisplay =
        designHumidity === 'Low' ? t.designToolkit.low : designHumidity === 'Medium' ? t.designToolkit.medium : t.designToolkit.high

      return (
        <div className="panel section-panel section-design-toolkit section-infra-models">
          <div className="design-toolkit-heading">
            <CmsSectionHeading fallback={t.sections.designToolkit} />
            <CmsText id="sectionIntro" fallback={t.designToolkit.tagline} />
          </div>

          <div className="inline-controls design-toolkit-filters">
            <label>
              {t.designToolkit.province}
              <select
                value={designProvince}
                onChange={(event) => {
                  const province = event.target.value
                  setDesignProvince(province)
                  setDesignCity((pakistanCitiesByProvince[province] ?? [])[0] ?? '')
                }}
              >
                {Object.keys(effectiveProvinceRisk).map((province) => (
                  <option key={province}>{province}</option>
                ))}
              </select>
            </label>
            <label>
              {t.designToolkit.city}
              <select value={designCity} onChange={(event) => setDesignCity(event.target.value)}>
                {availableDesignCities.map((city) => (
                  <option key={city}>{city}</option>
                ))}
              </select>
            </label>
            <label>
              {t.designToolkit.soilType}
              <select value={designSoilType} onChange={(event) => setDesignSoilType(event.target.value as typeof designSoilType)}>
                <option value="Rocky">{t.designToolkit.rocky}</option>
                <option value="Sandy">{t.designToolkit.sandy}</option>
                <option value="Clayey">{t.designToolkit.clayey}</option>
                <option value="Silty">{t.designToolkit.silty}</option>
                <option value="Saline">{t.designToolkit.saline}</option>
              </select>
            </label>
            <label>
              {t.designToolkit.humidity}
              <select value={designHumidity} onChange={(event) => setDesignHumidity(event.target.value as typeof designHumidity)}>
                <option value="Low">{t.designToolkit.low}</option>
                <option value="Medium">{t.designToolkit.medium}</option>
                <option value="High">{t.designToolkit.high}</option>
              </select>
            </label>
          </div>

          <div className="design-toolkit-summary-strip">
            <div className="design-toolkit-summary-card">
              <CmsText as="span" id="block.dtSummarySeismicZone" fallback={t.designToolkit.seismicZone} />
              <strong>{designHazardOverlay.seismicZone}/5</strong>
            </div>
            <div className="design-toolkit-summary-card">
              <CmsText as="span" id="block.dtSummaryFloodDepth" fallback={t.designToolkit.floodDepth100y} />
              <strong>{designHazardOverlay.floodDepth100y.toFixed(1)} m</strong>
            </div>
            <div className="design-toolkit-summary-card">
              <CmsText as="span" id="block.dtSummaryLiquefaction" fallback={t.designToolkit.liquefactionRisk} />
              <strong>{designHazardOverlay.liquefaction}</strong>
            </div>
            <div className="design-toolkit-summary-card">
              <CmsText as="span" id="block.dtSummaryWindExposure" fallback={t.designToolkit.windExposure} />
              <strong>{windExposureLabelDisplay}</strong>
            </div>
          </div>

          <div className="design-toolkit-grid">
            <div className="design-toolkit-column">
              <div className="retrofit-model-output design-toolkit-card">
                <CmsText as="h3" id="block.recommendedMaterial" fallback={t.designToolkit.recommendedMaterial} />
                <p>
                  <strong>{materialSuitability.recommendations[0] ?? materialSuitability.recommendations.join(' | ')}</strong>
                </p>
                <p>
                  {t.designToolkit.soilCondition}: {designSoilDisplay[designSoilType]}
                </p>
                <p>
                  {t.designToolkit.riskSuitability} <strong>{materialSafetyLabelDisplay}</strong>
                </p>
                {materialSuitability.flags.length > 0 && (
                  <ul>
                    {materialSuitability.flags.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="retrofit-model-output design-toolkit-card">
                <h3>
                  <button type="button" className="section-collapsible-toggle" onClick={() => togglePanel('designSafeShelterCapacityPlanner')} aria-expanded={expandedPanels.designSafeShelterCapacityPlanner}>
                    <CmsText as="span" id="block.safeShelterPlanner" fallback={t.designToolkit.safeShelterPlanner} />
                    <span>{expandedPanels.designSafeShelterCapacityPlanner ? '▾' : '▸'}</span>
                  </button>
                </h3>
                {expandedPanels.designSafeShelterCapacityPlanner && (
                  <>
                    <div className="inline-controls design-toolkit-compact-controls">
                      <label>
                        {t.designToolkit.shelterAreaSqm}
                        <input
                          type="number"
                          min={20}
                          value={shelterAreaSqm}
                          onChange={(event) => setShelterAreaSqm(Number(event.target.value) || 20)}
                        />
                      </label>
                      <label>
                        {t.designToolkit.occupancyType}
                        <select
                          value={shelterOccupancyType}
                          onChange={(event) => setShelterOccupancyType(event.target.value as typeof shelterOccupancyType)}
                        >
                          <option value="School">{t.designToolkit.school}</option>
                          <option value="Mosque">{t.designToolkit.mosque}</option>
                          <option value="House">{t.designToolkit.house}</option>
                        </select>
                      </label>
                    </div>
                    <p>
                      {t.designToolkit.maxSafeCapacity} <strong>
                        {shelterCapacityPlan.maxCapacity} {t.designToolkit.people}
                      </strong>
                    </p>
                    <p>
                      {t.designToolkit.spacePerPerson}{' '}
                      <strong>
                        {shelterCapacityPlan.areaPerPerson.toFixed(1)} {t.designToolkit.unitSqm}
                      </strong>
                    </p>
                    <ul>
                      {shelterCapacityPlan.layout.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className="retrofit-model-output design-toolkit-card">
                <h3>
                  <button type="button" className="section-collapsible-toggle" onClick={() => togglePanel('designRecommendedFoundation')} aria-expanded={expandedPanels.designRecommendedFoundation}>
                    <CmsText as="span" id="block.recommendedFoundation" fallback={t.designToolkit.recommendedFoundation} />
                    <span>{expandedPanels.designRecommendedFoundation ? '▾' : '▸'}</span>
                  </button>
                </h3>
                {expandedPanels.designRecommendedFoundation && (
                  <>
                    <p>
                      <strong>{foundationRecommendation.type}</strong>
                    </p>
                    <ul>
                      {foundationRecommendation.risks.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className="retrofit-model-output design-toolkit-card">
                <h3>
                  <button type="button" className="section-collapsible-toggle" onClick={() => togglePanel('windStormGuide')} aria-expanded={expandedPanels.windStormGuide}>
                    <CmsText as="span" id="block.windStormGuide" fallback={t.designToolkit.windStormGuide} />
                    <span>{expandedPanels.windStormGuide ? '▾' : '▸'}</span>
                  </button>
                </h3>
                {expandedPanels.windStormGuide && (
                  <>
                    <ul>
                      <li>
                        {t.designToolkit.roofAngle} <strong>{windStormGuide.roofAngle}</strong>
                      </li>
                      <li>
                        {t.designToolkit.openings} <strong>{windStormGuide.openings}</strong>
                      </li>
                      <li>
                        {t.designToolkit.tieBeams} <strong>{windStormGuide.tieBeams}</strong>
                      </li>
                    </ul>
                    <p>{windStormGuide.note}</p>
                  </>
                )}
              </div>

              <div className="retrofit-model-output design-toolkit-card">
                <h3>
                  <button type="button" className="section-collapsible-toggle" onClick={() => togglePanel('fieldImplementationChecklist')} aria-expanded={expandedPanels.fieldImplementationChecklist}>
                    <CmsText as="span" id="block.fieldChecklist" fallback={t.designToolkit.fieldChecklist} />
                    <span>{expandedPanels.fieldImplementationChecklist ? '▾' : '▸'}</span>
                  </button>
                </h3>
                {expandedPanels.fieldImplementationChecklist && (
                  <ul>
                    {nonStructuralChecklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="retrofit-model-output design-toolkit-card">
                <h3>
                  <button type="button" className="section-collapsible-toggle" onClick={() => togglePanel('slopeStabilityEstimator')} aria-expanded={expandedPanels.slopeStabilityEstimator}>
                    <CmsText as="span" id="block.slopeStability" fallback={t.designToolkit.slopeStability} />
                    <span>{expandedPanels.slopeStabilityEstimator ? '▾' : '▸'}</span>
                  </button>
                </h3>
                {expandedPanels.slopeStabilityEstimator && (
                  <>
                    <div className="inline-controls design-toolkit-compact-controls">
                      <label>
                        {t.designToolkit.slopeAngleDeg}
                        <input type="number" min={5} max={60} value={slopeAngleDeg} onChange={(event) => setSlopeAngleDeg(Number(event.target.value) || 5)} />
                      </label>
                      <label>
                        {t.designToolkit.slopeHeightM}
                        <input type="number" min={1} max={20} value={slopeHeightM} onChange={(event) => setSlopeHeightM(Number(event.target.value) || 1)} />
                      </label>
                    </div>
                    <p>
                      {t.designToolkit.stabilityClass} <strong>{slopeEstimator.stabilityClass}</strong>
                    </p>
                    <p>
                      {t.designToolkit.recommendedWall} <strong>{slopeEstimator.wallType}</strong>
                    </p>
                    <p>
                      {t.designToolkit.minimumEmbedment} <strong>{slopeEstimator.embedment} m</strong>
                    </p>
                    <p>{slopeEstimator.drainage}</p>
                  </>
                )}
              </div>
            </div>

            <div className="design-toolkit-column design-toolkit-column-visual">
              <div className="retrofit-model-output design-toolkit-card design-toolkit-visual-hero">
                <div className="design-toolkit-visual-media" role="img" aria-label={t.designToolkit.visualBackdropAria} />
                <CmsText as="h3" id="block.regionalSnapshot" fallback={t.designToolkit.regionalSnapshot} />
                <p>
                  {designCity}, {designProvince} — {t.designToolkit.profileTuned} {designSoilDisplay[designSoilType]}{' '}
                  {t.designToolkit.soilWord} {designHumidityDisplay} {t.designToolkit.humidityWord}
                </p>
                <div className="design-toolkit-badge-row">
                  <span>
                    {t.designToolkit.floodRisk} {floodRiskBandDisplay}
                  </span>
                  <span>
                    {t.designToolkit.materialSuitability} {materialSafetyLabelDisplay}
                  </span>
                </div>
              </div>

              <div className="retrofit-model-output design-toolkit-card">
                <CmsText as="h3" id="block.hazardBalance" fallback={t.designToolkit.hazardBalance} />
                <div className="design-toolkit-status-list">
                  <p>
                    <CmsText as="span" id="block.dtHazardSeismicIntensity" fallback={t.designToolkit.seismicIntensity} />
                    <strong>
                      {t.designToolkit.zonePrefix} {designHazardOverlay.seismicZone}
                    </strong>
                  </p>
                  <p>
                    <CmsText as="span" id="block.dtHazardFloodExposure" fallback={t.designToolkit.floodExposure} />
                    <strong>{designHazardOverlay.floodDepth100y.toFixed(1)} m</strong>
                  </p>
                  <p>
                    <CmsText as="span" id="block.dtHazardLiquefaction" fallback={t.designToolkit.liquefaction} />
                    <strong>{designHazardOverlay.liquefaction}</strong>
                  </p>
                  <p>
                    <CmsText as="span" id="block.dtHazardWindProfile" fallback={t.designToolkit.windProfile} />
                    <strong>{windExposureLabelDisplay}</strong>
                  </p>
                </div>
              </div>

              <div className="retrofit-model-output design-toolkit-card">
                <CmsText as="h3" id="block.implementationFocus" fallback={t.designToolkit.implementationFocus} />
                <ul>
                  <li>{t.designToolkit.implFocus1}</li>
                  <li>{t.designToolkit.implFocus2}</li>
                  <li>{t.designToolkit.implFocus3}</li>
                </ul>
              </div>
            </div>
          </div>

          {designSummaryText && <p className="design-toolkit-summary-text">{designSummaryText}</p>}

          {showTrainingPrograms && (
            <ul>
              <li>{t.designToolkit.trainingNespak}</li>
              <li>{t.designToolkit.trainingUndp}</li>
              <li>{t.designToolkit.trainingErra}</li>
              <li>{t.designToolkit.trainingPdma}</li>
            </ul>
          )}
        </div>
      )
    }

    if (section === 'infraModels') {
      return (
        <div className="panel section-panel section-design-toolkit section-infra-models">
          <div className="infra-models-hero-slab">
            <CmsSectionHeading fallback={t.sections.infraModels} />
            <CmsText id="sectionIntro" fallback={t.homeCards.infraModels.subtitle} className="section-lead" />
          </div>
          <div className="infra-video-panel">
            <CmsText as="h3" id="block.overviewTitle" fallback={t.infraModels.overviewTitle} />
            <CmsText id="block.overviewBody" fallback={t.infraModels.overviewBody} />
            {!showInfraLayoutVideo ? (
              <button type="button" onClick={openInfraLayoutVideo}>
                <CmsText as="span" id="block.infraPlayOfficialVideo" fallback={t.infraModels.playOfficialVideo} />
              </button>
            ) : (
              <>
                {infraLayoutVideoError && <p role="alert">{infraLayoutVideoError}</p>}
                <video
                  key={activeInfraLayoutVideoSrc || infraLayoutPlaybackSrc || activeInfraMediaSrc}
                  className="infra-layout-video"
                  controls
                  autoPlay
                  playsInline
                  controlsList="nodownload"
                  preload="metadata"
                  onLoadStart={() => setInfraLayoutVideoError(null)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    handleInfraLayoutVideoLoadError(e)
                  }}
                >
                  {(() => {
                    const vsrc = activeInfraLayoutVideoSrc || infraLayoutPlaybackSrc || activeInfraMediaSrc
                    const vmime = inferVideoMime(vsrc)
                    return vmime ?
                        <source src={vsrc} type={vmime} />
                      : <source src={vsrc} />
                  })()}
                  {t.videoUnsupported}
                </video>
                <CmsText id="block.videoPurpose" fallback={t.infraModels.videoPurpose} />
                <button
                  type="button"
                  onClick={() => {
                    setShowInfraLayoutVideo(false)
                    setInfraLayoutVideoError(null)
                  }}
                >
                  <CmsText as="span" id="block.infraHideVideo" fallback={t.infraModels.hideVideo} />
                </button>
              </>
            )}
            {!showInfraLayoutVideo && infraLayoutVideoError && <p role="alert">{infraLayoutVideoError}</p>}
          </div>
          <div className="infra-models-toolbar-slab">
            <p>Official 16-model infrastructure catalog loaded from resilience360/infra-models.</p>
            {hasInfraCatalogMismatch && <p role="alert">Infra model catalog mismatch. Expected exactly 16 models.</p>}
            {infraModelsError && <p role="alert">{infraModelsError}</p>}
          </div>

          {STATIC_INFRA_MODELS.length > 0 && (
            <div className="infra-models-viewer">
              <div className="infra-model-catalog-bar">
                <span className="infra-model-catalog-label">Model</span>
                <div className="infra-model-catalog-selector" ref={infraModelCatalogRef}>
                  <button
                    type="button"
                    className="infra-model-catalog-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={isInfraModelCatalogOpen}
                    onClick={() => {
                      setIsInfraModelCatalogOpen((previous) => !previous)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setIsInfraModelCatalogOpen(true)
                      }
                    }}
                  >
                    <span className="infra-model-catalog-trigger-text">
                      {selectedInfraModel?.title ?? filteredInfraModels[0]?.title ?? 'Select model'}
                    </span>
                    <span className="infra-model-catalog-trigger-icon" aria-hidden="true">
                      {isInfraModelCatalogOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {isInfraModelCatalogOpen && (
                    <div className="infra-model-catalog-menu">
                      <div className="infra-model-catalog-search-wrap">
                        <input
                          type="search"
                          value={infraModelCatalogQuery}
                          onChange={(event) => {
                            setInfraModelCatalogQuery(event.target.value)
                            setInfraModelCatalogFocusIndex(0)
                          }}
                          className="infra-model-catalog-search"
                          placeholder="Search resilience model..."
                          autoFocus
                          onKeyDown={(event) => {
                            if (event.key === 'ArrowDown') {
                              event.preventDefault()
                              setInfraModelCatalogFocusIndex((previous) =>
                                Math.min(previous + 1, Math.max(0, filteredInfraModels.length - 1)),
                              )
                            } else if (event.key === 'ArrowUp') {
                              event.preventDefault()
                              setInfraModelCatalogFocusIndex((previous) => Math.max(previous - 1, 0))
                            } else if (event.key === 'Enter') {
                              event.preventDefault()
                              const targetModel = filteredInfraModels[infraModelCatalogFocusIndex]
                              if (!targetModel) return
                              setSelectedInfraModelId(targetModel.id)
                              setIsInfraModelCatalogOpen(false)
                            } else if (event.key === 'Escape') {
                              event.preventDefault()
                              setIsInfraModelCatalogOpen(false)
                            }
                          }}
                        />
                      </div>

                      <div className="infra-model-catalog-options" role="listbox" aria-label={t.infraModels.ariaInfraModelNames}>
                        {filteredInfraModels.length > 0 ?
                          filteredInfraModels.map((model, index) => {
                            const isActive = selectedInfraModelId === model.id
                            const isFocused = infraModelCatalogFocusIndex === index
                            return (
                              <button
                                key={model.id}
                                id={`infra-model-option-${model.id}`}
                                type="button"
                                role="option"
                                aria-selected={isActive}
                                className={`infra-model-catalog-option ${isActive ? 'is-active' : ''} ${isFocused ? 'is-focused' : ''}`}
                                onMouseEnter={() => setInfraModelCatalogFocusIndex(index)}
                                onClick={() => {
                                  setSelectedInfraModelId(model.id)
                                  setIsInfraModelCatalogOpen(false)
                                }}
                              >
                                <span className="infra-model-catalog-option-icon" aria-hidden="true">
                                  {getInfraModelCardIcon(model)}
                                </span>
                                <span className="infra-model-catalog-option-body">
                                  <span className="infra-model-catalog-option-title">{model.title}</span>
                                  <span className="infra-model-catalog-option-sub">
                                    {model.features[0] ?? model.description}
                                  </span>
                                </span>
                              </button>
                            )
                          })
                        : <p className="infra-model-catalog-empty">No models matched your search.</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedInfraModel ? (
                <article key={selectedInfraModel.id} className="infra-model-detail-card">
                  <header className="infra-model-detail-head">
                    <CmsText id="block.modelNameHeading" fallback={t.infraModels.modelNameHeading} />
                    <h3>{selectedInfraModel.title}</h3>
                  </header>
                  <p className="infra-model-detail-description">{selectedInfraModel.description}</p>
                  <div className="infra-model-media-block">
                    <div className="infra-model-side-by-side">
                      <div className="infra-model-left-pane">
                        {infraModelHeroCandidates.length > 0 ? (
                          <InfraModelHeroImage
                            candidates={infraModelHeroCandidates}
                            alt={`${selectedInfraModel.title} model visual`}
                            className="retrofit-preview infra-model-preview-image"
                          />
                        ) : (
                          <p>Content not available</p>
                        )}
                      </div>
                      <div className="infra-model-board-wrap infra-model-right-pane">
                        <CmsText id="block.modelBoardPdf" className="infra-model-board-label" fallback={t.infraModels.modelBoardPdf} />
                        <CmsText id="block.modelBoardNote" className="infra-model-board-note" fallback={t.infraModels.modelBoardNote} />
                        {infraModelPdfCandidates.length > 0 ? (
                          <ModelBoardPdfViewer pdfCandidates={infraModelPdfCandidates} embedKey={infraModelPdfEmbedKey} />
                        ) : (
                          <p>Content not available</p>
                        )}
                      </div>
                    </div>
                  </div>

                </article>
              ) : (
                <article className="infra-model-detail-card">
                  <header className="infra-model-detail-head">
                    <CmsText id="block.modelNameHeading" fallback={t.infraModels.modelNameHeading} />
                    <h3>No model selected</h3>
                  </header>
                  <p className="infra-model-detail-description">
                    Try a different search keyword to find a resilience model.
                  </p>
                </article>
              )}
            </div>
          )}
        </div>
      )
    }

    if (section === 'applyRegion') {
      return (
        <div className="panel section-panel section-apply">
          <CmsSectionHeading fallback={t.sections.applyRegion} />
          <CmsText id="sectionIntro" fallback={t.homeCards.applyRegion.subtitle} className="section-lead" />
            <section className="apply-region-live-card" aria-label={t.applyRegion.ariaLiveLocation}>
                <div className="apply-region-card-head">
                <CmsText as="h3" id="block.liveLocationTitle" fallback={t.applyRegion.liveLocationTitle} />
                <CmsText id="block.liveLocationIntro" fallback={t.applyRegion.liveLocationIntro} />
                </div>
                <button className="apply-region-refresh-btn" onClick={requestCurrentUserLocation} disabled={isDetectingLocation}>
                  {isDetectingLocation ?
                    <CmsText as="span" id="block.applyDetectingLocation" fallback={t.applyRegion.detectingLocation} />
                  : <CmsText as="span" id="block.applyRefreshLocation" fallback={t.applyRegion.refreshLocation} />}
                </button>
                {locationAccessMsg && <p className="apply-region-location-msg">{locationAccessMsg}</p>}
                {detectedUserLocation && (
                  <>
                    <p className="apply-region-location-msg">
                      {t.applyRegion.autoFilledFrom} <strong>{applyCity}, {applyProvince}</strong> | {t.applyRegion.hazardFocus}{' '}
                      <strong>{applyHazard}</strong>
                    </p>
                    <UserLocationMiniMap location={detectedUserLocation} popupTitle={t.riskMap.liveLocationMapPopup} />
                  </>
                )}
                <p className="apply-region-inspection-note">
                  <CmsText as="span" id="block.applyInspectionAdvice" fallback={t.applyRegion.inspectionAdvice} />{' '}
                  <strong>
                    <CmsText as="span" id="block.applyStronglyRecommended" fallback={t.applyRegion.stronglyRecommended} />
                  </strong>
                </p>
            </section>

            <div className="apply-region-guidance-actions">
              <button
                className="apply-region-guidance-btn"
                type="button"
                onClick={() => {
                  void generateApplyAreaGuidance()
                }}
                disabled={isGeneratingGuidance}
              >
                <span className="apply-region-guidance-btn-icon" aria-hidden="true">
                  {t.applyRegion.guidanceGenerateIcon}
                </span>
                <span className="apply-region-guidance-btn-body">
                  <span className="apply-region-guidance-btn-main">
                    <CmsText as="span" id="block.applyGuidanceGenerateMain" fallback={t.applyRegion.guidanceGenerateMain} />
                  </span>
                  <span className="apply-region-guidance-btn-sub">
                    {isGeneratingGuidance ? (
                      <CmsText as="span" id="block.applyPreparingWait" fallback={t.applyRegion.preparingWait} />
                    ) : (
                      <CmsText as="span" id="block.applyGuidanceGenerateSub" fallback={t.applyRegion.guidanceGenerateSub} />
                    )}
                  </span>
                </span>
              </button>
            </div>

            {guidanceError && <p>{guidanceError}</p>}

            {constructionGuidance && (
                <div className="retrofit-model-output apply-region-guidance-output">
                  {!isUrdu ? (
                    <>
                      <h3>
                        <CmsText as="span" id="block.guidanceHeadingPrefix" fallback={t.applyRegion.locationGuidanceEnglishHeading} />{' '}
                        {applyBestPracticeTitle}
                      </h3>
                      <p>
                        <strong>
                          <CmsText as="span" id="block.applyAreaLabel" fallback={t.applyRegion.areaLabel} />
                        </strong>{' '}
                        {applyCity}, {applyProvince} |{' '}
                        <strong>
                          <CmsText as="span" id="block.applyHazardLabel" fallback={t.applyRegion.hazardLabel} />
                        </strong>{' '}
                        {applyHazard}
                      </p>
                      <p>{constructionGuidance.summary}</p>

                      <CmsText as="h3" id="block.materialsHeading" fallback={t.applyRegion.materialsHeading} />
                      <ul>
                        {constructionGuidance.materials.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>

                      <CmsText as="h3" id="block.safetyChecksHeading" fallback={t.applyRegion.safetyChecksHeading} />
                      <ul>
                        {constructionGuidance.safety.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>

                      <CmsText as="h3" id="block.implementationStepsHeading" fallback={t.applyRegion.implementationStepsHeading} />
                      <div className="retrofit-defect-list">
                        {constructionGuidance.steps.map((step, index) => {
                          const image = guidanceStepImages.find((item) => item.stepTitle === step.title) ?? guidanceStepImages[index]
                          return (
                            <article key={`${step.title}-${index}`} className="retrofit-defect-card">
                              <h4>
                                <CmsText as="span" id="block.applyStepLabelWordEn" fallback={t.applyRegion.stepLabel} /> {index + 1}:{' '}
                                {step.title}
                              </h4>
                              <p>{step.description}</p>
                              {image?.imageDataUrl && (
                                <img
                                  src={image.imageDataUrl}
                                  alt={`${step.title} ${t.applyRegion.visualGuideAltSuffix}`}
                                  className="retrofit-preview"
                                />
                              )}
                              <ul>
                                {step.keyChecks.map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </article>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3>
                        <CmsText as="span" id="block.guidanceHeadingPrefixUr" fallback={t.applyRegion.guidanceUrduHeading} />{' '}
                        {applyBestPracticeTitle}
                      </h3>
                      <p>
                        <strong>
                          <CmsText as="span" id="block.applyAreaUrdu" fallback={t.applyRegion.areaUrdu} />
                        </strong>{' '}
                        {applyCity}, {applyProvince} |{' '}
                        <strong>
                          <CmsText as="span" id="block.applyHazardUrdu" fallback={t.applyRegion.hazardUrdu} />
                        </strong>{' '}
                        {applyHazard}
                      </p>
                      <p>{constructionGuidance.summaryUrdu}</p>

                      <CmsText as="h3" id="block.materialsHeadingUr" fallback={t.applyRegion.materialsUrdu} />
                      <ul>
                        {constructionGuidance.materialsUrdu.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>

                      <CmsText as="h3" id="block.safetyChecksHeadingUr" fallback={t.applyRegion.safetyUrdu} />
                      <ul>
                        {constructionGuidance.safetyUrdu.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>

                      <CmsText as="h3" id="block.implementationStepsHeadingUr" fallback={t.applyRegion.stepsUrdu} />
                      <div className="retrofit-defect-list">
                        {constructionGuidance.stepsUrdu.map((step, index) => {
                          const image = guidanceStepImages[index]
                          return (
                            <article key={`${step.title}-${index}-urdu`} className="retrofit-defect-card">
                              <h4>
                                <CmsText as="span" id="block.applyStepLabelWordUr" fallback={t.applyRegion.stepUrdu} /> {index + 1}:{' '}
                                {step.title}
                              </h4>
                              <p>{step.description}</p>
                              {image?.imageDataUrl && (
                                <img
                                  src={image.imageDataUrl}
                                  alt={`${step.title} ${t.applyRegion.visualGuideAltSuffix}`}
                                  className="retrofit-preview"
                                />
                              )}
                              <ul>
                                {step.keyChecks.map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </article>
                          )
                        })}
                      </div>
                    </>
                  )}
                  <div className="inline-controls">
                    <button type="button" onClick={() => { void downloadApplyGuidanceWordReport() }} disabled={isPreparingWordReport}>
                      {isPreparingWordReport ?
                        <CmsText as="span" id="block.applyPreparingWordReport" fallback={t.applyRegion.preparingWordReport} />
                      : <CmsText as="span" id="block.applyDownloadWordReport" fallback={t.applyRegion.downloadWordReport} />}
                    </button>
                  </div>
                  {isGeneratingStepImages && <p>{t.applyRegion.generatingStepImages}</p>}
                </div>

              )}
          </div>
      )
    }
    if (section === 'readiness') {
      return (
        <div className="panel section-panel section-readiness">
          <CmsSectionHeading fallback={t.sections.readiness} />
          <CmsText id="sectionIntro" fallback={t.homeCards.readiness.subtitle} className="section-lead" />
          <div className="readiness-layout">
            <aside className="readiness-sidebar">
              <section className="readiness-card">
                <div className="readiness-card-header">
                  <h3 className="readiness-card-header__title">
                    <button type="button" className="section-collapsible-toggle" onClick={() => togglePanel('selfAssessment')} aria-expanded={expandedPanels.selfAssessment}>
                      <CmsText as="span" id="block.selfAssessmentTitle" fallback={t.readiness.selfAssessmentTitle} />
                      <span>{expandedPanels.selfAssessment ? '▾' : '▸'}</span>
                    </button>
                  </h3>
                  <button
                    type="button"
                    className="readiness-logic-btn"
                    onClick={() => setShowReadinessLogicModal(true)}
                    aria-label={t.readiness.logicButtonAria}
                  >
                    <CmsText as="span" id="block.readinessLogicBtn" fallback={t.readiness.logicBtn} />
                  </button>
                </div>
                {expandedPanels.selfAssessment && (
                  <div className="readiness-self-assessment-body">
                    <div className="readiness-self-layout">
                      <div className="readiness-self-layout__form">
                        <div className="readiness-form-grid readiness-form-grid--primary">
                          <label className="readiness-field">
                            {t.readiness.buildingType}
                            <select value={buildingType} onChange={(event) => setBuildingType(event.target.value)}>
                              <option value="Residential">{t.readiness.residential}</option>
                              <option value="Commercial">{t.readiness.commercial}</option>
                              <option value="Critical Infrastructure">{t.readiness.criticalInfrastructure}</option>
                            </select>
                          </label>
                          <label className="readiness-field">
                            {t.readiness.lifelinePresence}
                            <select value={lifeline} onChange={(event) => setLifeline(event.target.value)}>
                              <option value="No">{t.readiness.no}</option>
                              <option value="Yes">{t.readiness.yes}</option>
                            </select>
                          </label>
                          <label className="readiness-field">
                            {t.readiness.yearBuilt}
                            <input
                              type="number"
                              min={1950}
                              max={new Date().getFullYear()}
                              value={selfAssessmentYearBuilt}
                              onChange={(event) => setSelfAssessmentYearBuilt(Number(event.target.value) || 2000)}
                            />
                          </label>
                          <label className="readiness-field">
                            {t.readiness.constructionType}
                            <select
                              value={selfAssessmentConstruction}
                              onChange={(event) => setSelfAssessmentConstruction(event.target.value)}
                            >
                              <option value="Reinforced Concrete">{t.readiness.reinforcedConcrete}</option>
                              <option value="Steel Frame">{t.readiness.steelFrame}</option>
                              <option value="Unreinforced Masonry">{t.readiness.unreinforcedMasonry}</option>
                            </select>
                          </label>
                        </div>
                        <div className="readiness-advanced-grid">
                          <label className="readiness-field">
                            {t.readiness.nearbyDrainage}
                            <select
                              value={selfAssessmentDrainage}
                              onChange={(event) => setSelfAssessmentDrainage(event.target.value as 'Good' | 'Average' | 'Poor')}
                            >
                              <option value="Good">{t.readiness.good}</option>
                              <option value="Average">{t.readiness.average}</option>
                              <option value="Poor">{t.readiness.poor}</option>
                            </select>
                          </label>
                          <label className="readiness-field">
                            {t.readiness.seismicZoneLabel}
                            <select
                              value={selfAssessmentSeismicZone}
                              onChange={(event) => setSelfAssessmentSeismicZone(event.target.value as 'Low' | 'Medium' | 'High')}
                            >
                              <option value="Low">{t.designToolkit.low}</option>
                              <option value="Medium">{t.designToolkit.medium}</option>
                              <option value="High">{t.designToolkit.high}</option>
                            </select>
                          </label>
                          <label className="readiness-field">
                            {t.readiness.foundation}
                            <select
                              value={selfAssessmentFoundation}
                              onChange={(event) =>
                                setSelfAssessmentFoundation(event.target.value as 'Isolated Footing' | 'Raft' | 'Stone Masonry' | 'Unknown')
                              }
                            >
                              <option value="Isolated Footing">{t.readiness.isolatedFooting}</option>
                              <option value="Raft">{t.readiness.raft}</option>
                              <option value="Stone Masonry">{t.readiness.stoneMasonry}</option>
                              <option value="Unknown">{t.readiness.unknown}</option>
                            </select>
                          </label>
                        </div>
                      </div>

                      <div className="readiness-self-layout__summary">
                        <div className="readiness-summary-divider" aria-hidden="true" />
                        <CmsText
                          as="h4"
                          className="readiness-summary-heading"
                          id="block.readinessSummary"
                          fallback={t.readiness.readinessSummary}
                        />
                        <div className="readiness-gauge-shell" aria-label={`${t.readiness.readinessSummary} ${readinessScore} / 100`}>
                          <div className="readiness-gauge-track">
                            <span className="readiness-gauge-pointer" style={{ transform: `translateX(-50%) rotate(${readinessGaugeAngle - 90}deg)` }} />
                            <div className="readiness-gauge-hole" />
                          </div>
                          <p className="readiness-gauge-score">
                            {readinessScore}
                            <span>/100</span>
                          </p>
                          <p className="readiness-gauge-label">{readinessRiskLabel}</p>
                        </div>
                        <p className="readiness-recommendation">
                          <strong>{t.readiness.customRecommendations}</strong> {readinessCustomRecommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section className="readiness-card readiness-fire-card">
                <div className="readiness-card-header">
                  <h3 className="readiness-card-header__title">
                    <button
                      type="button"
                      className="section-collapsible-toggle readiness-fire-toggle"
                      onClick={() => togglePanel('fireSafetyCalculator')}
                      aria-expanded={expandedPanels.fireSafetyCalculator}
                    >
                      <CmsText as="span" id="block.fireSafetyTitle" fallback={t.readiness.fireSafetyTitle} />
                      <span>{expandedPanels.fireSafetyCalculator ? '▾' : '▸'}</span>
                    </button>
                  </h3>
                  <button
                    type="button"
                    className="readiness-logic-btn"
                    onClick={() => setShowFireSafetyLogicModal(true)}
                    aria-label={t.fireSafety.logicButtonAria}
                  >
                    <CmsText as="span" id="block.readinessLogicBtnFire" fallback={t.readiness.logicBtn} />
                  </button>
                </div>
                <CmsText id="block.fireCaption" className="readiness-fire-caption" fallback={t.readiness.fireCaption} />

                <div className={`readiness-collapsible-body ${expandedPanels.fireSafetyCalculator ? 'open' : ''}`}>
                  <div className="readiness-collapsible-inner">
                    {expandedPanels.fireSafetyCalculator && <FireSafetyCalculator labels={t.fireSafety} />}
                  </div>
                </div>
              </section>

            </aside>

          </div>

          {showReadinessLogicModal && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem',
                backdropFilter: 'blur(2px)',
              }}
              onClick={() => setShowReadinessLogicModal(false)}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  maxWidth: '950px',
                  maxHeight: '95vh',
                  overflow: 'auto',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                    padding: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '3px solid #004085',
                    borderRadius: '12px 12px 0 0',
                  }}
                >
                  <CmsText
                    as="h2"
                    id="logicModal.headerTitle"
                    fallback={t.readiness.logicModalTitle}
                    style={{ margin: 0, color: 'white', fontSize: '1.8rem', fontWeight: 700 } satisfies CSSProperties}
                  />
                  <button
                    onClick={() => setShowReadinessLogicModal(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid white',
                      color: 'white',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Content */}
                <div className="readiness-logic-content" style={{ padding: '2.5rem', fontSize: '1rem', lineHeight: 1.9, color: '#2c3e50' }}>
                  <div style={{ backgroundColor: '#f8f9ff', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', borderLeft: '5px solid #007bff' }}>
                    <CmsText
                      as="h3"
                      id="logicModal.overviewTitle"
                      fallback={t.readiness.overviewTitle}
                      style={{ marginTop: 0, color: '#007bff', fontSize: '1.2rem' } satisfies CSSProperties}
                    />
                    <CmsText
                      id="logicModal.overviewBody"
                      fallback={t.readiness.overviewBody}
                      style={{ margin: '0.5rem 0 0 0', color: '#34495e', lineHeight: 1.8 } satisfies CSSProperties}
                    />
                  </div>

                  <CmsText
                    as="h3"
                    id="logicModal.sevenFactors"
                    fallback={t.readiness.sevenFactors}
                    style={{
                      marginTop: '2rem',
                      marginBottom: '1rem',
                      color: '#007bff',
                      fontSize: '1.3rem',
                      fontWeight: 700,
                      borderBottom: '3px solid #007bff',
                      paddingBottom: '0.5rem',
                    } satisfies CSSProperties}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ backgroundColor: '#f0f7ff', padding: '1.5rem', borderRadius: '8px', borderLeft: '5px solid #28a745' }}>
                      <CmsText
                        as="h4"
                        id="logicModal.logicF1Title"
                        fallback={t.readiness.logicF1Title}
                        style={{ marginTop: 0, color: '#28a745', fontSize: '1.1rem', fontWeight: 700 } satisfies CSSProperties}
                      />
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#2c3e50' }}>
                        <li>{t.readiness.logicF1B1}</li>
                        <li>{t.readiness.logicF1B2}</li>
                        <li>{t.readiness.logicF1B3}</li>
                        <li>{t.readiness.logicF1B4}</li>
                      </ul>
                    </div>

                    <div style={{ backgroundColor: '#fff3f0', padding: '1.5rem', borderRadius: '8px', borderLeft: '5px solid #dc3545' }}>
                      <CmsText
                        as="h4"
                        id="logicModal.logicF2Title"
                        fallback={t.readiness.logicF2Title}
                        style={{ marginTop: 0, color: '#dc3545', fontSize: '1.1rem', fontWeight: 700 } satisfies CSSProperties}
                      />
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#2c3e50' }}>
                        <li>{t.readiness.logicF2B1}</li>
                        <li>{t.readiness.logicF2B2}</li>
                        <li>{t.readiness.logicF2B3}</li>
                      </ul>
                    </div>

                    <div style={{ backgroundColor: '#f0f8ff', padding: '1.5rem', borderRadius: '8px', borderLeft: '5px solid #17a2b8' }}>
                      <CmsText
                        as="h4"
                        id="logicModal.logicF3Title"
                        fallback={t.readiness.logicF3Title}
                        style={{ marginTop: 0, color: '#17a2b8', fontSize: '1.1rem', fontWeight: 700 } satisfies CSSProperties}
                      />
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#2c3e50' }}>
                        <li>{t.readiness.logicF3B1}</li>
                        <li>{t.readiness.logicF3B2}</li>
                        <li>{t.readiness.logicF3B3}</li>
                      </ul>
                    </div>

                    <div style={{ backgroundColor: '#fff8f0', padding: '1.5rem', borderRadius: '8px', borderLeft: '5px solid #fd7e14' }}>
                      <CmsText
                        as="h4"
                        id="logicModal.logicF4Title"
                        fallback={t.readiness.logicF4Title}
                        style={{ marginTop: 0, color: '#fd7e14', fontSize: '1.1rem', fontWeight: 700 } satisfies CSSProperties}
                      />
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#2c3e50' }}>
                        <li>{t.readiness.logicF4B1}</li>
                        <li>{t.readiness.logicF4B2}</li>
                        <li>{t.readiness.logicF4B3}</li>
                      </ul>
                    </div>

                    <div style={{ backgroundColor: '#f0fff4', padding: '1.5rem', borderRadius: '8px', borderLeft: '5px solid #20c997' }}>
                      <CmsText
                        as="h4"
                        id="logicModal.logicF5Title"
                        fallback={t.readiness.logicF5Title}
                        style={{ marginTop: 0, color: '#20c997', fontSize: '1.1rem', fontWeight: 700 } satisfies CSSProperties}
                      />
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#2c3e50' }}>
                        <li>{t.readiness.logicF5B1}</li>
                        <li>{t.readiness.logicF5B2}</li>
                        <li>{t.readiness.logicF5B3}</li>
                        <li>{t.readiness.logicF5B4}</li>
                      </ul>
                    </div>

                    <div style={{ backgroundColor: '#f8f0ff', padding: '1.5rem', borderRadius: '8px', borderLeft: '5px solid #6f42c1' }}>
                      <CmsText
                        as="h4"
                        id="logicModal.logicF6Title"
                        fallback={t.readiness.logicF6Title}
                        style={{ marginTop: 0, color: '#6f42c1', fontSize: '1.1rem', fontWeight: 700 } satisfies CSSProperties}
                      />
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#2c3e50' }}>
                        <li>{t.readiness.logicF6B1}</li>
                        <li>{t.readiness.logicF6B2}</li>
                        <li>{t.readiness.logicF6B3}</li>
                      </ul>
                    </div>

                    <div style={{ backgroundColor: '#fff0f5', padding: '1.5rem', borderRadius: '8px', borderLeft: '5px solid #e83e8c' }}>
                      <CmsText
                        as="h4"
                        id="logicModal.logicF7Title"
                        fallback={t.readiness.logicF7Title}
                        style={{ marginTop: 0, color: '#e83e8c', fontSize: '1.1rem', fontWeight: 700 } satisfies CSSProperties}
                      />
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#2c3e50' }}>
                        <li>{t.readiness.logicF7B1}</li>
                        <li>{t.readiness.logicF7B2}</li>
                      </ul>
                    </div>

                  </div>

                  <div style={{ backgroundColor: '#f0f4ff', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', borderLeft: '5px solid #007bff' }}>
                    <CmsText
                      as="h3"
                      id="logicModal.riskInterpretation"
                      fallback={t.readiness.riskInterpretation}
                      style={{ marginTop: 0, marginBottom: '1rem', color: '#007bff', fontSize: '1.1rem', fontWeight: 700 } satisfies CSSProperties}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      <div style={{ backgroundColor: '#d4edda', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid #28a745' }}>
                        <CmsText as="strong" id="logicModal.risk80Strong" fallback={t.readiness.logicRisk80Strong} style={{ color: '#155724' } satisfies CSSProperties} />
                        <CmsText
                          as="p"
                          id="logicModal.risk80Desc"
                          fallback={t.readiness.logicRisk80Desc}
                          style={{ margin: '0.3rem 0 0 0', color: '#155724', fontSize: '0.95rem' } satisfies CSSProperties}
                        />
                      </div>
                      <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid #ffc107' }}>
                        <CmsText as="strong" id="logicModal.risk60Strong" fallback={t.readiness.logicRisk60Strong} style={{ color: '#856404' } satisfies CSSProperties} />
                        <CmsText
                          as="p"
                          id="logicModal.risk60Desc"
                          fallback={t.readiness.logicRisk60Desc}
                          style={{ margin: '0.3rem 0 0 0', color: '#856404', fontSize: '0.95rem' } satisfies CSSProperties}
                        />
                      </div>
                      <div style={{ backgroundColor: '#f8d7da', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid #dc3545' }}>
                        <CmsText as="strong" id="logicModal.risk40Strong" fallback={t.readiness.logicRisk40Strong} style={{ color: '#721c24' } satisfies CSSProperties} />
                        <CmsText
                          as="p"
                          id="logicModal.risk40Desc"
                          fallback={t.readiness.logicRisk40Desc}
                          style={{ margin: '0.3rem 0 0 0', color: '#721c24', fontSize: '0.95rem' } satisfies CSSProperties}
                        />
                      </div>
                      <div style={{ backgroundColor: '#f5c6cb', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid #bd2130' }}>
                        <CmsText as="strong" id="logicModal.risk0Strong" fallback={t.readiness.logicRisk0Strong} style={{ color: '#721c24' } satisfies CSSProperties} />
                        <CmsText
                          as="p"
                          id="logicModal.risk0Desc"
                          fallback={t.readiness.logicRisk0Desc}
                          style={{ margin: '0.3rem 0 0 0', color: '#721c24', fontSize: '0.95rem' } satisfies CSSProperties}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f1f3f5', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', borderLeft: '5px solid #6c757d' }}>
                    <CmsText
                      as="h3"
                      id="logicModal.howItWorks"
                      fallback={t.readiness.howItWorks}
                      style={{ marginTop: 0, color: '#495057', fontSize: '1.1rem', fontWeight: 700 } satisfies CSSProperties}
                    />
                    <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#2c3e50', lineHeight: 1.9 }}>
                      <li>{t.readiness.logicHow1}</li>
                      <li>{t.readiness.logicHow2}</li>
                      <li>{t.readiness.logicHow3}</li>
                      <li>{t.readiness.logicHow4}</li>
                      <li>{t.readiness.logicHow5}</li>
                    </ol>
                  </div>

                  <div style={{ backgroundColor: '#e7f5ff', padding: '1.5rem', borderRadius: '8px', borderLeft: '5px solid #007bff', borderRight: '5px solid #0056b3' }}>
                    <CmsText
                      id="logicModal.disclaimerModal"
                      fallback={t.readiness.disclaimerModal}
                      style={{ margin: 0, color: '#004085', fontSize: '0.95rem', lineHeight: 1.8 } satisfies CSSProperties}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {showFireSafetyLogicModal && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem',
                backdropFilter: 'blur(2px)',
              }}
              onClick={() => setShowFireSafetyLogicModal(false)}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  maxWidth: '950px',
                  maxHeight: '95vh',
                  overflow: 'auto',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    background: 'linear-gradient(135deg, #ff922b 0%, #e8590c 100%)',
                    padding: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '3px solid #c2410c',
                    borderRadius: '12px 12px 0 0',
                  }}
                >
                  <CmsText
                    as="h2"
                    id="fireLogicModal.headerTitle"
                    fallback={t.fireSafety.logicModalTitle}
                    style={{ margin: 0, color: 'white', fontSize: 'clamp(1.15rem, 3.5vw, 1.75rem)', fontWeight: 700 } satisfies CSSProperties}
                  />
                  <button
                    type="button"
                    onClick={() => setShowFireSafetyLogicModal(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid white',
                      color: 'white',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                    }}
                    aria-label={t.fireSafety.logicModalClose}
                  >
                    ✕
                  </button>
                </div>

                <div className="readiness-logic-content" style={{ padding: '2.5rem', fontSize: '1rem', lineHeight: 1.9, color: '#2c3e50' }}>
                  <div
                    style={{
                      backgroundColor: '#fff8f0',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      marginBottom: '1.75rem',
                      borderLeft: '5px solid #fd7e14',
                    }}
                  >
                    <CmsText
                      as="h3"
                      id="fireLogicModal.overviewTitle"
                      fallback={t.fireSafety.logicOverviewTitle}
                      style={{ marginTop: 0, color: '#d9480f', fontSize: '1.2rem' } satisfies CSSProperties}
                    />
                    <CmsText
                      id="fireLogicModal.overviewBody"
                      fallback={t.fireSafety.logicOverviewBody}
                      style={{ margin: '0.5rem 0 0 0', color: '#34495e', lineHeight: 1.8 } satisfies CSSProperties}
                    />
                  </div>

                  <CmsText
                    as="h3"
                    id="fireLogicModal.scoringTitle"
                    fallback={t.fireSafety.logicScoringTitle}
                    style={{
                      marginTop: 0,
                      marginBottom: '0.75rem',
                      color: '#e8590c',
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      borderBottom: '3px solid #ffc078',
                      paddingBottom: '0.5rem',
                    } satisfies CSSProperties}
                  />
                  <div
                    style={{
                      backgroundColor: '#fff4e6',
                      padding: '1.25rem 1.5rem',
                      borderRadius: '8px',
                      marginBottom: '1.75rem',
                      borderLeft: '5px solid #ff922b',
                    }}
                  >
                    <p style={{ margin: 0, whiteSpace: 'pre-line', color: '#2c3e50' }}>{t.fireSafety.logicScoringDetails}</p>
                  </div>

                  <CmsText
                    as="h3"
                    id="fireLogicModal.bandsTitle"
                    fallback={t.fireSafety.logicBandsTitle}
                    style={{ marginTop: 0, marginBottom: '0.75rem', color: '#e8590c', fontSize: '1.15rem', fontWeight: 700 } satisfies CSSProperties}
                  />
                  <div
                    style={{
                      backgroundColor: '#fff9db',
                      padding: '1.25rem 1.5rem',
                      borderRadius: '8px',
                      marginBottom: '1.75rem',
                      borderLeft: '5px solid #fab005',
                    }}
                  >
                    <p style={{ margin: 0, whiteSpace: 'pre-line', color: '#2c3e50' }}>{t.fireSafety.logicBandsDetails}</p>
                  </div>

                  <CmsText
                    as="h3"
                    id="fireLogicModal.extinguishersTitle"
                    fallback={t.fireSafety.logicExtinguishersTitle}
                    style={{ marginTop: 0, marginBottom: '0.75rem', color: '#e8590c', fontSize: '1.15rem', fontWeight: 700 } satisfies CSSProperties}
                  />
                  <div
                    style={{
                      backgroundColor: '#e7f5ff',
                      padding: '1.25rem 1.5rem',
                      borderRadius: '8px',
                      marginBottom: '1.75rem',
                      borderLeft: '5px solid #339af0',
                    }}
                  >
                    <p style={{ margin: 0, whiteSpace: 'pre-line', color: '#2c3e50' }}>{t.fireSafety.logicExtinguishersDetails}</p>
                  </div>

                  <CmsText
                    as="h3"
                    id="fireLogicModal.classesTitle"
                    fallback={t.fireSafety.logicClassesTitle}
                    style={{ marginTop: 0, marginBottom: '0.75rem', color: '#e8590c', fontSize: '1.15rem', fontWeight: 700 } satisfies CSSProperties}
                  />
                  <div
                    style={{
                      backgroundColor: '#f3f0ff',
                      padding: '1.25rem 1.5rem',
                      borderRadius: '8px',
                      marginBottom: '1.75rem',
                      borderLeft: '5px solid #9775fa',
                    }}
                  >
                    <p style={{ margin: 0, color: '#2c3e50' }}>{t.fireSafety.logicClassesDetails}</p>
                  </div>

                  <CmsText
                    as="h3"
                    id="fireLogicModal.placementTitle"
                    fallback={t.fireSafety.logicPlacementTitle}
                    style={{ marginTop: 0, marginBottom: '0.75rem', color: '#e8590c', fontSize: '1.15rem', fontWeight: 700 } satisfies CSSProperties}
                  />
                  <div
                    style={{
                      backgroundColor: '#e6fcf5',
                      padding: '1.25rem 1.5rem',
                      borderRadius: '8px',
                      marginBottom: '1.75rem',
                      borderLeft: '5px solid #38d9a9',
                    }}
                  >
                    <p style={{ margin: 0, whiteSpace: 'pre-line', color: '#2c3e50' }}>{t.fireSafety.logicPlacementDetails}</p>
                  </div>

                  <CmsText
                    as="h3"
                    id="fireLogicModal.recoTitle"
                    fallback={t.fireSafety.logicRecoTitle}
                    style={{ marginTop: 0, marginBottom: '0.75rem', color: '#e8590c', fontSize: '1.15rem', fontWeight: 700 } satisfies CSSProperties}
                  />
                  <div
                    style={{
                      backgroundColor: '#fff0f6',
                      padding: '1.25rem 1.5rem',
                      borderRadius: '8px',
                      marginBottom: '1.75rem',
                      borderLeft: '5px solid #f783ac',
                    }}
                  >
                    <p style={{ margin: 0, whiteSpace: 'pre-line', color: '#2c3e50' }}>{t.fireSafety.logicRecoDetails}</p>
                  </div>

                  <div style={{ backgroundColor: '#f1f3f5', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.75rem', borderLeft: '5px solid #6c757d' }}>
                    <CmsText
                      as="h3"
                      id="fireLogicModal.howTitle"
                      fallback={t.fireSafety.logicHowTitle}
                      style={{ marginTop: 0, color: '#495057', fontSize: '1.1rem', fontWeight: 700 } satisfies CSSProperties}
                    />
                    <p style={{ margin: '0.5rem 0 0 0', whiteSpace: 'pre-line', color: '#2c3e50', lineHeight: 1.85 }}>{t.fireSafety.logicHowDetails}</p>
                  </div>

                  <div style={{ backgroundColor: '#e7f5ff', padding: '1.5rem', borderRadius: '8px', borderLeft: '5px solid #1864ab', borderRight: '5px solid #1864ab' }}>
                    <CmsText
                      id="fireLogicModal.disclaimer"
                      fallback={t.fireSafety.logicDisclaimer}
                      style={{ margin: 0, color: '#004085', fontSize: '0.95rem', lineHeight: 1.8 } satisfies CSSProperties}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    if (section === 'retrofit') {
      return (
        <div
          ref={retrofitSectionRef}
          className="panel section-panel section-retrofit"
          style={retrofitCmsSectionStyle}
        >
          <div id="retrofit-page-main" className="retrofit-cms-page" data-r360-cms-page="main">
            <CmsText id="sectionIntro" fallback="" hideIfEmpty className="section-lead" />
            <div className="retrofit-title-row">
              <h2 {...rf('main', 'title')}>{mergedRetrofit.title}</h2>
            </div>

            <div className="retrofit-main-card">
              <div className="retrofit-model-output retrofit-location-card">
                <h3 {...rf('main', 'locationRates')}>{mergedRetrofit.locationRates}</h3>
              <div className="retrofit-action-row retrofit-location-actions" role="group" aria-label={mergedRetrofit.ariaLocationMode}>
                <button
                  type="button"
                  className="retrofit-btn retrofit-btn-primary"
                  {...rf('main', 'useMyLocation')}
                  onClick={() => {
                    setRetrofitLocationMode('auto')
                    requestCurrentUserLocation()
                  }}
                  disabled={isDetectingLocation}
                >
                  {isDetectingLocation ? mergedRetrofit.detecting : mergedRetrofit.useMyLocation}
                </button>
                <button
                  type="button"
                  className="retrofit-btn retrofit-btn-secondary"
                  {...rf('main', 'enterManually')}
                  onClick={() => setRetrofitLocationMode('manual')}
                >
                  {mergedRetrofit.enterManually}
                </button>
              </div>
              {retrofitLocationMode === 'manual' ? (
                <div className="inline-controls retrofit-manual-controls">
                  <label>
                    {mergedRetrofit.provincePakistan}
                    <select
                      value={retrofitManualProvince}
                      onChange={(event) => {
                        const province = event.target.value
                        setRetrofitManualProvince(province)
                        setRetrofitManualCity((pakistanCitiesByProvince[province] ?? [])[0] ?? '')
                      }}
                    >
                      {Object.keys(effectiveProvinceRisk).map((province) => (
                        <option key={province}>{province}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {mergedRetrofit.cityDistrictPakistan}
                    <select value={retrofitManualCity} onChange={(event) => setRetrofitManualCity(event.target.value)}>
                      {availableRetrofitManualCities.map((city) => (
                        <option key={city}>{city}</option>
                      ))}
                    </select>
                  </label>
                  <p className="retrofit-location-target">
                    <strong>{mergedRetrofit.manualLocation}</strong> {retrofitManualCity}, {retrofitManualProvince}
                  </p>
                </div>
              ) : (
                <p className="retrofit-location-target">
                  <strong>{effectiveRetrofitLocation.label}</strong>
                  {effectiveRetrofitLocation.source === 'manual' && <> {mergedRetrofit.autoFallback}</>}
                </p>
              )}
              {locationAccessMsg && <p className="retrofit-location-msg">{locationAccessMsg}</p>}
            </div>

            <label className="retrofit-upload-label" {...rf('main', 'uploadSeries')}>
              {mergedRetrofit.uploadSeries}
              <input
                ref={retrofitUploadInputRef}
                className="retrofit-upload-input"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  handleRetrofitSeriesUpload(event.target.files)
                  event.currentTarget.value = ''
                }}
              />
            </label>

            {retrofitImageSeriesFiles.length > 0 && (
              <p className="retrofit-selected-photos" {...rf('main', 'selectedPhotos')}>
                {mergedRetrofit.selectedPhotos} <strong>{retrofitImageSeriesFiles.length}</strong>
              </p>
            )}

            <div className="retrofit-action-row retrofit-action-row-main" role="group" aria-label={mergedRetrofit.ariaEstimateActions}>
              <button
                className="retrofit-btn retrofit-btn-primary"
                {...rf('main', 'guidance')}
                onClick={() => void generateRetrofitGuidanceFromSeries()}
                disabled={isGeneratingRetrofitGuidance}
              >
                {isGeneratingRetrofitGuidance ? mergedRetrofit.analyzing : mergedRetrofit.guidance}
              </button>
              <button
                className="retrofit-btn retrofit-btn-secondary"
                {...rf('main', 'calculateCost')}
                onClick={openRetrofitCalculatorPage}
              >
                {mergedRetrofit.calculateCost}
              </button>
            </div>
          </div>
          </div>

          <div id="retrofit-page-analysis" className="retrofit-cms-page" data-r360-cms-page="analysis">
          {isCalculatingRetrofitEstimate && <p>{mergedRetrofit.deepAnalysis}</p>}
          {retrofitError && <p>{retrofitError}</p>}

          {retrofitImageSeriesPreviewUrls.length > 0 && (
            <div className="retrofit-defect-list retrofit-upload-grid">
              {retrofitImageSeriesPreviewUrls.map((preview, index) => (
                <article
                  key={`${preview}-${index}`}
                  className="retrofit-defect-card retrofit-upload-card"
                  onClick={() => retrofitUploadInputRef.current?.click()}
                >
                  <h4>
                    {mergedRetrofit.imageN} {index + 1}
                  </h4>
                  <div className="retrofit-preview-wrap">
                    <img
                      src={preview}
                      alt={`${mergedRetrofit.imageN} ${index + 1}`}
                      className="retrofit-preview"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <p>
                    <strong>{mergedRetrofit.clickForMore}</strong>
                  </p>
                </article>
              ))}
            </div>
          )}

          {retrofitImageSeriesResults.length > 0 && (
            <div className="retrofit-model-output">
              <h3 {...rf('analysis', 'perImageAnalysis')}>{mergedRetrofit.perImageAnalysis}</h3>
              <div className="retrofit-defect-list">
                {retrofitImageSeriesResults.map((item, index) => (
                  <article key={item.id} className="retrofit-defect-card">
                    <h4>
                      {mergedRetrofit.imageN} {index + 1}: {item.fileName}
                    </h4>
                    <p>
                      <strong>{mergedRetrofit.summary}</strong> {item.summary}
                    </p>
                    <p>
                      <strong>{mergedRetrofit.defects}</strong> {item.defectCount} | <strong>{mergedRetrofit.severityScore}</strong> {item.severityScore}/100
                    </p>
                    <p>
                      <strong>{mergedRetrofit.affectedArea}</strong> {item.affectedAreaPercent}% | <strong>{mergedRetrofit.visibility}</strong> {item.visibility}
                    </p>
                    <p>
                      <strong>{mergedRetrofit.estimatedCostImage}</strong> PKR {Math.round(item.estimatedCost).toLocaleString()}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {retrofitGuidanceResults.length > 0 && (
            <div className="retrofit-model-output">
              <h3 {...rf('analysis', 'guidanceImageBased')}>{mergedRetrofit.guidanceImageBased}</h3>
              <div className="retrofit-defect-list">
                {retrofitGuidanceResults.map((item, index) => (
                  <article key={item.id} className="retrofit-defect-card">
                    <h4>
                      {mergedRetrofit.imageN} {index + 1}: {item.fileName}
                    </h4>
                    <p>
                      <strong>{mergedRetrofit.summary}</strong> {item.summary}
                    </p>
                    <p>
                      <strong>{mergedRetrofit.imageVisibility}</strong> {item.visibility}
                    </p>
                    <p>
                      <strong>{mergedRetrofit.safetyNote}</strong> {item.safetyNote}
                    </p>
                    <CmsText as="h4" id="retrofit.guidance.recommendedGuidance" fallback={mergedRetrofit.recommendedGuidance} />
                    <ul>
                      {item.recommendations.map((recommendation) => (
                        <li key={`${item.id}-${recommendation}`}>{recommendation}</li>
                      ))}
                    </ul>
                    {item.defectFeatures && item.defectFeatures.length > 0 && (
                      <>
                        <CmsText as="h4" id="retrofit.guidance.detectedDamage" fallback={mergedRetrofit.detectedDamage} />
                        <ul>
                          {item.defectFeatures.map((feature, featureIndex) => (
                            <li key={`${item.id}-feature-${featureIndex}`}>
                              {feature.damageType} {mergedRetrofit.atWord} {feature.component} ({feature.locationDetail}) - {mergedRetrofit.patternLabel}:{' '}
                              {feature.pattern};
                              {mergedRetrofit.crackWidth} {feature.crackWidthMinMm.toFixed(1)}-{feature.crackWidthMaxMm.toFixed(1)} mm;
                              {mergedRetrofit.extentWord} {feature.estimatedExtentM.toFixed(2)} m
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    {item.structuredGuidance && (
                      <>
                        <CmsText as="h4" id="retrofit.guidance.damageClassTitle" fallback={mergedRetrofit.damageClassTitle} />
                        <p>
                          <strong>{mergedRetrofit.primary}</strong> {item.structuredGuidance.damageClassification.primary}
                        </p>
                        <ul>
                          {item.structuredGuidance.damageClassification.detected.map((detected) => (
                            <li key={`${item.id}-detected-${detected}`}>{detected}</li>
                          ))}
                        </ul>

                        <CmsText as="h4" id="retrofit.guidance.severityShortTitle" fallback={mergedRetrofit.severityShortTitle} />
                        <p>
                          <strong>{mergedRetrofit.level}</strong> {item.structuredGuidance.severity.level}
                        </p>
                        <p>
                          <strong>{mergedRetrofit.rationale}</strong> {item.structuredGuidance.severity.rationale}
                        </p>

                        <CmsText as="h4" id="retrofit.guidance.probableCausesTitle" fallback={mergedRetrofit.probableCausesTitle} />
                        <ul>
                          {item.structuredGuidance.probableCauses.map((cause) => (
                            <li key={`${item.id}-cause-${cause}`}>{cause}</li>
                          ))}
                        </ul>

                        <CmsText as="h4" id="retrofit.guidance.riskAssessmentTitle" fallback={mergedRetrofit.riskAssessmentTitle} />
                        <p>
                          <strong>{mergedRetrofit.lifeSafety}</strong> {item.structuredGuidance.risk.lifeSafety}
                        </p>
                        <p>
                          <strong>{mergedRetrofit.serviceability}</strong> {item.structuredGuidance.risk.serviceability}
                        </p>
                        <p>
                          <strong>{mergedRetrofit.progressionRisk}</strong> {item.structuredGuidance.risk.progressionRisk}
                        </p>

                        <CmsText as="h4" id="retrofit.guidance.stepByStepMethods" fallback={mergedRetrofit.stepByStepMethods} />
                        {item.structuredGuidance.retrofitMethods.map((method) => (
                          <div key={`${item.id}-method-${method.step}`} style={{ marginBottom: 10 }}>
                            <p>
                              <strong>
                                {mergedRetrofit.stepWord} {method.step}: {method.technique}
                              </strong>
                            </p>
                            <p>
                              <strong>{mergedRetrofit.targetCondition}</strong> {method.targetCondition}
                            </p>
                            <p>
                              <strong>{mergedRetrofit.procedure}</strong> {method.procedure}
                            </p>
                            <p>
                              <strong>{mergedRetrofit.materialsLabel}</strong>
                            </p>
                            <ul>
                              {method.materials.map((material, materialIndex) => (
                                <li key={`${item.id}-mat-${method.step}-${materialIndex}`}>
                                  {material.name} ({material.spec}) - {material.estimatedQty} {material.unit}
                                </li>
                              ))}
                            </ul>
                            <p>
                              <strong>{mergedRetrofit.toolsLabel}</strong>
                            </p>
                            <ul>
                              {method.tools.map((tool) => (
                                <li key={`${item.id}-tool-${method.step}-${tool}`}>{tool}</li>
                              ))}
                            </ul>
                            <p>
                              <strong>{mergedRetrofit.qaChecksLabel}</strong>
                            </p>
                            <ul>
                              {method.qaChecks.map((qa) => (
                                <li key={`${item.id}-qa-${method.step}-${qa}`}>{qa}</li>
                              ))}
                            </ul>
                          </div>
                        ))}

                        <CmsText as="h4" id="retrofit.guidance.safetyPrecautionsTitle" fallback={mergedRetrofit.safetyPrecautionsTitle} />
                        <ul>
                          {item.structuredGuidance.safetyPrecautions.map((safety) => (
                            <li key={`${item.id}-safety-${safety}`}>{safety}</li>
                          ))}
                        </ul>

                        <CmsText as="h4" id="retrofit.guidance.localizedCostTitle" fallback={mergedRetrofit.localizedCostTitle} />
                        <p>
                          <strong>{t.designToolkit.province}:</strong> {item.structuredGuidance.localizedCostEstimation.province}
                        </p>
                        <p>
                          <strong>{mergedRetrofit.totalEstimatedCostLabel}</strong> {item.structuredGuidance.localizedCostEstimation.currency}{' '}
                          {Math.round(item.structuredGuidance.localizedCostEstimation.totalEstimatedCostPkr).toLocaleString()}
                        </p>
                        <ul>
                          {item.structuredGuidance.localizedCostEstimation.lineItems.map((lineItem, lineItemIndex) => (
                            <li key={`${item.id}-cost-${lineItemIndex}`}>
                              {lineItem.item}: {lineItem.quantity} x PKR {Math.round(lineItem.unitRatePkr).toLocaleString()} = PKR{' '}
                              {Math.round(lineItem.costPkr).toLocaleString()}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          </div>

          {retrofitFinalEstimate && (
            <div id="retrofit-page-estimate" className="retrofit-cms-page" data-r360-cms-page="estimate">
            <div className="retrofit-model-output">
              <h3 {...rf('estimate', 'finalEstimate')}>{mergedRetrofit.finalEstimate}</h3>
              <p>
                {mergedRetrofit.estimateSource} <strong>{retrofitFinalEstimate.estimateSource}</strong>
                {retrofitFinalEstimate.estimateSource === 'ML Model' && mergedRetrofit.aiMlFromImages}
              </p>
              {retrofitFinalEstimate.mlModel && (
                <p>
                  {mergedRetrofit.mlModel} <strong>{retrofitFinalEstimate.mlModel}</strong>
                  {typeof retrofitFinalEstimate.mlConfidence === 'number' && (
                    <>
                      {' '}
                      | {mergedRetrofit.confidence} <strong>{(retrofitFinalEstimate.mlConfidence * 100).toFixed(0)}%</strong>
                    </>
                  )}
                </p>
              )}
              <div className="retrofit-insights-grid">
                <p>
                  {mergedRetrofit.photosAnalyzed} <strong>{retrofitFinalEstimate.imageCount}</strong>
                </p>
                <p>
                  {mergedRetrofit.inferredArea}{' '}
                  <strong>
                    {retrofitFinalEstimate.totalAreaSqft.toLocaleString()} {mergedRetrofit.sqFt}
                  </strong>
                </p>
                <p>
                  {mergedRetrofit.finalCost} <strong>PKR {Math.round(retrofitFinalEstimate.totalCost).toLocaleString()}</strong>
                </p>
                <p>
                  {mergedRetrofit.estimatedRange}{' '}
                  <strong>
                    PKR {Math.round(retrofitFinalEstimate.minTotalCost).toLocaleString()} - PKR{' '}
                    {Math.round(retrofitFinalEstimate.maxTotalCost).toLocaleString()}
                  </strong>
                </p>
                <p>
                  {mergedRetrofit.effectiveRate}{' '}
                  <strong>
                    PKR {Math.round(retrofitFinalEstimate.sqftRate).toLocaleString()}/{mergedRetrofit.sqFt}
                  </strong>
                </p>
                <p>
                  {mergedRetrofit.scope} <strong>{retrofitFinalEstimate.scope}</strong>
                </p>
                <p>
                  {mergedRetrofit.damageLevel} <strong>{retrofitFinalEstimate.damageLevel}</strong>
                </p>
                <p>
                  {mergedRetrofit.urgency} <strong>{retrofitFinalEstimate.urgencyLevel}</strong>
                </p>
                <p>
                  {mergedRetrofit.avgAffected} <strong>{retrofitFinalEstimate.affectedAreaPercent}%</strong>
                </p>
                <p>
                  {mergedRetrofit.locationFactor} <strong>{retrofitFinalEstimate.locationFactor.toFixed(2)}x</strong>
                </p>
                <p>
                  {mergedRetrofit.duration} <strong>{retrofitFinalEstimate.durationWeeks} {mergedRetrofit.weeks}</strong>
                </p>
              </div>
              {mlEstimate?.guidanceDetailed && mlEstimate.guidanceDetailed.length > 0 && (
                <div className="retrofit-defect-list">
                  {mlEstimate.guidanceDetailed.map((item) => (
                    <article key={`${item.priority}-${item.action}`} className="retrofit-defect-card">
                      <h4>
                        {item.priority} | {item.action}
                      </h4>
                      <p>
                        <strong>{mergedRetrofit.rationale}</strong> {item.rationale}
                      </p>
                      <p>
                        <strong>{mergedRetrofit.expectedImpact}</strong> {item.estimatedImpact}
                      </p>
                    </article>
                  ))}
                </div>
              )}
              {mlEstimate?.engineeringGuidance && (
                <div className="retrofit-defect-list">
                  <article className="retrofit-defect-card">
                    <CmsText as="h4" id="retrofit.estimate.damageClassTitle" fallback={mergedRetrofit.damageClassTitle} />
                    <p>
                      <strong>{mergedRetrofit.primary}</strong> {mlEstimate.engineeringGuidance.damageClassification.primary}
                    </p>
                    <p>
                      <strong>{mergedRetrofit.detectedTypes}</strong>
                    </p>
                    <ul>
                      {mlEstimate.engineeringGuidance.damageClassification.detected.map((item) => (
                        <li key={`damage-${item}`}>{item}</li>
                      ))}
                    </ul>
                    <p>
                      <strong>{mergedRetrofit.basis}</strong>
                    </p>
                    <ul>
                      {mlEstimate.engineeringGuidance.damageClassification.basis.map((item) => (
                        <li key={`basis-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="retrofit-defect-card">
                    <CmsText as="h4" id="retrofit.estimate.severityLevelTitle" fallback={mergedRetrofit.severityLevelTitle} />
                    <p>
                      <strong>{mergedRetrofit.level}</strong> {mlEstimate.engineeringGuidance.severityLevel.level}
                    </p>
                    <p>
                      <strong>{mergedRetrofit.score}</strong> {mlEstimate.engineeringGuidance.severityLevel.score}/100
                    </p>
                    <p>
                      <strong>{mergedRetrofit.rationale}</strong> {mlEstimate.engineeringGuidance.severityLevel.rationale}
                    </p>
                  </article>

                  <article className="retrofit-defect-card">
                    <CmsText as="h4" id="retrofit.estimate.probableCausesTitle" fallback={mergedRetrofit.probableCausesTitle} />
                    <ul>
                      {mlEstimate.engineeringGuidance.probableCauses.map((item) => (
                        <li key={`cause-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="retrofit-defect-card">
                    <CmsText as="h4" id="retrofit.estimate.riskAssessmentTitle" fallback={mergedRetrofit.riskAssessmentTitle} />
                    <p>
                      <strong>{mergedRetrofit.lifeSafety}</strong> {mlEstimate.engineeringGuidance.riskAssessment.lifeSafety}
                    </p>
                    <p>
                      <strong>{mergedRetrofit.serviceability}</strong> {mlEstimate.engineeringGuidance.riskAssessment.serviceability}
                    </p>
                    <p>
                      <strong>{mergedRetrofit.progressionRisk}</strong> {mlEstimate.engineeringGuidance.riskAssessment.progressionRisk}
                    </p>
                    <p>
                      <strong>{mergedRetrofit.occupancyRecommendation}</strong>{' '}
                      {mlEstimate.engineeringGuidance.riskAssessment.occupancyRecommendation}
                    </p>
                  </article>

                  <article className="retrofit-defect-card">
                    <CmsText as="h4" id="retrofit.estimate.stepByStepMeasures" fallback={mergedRetrofit.stepByStepMeasures} />
                    {mlEstimate.engineeringGuidance.retrofitMeasures.map((measure) => (
                      <div key={`measure-${measure.step}-${measure.title}`} style={{ marginBottom: 12 }}>
                        <p>
                          <strong>
                            {mergedRetrofit.stepWord} {measure.step}: {measure.title}
                          </strong>
                        </p>
                        <p>
                          <strong>{mergedRetrofit.objective}</strong> {measure.objective}
                        </p>
                        <p>
                          <strong>{mergedRetrofit.method}</strong> {measure.method}
                        </p>
                        <p>
                          <strong>{mergedRetrofit.applicability}</strong> {measure.applicability}
                        </p>
                        <p>
                          <strong>{mergedRetrofit.materialsAndQuantities}</strong>
                        </p>
                        <ul>
                          {measure.materials.map((mat) => (
                            <li key={`mat-${measure.step}-${mat.name}`}>
                              {mat.name} ({mat.specification}) - {mat.estimatedQty} {mat.unit}
                            </li>
                          ))}
                        </ul>
                        <p>
                          <strong>{mergedRetrofit.toolsLabel}</strong>
                        </p>
                        <ul>
                          {measure.tools.map((tool) => (
                            <li key={`tool-${measure.step}-${tool}`}>{tool}</li>
                          ))}
                        </ul>
                        <p>
                          <strong>{mergedRetrofit.executionSequence}</strong>
                        </p>
                        <ul>
                          {measure.execution.map((item) => (
                            <li key={`exec-${measure.step}-${item}`}>{item}</li>
                          ))}
                        </ul>
                        <p>
                          <strong>{mergedRetrofit.qualityChecksLabel2}</strong>
                        </p>
                        <ul>
                          {measure.qualityChecks.map((item) => (
                            <li key={`qc-${measure.step}-${item}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </article>

                  <article className="retrofit-defect-card">
                    <CmsText as="h4" id="retrofit.estimate.safetyPrecautionsTitle" fallback={mergedRetrofit.safetyPrecautionsTitle} />
                    <ul>
                      {mlEstimate.engineeringGuidance.safetyPrecautions.map((item) => (
                        <li key={`safety-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="retrofit-defect-card">
                    <CmsText as="h4" id="retrofit.estimate.locationCostTitle" fallback={mergedRetrofit.locationCostTitle} />
                    <p>
                      <strong>{mergedRetrofit.region}</strong> {mlEstimate.engineeringGuidance.locationBasedCostEstimation.city},{' '}
                      {mlEstimate.engineeringGuidance.locationBasedCostEstimation.region}
                    </p>
                    <p>
                      <strong>{mergedRetrofit.structureTypeLabel}</strong>{' '}
                      {mlEstimate.engineeringGuidance.locationBasedCostEstimation.structureType}
                    </p>
                    <p>
                      <strong>{mergedRetrofit.totalEstimatedCostLabel}</strong> PKR{' '}
                      {Math.round(mlEstimate.engineeringGuidance.locationBasedCostEstimation.breakdown.total).toLocaleString()}
                    </p>
                    <p>
                      <strong>{mergedRetrofit.rateLabel}</strong> PKR{' '}
                      {Math.round(
                        mlEstimate.engineeringGuidance.locationBasedCostEstimation.breakdown.ratePerSqft,
                      ).toLocaleString()}
                      /{mergedRetrofit.sqFt}
                    </p>
                    <p>
                      <strong>{mergedRetrofit.breakdown}</strong>
                    </p>
                    <ul>
                      <li>
                        {mergedRetrofit.labor} PKR{' '}
                        {Math.round(mlEstimate.engineeringGuidance.locationBasedCostEstimation.breakdown.labor).toLocaleString()}
                      </li>
                      <li>
                        {mergedRetrofit.materialsBreakdown} PKR{' '}
                        {Math.round(
                          mlEstimate.engineeringGuidance.locationBasedCostEstimation.breakdown.materials,
                        ).toLocaleString()}
                      </li>
                      <li>
                        {mergedRetrofit.equipment} PKR{' '}
                        {Math.round(
                          mlEstimate.engineeringGuidance.locationBasedCostEstimation.breakdown.equipment,
                        ).toLocaleString()}
                      </li>
                      <li>
                        {mergedRetrofit.contingency} PKR{' '}
                        {Math.round(
                          mlEstimate.engineeringGuidance.locationBasedCostEstimation.breakdown.contingency,
                        ).toLocaleString()}
                      </li>
                    </ul>
                    <p>
                      <strong>{mergedRetrofit.lineItems}</strong>
                    </p>
                    <ul>
                      {mlEstimate.engineeringGuidance.locationBasedCostEstimation.lineItems.map((item) => (
                        <li key={`cost-${item.item}`}>
                          {item.item}: {item.quantity} x PKR {Math.round(item.unitRate).toLocaleString()} = PKR{' '}
                          {Math.round(item.cost).toLocaleString()} ({item.note})
                        </li>
                      ))}
                    </ul>
                    <p>
                      <strong>{mergedRetrofit.assumptions}</strong>
                    </p>
                    <ul>
                      {mlEstimate.engineeringGuidance.locationBasedCostEstimation.assumptions.map((item) => (
                        <li key={`cost-assumption-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="retrofit-defect-card">
                    <CmsText as="h4" id="retrofit.estimate.fieldImplementationNotes" fallback={mergedRetrofit.fieldImplementationNotes} />
                    <ul>
                      {mlEstimate.engineeringGuidance.fieldImplementationNotes.map((item) => (
                        <li key={`field-note-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </article>
                </div>
              )}
              <button onClick={() => void downloadRetrofitEstimate()}>
                <CmsText as="span" id="retrofit.estimate.downloadPdf" fallback={mergedRetrofit.downloadEstimatePdf} />
              </button>
            </div>
            </div>
          )}

            </div>
          )
    }

    if (section === 'learn') {
      const { videoSrc, resolveError } = learnPlayerPlayback
      const learnNowPlaying =
        activeLearnVideo ?
          `${t.learn.nowPlaying} ${t.learnVideos[activeLearnVideo.id as keyof typeof t.learnVideos]?.title || learnRowDisplayTitle({
            title: activeLearnVideo.title,
            fileName: activeLearnVideo.fileName,
            url: learnTrainVideoUrl(activeLearnVideo.fileName),
            s3Key: `resilience360/learn/${activeLearnVideo.fileName}`,
            id: activeLearnVideo.id,
          }) || t.learn.title}`
        : ''
      const learnModalTitleFallback = learnNowPlaying.trim() || t.learn.title
      return (
        <Fragment>
          <div className="panel section-panel section-learn">
            <div className="learn-title-wrap">
              <CmsSectionHeading fallback={t.learn.title} />
              <CmsText id="sectionIntro" fallback={t.learn.intro} />
            </div>

            {!isLearnVideoVisible && (
              <div className="card-grid learn-video-grid">
                {effectiveLearnTrainingVideos.filter((v) => Boolean(learnTrainVideoUrl(v.fileName))).length === 0 ?
                  <p className="r360-universal-editor-hint" style={{ gridColumn: '1 / -1' }}>
                    {t.learn.noVideosCms}
                  </p>
                : null}
                {effectiveLearnTrainingVideos
                  .filter((video) => Boolean(learnTrainVideoUrl(video.fileName)))
                  .map((video) => {
                  const copy = t.learnVideos[video.id as keyof typeof t.learnVideos]
                  const videoTitle =
                    copy?.title ||
                    learnRowDisplayTitle({
                      title: video.title,
                      fileName: video.fileName,
                      url: learnTrainVideoUrl(video.fileName),
                      s3Key: `resilience360/learn/${video.fileName}`,
                      id: video.id,
                    })
                  const videoSummary = copy?.summary ?? video.summary ?? videoTitle
                  const playLabel = `${t.learn.watchVideo}: ${videoTitle}`
                  const showSummaryLead = videoSummary.trim() !== videoTitle.trim()
                  return (
                    <article key={video.id} className="learn-video-card learn-video-card--compact" data-learn-card-id={video.id}>
                      <div className="learn-video-card-main">
                        <div className="learn-video-card-head-row">
                          <span className="learn-video-icon" aria-hidden>
                            {effectiveLearnVideoIconById[video.id] ?? '🎬'}
                          </span>
                          <div className="learn-video-card-copy">
                            <h3>
                              <CmsText as="span" id={`learn.card.${video.id}.title`} fallback={videoTitle} />
                            </h3>
                            {showSummaryLead ?
                              <CmsText
                                id={`learn.card.${video.id}.summary`}
                                fallback={videoSummary}
                                className="learn-video-card-lead"
                              />
                            : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="learn-watch-btn"
                          onClick={() => openLearnVideoPlayer(video.id)}
                          aria-label={playLabel}
                        >
                          <CmsText as="span" id={`learn.card.${video.id}.watchBtn`} fallback={t.learn.watchVideo} />
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
            {!isLearnVideoVisible && learnVideoError && <p role="alert">{learnVideoError}</p>}
          </div>

          {isLearnVideoVisible && activeLearnVideo ?
            <div
              className="learn-video-modal-root"
              role="presentation"
              onClick={closeLearnVideoModal}
            >
              <div
                className="learn-video-modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="learn-video-modal-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="infra-video-panel learn-video-player-panel">
                  <div id="learn-video-modal-title">
                    <CmsText
                      as="h3"
                      id="block.learnPlayerTitle"
                      fallback={learnModalTitleFallback}
                    />
                  </div>
                  {resolveError ?
                    <div className="learn-video-modal-error" role="alert">
                      {resolveError}
                    </div>
                  : null}
                  {videoSrc ?
                    <video
                      key={videoSrc}
                      ref={learnVideoRef}
                      className="infra-layout-video learn-training-video"
                      controls
                      autoPlay
                      playsInline
                      controlsList="nodownload"
                      disablePictureInPicture
                      onContextMenu={(event) => event.preventDefault()}
                      poster={learnTrainPosterUrl(activeLearnVideo.fileName)}
                      preload="metadata"
                      onLoadStart={() => setLearnVideoError(null)}
                      onLoadedMetadata={() => setIsLearnVideoMetadataReady(true)}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        handleLearnVideoLoadError(e)
                      }}
                    >
                      {inferVideoMime(videoSrc) ?
                        <source src={videoSrc} type={inferVideoMime(videoSrc)} />
                      : <source src={videoSrc} />}
                      {t.videoUnsupported}
                    </video>
                  : !resolveError ?
                    null
                  : null}
                  {!resolveError && videoSrc && !isLearnVideoMetadataReady ? (
                    <p className="learn-video-modal-status" role="status" aria-live="polite">
                      Loading video...
                    </p>
                  ) : null}
                  {learnVideoError && <p role="alert">{learnVideoError}</p>}
                  <div className="learn-video-player-actions">
                    <button type="button" onClick={closeLearnVideoModal}>
                      <CmsText as="span" id="block.learnBackToVideos" fallback={t.learn.backToVideos} />
                    </button>
                    <button type="button" onClick={closeLearnVideoModal}>
                      <CmsText as="span" id="block.learnHideVideo" fallback={t.learn.hideVideo} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          : null}
        </Fragment>
      )
    }

    if (section === 'pgbc') {
      return (
        <div className="panel section-panel section-pgbc section-building-codes">
          <BuildingCodesPage language={language} isAdminMode={isAdminMode} isEditMode={isEditMode} />
        </div>
      )
    }

    if (section === 'materialHubs') {
      return (
        <MaterialHubsPage
          language={language}
          isAdminMode={isAdminMode}
          isEditMode={isEditMode}
        />
      )
    }

    if (section === 'retrofitCalculator') {
      return (
        <div className="panel section-panel section-pgbc section-retrofit-calculator">
          <CmsSectionHeading fallback={t.sections.retrofitCalculator} />
          <CmsText id="sectionIntro" fallback={t.homeCards.retrofitCalculator.subtitle} className="section-lead" />
          <CostEstimatorPage language={language} isAdminMode={isAdminMode} isEditMode={isEditMode} />
        </div>
      )
    }

    if (section === 'smartConstruction') {
      return (
        <div className="panel section-panel section-pgbc section-smart-construction">
          <CmsSectionHeading fallback={t.sections.smartConstruction} />
          <CmsText id="sectionIntro" fallback={t.homeCards.smartConstruction.subtitle} className="section-lead" />
          <SmartConstructionPage language={language} isAdminMode={isAdminMode} isEditMode={isEditMode} />
        </div>
      )
    }

    if (section === 'disasterDashboard') {
      return (
        <DisasterDashboardPage
          language={language}
          isAdminMode={isAdminMode}
          isEditMode={isEditMode}
        />
      )
    }

    return (
      <div className="panel section-panel section-settings">
        <CmsSectionHeading fallback={t.sections.settings} />
        <CmsText id="sectionIntro" fallback={t.homeCards.settings.subtitle} className="section-lead" />
        <div className="settings-card">{notificationSettingsPanel}</div>
      </div>
    )
  }

  const useWebSingleRowHeader = !isCapacitorNativeRuntime()
  const showDesktopSettingsCard = isHomeView && isSettingsCardViewport
  const desktopHomeSettingsCard =
    showDesktopSettingsCard ?
      <section className="home-settings-card settings-card" aria-label="Settings">
        {notificationSettingsPanel}
      </section>
    : null

  const navbarBrandContent = (
    <div className="brand">
      <div className="app-main-brand app-brand-mark" aria-label={t.appTitle}>
        <img
          src={appBrandIconSrc}
          alt=""
          className="app-main-brand__icon app-brand-mark__icon"
          width={55}
          height={55}
          decoding="async"
          fetchPriority="high"
          onError={() => {
            setAppBrandIconIndex((i) => (i + 1 < APP_BRAND_ICON_URL_CANDIDATES.length ? i + 1 : i))
          }}
        />
        {isHomeView ||
        isBestPracticesView ||
        isLearnView ||
        isRiskMapsView ||
        isLiveEarthquakeMapView ||
        isReadinessView ? (
          <div className="hero-title-wrap">
            <h1 className="hero-title" dir={isUrdu ? 'rtl' : 'ltr'} style={isHomeView ? homeHeroColorStyle : undefined}>
              <CmsText
                as="span"
                id={isHomeView ? 'hero.title' : 'hero.navbarTitle'}
                fallback={isHomeView ? homeHeroTitleDisplay : t.heroTitle}
              />
            </h1>
            <p className="hero-subtitle" style={isHomeView ? homeHeroColorStyle : undefined}>
              <CmsText
                as="span"
                id={isHomeView ? 'hero.subtitle' : 'hero.navbarSubtitle'}
                fallback={isHomeView ? homeHeroSubtitleDisplay : t.heroSubtitle}
              />
            </p>
          </div>
        ) : (
          <h1 dir={isUrdu ? 'rtl' : 'ltr'}>
            <CmsText as="span" id="hero.appTitle" fallback={t.appTitle} />
          </h1>
        )}
      </div>
    </div>
  )

  const topBarQuickControls = (
    <TopBarQuickControls
      t={t}
      language={language}
      setLanguage={setLanguage}
      showLanguageToggle={true}
      showSettingsToggle={!isSettingsCardViewport}
      selectedRole={selectedRole}
      setSelectedRole={setSelectedRole}
      interfaceToggleLabel={interfaceToggleLabel}
      showInterfaceToggle={false}
      onHome={() => navigateToSection(null)}
      homeLabel={isHomeView ? t.pakistanHome : `🏠 ${t.home}`}
      onSettings={() => navigateToSection('settings')}
      settingsLabel={t.sections.settings}
      onNewInterface={() => {
        const next = homeLayoutMode === 'carousel' ? 'grid' : 'carousel'
        setHomeLayoutMode(next)
        try {
          localStorage.setItem(HOME_LAYOUT_LS_KEY, next)
        } catch {
          /* ignore */
        }
        navigateToSection(null)
      }}
    />
  )

  return (
    <PageConfigElementsProvider value={pageConfigContextValue}>
    <>
    {showEarthquakeNotifyPrompt ?
      createPortal(
        <div className="learn-video-modal-overlay" role="dialog" aria-modal="true" aria-label="Enable notifications">
          <div className="learn-video-modal-dialog" style={{ maxWidth: 520 }}>
            <div className="learn-video-modal-header">
              <h3 style={{ margin: 0 }}>Stay informed with real-time earthquake alerts.</h3>
              <button
                type="button"
                className="learn-video-modal-close"
                onClick={maybeLaterEarthquakeNotifications}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="section-lead" style={{ marginTop: 6 }}>
              Enable notifications to receive instant alerts for significant earthquakes (Magnitude ≥ 5.0).
            </p>
            <div className="inline-controls" style={{ marginTop: 12 }}>
              <button type="button" onClick={enableEarthquakeBrowserNotifications}>
                Enable Notifications
              </button>
              <button type="button" onClick={maybeLaterEarthquakeNotifications}>
                Maybe Later
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null}
    <GlobalBackgroundVideo />
    <div className="r360-app-stack">
    <div
      className={`page-wrapper ${isHomeView ? 'page-home' : 'page-section'}`}
      dir={isUrdu ? 'rtl' : 'ltr'}
    >
      <div className="content-layer">
      <div
        className={`app-shell r360-app-shell ${!isEmbeddedPortalSection ? 'resilience-bg-shell' : ''} ${isHomeView ? 'home-shell' : ''} ${isBestPracticesView || isLearnView ? 'best-practices-view' : ''} ${isRiskMapsView || isLiveEarthquakeMapView ? 'risk-maps-view' : ''} ${isReadinessView ? 'readiness-view' : ''}`}
        style={{ ...homeShellThemeVars }}
      >
      {isAdminMode && isEditMode && !isHomeView ?
        <button
          type="button"
          className="r360-page-bg-edit-fab"
          data-cms-id={SHELL_PAGE_BACKGROUND_ID}
          data-cms-type="background"
          aria-label="Edit page background"
        >
          Page BG
        </button>
      : null}
      <header
        className={`navbar ${isHomeView ? 'home-navbar' : ''} ${isBestPracticesView || isLearnView ? 'best-practices-navbar' : ''} ${isRiskMapsView || isLiveEarthquakeMapView ? 'risk-maps-navbar' : ''} ${isReadinessView ? 'readiness-navbar' : ''}${useWebSingleRowHeader ? ' navbar--web-single-row' : ''}`}
      >
        {useWebSingleRowHeader ?
          <div className="navbar-top-strip navbar-top-strip--web-unified">
            <div className="navbar-top-strip__brand">
              <div className="navbar-start">{navbarBrandContent}</div>
            </div>
            <div className="navbar-top-strip__authority">
              <div className="navbar-top-strip__logo-wrap">
                <NdmaHeaderLogo alt={t.ndmaLogoAlt} />
              </div>
              <NdmaAuthorityBadge t={t} isUrdu={isUrdu} variant="topbar" tone={ndmaBadgeTone} />
            </div>
            {topBarQuickControls}
          </div>
        : <>
            <div className="navbar-top-strip">
              <div className="navbar-top-strip__logo-wrap">
                <NdmaHeaderLogo alt={t.ndmaLogoAlt} />
              </div>
              <NdmaAuthorityBadge t={t} isUrdu={isUrdu} variant="topbar" tone={ndmaBadgeTone} />
              {topBarQuickControls}
            </div>
            <div className="navbar-top navbar-main">
              <div className="navbar-start">{navbarBrandContent}</div>
              <div className="navbar-end" />
            </div>
            <div className="navbar-mobile-home-row">
              <button
                type="button"
                className="nav-toolbar-home-btn navbar-mobile-home-btn"
                onClick={() => navigateToSection(null)}
              >
                {isHomeView ? t.pakistanHome : `🏠 ${t.home}`}
              </button>
            </div>
          </>
        }
      </header>

      <main className="r360-page-layout">
        {!activeSection &&
          (useCarouselHomeLayout ?
            <HomePageCarouselBody
              t={t}
              language={language}
              homeCardRows={homeCardRowsForDisplay}
              navigateToSection={navigateToSection}
              editMode={false}
              onAdminCardClick={undefined}
              onAdminFooterClick={undefined}
              footerCms={homepageConfig.footer}
              showSettingsButton={isCapacitorNativeRuntime()}
              desktopSettingsCard={desktopHomeSettingsCard}
            />
          : <HomePageHomeBody
            t={t}
            language={language}
            homeCardRows={homeCardRowsForDisplay}
            navigateToSection={navigateToSection}
            editMode={false}
            onAdminCardClick={undefined}
            onAdminFooterClick={undefined}
            footerCms={homepageConfig.footer}
            showSettingsButton={isCapacitorNativeRuntime()}
            desktopSettingsCard={desktopHomeSettingsCard}
          />)}
        {visitedSections.size > 0 ?
          <PersistentSectionHost
            activeSection={activeSection}
            visitedSections={visitedSections}
            renderSection={renderSectionContent}
          />
        : null}
      </main>
    </div>
    </div>
    </div>
    </div>
    </>
    </PageConfigElementsProvider>
  )
}

export default App

