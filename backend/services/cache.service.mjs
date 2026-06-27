import NodeCache from 'node-cache'

const stdTTL = Math.max(1, Number(process.env.CMS_READ_CACHE_TTL_SECONDS) || 60)

const cache = new NodeCache({ stdTTL })

export function getCache(key) {
  return cache.get(key)
}

export function setCache(key, value) {
  cache.set(key, value)
}

/** Invalidate all in-process CMS read entries (call after successful page_config writes). */
export function bustCmsReadCache() {
  cache.flushAll()
}

export function isCmsReadCacheEnabled() {
  return String(process.env.CMS_READ_CACHE ?? 'true').toLowerCase() !== 'false'
}
