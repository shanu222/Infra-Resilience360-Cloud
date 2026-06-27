/**
 * Central UI strings for Infra Resilience360 (English + Pakistani Urdu).
 * Canonical strings live in `en.json` / `ur.json`; retrofit portal strings are merged at runtime.
 */
import enJson from './en.json'
import urJson from './ur.json'
import { retrofitPortalByLang } from './retrofitPortalLocale'

export type AppLanguage = 'en' | 'ur'

/** Recursively widens leaf string literals to `string` while preserving nested key structure. */
export type LocaleStringTree<T> = T extends string
  ? string
  : T extends Record<string, unknown>
    ? { [K in keyof T]: LocaleStringTree<T[K]> }
    : T

type EnJson = typeof enJson

export type AppLocaleStrings = LocaleStringTree<EnJson> & {
  retrofitPortal: (typeof retrofitPortalByLang)['en']
}

const en: AppLocaleStrings = {
  ...(enJson as AppLocaleStrings),
  retrofitPortal: retrofitPortalByLang.en,
}

const ur: AppLocaleStrings = {
  ...(urJson as AppLocaleStrings),
  retrofitPortal: retrofitPortalByLang.ur,
}

export const appLocale: Record<AppLanguage, AppLocaleStrings> = {
  en,
  ur,
}
