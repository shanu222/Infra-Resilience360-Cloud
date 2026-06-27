import { HexColorPicker } from 'react-colorful'
import './colorPicker.css'

type ColorPickerProps = {
  value: string
  onChange: (nextHex: string) => void
  label?: string
}

function normalizeHex(value: string, fallback = '#000000'): string {
  const raw = String(value ?? '').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toUpperCase()
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const r = raw[1]
    const g = raw[2]
    const b = raw[3]
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return fallback
}

export function ColorPicker({ value, onChange, label = 'Hex color' }: ColorPickerProps) {
  const safeHex = normalizeHex(value, '#000000')

  return (
    <div className="r360-color-picker" style={{ display: 'grid', gap: 8 }}>
      <HexColorPicker color={safeHex} onChange={(next) => onChange(normalizeHex(next, safeHex))} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          aria-hidden
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            border: '1px solid rgba(148,163,184,0.6)',
            backgroundColor: safeHex,
            flexShrink: 0,
          }}
        />
        <input
          type="text"
          aria-label={label}
          value={safeHex}
          onChange={(e) => onChange(normalizeHex(e.target.value, safeHex))}
          style={{ minWidth: 110 }}
        />
      </div>
    </div>
  )
}

