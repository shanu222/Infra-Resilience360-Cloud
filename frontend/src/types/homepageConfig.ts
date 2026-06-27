import type { CmsMediaLibraryItem } from './cmsMedia'
import type { BilingualOrString } from '../utils/bilingualText'

/** Where homepage-config background media applies: home grid only, or every app section. */
export type HomepageBackgroundScope = 'home' | 'global'

/** Optional footer copy per language (Mongo); empty ? i18n locale strings. */
export type HomepageFooterLocaleBlock = {
  taglineBefore?: string
  taglineStrong?: string
  taglineAfter?: string
  versionLine?: string
}

export type HomepageFooterConfig = {
  en?: HomepageFooterLocaleBlock
  ur?: HomepageFooterLocaleBlock
}

/**
 * Homepage grid tile — persisted in MongoDB `homepage_config.cards` (single source of truth
 * when CMS is enabled). `backgroundImage` / `icon` may reference S3 URLs registered in
 * `cms_media_library` for section `homepage`; the admin homepage editor uploads to S3 and
 * stores the resolved URL here. Use `transparency` (0–1) with hex `color` for glass panels.
 */
export type HomepageConfigCard = {
  id: string
  title: BilingualOrString
  /** Card background color (hex/CSS); mirrors CMS “background color”. */
  color: string
  icon: string
  route: string
  /** Per-card subtitle; empty uses i18n `homeCards[route].subtitle`. */
  subtitle: BilingualOrString
  /** Optional title + subtitle color. */
  textColor: string
  /** Optional full-bleed card background image URL. */
  backgroundImage: string
  /** 0–1; applied when `color` is a solid hex. */
  transparency: number
  /** Visual scale in the home grid. */
  size: 'small' | 'medium' | 'large'
  /** Custom corner radius in px (omit for default). */
  borderRadius?: number
  /** When false, drop default card shadow. */
  shadow: boolean
  /** Optional font family for card title/subtitle. */
  fontFamily?: string
  /** Optional CSS font-size for card title. */
  fontSize?: string
  /** Optional CSS font-weight for card title. */
  fontWeight?: string
  /** Optional text alignment for card title/subtitle. */
  textAlign?: 'left' | 'center' | 'right'
  /** Optional line-height for card text. */
  lineHeight?: string
  /** Optional letter-spacing for card title. */
  letterSpacing?: string
  /** Optional CSS padding for card container. */
  padding?: string
  /** Optional CSS margin for card container. */
  margin?: string
  /** Optional CSS width for card container. */
  width?: string
  /** Optional CSS height for card container. */
  height?: string
  /** Optional CSS border shorthand for card container. */
  border?: string
  /** Optional gradient/background overlay CSS. */
  backgroundGradient?: string
  enabled: boolean
}

export type HomepageConfigPayload = {
  type: string
  backgroundImage: string
  backgroundVideo: string
  isVideoEnabled: boolean
  /** Hero shell from Mongo (`cms_media_library`); direct HTTPS URLs (not `/static/media/local/`). */
  backgroundMedia?: { video: string | null; image: string | null }
  /** When `global`, homepage background image/video applies on all sections (unless overridden per page). */
  backgroundScope: HomepageBackgroundScope
  colors: { primary: string; secondary: string; text: string }
  /** Raw CMS fields (may be empty to mean “use i18n” for title/subtitle). */
  text: { title: BilingualOrString; subtitle: BilingualOrString }
  /** Resolved hero strings (snapshot fallback when `text` is empty). */
  hero: { title: BilingualOrString; subtitle: BilingualOrString }
  /** Optional footer lines; use `en` / `ur` blocks; empty fields fall back to locale files. */
  footer: HomepageFooterConfig
  cards: HomepageConfigCard[]
  updatedAt: string
  staticSnapshot?: { heroTitle: string; heroSubtitle: string }
  /** S3 assets registered for section `homepage` (Mongo media library). */
  mediaLibrary?: CmsMediaLibraryItem[]
}


