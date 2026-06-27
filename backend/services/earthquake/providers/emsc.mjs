import { EMSC_FEED_URL } from '../config.mjs'

export const id = 'EMSC'

export function isEnabled(config) {
  return Boolean(config?.PROVIDER_ENABLED?.EMSC)
}

export async function fetchFeed() {
  throw new Error('EMSC provider is disabled (set EMSC_ENABLED=true to enable)')
}

export function getFeedUrl() {
  return EMSC_FEED_URL
}
