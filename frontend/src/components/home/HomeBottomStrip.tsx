import type { HomepageFooterConfig } from '../../types/homepageConfig'
import type { AppLocaleStrings } from '../../i18n/appLocale'
import type { Language, SectionKey } from '../../types/sectionKeys'
import { LEGAL_LINKS } from '../../legal/legalPages'

function pickFooterLine(
  footer: HomepageFooterConfig | undefined,
  lang: Language,
  key: 'taglineBefore' | 'taglineStrong' | 'taglineAfter' | 'versionLine',
): string {
  const block = lang === 'ur' ? footer?.ur : footer?.en
  const v = block?.[key]?.trim()
  return v || ''
}

export type HomeBottomStripProps = {
  t: AppLocaleStrings
  language: Language
  footerCms?: HomepageFooterConfig
  editMode?: boolean
  onAdminFooterClick?: () => void
  navigateToSection: (key: SectionKey | null) => void
  /** When false, hides settings button (feature code retained). */
  showSettingsButton?: boolean
}

export function HomeBottomStrip({
  t,
  language,
  footerCms,
  editMode,
  onAdminFooterClick,
  navigateToSection,
  showSettingsButton = true,
}: HomeBottomStripProps) {
  const isUrdu = language === 'ur'
  return (
    <section
      className={`home-bottom-strip${editMode ? ' hp-edit-target' : ''}`}
      hidden={!showSettingsButton}
      role={editMode ? 'button' : undefined}
      tabIndex={editMode ? 0 : undefined}
      onClick={
        editMode && onAdminFooterClick ?
          (e) => {
            e.stopPropagation()
            onAdminFooterClick()
          }
        : undefined
      }
      onKeyDown={
        editMode && onAdminFooterClick ?
          (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onAdminFooterClick()
            }
          }
        : undefined
      }
    >
      <p>
        <span dir={isUrdu ? 'rtl' : 'ltr'} style={isUrdu ? { display: 'inline-block', textAlign: 'right' } : undefined}>
          {pickFooterLine(footerCms, language, 'taglineBefore')}{' '}
          <strong>{pickFooterLine(footerCms, language, 'taglineStrong')}</strong>{' '}
          {pickFooterLine(footerCms, language, 'taglineAfter')}
        </span>
      </p>
      <p
        dir={isUrdu ? 'rtl' : 'ltr'}
        style={{ margin: 0, fontSize: '0.82rem', opacity: 0.8, ...(isUrdu ? { textAlign: 'right' } : {}) }}
      >
        {pickFooterLine(footerCms, language, 'versionLine')}
      </p>
      <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.88 }}>
        <button
          type="button"
          className="home-bottom-strip__help-link"
          onClick={(e) => {
            if (editMode) {
              e.preventDefault()
              e.stopPropagation()
              return
            }
            navigateToSection('helpCenter')
          }}
        >
          {t.sections.helpCenter}
        </button>
        {' · '}
        {LEGAL_LINKS.map((link, index) => (
          <span key={link.path}>
            <a href={link.path}>{link.title}</a>
            {index + 1 < LEGAL_LINKS.length ? ' · ' : ''}
          </span>
        ))}
      </p>
      {showSettingsButton ?
        <button
          type="button"
          onClick={(e) => {
            if (editMode) {
              e.preventDefault()
              e.stopPropagation()
            }
            navigateToSection('settings')
          }}
        >
          {t.sections.settings}
        </button>
      : null}
    </section>
  )
}
