import { buildApiTargets, fetchApi, resolveAiUserMessage, assertProductionVisionResult, AI_USER_MESSAGES } from './apiBase'

const wait = (ms: number) => new Promise<void>((resolve) => {
  window.setTimeout(resolve, ms)
})

/**
 * Keep retrofit analysis requests alive until the backend completes.
 * Do not attach an AbortController timeout here, otherwise valid long-running
 * analyses are cancelled client-side with "signal is aborted without reason".
 */
const fetchVisionRequest = async (input: RequestInfo | URL, init: RequestInit): Promise<Response> =>
  fetchApi(input, init)

export type DefectDetection = {
  type: 'crack' | 'spalling' | 'corrosion' | 'moisture' | 'deformation' | 'other'
  severity: 'low' | 'medium' | 'high'
  confidence: number
  location: string
  evidence: string
  retrofitAction: string
}

const buildVisionFormData = (payload: {
  image: File
  structureType: string
  province: string
  location: string
  riskProfile: string
}) => {
  const formData = new FormData()
  formData.append('image', payload.image)
  formData.append('structureType', payload.structureType)
  formData.append('province', payload.province)
  formData.append('location', payload.location)
  formData.append('riskProfile', payload.riskProfile)
  return formData
}

export type VisionAnalysisResult = {
  model: string
  requestId?: string
  analyzedAt: string
  summary: string
  imageQuality: {
    visibility: 'excellent' | 'good' | 'fair' | 'poor'
    notes: string
  }
  defectFeatures?: Array<{
    damageType: string
    component: string
    pattern: string
    crackWidthMinMm: number
    crackWidthMaxMm: number
    estimatedExtentM: number
    locationDetail: string
    confidence: number
  }>
  defects: DefectDetection[]
  costSignals?: {
    assessedDamageLevel: 'low' | 'medium' | 'high'
    recommendedScope: 'basic' | 'standard' | 'comprehensive'
    estimatedAffectedAreaPercent: number
    severityScore: number
    urgencyLevel: 'routine' | 'priority' | 'critical'
  }
  priorityActions: string[]
  retrofitPlan: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
  structuredGuidance?: {
    damageClassification: {
      primary: string
      detected: string[]
      featureEvidence: string[]
    }
    severity: {
      level: 'Low' | 'Moderate' | 'High' | 'Critical'
      rationale: string
    }
    probableCauses: string[]
    risk: {
      lifeSafety: string
      serviceability: string
      progressionRisk: string
    }
    retrofitMethods: Array<{
      step: number
      technique: string
      targetCondition: string
      procedure: string
      materials: Array<{
        name: string
        spec: string
        unit: string
        estimatedQty: number
      }>
      tools: string[]
      qaChecks: string[]
    }>
    safetyPrecautions: string[]
    localizedCostEstimation: {
      province: string
      currency: 'PKR'
      lineItems: Array<{
        item: string
        quantity: string
        unitRatePkr: number
        costPkr: number
      }>
      totalEstimatedCostPkr: number
      assumptions: string[]
    }
  }
  safetyNote: string
}

/** @deprecated Placeholder responses must not be shown to users. */
export const buildVisionOfflineFallback = (_payload: {
  structureType: string
  province: string
  location: string
}): never => {
  throw new Error(AI_USER_MESSAGES.unavailable)
}

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
      try {
        const formData = buildVisionFormData(payload)
        const response = await fetchVisionRequest(target, {
          method: 'POST',
          body: formData,
        })

        const raw = await response.text()
        const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
        const isJsonResponse = contentType.includes('application/json')

        if ((response.status === 404 || response.status === 405) && !isJsonResponse) {
          lastError = new Error(AI_USER_MESSAGES.network)
          break
        }

        if (!isJsonResponse) {
          lastError = new Error(AI_USER_MESSAGES.network)
          break
        }

        let body: VisionAnalysisResult | { error?: string } | null = null

        try {
          body = JSON.parse(raw) as VisionAnalysisResult | { error?: string }
        } catch {
          lastError = new Error(AI_USER_MESSAGES.incomplete)
          break
        }

        if (!response.ok) {
          const apiError = resolveAiUserMessage(
            { error: (body as { error?: string }).error },
            AI_USER_MESSAGES.unavailable,
          )
          const isRateLimit = response.status === 429
          const isTemporary = response.status === 503 || response.status === 502 || response.status === 504

          if ((isRateLimit || isTemporary) && attempt < maxAttemptsPerTarget) {
            await wait(isTemporary ? 2000 : 800 * attempt)
            continue
          }

          lastError = new Error(apiError)
          break
        }

        return assertProductionVisionResult(body as VisionAnalysisResult)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(AI_USER_MESSAGES.generic)

        const isNetworkError = /failed to fetch|network|timeout/i.test(lastError.message)
        if (attempt < maxAttemptsPerTarget && isNetworkError) {
          await wait(600 * attempt)
          continue
        }
      }
    }
  }

  throw new Error(resolveAiUserMessage(lastError, AI_USER_MESSAGES.unavailable))
}
