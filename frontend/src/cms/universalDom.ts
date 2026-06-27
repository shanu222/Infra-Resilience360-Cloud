import { migrateToBilingual, resolveBilingual } from '../utils/bilingualText'
import type { CmsMediaPayload, UniversalElementPayload } from '../types/universalElement'
import {
  ALLOWED_STYLE_KEYS,
  ALLOWED_UI_SELECTOR,
  canEditElementText,
  getCmsType,
  inferCmsType,
  isEditableUiElement,
  isPortalCmsInput,
} from './cmsUiPolicy'
import { elementIndexInParentSlot, parentElementComposed } from './shadowDomTree'
import { fixApiUrl } from '../utils/fixApiUrl'

/** Stable id from DOM position under root. */
export function computeStableCmsId(el: Element, root: Element): string {
  const parts: string[] = []
  let n: Element | null = el
  while (n && n !== root) {
    const parentEl = parentElementComposed(n)
    if (!parentEl) break
    const idx = elementIndexInParentSlot(n)
    const tag = n.tagName.toLowerCase()
    const cls = (n.getAttribute('class') || '').split(/\s+/).slice(0, 2).join('.')
    parts.push(`${tag}:${idx}${cls ? `:${cls}` : ''}`)
    n = parentEl
  }
  parts.reverse()
  const raw = parts.join('>')
  return `cms_${djb2Hash(raw).toString(16).padStart(8, '0')}`
}

export function djb2Hash(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0
}

function defaultView(el: Element): Window & typeof globalThis {
  return (el.ownerDocument.defaultView ?? window) as Window & typeof globalThis
}

/** Iframe portals: prefix ids so they never collide with main document on the same page slug. */
export function computeStableCmsIdForIframe(iframe: HTMLIFrameElement, el: Element, root: Element): string {
  const base = computeStableCmsId(el, root)
  const key = iframe.src || iframe.name || 'inline'
  const prefix = `if${djb2Hash(key).toString(16).padStart(8, '0')}`
  return `${prefix}_${base.replace(/^cms_/, '')}`
}

function deepCollectPortalNodes(root: Element, out: HTMLElement[]): void {
  const visit = (el: Element) => {
    if (el instanceof HTMLElement && isEditableUiElement(el) && !out.includes(el)) {
      out.push(el)
    }
    if (el.shadowRoot) {
      for (const c of el.shadowRoot.children) {
        visit(c)
      }
    }
    for (const c of el.children) {
      visit(c)
    }
  }
  visit(root)
}

/** Auto-detect all safe UI elements under root. */
export function collectSafeEditableElements(
  root: Element,
  opts?: { portalBody?: boolean },
): HTMLElement[] {
  try {
    if (opts?.portalBody) {
      const out: HTMLElement[] = []
      deepCollectPortalNodes(root, out)
      return out
    }
    const list = root.querySelectorAll(ALLOWED_UI_SELECTOR)
    const out: HTMLElement[] = []
    list.forEach((el) => {
      if (!(el instanceof HTMLElement)) return
      if (!root.contains(el)) return
      if (!isEditableUiElement(el)) return
      out.push(el)
    })
    return out
  } catch {
    return []
  }
}

/** @deprecated use collectSafeEditableElements */
export const collectMarkedEditableElements = collectSafeEditableElements

