/** Apply alpha to a #RGB or #RRGGBB hex color for card backgrounds. */
export function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.trim().replace(/^#/, '')
  if (raw.length !== 3 && raw.length !== 6) return hex
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return hex
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const a = Math.min(1, Math.max(0, alpha))
  return `rgba(${r},${g},${b},${a})`
}
