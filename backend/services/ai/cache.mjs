import { createHash } from 'node:crypto'
import { AI_CACHE_ENABLED, AI_CACHE_TTL } from './config.mjs'

const cache = new Map()

function pruneExpired() {
  const now = Date.now()
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) cache.delete(key)
  }
}

function stableJson(value) {
  if (value == null) return String(value)
  if (typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`
  const keys = Object.keys(value).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableJson(value[k])}`).join(',')}}`
}

function buildImageSignature(messages = []) {
  const chunks = []
  for (const message of messages) {
    const content = message?.content
    if (!Array.isArray(content)) continue
    for (const item of content) {
      const url = item?.image_url?.url
      if (typeof url === 'string' && url.startsWith('data:')) {
        const matched = url.match(/^data:([^;]+);base64,(.+)$/)
        if (matched?.[2]) {
          chunks.push(`${matched[1]}:${matched[2]}`)
        }
      }
    }
  }
  return chunks.join('|')
}

export function computeRequestHash({ taskType, operation, messages, modelHint = '' }) {
  const textPayload = stableJson(messages)
  const imagePayload = operation === 'analyzeImage' ? buildImageSignature(messages) : ''
  const hashInput = `${taskType}|${operation}|${modelHint}|${textPayload}|${imagePayload}`
  return createHash('sha256').update(hashInput).digest('hex')
}

export function getCacheValue(hashKey) {
  if (!AI_CACHE_ENABLED) return null
  pruneExpired()
  const entry = cache.get(hashKey)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    cache.delete(hashKey)
    return null
  }
  return entry.value
}

export function setCacheValue(hashKey, value) {
  if (!AI_CACHE_ENABLED) return
  const ttlMs = AI_CACHE_TTL * 1000
  cache.set(hashKey, {
    value,
    expiresAt: Date.now() + ttlMs,
  })
}

export function getCacheStats() {
  pruneExpired()
  return {
    enabled: AI_CACHE_ENABLED,
    ttlSeconds: AI_CACHE_TTL,
    size: cache.size,
  }
}

