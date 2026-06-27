export type DefectDetection = {
  type: 'crack' | 'spalling' | 'corrosion' | 'moisture' | 'deformation' | 'other'
  severity: 'low' | 'medium' | 'high'
  confidence: number
  location: string
  evidence: string
  retrofitAction: string
}

export type VisionAnalysisResult = {
  model: string
  analyzedAt: string
  summary: string
  imageQuality: {
    visibility: 'excellent' | 'good' | 'fair' | 'poor'
    notes: string
  }
  defects: DefectDetection[]
  costSignals?: {
    assessedDamageLevel: 'low' | 'medium' | 'high'
    recommendedScope: 'basic' | 'standard' | 'comprehensive'
    estimatedAffectedAreaPercent: number
    severityScore: number
    urgencyLevel: 'routine' | 'priority' | 'critical'
  }
  priorityActions: string[]
  safetyNote: string
}

export type MlRetrofitEstimate = {
  model: string
  predictedScope: 'basic' | 'standard' | 'comprehensive'
  predictedDamage: 'low' | 'medium' | 'high'
  predictedCostPerSqft: number
  predictedDurationWeeks: number
  confidence: number
  guidance: string[]
}

import { buildApiTargets, fetchApi, formatApiErrorMessage, AI_ANALYSIS_UNAVAILABLE } from '@resilience/api-base'

const R360_DEBUG = typeof window !== 'undefined' && (window as any).__R360_DEBUG === true

const debugLog = (message: string, details?: unknown) => {
  if (!R360_DEBUG) return
  if (details !== undefined) {
    console.debug(`[retrofit vision] ${message}`, details)
  } else {
    console.debug(`[retrofit vision] ${message}`)
  }
}

const formatResponseHeaders = (headers: Headers): Record<string, string> => {
  return Object.fromEntries([...headers.entries()].map(([key, value]) => [key.toLowerCase(), value]))
}

const buildVisionFormData = (payload: {
  image: File
  structureType: string
  province: string
  location: string
  riskProfile: string
}) => {
  const fd = new FormData()
  fd.append('image', payload.image)
  fd.append('structureType', payload.structureType)
  fd.append('province', payload.province)
  fd.append('location', payload.location)
  fd.append('riskProfile', payload.riskProfile)
  return fd
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

export const analyzeBuildingWithVision = async (payload: {
  image: File
  structureType: string
  province: string
  location: string
  riskProfile: string
}): Promise<VisionAnalysisResult> => {
  const targets = buildApiTargets('/api/vision/analyze')
  let lastError: Error | null = null
  const maxAttemptsPerTarget = 3

  for (const target of targets) {
    for (let attempt = 1; attempt <= maxAttemptsPerTarget; attempt += 1) {
      const formData = buildVisionFormData(payload)
      const requestInit: RequestInit = {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
      }

      const requestStart = Date.now()
      try {
        debugLog('request init', requestInit)

        const response = await fetchApi(target, requestInit)
        const durationMs = Date.now() - requestStart
        const raw = await response.text()
        const headers = formatResponseHeaders(response.headers)
        const contentType = headers['content-type']?.toLowerCase() ?? ''
        const isJsonResponse = contentType.includes('application/json')

        debugLog('response body', raw)

        if ((response.status === 404 || response.status === 405) && !isJsonResponse) {
          lastError = new Error(`Vision route unavailable on ${target} (${response.status})`)
          break
        }

        if (!isJsonResponse) {
          lastError = new Error(`Vision API returned non-JSON response (${response.status}) from ${target}.`)
          continue
        }

        let body: VisionAnalysisResult | { error?: string; message?: string; success?: boolean; temporary?: boolean } | null = null
        try {
          body = JSON.parse(raw) as VisionAnalysisResult | { error?: string; message?: string; success?: boolean; temporary?: boolean }
        } catch (parseError) {
          lastError = new Error(response.ok ? 'Vision API returned invalid JSON response.' : `Vision API returned non-JSON response (${response.status}).`)
          debugLog('JSON parse failed', { target, raw, parseError })
          break
        }

        if (!response.ok) {
          const errorBody = body as { error?: string; message?: string; success?: boolean; temporary?: boolean }
          const apiMessage = errorBody.message ?? errorBody.error ?? AI_ANALYSIS_UNAVAILABLE
          const isTemporary = Boolean(errorBody.temporary) || response.status === 429 || response.status === 502 || response.status === 503 || response.status === 504

          if (isTemporary && attempt < maxAttemptsPerTarget) {
            const backoffMs = 800 * attempt
            await wait(backoffMs)
            continue
          }

          lastError = new Error(apiMessage)
          break
        }

        const normalized = body as VisionAnalysisResult
        debugLog('normalized response', normalized)
        return normalized
      } catch (error) {
        const durationMs = Date.now() - requestStart
        lastError = error instanceof Error ? error : new Error('Vision API request failed')
        debugLog('request failed', { target, attempt, durationMs, error: lastError.message })

        const isNetworkError = /failed to fetch|network|timeout|cors|aborted|econnrefused|enotfound|502|503|504/i.test(lastError.message)
        if (attempt < maxAttemptsPerTarget && isNetworkError) {
          await wait(600 * attempt)
          continue
        }
      }
    }
  }

  if (lastError && /quota|insufficient_quota|billing|401|403|incorrect api key|invalid api key/i.test(lastError.message)) {
    throw lastError
  }

  if (lastError) {
    debugLog('analysis unavailable', lastError.message)
  } else {
    debugLog('analysis unavailable: unknown failure')
  }

  throw new Error(formatApiErrorMessage(lastError, AI_ANALYSIS_UNAVAILABLE))
}

export const getMlRetrofitEstimate = async (payload: {
  structureType: string
  province: string
  city: string
  areaSqft: number
  severityScore: number
  affectedAreaPercent: number
  urgencyLevel: 'routine' | 'priority' | 'critical'
  laborDaily?: number
  materialIndex?: number
  equipmentIndex?: number
  logisticsIndex?: number
}): Promise<MlRetrofitEstimate> => {
  const targets = buildApiTargets('/api/ml/retrofit-estimate')
  let lastError: Error | null = null

  for (const target of targets) {
    try {
      const response = await fetchApi(target, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const raw = await response.text()
      const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''

      if (!contentType.includes('application/json')) {
        lastError = new Error(`ML API returned non-JSON response (${response.status})`)
        continue
      }

      const body = JSON.parse(raw) as MlRetrofitEstimate | { error?: string }

      if (!response.ok) {
        throw new Error((body as { error?: string }).error ?? 'ML retrofit estimate failed')
      }

      return body as MlRetrofitEstimate
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('ML API request failed')
    }
  }

  throw lastError ?? new Error('ML API request failed')
}
