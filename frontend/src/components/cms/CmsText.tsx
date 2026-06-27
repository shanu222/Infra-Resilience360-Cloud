import type { CSSProperties } from 'react'
import type { UniversalElementPayload } from '../../types/universalElement'
import { getCmsElement } from '../../utils/getCmsElement'
import { migrateToBilingual, resolveCmsTextWithStaticFallback } from '../../utils/bilingualText'
import { mergeCms } from '../../utils/mergeCms'
import { usePageConfigElementsContext } from '../../context/PageConfigElementsContext'

const warnedMissingCmsTranslation = new Set<string>()

const emptyPayload: UniversalElementPayload = {
  text: migrateToBilingual(''),
  placeholder: migrateToBilingual(''),
}

/**
 * Binds Mongo `page_config.elements[id].text` for the active section (`PageConfigElementsProvider`).
 * When CMS is empty, loading, or errored, uses `fallback` so labels and copy never disappear.
 */
export function CmsText({
  id,
  fallback = '',
  as: Comp = 'p',
  className,
  style,
  hideIfEmpty,
}: {
  id: string
  /** Bundled default when Mongo has no value (or fetch is loading / failed). */
  fallback?: string
  as?:
    | 'p'
    | 'span'
    | 'div'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'small'
    | 'strong'
    | 'label'
    | 'button'
  className?: string
  style?: CSSProperties
  hideIfEmpty?: boolean
}) {
  const ctx = usePageConfigElementsContext()
  if (!ctx) return null
  const fb = String(fallback ?? '').trim()
  if (ctx.loadStatus === 'loading') {
    return (
      <Comp
        className={className}
        style={style}
        aria-busy="true"
        data-cms-id={id}
        data-cms-loading={fb ? '1' : undefined}
      >
        {fb || '…'}
      </Comp>
    )
  }
  if (ctx.loadStatus === 'error') {
    return (
      <Comp className={className} style={style} data-cms-error="1" data-cms-id={id}>
        {fb || '—'}
      </Comp>
    )
  }
  const el = getCmsElement(ctx.elements, id)
  const lang = ctx.language
  const merged = mergeCms(emptyPayload, el)
  const text = resolveCmsTextWithStaticFallback(merged.text, lang, fallback ?? '')
  const rtlStyle = lang === 'ur' ? ({ direction: 'rtl', textAlign: 'right' as const } satisfies CSSProperties) : undefined
  if (lang === 'ur') {
    const raw = migrateToBilingual(merged.text)
    if (!String(raw.ur || '').trim()) {
      const warningKey = `${id}:ur`
      if (!warnedMissingCmsTranslation.has(warningKey)) {
        warnedMissingCmsTranslation.add(warningKey)
        void warningKey
      }
    }
  }
  if (hideIfEmpty && !String(text).trim()) return null
  return (
    <Comp
      className={className}
      style={{ ...(style ?? {}), ...(rtlStyle ?? {}) }}
      dir={lang === 'ur' ? 'rtl' : 'ltr'}
      data-cms-id={id}
    >
      {text}
    </Comp>
  )
}
