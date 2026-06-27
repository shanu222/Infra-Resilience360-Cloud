export const id = 'NDMA'

export function isEnabled(config) {
  return Boolean(config?.PROVIDER_ENABLED?.NDMA)
}

export async function fetchFeed() {
  throw new Error('NDMA provider is not yet implemented (placeholder)')
}
