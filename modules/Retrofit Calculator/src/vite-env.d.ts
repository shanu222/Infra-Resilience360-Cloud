interface ImportMetaEnv {
  readonly BASE_URL: string
  readonly VITE_SITE_URL?: string
  readonly [key: string]: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
