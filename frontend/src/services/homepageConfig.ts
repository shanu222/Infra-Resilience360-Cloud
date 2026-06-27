import { getStaticHomepageConfig } from './staticContent'
import type { HomepageConfigPayload } from '../types/homepageConfig'

export type { HomepageConfigCard, HomepageConfigPayload } from '../types/homepageConfig'

export async function fetchHomepageConfig(): Promise<HomepageConfigPayload> {
  return getStaticHomepageConfig()
}
