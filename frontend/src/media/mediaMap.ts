/** Maps Learn & Train card ids to legacy keys (i18n titles only; video URLs from GET /static/content/learn). */
export const learnVideoIdToLearnKey: Record<string, string> = {
  'flood-barriers': 'floodProtection',
  'monsoon-damages': 'monsoon',
  'global-best-practice': 'global',
  'building-resilience-audit': 'audit',
  'floodplain-recovery': 'recovery',
  'infra-damages': 'damages',
  'innovative-tech': 'innovative',
  'innovative-tech-sound': 'innovativeAudio',
  'modular-bridge': 'modular',
  'resilient-structures': 'resilient',
  'stormwater-management': 'stormwater',
  'arc-overview': 'arc',
  'video-3': 'field',
}

export type LearnVideoKey = string

/** Playback uses GET /static/content/learn only — no hardcoded S3 URLs. */
export function getS3FallbackUrlForLearnVideoId(_videoId: string): string {
  return ''
}

/** Layout video from GET /static/content/inframodels only. */
export function getS3FallbackUrlForInfraLayout(): string {
  return ''
}

