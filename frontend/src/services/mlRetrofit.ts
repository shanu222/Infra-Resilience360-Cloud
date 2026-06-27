import { buildApiTargets, fetchApi } from './apiBase'

export type MlRetrofitEstimate = {
  model: string
  predictedScope: 'basic' | 'standard' | 'comprehensive'
  predictedDamage: 'low' | 'medium' | 'high'
  predictedCostPerSqft: number
  predictedDurationWeeks: number
  confidence: number
  guidance: string[]
  guidanceDetailed?: Array<{
    priority: 'P1' | 'P2' | 'P3'
    action: string
    rationale: string
    estimatedImpact: string
  }>
  engineeringGuidance?: {
    damageClassification: {
      primary: string
      detected: string[]
      basis: string[]
    }
    severityLevel: {
      level: 'Low' | 'Moderate' | 'High' | 'Critical'
      score: number
      rationale: string
    }
    probableCauses: string[]
    riskAssessment: {
      lifeSafety: string
      serviceability: string
      progressionRisk: string
      occupancyRecommendation: string
    }
    retrofitMeasures: Array<{
      step: number
      title: string
      objective: string
      method: string
      applicability: string
      materials: Array<{
        name: string
        specification: string
        unit: string
        estimatedQty: number
      }>
      tools: string[]
      execution: string[]
      qualityChecks: string[]
    }>
    safetyPrecautions: string[]
    locationBasedCostEstimation: {
      currency: 'PKR'
      region: string
      city: string
      structureType: string
      assumptions: string[]
      breakdown: {
        labor: number
        materials: number
        equipment: number
        contingency: number
        total: number
        ratePerSqft: number
      }
      lineItems: Array<{
        item: string
        quantity: string
        unitRate: number
        cost: number
        note: string
      }>
    }
    fieldImplementationNotes: string[]
  }
  assumptions?: string[]
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
  defectProfile?: Partial<Record<'crack' | 'spalling' | 'corrosion' | 'moisture' | 'deformation' | 'other', number>>
  imageQuality?: 'excellent' | 'good' | 'fair' | 'poor'
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
      const isJsonResponse = contentType.includes('application/json')

      if ((response.status === 404 || response.status === 405) && !isJsonResponse) {
        lastError = new Error(`ML retrofit route unavailable on ${target} (${response.status})`)
        continue
      }

      if (!isJsonResponse) {
        lastError = new Error(`ML retrofit API returned non-JSON response (${response.status}) from ${target}.`)
        continue
      }

      let body: MlRetrofitEstimate | { error?: string } | null = null

      try {
        body = JSON.parse(raw) as MlRetrofitEstimate | { error?: string }
      } catch {
        lastError = new Error(response.ok ? 'ML retrofit API returned invalid JSON response.' : `ML retrofit API returned non-JSON response (${response.status}).`)
        continue
      }

      if (!response.ok) {
        throw new Error((body as { error?: string }).error ?? 'ML retrofit estimate failed')
      }

      return body as MlRetrofitEstimate
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('ML retrofit API request failed')
    }
  }

  throw lastError ?? new Error('ML retrofit API request failed')
}
