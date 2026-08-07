import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppLocaleStrings } from '../../i18n/appLocale'
import type { Language } from '../../types/sectionKeys'
import { roleOptions } from '../../constants/homepageGrid'

export type ToolbarRole = (typeof roleOptions)[number]

export type TopBarQuickControlsProps = {
  t: AppLocaleStrings
  language: Language
  setLanguage: (value: Language) => void
  /** When false, hides language selector (feature code retained). */
  showLanguageToggle?: boolean
  selectedRole: ToolbarRole
  setSelectedRole: (value: ToolbarRole) => void
  onNewInterface: () => void
  interfaceToggleLabel: string
  /** When false, hides carousel/grid interface switcher (feature code retained). */
  showInterfaceToggle?: boolean
  onHome: () => void
  homeLabel: string
  onHelpCenter?: () => void
  helpCenterLabel?: string
  onSettings: () => void
  settingsLabel: string
  /** When false, hides settings entry (feature code retained). */
  showSettingsToggle?: boolean
}

const MOBILE_NAV_MQ = '(max-width: 1023px)'

export function TopBarQuickControls({
  t,
  language,
  setLanguage,
  showLanguageToggle = true,
  selectedRole,
  setSelectedRole,
  onNewInterface,
  interfaceToggleLabel,
  showInterfaceToggle = true,
  onHome,
  homeLabel,
  onHelpCenter,
  helpCenterLabel,
  onSettings,
  settingsLabel,
  showSettingsToggle = true,
}: TopBarQuickControlsProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [useMobileDrawer, setUseMobileDrawer] = useState(false)
  const shellRef = useRef<HTMLDivElement>(null)
  const drawerId = useId()
  const appVersion = import.meta.env.VITE_APP_VERSION ?? 'Web'

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_NAV_MQ)
    const sync = () => setUseMobileDrawer(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!menuOpen || !useMobileDrawer) return
    const previousOverflow = document.body.style.overflow
    document.body.classList.add('r360-nav-drawer-open')
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.classList.remove('r360-nav-drawer-open')
      document.body.style.overflow = previousOverflow
    }
  }, [menuOpen, useMobileDrawer])

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (shellRef.current?.contains(target)) return
      const portalRoot = document.getElementById('r360-nav-drawer-portal')
      if (portalRoot?.contains(target)) return
      setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  const runAndClose = (action: () => void) => {
    action()
    closeMenu()
  }

  const drawerControls = (
    <div className="r360-topbar-panel-body nav-toolbar-unified-controls nav-toolbar-menu-only-controls">
      {showLanguageToggle ?
        <section className="nav-drawer-section nav-drawer-section--field" aria-label={t.language}>
          <label className="nav-toolbar-field" htmlFor="toolbar-lang-select-drawer">
            <span className="nav-toolbar-label-text">{t.language}</span>
            <select
              id="toolbar-lang-select-drawer"
              className="nav-toolbar-select nav-toolbar-select--drawer"
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              aria-label={t.language}
            >
              <option value="ur">{t.langOptionPkUrdu}</option>
              <option value="en">{t.langOptionGbEnglish}</option>
            </select>
          </label>
        </section>
      : null}

      <section className="nav-drawer-section nav-drawer-section--field" aria-label={t.navbarRole}>
        <label className="nav-toolbar-field" htmlFor="toolbar-role-select-drawer">
          <span className="nav-toolbar-label-text">{t.navbarRole}</span>
          <select
            id="toolbar-role-select-drawer"
            className="nav-toolbar-select nav-toolbar-select--drawer"
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value as ToolbarRole)}
            aria-label={t.navbarRole}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {t.roles[role]}
              </option>
            ))}
          </select>
        </label>
      </section>

      {showInterfaceToggle ?
        <section className="nav-drawer-section nav-drawer-section--action">
          <div className="nav-toolbar-field nav-toolbar-field--action">
            <button type="button" className="nav-toolbar-action" onClick={() => runAndClose(onNewInterface)}>
              {interfaceToggleLabel}
            </button>
          </div>
        </section>
      : null}

      {showSettingsToggle ?
        <section className="nav-drawer-section nav-drawer-section--action">
          <div className="nav-toolbar-field nav-toolbar-field--action">
            <button type="button" className="nav-toolbar-action" onClick={() => runAndClose(onSettings)}>
              {settingsLabel}
            </button>
          </div>
        </section>
      : null}

      {onHelpCenter && helpCenterLabel ?
        <section className="nav-drawer-section nav-drawer-section--action">
          <div className="nav-toolbar-field nav-toolbar-field--action">
            <button type="button" className="nav-toolbar-action" onClick={() => runAndClose(onHelpCenter)}>
              {helpCenterLabel}
            </button>
          </div>
        </section>
      : null}

      <section className="nav-drawer-section nav-drawer-section--home">
        <div className="nav-toolbar-field nav-toolbar-field--action">
          <button type="button" className="nav-toolbar-home-btn" onClick={() => runAndClose(onHome)}>
            {homeLabel}
          </button>
        </div>
      </section>

      <section className="nav-drawer-section nav-drawer-section--meta" aria-label="Application info">
        <div className="nav-drawer-meta-row">
          <span className="nav-drawer-meta-label">{t.navDrawerAppVersion}</span>
          <span className="nav-drawer-meta-value">{appVersion}</span>
        </div>
        <div className="nav-drawer-meta-row">
          <span className="nav-drawer-meta-label">{t.navDrawerAppName}</span>
        </div>
        <div className="nav-drawer-meta-row">
          <span className="nav-drawer-meta-value">{t.navDrawerPoweredBy}</span>
        </div>
      </section>
    </div>
  )

  const mobileDrawerPortal =
    useMobileDrawer && menuOpen && typeof document !== 'undefined' ?
      createPortal(
        <div id="r360-nav-drawer-portal" className="r360-nav-drawer-portal-root">
          <button
            type="button"
            className="r360-nav-drawer-backdrop"
            aria-hidden={false}
            tabIndex={0}
            onClick={closeMenu}
          />
          <div
            id={drawerId}
            className="nav-toolbar-unified-card r360-topbar-popover r360-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t.navDrawerMenu}
          >
            {drawerControls}
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <div
      ref={shellRef}
      className={`navbar-top-strip__menu nav-toolbar-menu nav-toolbar-shell${menuOpen ? ' is-open' : ''}`}
    >
      <button
        type="button"
        className="nav-toolbar-menu-trigger r360-nav-menu-trigger"
        aria-expanded={menuOpen}
        aria-controls={drawerId}
        aria-haspopup="dialog"
        aria-label={t.navDrawerMenu}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="nav-toolbar-menu-trigger__icon" aria-hidden>
          ☰
        </span>
      </button>

      <div className="nav-toolbar-inline-controls r360-nav-toolbar-desktop" role="toolbar" aria-label="Top bar quick controls">
        {showLanguageToggle ?
          <label className="nav-toolbar-field nav-toolbar-field--inline" htmlFor="toolbar-lang-select-inline">
            <span className="nav-toolbar-label-text">{t.language}</span>
            <select
              id="toolbar-lang-select-inline"
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              aria-label={t.language}
            >
              <option value="ur">{t.langOptionPkUrdu}</option>
              <option value="en">{t.langOptionGbEnglish}</option>
            </select>
          </label>
        : null}
        <label className="nav-toolbar-field nav-toolbar-field--inline" htmlFor="toolbar-role-select-inline">
          <span className="nav-toolbar-label-text">{t.navbarRole}</span>
          <select
            id="toolbar-role-select-inline"
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value as ToolbarRole)}
            aria-label={t.navbarRole}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {t.roles[role]}
              </option>
            ))}
          </select>
        </label>
        {showInterfaceToggle ?
          <button type="button" className="nav-toolbar-action nav-toolbar-action--inline" onClick={onNewInterface}>
            {interfaceToggleLabel}
          </button>
        : null}
        {showSettingsToggle ?
          <button type="button" className="nav-toolbar-action nav-toolbar-action--inline" onClick={onSettings}>
            {settingsLabel}
          </button>
        : null}
        {onHelpCenter && helpCenterLabel ?
          <button type="button" className="nav-toolbar-action nav-toolbar-action--inline" onClick={onHelpCenter}>
            {helpCenterLabel}
          </button>
        : null}
        <button type="button" className="nav-toolbar-home-btn" onClick={onHome}>
          {homeLabel}
        </button>
      </div>

      {!useMobileDrawer && (
        <>
          <button
            type="button"
            className="r360-nav-drawer-backdrop"
            aria-hidden={!menuOpen}
            tabIndex={menuOpen ? 0 : -1}
            onClick={closeMenu}
          />
          <div
            id={drawerId}
            className="nav-toolbar-unified-card r360-topbar-popover r360-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t.navDrawerMenu}
          >
            {drawerControls}
          </div>
        </>
      )}

      {mobileDrawerPortal}
    </div>
  )
}
