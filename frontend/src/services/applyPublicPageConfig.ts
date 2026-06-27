import { isEditableUiElement } from '../cms/cmsUiPolicy'
import {
  applyPayloadToElement,
  collectSafeEditableElements,
  computeStableCmsId,
  computeStableCmsIdForIframe,
} from '../cms/universalDom'
import type { UniversalElementPayload } from '../types/universalElement'

function cssEscapeSelector(id: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(id)
  }
  return id.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function collectSameOriginIframes(): HTMLIFrameElement[] {
  const out: HTMLIFrameElement[] = []
  try {
    document.querySelectorAll('iframe').forEach((n) => {
      if (!(n instanceof HTMLIFrameElement)) return
      try {
        const d = n.contentDocument
        if (d?.body) out.push(n)
      } catch {
        /* cross-origin */
      }
    })
  } catch {
    /* */
  }
  return out
}

/**
 * Assign stable `data-cms-id` values and apply Mongo `page_config` payloads (same rules as admin edit).
 * Safe to call repeatedly after React re-renders or iframe loads.
 */
export function applyPublicPageConfigToDom(
  root: HTMLElement,
  elements: Record<string, UniversalElementPayload>,
  lang: 'en' | 'ur' = 'en',
): void {
  try {
    const els = collectSafeEditableElements(root)
    for (const el of els) {
      if (!el.hasAttribute('data-cms-id')) {
        el.setAttribute('data-cms-id', computeStableCmsId(el, root))
      }
    }
    for (const [eid, payload] of Object.entries(elements)) {
      try {
        const node = root.querySelector(`[data-cms-id="${cssEscapeSelector(eid)}"]`)
        if (node instanceof HTMLElement && isEditableUiElement(node)) {
          applyPayloadToElement(node, payload, lang)
        }
      } catch {
        /* */
      }
    }

    collectSameOriginIframes().forEach((iframe) => {
      try {
        const doc = iframe.contentDocument
        if (!doc?.body) return
        const bodyRoot = doc.body
        const portalEls = collectSafeEditableElements(bodyRoot, { portalBody: true })
        for (const el of portalEls) {
          if (!el.hasAttribute('data-cms-id')) {
            el.setAttribute('data-cms-id', computeStableCmsIdForIframe(iframe, el, bodyRoot))
          }
        }
        for (const [eid, payload] of Object.entries(elements)) {
          try {
            const node = doc.querySelector(`[data-cms-id="${cssEscapeSelector(eid)}"]`)
            if (node instanceof HTMLElement && isEditableUiElement(node)) {
              applyPayloadToElement(node, payload, lang)
            }
          } catch {
            /* */
          }
        }
      } catch {
        /* */
      }
    })
  } catch {
    /* never break public shell */
  }
}
