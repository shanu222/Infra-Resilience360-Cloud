interface ImportMetaEnv {
  readonly BASE_URL: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_MEDIA_BASE_URL?: string
  readonly [key: string]: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  glob: (
    pattern: string | readonly string[],
    options?: {
      as?: string
      eager?: boolean
      import?: string
      query?: Record<string, string | number | boolean> | string
    }
  ) => Record<string, unknown>
}

declare module '*.css'

declare module '*.geojson?url' {
  const src: string
  export default src
}

declare module '*.mp4' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module 'virtual:pwa-register' {
  export function registerSW(options?: {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
  }): (reloadPage?: boolean) => Promise<void>
}
