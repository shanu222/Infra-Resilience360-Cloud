import { GlobalBackgroundVideo } from './GlobalBackgroundVideo'

export type HomepageBackgroundSeed = { video: string; poster: string }

export type BackgroundMediaProps = {
  pageSlug: string
  disabled?: boolean
  homepageSeed?: HomepageBackgroundSeed | null
}

export function BackgroundMedia({ disabled }: BackgroundMediaProps) {
  if (disabled) return null
  return <GlobalBackgroundVideo />
}
