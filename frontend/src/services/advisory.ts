import { buildApiTargets, fetchApi } from './apiBase'

const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit, timeoutMs = 45000): Promise<Response> => {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetchApi(input, { ...init, signal: controller.signal })
  } finally {
    window.clearTimeout(timer)
  }
}

const postJsonWithFallback = async (path: string, payload: object): Promise<Response> => {
  const targets = buildApiTargets(path)
  let lastError: Error | null = null

  for (const target of targets) {
    try {
      const response = await fetchWithTimeout(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
      const isJsonResponse = contentType.includes('application/json')

      if (response.ok) return response

      if ((response.status === 404 || response.status === 405) && !isJsonResponse) {
        lastError = new Error(`Advisory route unavailable on ${target} (${response.status})`)
        continue
      }

      if (!isJsonResponse) {
        lastError = new Error(`Advisory API returned non-JSON response (${response.status}) from ${target}`)
        continue
      }

      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Advisory API request failed')
    }
  }

  throw lastError ?? new Error('Advisory API request failed')
}

const parseJsonResponse = async <T>(response: Response, fallback: string): Promise<T> => {
  const raw = await response.text()
  let body: T | { error?: string } | null = null

  try {
    body = JSON.parse(raw) as T | { error?: string }
  } catch {
    throw new Error(response.ok ? `${fallback}: invalid JSON response.` : `${fallback}: non-JSON response (${response.status}).`)
  }

  if (!response.ok) {
    throw new Error((body as { error?: string }).error ?? fallback)
  }

  return body as T
}

const fallbackAdvisoryAnswer = (language: 'English' | 'Urdu'): { answer: string } => ({
  answer:
    language === 'Urdu' ?
      'مشورے کی سروس عارضی طور پر دستیاب نہیں۔ براہ کرم بعد میں دوبارہ کوشش کریں یا آف لائن رہنمائی استعمال کریں۔'
    : 'The advisory service is temporarily unavailable. Please try again later or use offline guidance.',
})

export const askLocalAdvisory = async (payload: {
  question: string
  province: string
  district: string | null
  riskLayer: string
  riskValue: string
  language: 'English' | 'Urdu'
  districtProfile?: {
    district: string
    earthquake: string
    flood: string
    infraRisk: string
    dominantStructure: string
    resilienceActions: string[]
  } | null
}): Promise<{ answer: string }> => {
  try {
    const response = await postJsonWithFallback('/api/advisory/ask', payload)
    return await parseJsonResponse<{ answer: string }>(response, 'Advisory answer generation failed')
  } catch {
    return fallbackAdvisoryAnswer(payload.language)
  }
}
