type NdmaAuthorityBadgeStripProps = {
  prefix: string
  org: string
  suffix: string
  tone?: 'default' | 'home' | 'bestPractices' | 'riskMaps' | 'readiness'
  dir?: 'ltr' | 'rtl'
  className?: string
}

/**
 * Presentational NDMA partnership pill — shared across shell and embedded portals.
 */
export function NdmaAuthorityBadgeStrip({
  prefix,
  org,
  suffix,
  tone = 'default',
  dir = 'ltr',
  className = '',
}: NdmaAuthorityBadgeStripProps) {
  const badgeClass = `ndma-authority-badge ndma-authority-badge--tone-${tone}${className ? ` ${className}` : ''}`
  return (
    <div className={badgeClass} dir={dir}>
      <span className="ndma-authority-badge__text">
        <span className="ndma-authority-badge__prefix">{prefix}</span>
        <strong className="ndma-authority-badge__org">{org}</strong>
        <span className="ndma-authority-badge__suffix">{suffix}</span>
      </span>
    </div>
  )
}
