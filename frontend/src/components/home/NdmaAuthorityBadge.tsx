import type { AppLocaleStrings } from '../../i18n/appLocale'
import { NdmaAuthorityBadgeStrip } from './NdmaAuthorityBadgeStrip'

const PLACEHOLDER = '{NDMA}'

type NdmaAuthorityBadgeProps = {
  t: AppLocaleStrings
  /** Match page text direction for Urdu. */
  isUrdu?: boolean
  /** Header usage across all pages or standalone home usage. */
  variant?: 'default' | 'topbar'
  /** Page-aware accent theme for shared topbar usage. */
  tone?: 'default' | 'home' | 'bestPractices' | 'riskMaps' | 'readiness'
}

function parseBadgeParts(t: AppLocaleStrings): { prefix: string; org: string; suffix: string } {
  const raw = t.ndmaAuthorityBadgeText
  const org = t.ndmaAuthorityBadgeOrgMark
  if (!raw.includes(PLACEHOLDER)) {
    return {
      prefix: 'Powered by ',
      org,
      suffix: ' for Disaster Preparedness & Resilience',
    }
  }
  const [before, after] = raw.split(PLACEHOLDER)
  return { prefix: before, org, suffix: after }
}

/**
 * Official-style partnership line in the top shell and home header flow.
 */
export function NdmaAuthorityBadge({
  t,
  isUrdu = false,
  variant = 'default',
  tone = 'default',
}: NdmaAuthorityBadgeProps) {
  const containerClass =
    variant === 'topbar' ?
      'ndma-authority-badge-container ndma-authority-badge-container--topbar'
    : 'ndma-authority-badge-container'
  const { prefix, org, suffix } = parseBadgeParts(t)

  return (
    <div
      className={containerClass}
      role="complementary"
      aria-label={t.ndmaAuthorityBadgeAria}
    >
      <NdmaAuthorityBadgeStrip
        prefix={prefix}
        org={org}
        suffix={suffix}
        tone={tone}
        dir={isUrdu ? 'rtl' : 'ltr'}
      />
    </div>
  )
}
