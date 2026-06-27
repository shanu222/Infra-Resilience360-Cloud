import { ISC_FEED_URL } from '../config.mjs'

export const id = 'ISC'

export function isEnabled(config) {
  return Boolean(config?.PROVIDER_ENABLED?.ISC)
}

export async function fetchFeed() {
  throw new Error('ISC provider is disabled (set ISC_ENABLED=true to enable)')
}

export function getFeedUrl() {
  return ISC_FEED_URL
}
