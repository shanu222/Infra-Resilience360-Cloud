import { localContentUrl } from './localContent'

/**
 * Application introduction / demo video on Cloudflare R2.
 * Object key: content/DEMO APPLICATION VIDEO/INFRA RESILIENCE360 EXPLANATION VDIEO.mp4
 * (Filename spelling matches the uploaded R2 object.)
 */
export const APP_INTRO_VIDEO_FOLDER = 'DEMO APPLICATION VIDEO'
export const APP_INTRO_VIDEO_FILE = 'INFRA RESILIENCE360 EXPLANATION VDIEO.mp4'

/** Stream URL via existing R2 media base (`…/content/…`). */
export const APP_INTRO_VIDEO_URL = localContentUrl(APP_INTRO_VIDEO_FOLDER, APP_INTRO_VIDEO_FILE)

/** Auto-skip when the stream cannot start (ms). */
export const APP_INTRO_LOAD_TIMEOUT_MS = 10_000

/** Fade-out duration before revealing Home (ms). */
export const APP_INTRO_FADE_MS = 700
