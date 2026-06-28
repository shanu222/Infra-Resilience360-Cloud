/**
 * Bundled application shell assets (logos, icons, backgrounds).
 * Module media is served from Cloudflare R2 content keys; GIS stays under /data/gis/.
 */
import ndmaLogoUrl from '../assets/logos/ndma-logo.png'
import { localContentUrl } from './localContent'

export const LOCAL_NDMA_LOGO_URL = ndmaLogoUrl
export const LOCAL_APP_LOGO_URL = '/assets/branding/app-logo.png'
export const LOCAL_BACKGROUND_VIDEO_URL = localContentUrl('home', 'videos', 'home.mp4')

export const LOCAL_APP_LOGO_CANDIDATES = [LOCAL_APP_LOGO_URL] as const

/** GIS datasets served from Express /data/gis/ */
export const GIS_PAKISTAN_ADM1_URL = '/data/gis/pakistan-adm1.geojson'
export const GIS_PAKISTAN_ADM2_URL = '/data/gis/pakistan-adm2.geojson'