function pickAllowedStyles(
  cs: CSSStyleDeclaration,
  cmsType: string,
): NonNullable<UniversalElementPayload['styles']> {
  const bgImg = cs.backgroundImage && cs.backgroundImage !== 'none' ? cs.backgroundImage : ''
  const bgFull = cs.background
  let backgroundShorthand = ''
  if (!bgImg && bgFull && bgFull !== 'none' && /gradient|url\(/i.test(bgFull)) {
    backgroundShorthand = bgFull
  }
  const raw: Record<string, string> = {
    backgroundColor: cs.backgroundColor,
    color: cs.color,
    opacity: cs.opacity,
    borderRadius: cs.borderRadius,
    padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
    margin: `${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft}`,
    backgroundImage: bgImg,
    background: backgroundShorthand,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight && cs.fontWeight !== 'normal' && cs.fontWeight !== '400' ? cs.fontWeight : '',
    fontFamily: cs.fontFamily || '',
    fontStyle: cs.fontStyle && cs.fontStyle !== 'normal' ? cs.fontStyle : '',
    textDecoration:
      cs.textDecorationLine && cs.textDecorationLine !== 'none' ? cs.textDecorationLine : '',
    textAlign: cs.textAlign && cs.textAlign !== 'start' ? cs.textAlign : '',
    lineHeight: cs.lineHeight || '',
    letterSpacing: cs.letterSpacing && cs.letterSpacing !== 'normal' ? cs.letterSpacing : '',
    textShadow: cs.textShadow && cs.textShadow !== 'none' ? cs.textShadow : '',
    backdropFilter: (cs as CSSStyleDeclaration & { backdropFilter?: string }).backdropFilter || '',
    border: cs.border || '',
    width: cs.width,
    height: cs.height,
    boxShadow: cs.boxShadow && cs.boxShadow !== 'none' ? cs.boxShadow : '',
    objectFit: cs.objectFit && cs.objectFit !== 'fill' ? cs.objectFit : '',
  }
  const canUseBgLayers = cmsType === 'background'
  const out: NonNullable<UniversalElementPayload['styles']> = {}
  for (const key of ALLOWED_STYLE_KEYS) {
    const v = raw[key]
    if (v === undefined || v === '') continue
    if (key === 'backgroundImage' && canUseBgLayers) {
      out.backgroundImage = v
    } else if (key === 'background' && canUseBgLayers) {
      out.background = v
    } else if (key !== 'backgroundImage' && key !== 'background') {
      ;(out as Record<string, string>)[key] = v
    }
  }
  return out
}

function firstDirectVideoChild(el: HTMLElement): HTMLVideoElement | null {
  const v = el.querySelector(':scope > video')
  return v instanceof HTMLVideoElement ? v : null
}

function firstButtonIconImg(el: HTMLElement): HTMLImageElement | null {
  if (el.tagName !== 'BUTTON' && el.tagName !== 'A') return null
  const img = el.querySelector(':scope > img')
  return img instanceof HTMLImageElement ? img : null
}

/** Resolved primary URL from persisted media (Mongo `url` first; legacy `src`). */
export function cmsMediaPrimaryUrl(m: CmsMediaPayload | null | undefined): string | undefined {
  if (!m) return undefined
  const u = m.url ?? m.src
  if (!u || !String(u).trim()) return undefined
  return fixApiUrl(String(u).trim())
}

function clearCmsMediaOnElement(el: HTMLElement, cmsType: string, tag: string): void {
  if (cmsType === 'image' || cmsType === 'video' || cmsType === 'audio') {
    if (el instanceof HTMLImageElement || el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
      el.removeAttribute('src')
    }
  }
  if (cmsType === 'pdf' && el instanceof HTMLEmbedElement) {
    el.removeAttribute('src')
  }
  if (cmsType === 'background') {
    el.style.backgroundImage = 'none'
    const fv = firstDirectVideoChild(el)
    if (fv) fv.removeAttribute('src')
  }
  if (tag === 'button' || tag === 'a') {
    const img = firstButtonIconImg(el)
    if (img) img.removeAttribute('src')
  }
}

export type ExtractPayloadOptions = {
  /** Merged draft/server payload to preserve the non-active language when reading DOM. */
  existing?: UniversalElementPayload
  /** Which language the DOM currently shows (app language). */
  uiLang?: 'en' | 'ur'
}

export function extractPayload(el: Element, opts?: ExtractPayloadOptions): UniversalElementPayload {
  const cmsType = getCmsType(el)
  const cs = defaultView(el).getComputedStyle(el)
  const tag = el.tagName.toLowerCase()
  const base: UniversalElementPayload = { cmsType, tag }
  const uiLang: 'en' | 'ur' = opts?.uiLang ?? 'en'
  const existing = opts?.existing

  if (el instanceof HTMLElement && isPortalCmsInput(el)) {
    const value =
      el instanceof HTMLTextAreaElement ? el.value : el instanceof HTMLInputElement ? el.value : ''
    const domPh = el.getAttribute('placeholder') ?? ''
    const textBi = migrateToBilingual(existing?.text)
    if (uiLang === 'ur') textBi.ur = value
    else textBi.en = value
    const phBi = migrateToBilingual(existing?.placeholder)
    if (domPh) {
      if (uiLang === 'ur') phBi.ur = domPh
      else phBi.en = domPh
    }
    return {
      ...base,
      cmsType: 'text-static',
      text: textBi,
      placeholder: phBi.en || phBi.ur ? phBi : existing?.placeholder,
      styles: pickAllowedStyles(cs, 'text-static'),
    }
  }

  if (cmsType === 'pdf' && el instanceof HTMLEmbedElement) {
    const domSrc = el.src || el.getAttribute('src') || ''
    const em = existing?.media && typeof existing.media === 'object' ? existing.media : null
    const fromExisting = cmsMediaPrimaryUrl(em ?? undefined)
    const primary = (fromExisting || (domSrc ? fixApiUrl(domSrc) ?? domSrc : '')) || ''
    const urlPersist = em?.url && String(em.url).trim() ? String(em.url).trim() : undefined
    return {
      ...base,
      media: primary ?
          {
            type: 'pdf' as const,
            src: primary,
            ...(urlPersist ? { url: urlPersist } : {}),
            ...(em?.s3Key ? { s3Key: String(em.s3Key) } : {}),
          }
        : null,
      styles: pickAllowedStyles(cs, cmsType),
    }
  }

  if (cmsType === 'image' || cmsType === 'video' || cmsType === 'audio') {
    if (el instanceof HTMLImageElement || el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
      const domSrc = el.currentSrc || el.src || ''
      const em = existing?.media && typeof existing.media === 'object' ? existing.media : null
      const fromExisting = cmsMediaPrimaryUrl(em ?? undefined)
      const primary = (fromExisting || (domSrc ? fixApiUrl(domSrc) ?? domSrc : '')) || ''
      const t: CmsMediaPayload['type'] =
        cmsType === 'image' ? 'image' : cmsType === 'video' ? 'video' : 'audio'
      const urlPersist = em?.url && String(em.url).trim() ? String(em.url).trim() : undefined
      return {
        ...base,
        media: primary ?
            {
              type: t,
              src: primary,
              ...(urlPersist ? { url: urlPersist } : {}),
              ...(em?.s3Key ? { s3Key: String(em.s3Key) } : {}),
            }
          : null,
        styles: pickAllowedStyles(cs, cmsType),
      }
    }
    return { ...base, styles: pickAllowedStyles(cs, cmsType) }
  }

  if (cmsType === 'text-static' && el instanceof HTMLElement) {
    const domText = canEditElementText(el) ? String(el.innerText ?? '') : undefined
    const textBi = migrateToBilingual(existing?.text)
    if (domText !== undefined) {
      if (uiLang === 'ur') textBi.ur = domText
      else textBi.en = domText
    }
    return {
      ...base,
      text: textBi,
      styles: pickAllowedStyles(cs, cmsType),
    }
  }

  if (cmsType === 'background' && tag !== 'button' && tag !== 'a') {
    const styles = pickAllowedStyles(cs, cmsType)
    const payload: UniversalElementPayload = {
      ...base,
      styles,
    }
    if (el instanceof HTMLElement) {
      const fv = firstDirectVideoChild(el)
      if (fv?.src) {
        payload.media = { ...payload.media, backgroundVideoSrc: fv.currentSrc || fv.src }
      }
      const bi = styles.backgroundImage
      const u = bi && bi !== 'none' ? extractUrlFromCssBackground(bi) : undefined
      if (u) {
        payload.media = { ...payload.media, src: u, type: 'image' }
      }
    }
    return payload
  }

  if ((tag === 'button' || tag === 'a') && el instanceof HTMLElement) {
    const img = firstButtonIconImg(el)
    if (img) {
      const iconSrc = img.currentSrc || img.src
      return {
        ...base,
        styles: pickAllowedStyles(cs, cmsType),
        media: iconSrc ? { iconSrc, type: 'image' as const } : null,
      }
    }
  }

  return { ...base, styles: pickAllowedStyles(cs, cmsType) }
}

function extractUrlFromCssBackground(bg: string): string | undefined {
  const m = /url\s*\(\s*["']?([^"')]+)["']?\s*\)/.exec(bg)
  return m?.[1]?.trim()
}

/** Map element rect through nested same-origin iframes into the top browsing context viewport. */
export function getBoundingRectInOuterViewport(el: HTMLElement): DOMRect {
  const r = el.getBoundingClientRect()
  let win: Window | null = el.ownerDocument.defaultView
  let frameEl = win?.frameElement as HTMLElement | null
  let x = r.left
  let y = r.top
  while (frameEl && win) {
    const fr = frameEl.getBoundingClientRect()
    x += fr.left
    y += fr.top
    win = frameEl.ownerDocument.defaultView
    frameEl = (win?.frameElement as HTMLElement | null) ?? null
  }
  return new DOMRect(x, y, r.width, r.height)
}

const INLINE_EDITOR_GAP = 10
export const INLINE_EDITOR_PANEL_WIDTH = 400

/** Fixed positioning next to the selected element (viewport coordinates). */
export function positionFixedEditorNearElement(el: HTMLElement): { left: number; top: number } {
  const r = getBoundingRectInOuterViewport(el)
  const vw = window.innerWidth
  const vh = window.innerHeight
  const w = INLINE_EDITOR_PANEL_WIDTH
  const maxPanelH = Math.min(420, vh - 16)
  let left = r.right + INLINE_EDITOR_GAP
  let top = r.top
  if (left + w > vw - 8) {
    left = Math.max(8, r.left - w - INLINE_EDITOR_GAP)
  }
  if (left < 8) left = 8
  top = Math.max(8, Math.min(top, vh - maxPanelH - 8))
  return { left, top }
}

export function cloneUniversalPayload(p: UniversalElementPayload): UniversalElementPayload {
  return JSON.parse(JSON.stringify(p)) as UniversalElementPayload
}

function applyAllowedStyles(el: HTMLElement, styles: NonNullable<UniversalElementPayload['styles']>): void {
  for (const key of ALLOWED_STYLE_KEYS) {
    const v = styles[key as keyof typeof styles]
    if (v === null) {
      if (key === 'backgroundImage') el.style.backgroundImage = 'none'
      continue
    }
    if (v === undefined || v === '') continue
    if (key === 'backgroundColor') el.style.backgroundColor = v
    else if (key === 'color') el.style.color = v
    else if (key === 'opacity') el.style.opacity = v
    else if (key === 'borderRadius') el.style.borderRadius = v
    else if (key === 'padding') el.style.padding = v
    else if (key === 'margin') el.style.margin = v
    else if (key === 'backgroundImage' && v !== 'none') el.style.backgroundImage = v
    else if (key === 'background' && v) el.style.background = v
    else if (key === 'fontSize') el.style.fontSize = v
    else if (key === 'fontWeight') el.style.fontWeight = v
    else if (key === 'fontFamily') el.style.fontFamily = v
    else if (key === 'fontStyle') el.style.fontStyle = v
    else if (key === 'textDecoration') el.style.textDecoration = v
    else if (key === 'textAlign') el.style.textAlign = v as CSSStyleDeclaration['textAlign']
    else if (key === 'lineHeight') el.style.lineHeight = v
    else if (key === 'letterSpacing') el.style.letterSpacing = v
    else if (key === 'textShadow') el.style.textShadow = v
    else if (key === 'backdropFilter') (el.style as CSSStyleDeclaration & { backdropFilter: string }).backdropFilter = v
    else if (key === 'border') el.style.border = v
    else if (key === 'width') el.style.width = v
    else if (key === 'height') el.style.height = v
    else if (key === 'boxShadow') el.style.boxShadow = v
    else if (key === 'objectFit') el.style.objectFit = v as CSSStyleDeclaration['objectFit']
  }
}

/**
 * Apply saved UI overrides only — never touches event handlers, href, or React internals.
 * @param lang Active UI language for bilingual `text` / `placeholder`.
 */
export function applyPayloadToElement(el: HTMLElement, p: UniversalElementPayload, lang: 'en' | 'ur' = 'en'): void {
  try {
    const cmsType = getCmsType(el) || p.cmsType || inferCmsType(el)
    const tag = el.tagName.toLowerCase()
    const m = p.media

    if (m === null) {
      clearCmsMediaOnElement(el, cmsType, tag)
    }

    if (cmsType === 'text-static') {
      if (el instanceof HTMLElement && isPortalCmsInput(el)) {
        if (p.text !== undefined && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
          el.value = resolveBilingual(p.text, lang, '')
        }
        if (p.placeholder !== undefined) {
          el.setAttribute('placeholder', resolveBilingual(p.placeholder, lang, ''))
        }
        if (p.styles) applyAllowedStyles(el, p.styles)
        return
      }
      if (p.text !== undefined && canEditElementText(el)) {
        el.innerText = resolveBilingual(p.text, lang, '')
        if (p.styles) applyAllowedStyles(el, p.styles)
        return
      }
    }

    if (cmsType === 'image' || cmsType === 'video' || cmsType === 'audio' || cmsType === 'pdf') {
      const src = cmsMediaPrimaryUrl(m ?? undefined)
      if (m !== null && src) {
        if (el instanceof HTMLImageElement || el instanceof HTMLVideoElement || el instanceof HTMLAudioElement) {
          el.src = src
        } else if (el instanceof HTMLEmbedElement && cmsType === 'pdf') {
          el.src = src
          el.type = 'application/pdf'
        }
      }
      if (p.styles) applyAllowedStyles(el, p.styles)
      return
    }

    if (cmsType === 'background' && tag !== 'button' && tag !== 'a') {
      if (p.styles) applyAllowedStyles(el, p.styles)
      if (m === null) {
        el.style.backgroundImage = 'none'
        const fv0 = firstDirectVideoChild(el)
        if (fv0) fv0.removeAttribute('src')
      } else if (m) {
        const imgUrl = cmsMediaPrimaryUrl(m)
        if (imgUrl && (m.type === 'image' || !m.type || !m.backgroundVideoSrc)) {
          el.style.backgroundImage = `url("${imgUrl}")`
        }
        const bvs = m.backgroundVideoSrc || m.url
        if (bvs) {
          const fv = firstDirectVideoChild(el)
          if (fv) fv.src = fixApiUrl(String(bvs)) ?? String(bvs)
        }
      }
      return
    }

    if (p.styles) applyAllowedStyles(el, p.styles)

    if ((tag === 'button' || tag === 'a') && el instanceof HTMLElement) {
      const img = firstButtonIconImg(el)
      if (m === null && img) {
        img.removeAttribute('src')
      } else if (m && img) {
        const iconSrc = m.iconSrc || m.url
        if (iconSrc) img.src = fixApiUrl(iconSrc) ?? iconSrc
      }
    }
  } catch {
    /* never break UI */
  }
}
