export const safeArray = (value) => (Array.isArray(value) ? value : [])

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchRemoteText(url, timeoutMs = 14_000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Upstream request failed (${response.status}) for ${url}`)
    }
    return await response.text()
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchRemoteJson(url, timeoutMs = 14_000) {
  const text = await fetchRemoteText(url, timeoutMs)
  return JSON.parse(text)
}

export function buildSourceLabel(source, cached = false) {
  const name = String(source ?? 'USGS').trim() || 'USGS'
  return cached ? `Source: ${name} (cached)` : `Source: ${name}`
}
