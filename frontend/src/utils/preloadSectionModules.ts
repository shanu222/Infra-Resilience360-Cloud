/** Preload lazy JS bundles during idle time so first navigation feels instant. */
export function preloadSectionModules(): void {
  const loaders = [
    () => import('../pages/EmbeddedEarthquakePage'),
    () => import('../components/RiskMap'),
    () => import('../pages/portals/BuildingCodesPage'),
    () => import('../pages/portals/CostEstimatorPage'),
    () => import('../pages/portals/SmartConstructionPage'),
    () => import('../pages/portals/DisasterDashboardPage'),
    () => import('../pages/portals/MaterialHubsPage'),
    () => import('../components/fire-safety/FireSafetyCalculator'),
    () => import('../components/UserLocationMiniMap'),
  ]

  const run = () => {
    for (const load of loaders) {
      void load().catch(() => {
        /* ignore preload failures */
      })
    }
  }

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => run(), { timeout: 4000 })
  } else {
    window.setTimeout(run, 1200)
  }
}
