/**
 * UI-only universal CMS: auto-detect safe presentation nodes.
 * No app logic, API-driven values, forms, maps, or dynamic markers.
 */

export const EDITABLE_TYPES = [
  'text-static',
  'background',
  'image',
  'video',
  'audio',
  'pdf',
  'card',
  'container',
  'section',
] as const

export type CmsEditableType = (typeof EDITABLE_TYPES)[number]

/** Tags eligible for auto-detection (presentation). */
export const ALLOWED_UI_TAGS = [
  'div',
  'section',
  'span',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'button',
  'a',
  'img',
  'video',
  'audio',
  'embed',
  'header',
  'footer',
  'main',
  'nav',
  'article',
  'aside',
  'li',
] as const

/** Extra tags allowed only inside same-origin embedded portal iframes (SPAs, tables, typography). */
const PORTAL_EXTRA_UI_TAGS = new Set([
  'td',
  'th',
  'table',
  'tbody',
  'thead',
  'tfoot',
  'tr',
  'caption',
  'strong',
  'b',
  'em',
  'i',
  'small',
  'sub',
  'sup',
  'mark',
  'blockquote',
  'pre',
  'code',
  'figure',
  'figcaption',
  'dt',
  'dd',
  'dl',
])

/** Safe inline style keys only (presentation). */
export const ALLOWED_STYLE_KEYS = [
  'backgroundColor',
  'color',
  'opacity',
  'borderRadius',
  'padding',
  'margin',
  'backgroundImage',
  'background',
  'fontSize',
  'fontWeight',
  'fontFamily',
  'fontStyle',
  'textDecoration',
  'textAlign',
  'lineHeight',
  'letterSpacing',
  'textShadow',
  'backdropFilter',
  'border',
  'width',
  'height',
  'boxShadow',
  'objectFit',
] as const

/** Comma selector for collectSafeEditableElements */
export const ALLOWED_UI_SELECTOR: string = [...ALLOWED_UI_TAGS].join(',')

/**
 * True if changing innerText will not remove nested element structure.
 * Required for safe text edits (no add/remove of nodes).
 */
export function canEditElementText(el: HTMLElement): boolean {
  return el.children.length === 0
}

export function inferCmsType(el: HTMLElement): CmsEditableType {
  const tag = el.tagName.toLowerCase()
  if (tag === 'img') return 'image'
  if (tag === 'video') return 'video'
  if (tag === 'audio') return 'audio'
  if (tag === 'embed') return 'pdf'
  if (tag === 'section') return 'section'
  if (['header', 'footer', 'main', 'nav', 'article', 'aside'].includes(tag)) return 'section'
  if (tag === 'li') {
    return canEditElementText(el) ? 'text-static' : 'container'
  }
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(tag)) {
    return canEditElementText(el) ? 'text-static' : 'container'
  }
  if (tag === 'button' || tag === 'a') {
    return canEditElementText(el) ? 'text-static' : 'container'
  }
  if (tag === 'span') {
    return canEditElementText(el) ? 'text-static' : 'container'
  }
  if (tag === 'td' || tag === 'th') {
    return canEditElementText(el) ? 'text-static' : 'container'
  }
  if (['strong', 'b', 'em', 'i', 'small', 'sub', 'sup', 'mark'].includes(tag)) {
    return canEditElementText(el) ? 'text-static' : 'container'
  }
  if (tag === 'code' || tag === 'pre' || tag === 'blockquote') {
    return canEditElementText(el) ? 'text-static' : 'container'
  }
  if (tag === 'caption' || tag === 'figcaption') {
    return canEditElementText(el) ? 'text-static' : 'container'
  }
  if (['dt', 'dd'].includes(tag)) {
    return canEditElementText(el) ? 'text-static' : 'container'
  }
  if (['table', 'tbody', 'thead', 'tfoot', 'tr', 'dl', 'figure'].includes(tag)) {
    return 'container'
  }
  return 'container'
}

/** True when `el` lives in a static portal document embedded via `EmbeddedPortalFrame` (same-origin iframe). */
export function isInsideEmbeddedPortalIframe(el: Element | null): boolean {
  if (!el) return false
  try {
    const win = el.ownerDocument?.defaultView
    const fr = win?.frameElement
    return fr instanceof HTMLIFrameElement && fr.getAttribute('data-r360-cms-portal') === 'true'
  } catch {
    return false
  }
}

/** Text-like controls inside embedded portal documents (same-origin iframe) that we allow in universal CMS. */
export function isPortalCmsInput(el: HTMLElement): boolean {
  if (!isInsideEmbeddedPortalIframe(el)) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'textarea') return true
  if (tag !== 'input' || !(el instanceof HTMLInputElement)) return false
  const t = (el.type || 'text').toLowerCase()
  return t === 'text' || t === 'search' || t === 'email' || t === 'url' || t === 'tel' || t === 'number'
}

export function getCmsType(el: Element): string {
  const attr = (el.getAttribute('data-cms-type') || '').trim().toLowerCase()
  if (attr && (EDITABLE_TYPES as readonly string[]).includes(attr)) return attr
  if (el instanceof HTMLElement && isPortalCmsInput(el)) return 'text-static'
  if (el instanceof HTMLElement) return inferCmsType(el)
  return 'container'
}

export function isBlockedFunctionalSurface(el: Element): boolean {
  try {
    if (el instanceof HTMLElement && isPortalCmsInput(el)) return false
    if (el.closest('.leaflet-container, .leaflet, .map')) return true
    if (el.matches('canvas') || el.closest('canvas')) return true
    if (el.matches('input, textarea, select, option')) return true
    if (el.closest('form')) {
      // Embedded static portals may wrap UI in <form>; still allow editing text/headings inside.
      if (isInsideEmbeddedPortalIframe(el)) {
        return false
      }
      return true
    }
    if (el.hasAttribute('data-api') || el.hasAttribute('data-dynamic') || el.hasAttribute('data-cms-dynamic')) {
      return true
    }
  } catch {
    /* ignore */
  }
  return false
}

/** Auto-detected safe UI node: allowed tag, not blocked, not dynamic. */
export function isEditableUiElement(el: Element | null): el is HTMLElement {
  if (!el || !(el instanceof HTMLElement)) return false
  if (el.classList.contains('portal-page-root')) return false
  const tag = el.tagName.toLowerCase()
  if ((tag === 'input' || tag === 'textarea') && isPortalCmsInput(el)) {
    if (isBlockedFunctionalSurface(el)) return false
    return true
  }
  const tagAllowed =
    (ALLOWED_UI_TAGS as readonly string[]).includes(tag) ||
    (isInsideEmbeddedPortalIframe(el) && PORTAL_EXTRA_UI_TAGS.has(tag))
  if (!tagAllowed) return false
  if (isBlockedFunctionalSurface(el)) return false
  return true
}
