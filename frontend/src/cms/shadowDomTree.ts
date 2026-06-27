/**
 * DOM helpers for open shadow roots. `Node.contains()` is false for shadow descendants,
 * so admin hit-testing and CMS scans must walk the composed tree.
 */

/** Parent in light DOM, or shadow host when at a shadow root boundary. */
export function parentElementComposed(el: Element): Element | null {
  const p = el.parentElement
  if (p) return p
  const rn = el.getRootNode()
  if (rn instanceof ShadowRoot && rn.host) return rn.host
  return null
}

/** Index among `parent.children` (light) or among shadow-root children when parent is a ShadowRoot. */
export function elementIndexInParentSlot(n: Element): number {
  if (n.parentElement) {
    return Array.prototype.indexOf.call(n.parentElement.children, n)
  }
  const p = n.parentNode
  if (p && p instanceof ShadowRoot) {
    return Array.prototype.indexOf.call(p.children, n)
  }
  return 0
}

/** True if `node` is `ancestor` or a descendant in the same document, including open shadow trees. */
export function isDescendantInComposedTree(ancestor: Element, node: Node | null): boolean {
  if (!node) return false
  let cur: Node | null = node
  while (cur) {
    if (cur === ancestor) return true
    const parent: Node | null = cur.parentNode
    if (parent) {
      cur = parent
      continue
    }
    const r = cur.getRootNode()
    if (r instanceof ShadowRoot && r.host) {
      cur = r.host
      continue
    }
    break
  }
  return false
}
