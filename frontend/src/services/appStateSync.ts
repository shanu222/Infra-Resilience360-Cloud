export type SharedAppState = {
  emergencyKitChecks: Record<string, boolean>
  updatedAt?: string
}
const SHARED_STATE_KEY = 'r360-shared-app-state'

const sanitizeEmergencyKitChecks = (value: unknown): Record<string, boolean> => {
  if (!value || typeof value !== 'object') return {}

  const normalized: Record<string, boolean> = {}
  for (const [key, rawFlag] of Object.entries(value as Record<string, unknown>)) {
    const cleanKey = String(key ?? '').trim()
    if (!cleanKey) continue
    normalized[cleanKey] = Boolean(rawFlag)
  }

  return normalized
}

const sanitizeSharedAppState = (value: unknown): SharedAppState => {
  const source = (value && typeof value === 'object' ? value : {}) as Partial<SharedAppState>
  return {
    emergencyKitChecks: sanitizeEmergencyKitChecks(source.emergencyKitChecks),
    updatedAt: source.updatedAt,
  }
}

export const loadSharedAppState = async (): Promise<SharedAppState | null> => {
  try {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(SHARED_STATE_KEY)
    if (!raw) return null
    return sanitizeSharedAppState(JSON.parse(raw))
  } catch {
    return null
  }
}

export const saveSharedAppState = async (state: SharedAppState): Promise<SharedAppState | null> => {
  try {
    if (typeof window === 'undefined') return null
    const normalized = sanitizeSharedAppState(state)
    window.localStorage.setItem(SHARED_STATE_KEY, JSON.stringify(normalized))
    return normalized
  } catch {
    return null
  }
}
