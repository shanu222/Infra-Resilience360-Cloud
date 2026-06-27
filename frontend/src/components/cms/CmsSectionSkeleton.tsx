import './CmsSectionSkeleton.css'

type Props = {
  /** Number of placeholder rows */
  rows?: number
  className?: string
}

/**
 * Non-blocking placeholder while a section loads bundled page config.
 */
export function CmsSectionSkeleton({ rows = 4, className = '' }: Props) {
  const n = Math.min(12, Math.max(1, rows))
  return (
    <div className={['cms-section-skeleton', className].filter(Boolean).join(' ')} aria-hidden>
      <div className="cms-section-skeleton__bar cms-section-skeleton__bar--title" />
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="cms-section-skeleton__bar" style={{ width: `${72 + ((i * 17) % 28)}%` }} />
      ))}
    </div>
  )
}
