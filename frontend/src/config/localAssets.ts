/**
 * Bundled application shell assets (logos, icons, backgrounds).
 * Module media is served from Cloudflare R2 content keys; GIS stays under /data/gis/.
 */
import ndmaLogoUrl from '../assets/logos/ndma-logo.png'

/** Bundled shell background video (shipped inside APK; no R2 fetch). */
export const BUNDLED_BACKGROUND_VIDEO_URL = '/assets/backgrounds/background-video.mp4'

export const LOCAL_NDMA_LOGO_URL = ndmaLogoUrl
export const LOCAL_APP_LOGO_URL = '/assets/branding/app-logo.png'
/** @deprecated Use BUNDLED_BACKGROUND_VIDEO_URL for shell background playback. */
export const LOCAL_BACKGROUND_VIDEO_URL = BUNDLED_BACKGROUND_VIDEO_URL

export const LOCAL_APP_LOGO_CANDIDATES = [LOCAL_APP_LOGO_URL] as const

/** GIS datasets served from Express /data/gis/ */
export const GIS_PAKISTAN_ADM1_URL = '/data/gis/pakistan-adm1.geojson'
export const GIS_PAKISTAN_ADM2_URL = '/data/gis/pakistan-adm2.geojson'
