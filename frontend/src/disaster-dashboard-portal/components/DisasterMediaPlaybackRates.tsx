export const DISASTER_MEDIA_PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const

type PlaybackRateSelectProps = {
  value: number
  onChange: (rate: number) => void
  id: string
  label?: string
}

export function DisasterMediaPlaybackRateSelect({
  value,
  onChange,
  id,
  label = 'Playback speed',
}: PlaybackRateSelectProps) {
  return (
    <label htmlFor={id} className="dd-media-rate">
      <span className="dd-media-rate__label">{label}</span>
      <select
        id={id}
        className="dd-media-rate__select"
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {DISASTER_MEDIA_PLAYBACK_RATES.map((rate) => (
          <option key={rate} value={rate}>
            {rate === 1 ? '1x (Normal)' : `${rate}x`}
          </option>
        ))}
      </select>
    </label>
  )
}
