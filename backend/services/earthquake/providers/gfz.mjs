import { GFZ_FEED_URL } from '../config.mjs'

export const id = 'GFZ'

export function isEnabled(config) {
  return Boolean(config?.PROVIDER_ENABLED?.GFZ)
}

export async function fetchFeed() {
  throw new Error('GFZ provider is disabled (set GFZ_ENABLED=true to enable)')
}

export function getFeedUrl() {
  return GFZ_FEED_URL
}
