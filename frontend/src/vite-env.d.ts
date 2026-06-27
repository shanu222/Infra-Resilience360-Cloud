interface ImportMetaEnv {
  readonly BASE_URL: string
  /** When "true", client treats builds as admin service (with /admin.html route). */
  readonly VITE_ADMIN_SERVICE_MODE?: string
  /** Static site URL for canonical/runtime metadata. */
  readonly VITE_SITE_URL?: string
  readonly VITE_ADMIN_API_KEY?: string
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
