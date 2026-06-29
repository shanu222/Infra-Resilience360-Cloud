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
  plugins: {
    // Native HTTP bypasses WebView CORS — required for Railway API from Capacitor (https://localhost origin).
    CapacitorHttp: {
      enabled: true,
    },
  },
}

export default config
