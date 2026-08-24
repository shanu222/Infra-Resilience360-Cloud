const INTRO_WATCHED_KEY = 'r360-app-intro-watched'
const INTRO_SHOW_ON_STARTUP_KEY = 'r360-app-intro-show-on-startup'

function readFlag(key: string, defaultValue: boolean): boolean {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return defaultValue
    if (raw === '1' || raw === 'true') return true
    if (raw === '0' || raw === 'false') return false
    return defaultValue
  } catch {
    return defaultValue
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    /* ignore quota / private mode */
  }
}

/** True after the user finished or skipped the intro at least once. */
export function getAppIntroWatched(): boolean {
  return readFlag(INTRO_WATCHED_KEY, false)
}

export function setAppIntroWatched(watched: boolean): void {
  writeFlag(INTRO_WATCHED_KEY, watched)
}

/**
 * Optional setting: show introduction automatically on startup.
 * Default: enabled (true).
 */
export function getAppIntroShowOnStartup(): boolean {
  return readFlag(INTRO_SHOW_ON_STARTUP_KEY, true)
}

export function setAppIntroShowOnStartup(enabled: boolean): void {
  writeFlag(INTRO_SHOW_ON_STARTUP_KEY, enabled)
}

/** Auto-play on launch when startup is enabled and the user has not completed the intro yet. */
export function shouldAutoShowAppIntro(): boolean {
  return getAppIntroShowOnStartup() && !getAppIntroWatched()
}
