import type { SectionKey } from '../../types/sectionKeys'
import { localContentUrl } from '../../config/localContent'

const SPOTLIGHT_HOME_MEDIA_BASE = localContentUrl('home', 'images')

const SPOTLIGHT_HOME_MEDIA_FILES: Partial<Record<SectionKey, { images: string[]; videos?: string[] }>> = {
  retrofit: { images: ['retrofit module picture.png'], videos: ['Retrofit module video.mp4'] },
  infraModels: { images: ['Resilience infra model pic.png'], videos: ['Resilience infra models video.mp4'] },
  designToolkit: { images: ['Design toolkit pic.png'] },
  smartConstruction: { images: ['Smart construction pic.png'] },
  materialHubs: { images: ['Material hubs pic.png'] },
  pgbc: { images: ['Building Codes pic.png'] },
  bestPractices: { images: ['Best Practices.png'] },
  readiness: { images: ['Readiness calculator pic.png'] },
  learn: { images: ['Learn and train pic.png'] },
  riskMaps: { images: ['Live earthquake alerts.png'] },
  liveEarthquakeMap: { images: ['Live earthquake alerts.png'] },
  disasterDashboard: { images: ['disaster dashboard pic.png'] },
}

const toTitleCase = (value: string) =>
  value.replace(/\w\S*/g, (w) => `${w.charAt(0).toUpperCase()}${w.slice(1).toLowerCase()}`)

const fileNameVariants = (fileName: string): string[] => {
  const raw = String(fileName || '').trim()
  if (!raw) return []
  const extMatch = raw.match(/(\.[^.]+)$/)
  const ext = extMatch?.[1] ?? ''
  const nameOnly = ext ? raw.slice(0, -ext.length) : raw
  const candidates = [
    raw,
    `${nameOnly.toLowerCase()}${ext}`,
    `${toTitleCase(nameOnly)}${ext}`,
    `${nameOnly.replace(/\s+/g, '-')}${ext}`,
    `${nameOnly.replace(/\s+/g, '_')}${ext}`,
  ]
  return [...new Set(candidates.map((v) => v.trim()).filter(Boolean))]
}

const toS3ObjectUrls = (fileName: string): string[] => {
  const variants = fileNameVariants(fileName)
  if (variants.length === 0) return []
  const out: string[] = []
  for (const variant of variants) {
    const encoded = variant
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/')
    const direct = `${SPOTLIGHT_HOME_MEDIA_BASE}/${encoded}`
    if (direct && !out.includes(direct)) out.push(direct)
  }
  return out
}

export function getSpotlightMediaCandidatesForSection(section: SectionKey): { images: string[]; videos: string[] } {
  const media = SPOTLIGHT_HOME_MEDIA_FILES[section]
  const images = (media?.images ?? []).flatMap((f) => toS3ObjectUrls(f))
  const videos = (media?.videos ?? []).flatMap((f) => toS3ObjectUrls(f))
  return { images: [...new Set(images)], videos: [...new Set(videos)] }
}
