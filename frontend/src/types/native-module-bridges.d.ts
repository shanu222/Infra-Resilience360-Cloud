declare module '*liveEarthquakeMonitor.js' {
  export function initLiveEarthquakeMonitor(root: HTMLElement): () => void
}

declare module '*retrofitPortalApp.js' {
  import type { ComponentType } from 'react'
  const RetrofitCalculatorApp: ComponentType
  export default RetrofitCalculatorApp
}

declare module '*smartConstructionPortalApp.js' {
  import type { ComponentType } from 'react'
  const SmartConstructionApp: ComponentType
  export default SmartConstructionApp
}
