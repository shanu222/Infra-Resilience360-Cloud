import { type CSSProperties, type MouseEvent, useState } from 'react'
import type { HomepageFooterConfig } from '../../types/homepageConfig'
import type { AppLocaleStrings } from '../../i18n/appLocale'
import type { Language, SectionKey } from '../../types/sectionKeys'
import type { RoleOption } from '../../constants/homepageGrid'
import type { HomeCardRow } from '../../utils/homepagePresentation'
import { CmsText } from '../cms/CmsText'
import { HomePageHomeBody } from './HomePageHomeBody'
import { NdmaAuthorityBadge } from './NdmaAuthorityBadge'
import { BackgroundMedia } from '../BackgroundMedia'
import {
  DEFAULT_SHELL_LOGO_URL,
  APP_BRAND_ICON_URL,
  APP_BRAND_ICON_URL_CANDIDATES,
} from '../../services/globalShellConfig'

export type HomePageViewProps = {
  language: Language
  setLanguage: (l: Language) => void
  selectedRole: RoleOption
  setSelectedRole: (r: RoleOption) => void
  roleOptions: readonly RoleOption[]
  isUrdu: boolean
  t: AppLocaleStrings
  homeShellThemeVars: CSSProperties | undefined
  homeHeroTitleDisplay: string
  homeHeroSubtitleDisplay: string
  homeHeroColorStyle: CSSProperties | undefined
  homeCardRows: HomeCardRow[]
  /** Optional footer copy from homepage-config (Mongo). */
  footerCms?: HomepageFooterConfig
  navigateToSection: (key: SectionKey | null) => void
  /** Inline editing affordances (admin homepage editor only). */
  editMode?: boolean
  /** Alias for `editMode` — admin editor passes true while public app omits both. */
  isEditMode?: boolean
  onAdminHeroClick?: () => void
  onAdminFooterClick?: () => void
  onAdminBackgroundClick?: () => void
  onAdminCardClick?: (key: SectionKey, row: HomeCardRow, anchor: HTMLElement) => void
}

/**
 * Full home shell used by the Homepage WYSIWYG admin entry only (matches user home layout).
 */
export function HomePageView({
  ...props
}: HomePageViewProps) {
  const {
    language,
    setLanguage,
    selectedRole,
    setSelectedRole,
    roleOptions,
    isUrdu,
    t,
    homeShellThemeVars,
    homeHeroTitleDisplay,
    homeHeroSubtitleDisplay,
    homeHeroColorStyle,
    homeCardRows,
    footerCms,
    navigateToSection,
    editMode,
    isEditMode,
    onAdminHeroClick,
    onAdminFooterClick,
    onAdminBackgroundClick,
    onAdminCardClick,
  } = props
  const adminEdit = Boolean(editMode ?? isEditMode)
  const [appBrandIconIndex, setAppBrandIconIndex] = useState(0)
  const appBrandIconSrc = APP_BRAND_ICON_URL_CANDIDATES[appBrandIconIndex] ?? APP_BRAND_ICON_URL
  const shellOnClick =
    adminEdit && onAdminBackgroundClick ?
      (e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onAdminBackgroundClick()
      }
    : undefined
  return (
    <>
      <BackgroundMedia pageSlug="homepage" />
      <div className="r360-app-stack">
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className="page-wrapper page-home"
      onClick={shellOnClick}
    >
      <div className="content-layer">
      <div
        className={`app-shell resilience-bg-shell home-shell`}
        style={{ ...homeShellThemeVars }}
      >

      <header className="navbar home-navbar">
        <div className="navbar-top">
          <div className="navbar-start">
            <div className="brand">
              <img
                src={DEFAULT_SHELL_LOGO_URL}
                alt={t.ndmaLogoAlt}
                className="ndma-logo"
                width={120}
                height={48}
                decoding="async"
                fetchPriority="high"
              />
              <div className="app-brand-mark" aria-label={t.appTitle}>
                <img
                  src={appBrandIconSrc}
                  alt=""
                  className="app-brand-mark__icon"
                  width={55}
                  height={55}
                  decoding="async"
                  fetchPriority="high"
                  onError={() => {
                    setAppBrandIconIndex((i) =>
                      i + 1 < APP_BRAND_ICON_URL_CANDIDATES.length ? i + 1 : i,
                    )
                  }}
                />
                <span className="app-brand-mark__wordmark">{t.logoText}</span>
              </div>
              <div
                className={`hero-title-wrap${adminEdit ? ' hp-edit-target' : ''}`}
                role={adminEdit ? 'button' : undefined}
                tabIndex={adminEdit ? 0 : undefined}
                onClick={
                  adminEdit && onAdminHeroClick ?
                    (e) => {
                      e.stopPropagation()
                      onAdminHeroClick()
                    }
                  : undefined
                }
                onKeyDown={
                  adminEdit && onAdminHeroClick ?
                    (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onAdminHeroClick()
                      }
                    }
                  : undefined
                }
              >
                <h1 className="hero-title" dir={isUrdu ? 'rtl' : 'ltr'} style={homeHeroColorStyle}>
                  <CmsText as="span" id="hero.title" fallback={homeHeroTitleDisplay} />
                </h1>
                <p className="hero-subtitle" style={homeHeroColorStyle}>
                  <CmsText as="span" id="hero.subtitle" fallback={homeHeroSubtitleDisplay} />
                </p>
              </div>
            </div>
          </div>
          <div className="navbar-end">
            <div
              className="nav-controls nav-toolbar-controls"
              role="toolbar"
              aria-label={`${t.language}, ${t.navbarRole}, ${t.home}`}
            >
              <label htmlFor="toolbar-lang-select">
                <span className="nav-toolbar-label-text">{t.language}</span>
                <select
                  id="toolbar-lang-select"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as Language)}
                  aria-label={t.language}
                >
                  <option value="ur">{t.langOptionPkUrdu}</option>
                  <option value="en">{t.langOptionGbEnglish}</option>
                </select>
              </label>
              <label htmlFor="toolbar-role-select">
                <span className="nav-toolbar-label-text">{t.navbarRole}</span>
                <select
                  id="toolbar-role-select"
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value as RoleOption)}
                  aria-label={t.navbarRole}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {t.roles[role as keyof typeof t.roles]}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => navigateToSection(null)}>
                {t.pakistanHome}
              </button>
            </div>
          </div>
        </div>
      </header>

      <NdmaAuthorityBadge t={t} isUrdu={isUrdu} />

      <main>
        <HomePageHomeBody
          t={t}
          language={language}
          homeCardRows={homeCardRows}
          footerCms={footerCms}
          navigateToSection={navigateToSection}
          editMode={adminEdit}
          onAdminCardClick={onAdminCardClick}
          onAdminFooterClick={onAdminFooterClick}
        />
      </main>
      </div>
      </div>
    </div>
    </div>
    </>
  )
}

/** Same component — alias for admin entry (`<Homepage isEditMode />`). */
export { HomePageView as Homepage }
