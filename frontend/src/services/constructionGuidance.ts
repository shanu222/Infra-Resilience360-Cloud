import { buildApiTargets, fetchApi } from './apiBase'

const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit, timeoutMs = 60000): Promise<Response> => {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetchApi(input, { ...init, signal: controller.signal })
  } finally {
    window.clearTimeout(timer)
  }
}

export type GuidanceStep = {
  title: string
  description: string
  keyChecks: string[]
}

export type ConstructionGuidanceResult = {
  summary: string
  summaryUrdu: string
  materials: string[]
  materialsUrdu: string[]
  safety: string[]
  safetyUrdu: string[]
  steps: GuidanceStep[]
  stepsUrdu: GuidanceStep[]
}

export type GuidanceStepImage = {
  stepTitle: string
  prompt: string
  imageDataUrl: string
}

const defaultKeyChecks = (): string[] => [
  'Drawings and specifications reviewed',
  'Materials certificates verified',
  'Critical stage inspections recorded',
]

const buildFallbackSteps = (ctx: {
  province: string
  city: string
  hazard: string
  structureType: string
  bestPracticeName: string
}): GuidanceStep[] => {
  const { province, city, hazard, structureType, bestPracticeName } = ctx
  const k = defaultKeyChecks()
  return [
    {
      title: 'Site characterization and hazard alignment',
      description: `Map ${hazard} exposure for ${city}, ${province}; align temporary works, access, and drainage with ${bestPracticeName} before mobilizing for ${structureType}.`,
      keyChecks: k,
    },
    {
      title: 'Foundations and substructure',
      description: `Execute foundations and moisture protection suited to local soil and flood/ seismic context; verify reinforcement and embedments before pours.`,
      keyChecks: k,
    },
    {
      title: 'Primary structure and lateral system',
      description: `Build the structural system with correct materials, spacing, and connections; hold QA/QC at joints and load path continuity elements.`,
      keyChecks: k,
    },
    {
      title: 'Envelope and services rough-in',
      description: `Close the envelope against driving rain and heat; coordinate penetrations so structural performance and weather resistance are preserved.`,
      keyChecks: k,
    },
    {
      title: 'Finishes, commissioning, and handover',
      description: `Complete finishes without damaging structure; document tests, as-builts, and maintenance guidance for the owner.`,
      keyChecks: k,
    },
  ]
}

/** Deterministic bilingual payload when the API is down or returns non-JSON. */
export function getFallbackConstructionGuidanceResult(payload: {
  province: string
  city: string
  hazard: 'flood' | 'earthquake' | string
  structureType: string
  bestPracticeName?: string
}): ConstructionGuidanceResult {
  const bestPracticeName = payload.bestPracticeName ?? 'General Resilient Construction Practice'
  const summary = `Default regional guidance for ${payload.structureType} in ${payload.city}, ${payload.province}, Pakistan (${payload.hazard}). Apply ${bestPracticeName} with qualified supervision and local building control.`
  const materials = [
    'Cement, aggregates, and water to approved mix designs; independent cube/slump checks where specified.',
    'Reinforcement and structural steel with traceable mill certificates.',
    'Masonry or precast units meeting dimensional tolerances and local standards.',
  ]
  const safety = [
    'Confirm geotechnical and floodplain constraints before foundations.',
    'Maintain edge protection, secure access, and clear site drainage during construction.',
    'Inspect reinforcement, connections, and penetrations before covering works.',
  ]
  const steps = buildFallbackSteps({
    province: payload.province,
    city: payload.city,
    hazard: String(payload.hazard),
    structureType: payload.structureType,
    bestPracticeName,
  })
  return {
    summary,
    summaryUrdu: summary,
    materials,
    materialsUrdu: materials,
    safety,
    safetyUrdu: safety,
    steps,
    stepsUrdu: steps,
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
        lastError = new Error(`Guidance route unavailable on ${target} (${response.status})`)
        continue
      }

      if (!isJsonResponse) {
        lastError = new Error(`Guidance API returned non-JSON response (${response.status}) from ${target}`)
        continue
      }

      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Network request failed')
    }
  }

  throw lastError ?? new Error('Guidance API request failed')
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

const normalizeGuidanceStep = (v: unknown): GuidanceStep | null => {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if (typeof o.title !== 'string' || typeof o.description !== 'string') return null
  const keyChecks = Array.isArray(o.keyChecks) ? o.keyChecks.map((x) => String(x)) : []
  return { title: o.title, description: o.description, keyChecks }
}

const coerceConstructionGuidanceResult = (body: unknown): ConstructionGuidanceResult | null => {
  if (!body || typeof body !== 'object') return null
  const o = body as Record<string, unknown>
  if (typeof o.summary !== 'string' || !Array.isArray(o.steps)) return null
  const steps = o.steps.map(normalizeGuidanceStep).filter((s): s is GuidanceStep => s != null)
  if (steps.length === 0) return null
  const materials = Array.isArray(o.materials) ? o.materials.map((x) => String(x)) : []
  const safety = Array.isArray(o.safety) ? o.safety.map((x) => String(x)) : []
  const materialsUrdu = Array.isArray(o.materialsUrdu) ? o.materialsUrdu.map((x) => String(x)) : []
  const safetyUrdu = Array.isArray(o.safetyUrdu) ? o.safetyUrdu.map((x) => String(x)) : []
  const stepsUrduRaw = Array.isArray(o.stepsUrdu) ? o.stepsUrdu : []
  const stepsUrduParsed = stepsUrduRaw.map(normalizeGuidanceStep).filter((s): s is GuidanceStep => s != null)
  const stepsUrdu = stepsUrduParsed.length > 0 ? stepsUrduParsed : steps

  return {
    summary: o.summary,
    summaryUrdu: typeof o.summaryUrdu === 'string' ? o.summaryUrdu : o.summary,
    materials: materials.length > 0 ? materials : materialsUrdu,
    materialsUrdu: materialsUrdu.length > 0 ? materialsUrdu : materials,
    safety: safety.length > 0 ? safety : safetyUrdu,
    safetyUrdu: safetyUrdu.length > 0 ? safetyUrdu : safety,
    steps,
    stepsUrdu,
  }
}

export const generateConstructionGuidance = async (payload: {
  province: string
  city: string
  hazard: 'flood' | 'earthquake'
  structureType: string
  bestPracticeName?: string
}): Promise<ConstructionGuidanceResult> => {
  const fallback = () => getFallbackConstructionGuidanceResult(payload)
  try {
    const response = await postJsonWithFallback('/api/guidance/construction', payload)
    const raw = await response.text()
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return fallback()
    }
    if (!response.ok) {
      return fallback()
    }
    const coerced = coerceConstructionGuidanceResult(parsed)
    if (!coerced) {
      return fallback()
    }
    return coerced
  } catch {
    return fallback()
  }
}

export const generateGuidanceStepImages = async (payload: {
  province: string
  city: string
  hazard: 'flood' | 'earthquake'
  structureType: string
  bestPracticeName?: string
  steps: GuidanceStep[]
}): Promise<{ images: GuidanceStepImage[] }> => {
  const response = await postJsonWithFallback('/api/guidance/step-images', payload)
  return parseJsonResponse<{ images: GuidanceStepImage[] }>(response, 'Construction image generation failed')
}
