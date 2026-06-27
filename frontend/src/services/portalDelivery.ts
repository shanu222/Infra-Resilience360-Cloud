export function normalizeBaseUrl(raw: string): string {
  return String(raw || '').trim().replace(/\/+$/, '')
}

export function toPortalBaseWithSlash(raw: string): string {
  const base = normalizeBaseUrl(raw)
  return base ? `${base}/` : '/'
}

export function resolvePortalSourceRuntime({
  cmsSource,
  localPath,
  isCapacitorBuild,
  normalizedAppBase,
  mobilePortalBaseUrl,
  normalizePortalIframeSrc,
}: {
  cmsSource: string | undefined
  localPath: string
  isCapacitorBuild: boolean
  normalizedAppBase: string
  mobilePortalBaseUrl: string
  normalizePortalIframeSrc: (raw: string, normalizedAppBase: string) => string
}): string {
  const source = String(cmsSource ?? '').trim()
  if (source && /^https?:\/\//i.test(source)) return source
  if (source) return normalizePortalIframeSrc(source, normalizedAppBase)
  if (isCapacitorBuild && localPath.replace(/^\//, '') === 'pgbc/index.html') {
    return `${toPortalBaseWithSlash(mobilePortalBaseUrl)}pgbc/index.html`
  }
  const rel = localPath.replace(/^\//, '')
  return `${normalizedAppBase}${rel}`
}

export function buildDisasterDashboardCandidatesRuntime({
  fromCms,
  isCapacitorBuild,
  mobilePortalBaseUrl,
  buildPackagedCandidates,
}: {
  fromCms: string[]
  isCapacitorBuild: boolean
  mobilePortalBaseUrl: string
  buildPackagedCandidates: () => string[]
}): string[] {
  void mobilePortalBaseUrl
  const packaged = buildPackagedCandidates()
  if (isCapacitorBuild) {
    const remoteCms = fromCms.filter((src) => /^https?:\/\//i.test(src))
    return [...new Set([...packaged, ...remoteCms])]
  }

  const merged = [...new Set([...packaged, ...fromCms])]
  return merged.length > 0 ? merged : packaged
}

