/** Shared EN/UR CMS shape (Mongo + inline editor). Legacy plain strings migrate to `{ en, ur }`. */
export type BilingualText = { en: string; ur: string }

export type BilingualOrString = string | BilingualText

export function migrateToBilingual(raw: unknown): BilingualText {
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'en' in raw && 'ur' in raw) {
    const o = raw as BilingualText
    return { en: String(o.en ?? ''), ur: String(o.ur ?? '') }
  }
  if (typeof raw === 'string') return { en: raw, ur: '' }
  return { en: '', ur: '' }
}

/** Merge patch over base (undefined in patch keeps base). */
export function mergeBilingual(patch: unknown, base: unknown): BilingualText {
  const B = migrateToBilingual(base)
  if (patch === undefined || patch === null) return B
  if (typeof patch === 'string') return { en: patch, ur: B.ur }
  const p = patch as Partial<BilingualText>
  return {
    en: p.en !== undefined ? String(p.en) : B.en,
    ur: p.ur !== undefined ? String(p.ur) : B.ur,
  }
}

export function resolveBilingual(raw: BilingualOrString | undefined, lang: 'en' | 'ur', fallback = ''): string {
  const m = migrateToBilingual(raw)
  const primary = lang === 'ur' ? m.ur : m.en
  const alt = lang === 'ur' ? m.en : m.ur
  const s = primary.trim() ? primary : alt.trim() ? alt : ''
  return s || fallback
}

/**
 * Like {@link resolveBilingual}, but when the active language field is empty, prefers the
 * **static bundle string** (`staticFallback`, already in the correct locale) before using the
 * other language from CMS. Use for home tiles so Urdu mode shows `t.homeCards` Urdu instead of
 * English-only Mongo copy.
 */
export function resolveBilingualPreferStaticForActiveLang(
  raw: BilingualOrString | undefined,
  lang: 'en' | 'ur',
  staticFallback: string,
): string {
  const m = migrateToBilingual(raw)
  const fb = String(staticFallback ?? '').trim()
  if (lang === 'ur') {
    const ur = m.ur.trim()
    if (ur) return ur
    if (fb) return fb
    return m.en.trim()
  }
  const en = m.en.trim()
  if (en) return en
  if (fb) return fb
  return m.ur.trim()
}

/**
 * Mongo CMS text with safe static defaults: any blank CMS field falls back to bundled copy
 * so the UI never renders empty when a `fallback` string is provided at the call site.
 */
export function resolveCmsTextWithStaticFallback(
  cmsRaw: BilingualOrString | undefined,
  lang: 'en' | 'ur',
  staticFallback: string,
): string {
  const cms = migrateToBilingual(cmsRaw)
  const fb = migrateToBilingual(staticFallback)
  const en = cms.en.trim() || fb.en
  const ur = cms.ur.trim() || fb.ur || fb.en
  return resolveBilingual({ en, ur }, lang, '')
}
