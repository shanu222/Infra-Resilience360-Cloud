import type { UniversalElementPayload } from '../../types/universalElement'
import { getCmsElement } from '../../utils/getCmsElement'
import { migrateToBilingual, resolveCmsTextWithStaticFallback } from '../../utils/bilingualText'
import { mergeCms } from '../../utils/mergeCms'
import { usePageConfigElementsContext } from '../../context/PageConfigElementsContext'

const emptyPayload: UniversalElementPayload = {
  text: migrateToBilingual(''),
}

/**
 * Section title from Mongo `page_config.elements[id].text` with static `fallback` when CMS is empty or unavailable.
 */
export function CmsSectionHeading({
  as: Comp = 'h2',
  id = 'mainTitle',
  fallback = '',
  className,
}: {
  as?: 'h2' | 'div' | 'span'
  id?: string
  /** Bundled default when Mongo has no value (or fetch is loading / failed). */
  fallback?: string
  className?: string
}) {
  const ctx = usePageConfigElementsContext()
  if (!ctx) return null
  const fb = String(fallback ?? '').trim()
  if (ctx.loadStatus === 'loading') {
    return (
      <Comp className={className} aria-busy="true" data-cms-id={id} data-cms-loading={fb ? '1' : undefined}>
        {fb || '…'}
      </Comp>
    )
  }
  if (ctx.loadStatus === 'error') {
    return (
      <Comp className={className} data-cms-error="1" data-cms-id={id}>
        {fb || '—'}
      </Comp>
    )
  }
  const el = getCmsElement(ctx.elements, id)
  const lang = ctx.language
  const merged = mergeCms(emptyPayload, el)
  const text = resolveCmsTextWithStaticFallback(merged.text, lang, fallback ?? '')
  return (
    <Comp
      className={className}
      dir={lang === 'ur' ? 'rtl' : 'ltr'}
      style={lang === 'ur' ? { direction: 'rtl', textAlign: 'right' } : undefined}
      data-cms-id={id}
    >
      {text}
    </Comp>
  )
}
