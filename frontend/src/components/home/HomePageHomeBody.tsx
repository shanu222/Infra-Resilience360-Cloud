import type { HomepageFooterConfig } from '../../types/homepageConfig'
import type { AppLocaleStrings } from '../../i18n/appLocale'
import type { Language, SectionKey } from '../../types/sectionKeys'
import type { HomeCardRow } from '../../utils/homepagePresentation'
import { HomeBottomStrip } from './HomeBottomStrip'
import { HomeCardTile } from './HomeCardTile'

export type HomePageHomeBodyProps = {
  t: AppLocaleStrings
  homeCardRows: HomeCardRow[]
  navigateToSection: (key: SectionKey | null) => void
  /** Drives CMS text resolution for bilingual `page_config` payloads. */
  language?: Language
  /** Optional homepage-config footer overrides (Mongo). Empty → locale defaults. */
  footerCms?: HomepageFooterConfig
  editMode?: boolean
  onAdminCardClick?: (key: SectionKey, row: HomeCardRow, anchor: HTMLElement) => void
  onAdminFooterClick?: () => void
  showSettingsButton?: boolean
}

/** Home card grid + bottom strip only (used inside App shell when `activeSection === null`). */
export function HomePageHomeBody({
  t,
  homeCardRows,
  navigateToSection,
  language = 'en',
  footerCms,
  editMode,
  onAdminCardClick,
  onAdminFooterClick,
  showSettingsButton,
}: HomePageHomeBodyProps) {
  return (
    <>
      <section className="home-card-grid">
        {homeCardRows.map((row, cardIndex) => (
          <HomeCardTile
            key={row.cardId || row.key}
            row={row}
            cardIndex={cardIndex}
            t={t}
            language={language}
            navigateToSection={navigateToSection}
            editMode={editMode}
            onAdminCardClick={onAdminCardClick}
            variant="grid"
          />
        ))}
      </section>

      <HomeBottomStrip
        t={t}
        language={language}
        footerCms={footerCms}
        editMode={editMode}
        onAdminFooterClick={onAdminFooterClick}
        navigateToSection={navigateToSection}
        showSettingsButton={showSettingsButton}
      />
    </>
  )
}
