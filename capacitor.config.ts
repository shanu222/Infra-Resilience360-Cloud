import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.resilience360.app',
  appName: 'Infra Resilience360',
  webDir: 'frontend/dist',
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
    captureInput: true,
  },
}

export default config
