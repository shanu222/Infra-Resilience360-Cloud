import { buildApiTargets, fetchApi } from './apiBase'

type TrainingUploadResponse = {
  message: string
  sampleCount: number
}

type TrainingRetrainResponse = {
  message: string
  sampleCount: number
  syntheticRows: number
  userRows: number
  totalRows: number
  modelVersion: string
}

const postJsonWithFallback = async <T>(path: string, payload: object): Promise<T> => {
  const targets = buildApiTargets(path)
  let lastError: Error | null = null

  for (const target of targets) {
    try {
      const response = await fetchApi(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const raw = await response.text()
      const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
      const isJsonResponse = contentType.includes('application/json')

      if ((response.status === 404 || response.status === 405) && !isJsonResponse) {
        lastError = new Error(`Training route unavailable on ${target} (${response.status})`)
        continue
      }

      if (!isJsonResponse) {
        lastError = new Error(`Training API returned non-JSON response (${response.status}) from ${target}.`)
        continue
      }

      let body: T | { error?: string } | null = null

      try {
        body = JSON.parse(raw) as T | { error?: string }
      } catch {
        lastError = new Error(response.ok ? 'Training API returned invalid JSON response.' : `Training API returned non-JSON response (${response.status}).`)
        continue
      }

      if (!response.ok) {
        throw new Error((body as { error?: string }).error ?? 'Training API request failed')
      }

      return body as T
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Training API request failed')
    }
  }

  throw lastError ?? new Error('Training API request failed')
}

export const uploadRetrofitTrainingData = async (payload: {
  image: File
  structureType: string
  province: string
  city: string
  areaSqft: number
  severityScore: number
  affectedAreaPercent: number
  urgencyLevel: 'routine' | 'priority' | 'critical'
  laborDaily: number
  materialIndex: number
  equipmentIndex: number
  logisticsIndex: number
}): Promise<TrainingUploadResponse> => {
  const targets = buildApiTargets('/api/ml/training-data')
  let lastError: Error | null = null

  const formData = new FormData()
  formData.append('image', payload.image)
  formData.append('structureType', payload.structureType)
  formData.append('province', payload.province)
  formData.append('city', payload.city)
  formData.append('areaSqft', String(payload.areaSqft))
  formData.append('severityScore', String(payload.severityScore))
  formData.append('affectedAreaPercent', String(payload.affectedAreaPercent))
  formData.append('urgencyLevel', payload.urgencyLevel)
  formData.append('laborDaily', String(payload.laborDaily))
  formData.append('materialIndex', String(payload.materialIndex))
  formData.append('equipmentIndex', String(payload.equipmentIndex))
  formData.append('logisticsIndex', String(payload.logisticsIndex))

  for (const target of targets) {
    try {
      const response = await fetchApi(target, {
        method: 'POST',
        body: formData,
      })

      const raw = await response.text()
      const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
      const isJsonResponse = contentType.includes('application/json')

      if ((response.status === 404 || response.status === 405) && !isJsonResponse) {
        lastError = new Error(`Training route unavailable on ${target} (${response.status})`)
        continue
      }

      if (!isJsonResponse) {
        lastError = new Error(`Training upload API returned non-JSON response (${response.status}) from ${target}.`)
        continue
      }

      let body: TrainingUploadResponse | { error?: string } | null = null

      try {
        body = JSON.parse(raw) as TrainingUploadResponse | { error?: string }
      } catch {
        lastError = new Error(response.ok ? 'Training upload API returned invalid JSON response.' : `Training upload API returned non-JSON response (${response.status}).`)
        continue
      }

      if (!response.ok) {
        throw new Error((body as { error?: string }).error ?? 'Training upload failed')
      }

      return body as TrainingUploadResponse
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Training upload request failed')
    }
  }

  throw lastError ?? new Error('Training upload request failed')
}

export const retrainRetrofitModel = async (): Promise<TrainingRetrainResponse> =>
  postJsonWithFallback<TrainingRetrainResponse>('/api/ml/retrain', {})
