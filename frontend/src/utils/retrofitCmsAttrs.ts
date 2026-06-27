import type { CSSProperties } from 'react'
import type { RetrofitCmsPageRecord } from '../types/retrofitCms'

type ElementStyle = {
  backgroundColor?: string
  color?: string
  transparency?: number
  size?: 'sm' | 'md' | 'lg'
}

function readStyle(raw: unknown): ElementStyle {
  if (!raw || typeof raw !== 'object') return {}
  const o = raw as Record<string, unknown>
  const size = o.size
  return {
    backgroundColor: typeof o.backgroundColor === 'string' ? o.backgroundColor : undefined,
    color: typeof o.color === 'string' ? o.color : undefined,
    transparency: typeof o.transparency === 'number' ? o.transparency : undefined,
    size: size === 'sm' || size === 'md' || size === 'lg' ? size : undefined,
  }
}

/**
 * Applies optional per-page element styles from CMS `pages`.
 * When `includeEditMarkers` is true (admin visual editor), adds data attributes for click-to-edit.
 */
export function retrofitCmsAttrs(
  pageId: string,
  key: string,
  pages: RetrofitCmsPageRecord[] | undefined,
  includeEditMarkers: boolean,
): Record<string, unknown> & { style?: CSSProperties } {
  const page = pages?.find((p) => p.pageId === pageId)
  const st = readStyle(page?.styles?.[key])
  const style: CSSProperties = {}
  if (st.backgroundColor) style.backgroundColor = st.backgroundColor
  if (st.color) style.color = st.color
  if (typeof st.transparency === 'number') {
    style.opacity = Math.max(0, Math.min(1, st.transparency))
  }
  if (st.size === 'sm') style.fontSize = '0.92rem'
  if (st.size === 'md') style.fontSize = '1rem'
  if (st.size === 'lg') style.fontSize = '1.12rem'

  const img = page?.content?.images?.[key]
  if (img && String(img).trim()) {
    style.backgroundImage = `url("${String(img)}")`
    style.backgroundSize = 'cover'
    style.backgroundPosition = 'center'
  }

  const out: Record<string, unknown> & { style?: CSSProperties } = {}
  if (Object.keys(style).length > 0) out.style = style
  if (includeEditMarkers) {
    out['data-r360-cms-key'] = key
    out['data-r360-cms-page'] = pageId
  }
  return out
}
