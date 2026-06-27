export const buildDisasterDashboardPortalCandidates = (): string[] => {
  const basePath = import.meta.env.BASE_URL
  const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`

  return [`${normalizedBasePath}disaster-dashboard/index.html`]
}

export const openInSystemBrowser = async (url: string): Promise<boolean> => {
  const popup = window.open(url, '_blank', 'noopener,noreferrer')
  return Boolean(popup)
}
