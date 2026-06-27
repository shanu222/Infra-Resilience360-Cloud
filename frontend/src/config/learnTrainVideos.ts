import { localContentUrl } from './localContent'

export const LEARN_VIDEO_BASE = `${localContentUrl('learn-train', 'videos')}/`
export const LEARN_POSTER_BASE = `${localContentUrl('learn-train', 'images')}/`

export type LearnTrainVideoConfig = {
  id: string
  title: string
  summary: string
  fileName: string
  icon: string
}

export const LEARN_TRAIN_VIDEOS: LearnTrainVideoConfig[] = [
  {
    id: 'flood-barriers',
    title: 'Flood Protection & Barriers',
    summary: 'Practical barrier strategies and mitigation planning for flood-prone localities.',
    fileName: 'flood-protection-barriers.mp4',
    icon: '🌊',
  },
  {
    id: 'monsoon-damages',
    title: 'Monsoon 2025 Damages in Pakistan',
    summary: 'Damage patterns from monsoon events and key infrastructure lessons.',
    fileName: 'monsoon-2025-damages-pakistan.mp4',
    icon: '🌧️',
  },
  {
    id: 'global-best-practice',
    title: 'Global Best Practice',
    summary: 'Short global resilience examples relevant for local adaptation in Pakistan.',
    fileName: 'global-best-practices.mp4',
    icon: '🌍',
  },
  {
    id: 'building-resilience-audit',
    title: 'Building Resilience through Infra Audit',
    summary: 'How to assess critical assets and prioritize safety upgrades.',
    fileName: 'infrastructure-resilience-audit.mp4',
    icon: '📋',
  },
  {
    id: 'floodplain-recovery',
    title: 'Floodplains Resilient Recovery',
    summary: 'Recovery and rebuilding approaches for floodplain communities.',
    fileName: 'floodplain-resilient-recovery.mp4',
    icon: '🏞️',
  },
  {
    id: 'infra-damages',
    title: 'Infrastructure Damages Overview',
    summary: 'Visual overview of common damage mechanisms and risk hotspots.',
    fileName: 'infrastructure-damages.mp4',
    icon: '🏗️',
  },
  {
    id: 'innovative-tech',
    title: 'Innovative Construction Technologies',
    summary: 'Construction technology options for safer and more durable infrastructure.',
    fileName: 'innovative-construction-technologies.mp4',
    icon: '⚙️',
  },
  {
    id: 'innovative-tech-sound',
    title: 'Innovative Construction Technologies (Sound Added)',
    summary: 'Audio-enhanced version for training sessions and classroom delivery.',
    fileName: 'innovative-construction-technologies-audio.mp4',
    icon: '🔊',
  },
  {
    id: 'modular-bridge',
    title: 'Modular Bridge Video Animation',
    summary: 'Modular bridge concept animation for rapid deployment and resilience.',
    fileName: 'modular-bridge-animation.mp4',
    icon: '🌉',
  },
  {
    id: 'resilient-structures',
    title: 'Resilient Structures against EQ & Floods',
    summary: 'Integrated design principles for earthquake and flood resilience.',
    fileName: 'resilient-structures-earthquake-floods.mp4',
    icon: '🏛️',
  },
  {
    id: 'stormwater-management',
    title: 'Stormwater Management & Permeable Pavement',
    summary: 'Drainage and permeable pavement techniques to reduce flooding impacts.',
    fileName: 'stormwater-management-drainage-permeable-pavement.mp4',
    icon: '💧',
  },
  {
    id: 'arc-overview',
    title: 'ARC Overview',
    summary: 'Supplementary resilience planning video for field awareness sessions.',
    fileName: 'arc-explainer.mp4',
    icon: '📘',
  },
  {
    id: 'video-3',
    title: 'Field Training Video 3',
    summary: 'Additional field-focused training module for local teams.',
    fileName: 'infrastructure-video-3.mp4',
    icon: '🎬',
  },
]

export const LEARN_TRAIN_ICON_MAP: Record<string, string> = Object.fromEntries(
  LEARN_TRAIN_VIDEOS.map((video) => [video.id, video.icon]),
)

export function learnTrainVideoUrl(fileName: string): string {
  const safe = String(fileName ?? '').trim()
  return safe ? `${LEARN_VIDEO_BASE}${safe}` : ''
}

export function learnTrainPosterUrl(fileName: string): string {
  const safe = String(fileName ?? '').trim()
  if (!safe) return ''
  const stem = safe.replace(/\.[^.]+$/, '')
  return `${LEARN_POSTER_BASE}${stem}.jpg`
}
