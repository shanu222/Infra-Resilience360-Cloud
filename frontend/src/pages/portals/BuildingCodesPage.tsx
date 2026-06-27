import type { Language } from '../../types/sectionKeys'

export function BuildingCodesPage({
  language,
  isAdminMode,
  isEditMode,
}: {
  language: Language
  isAdminMode?: boolean
  isEditMode?: boolean
}) {
  const isUrdu = language === 'ur'
  const iframeSrc = `/pgbc/library.html?lang=${isUrdu ? 'ur' : 'en'}`

  return (
    <div
      className="portal-page-root portal-page-pgbc"
      data-admin-mode={isAdminMode ? 'true' : 'false'}
      data-edit-mode={isEditMode ? 'true' : 'false'}
      dir={isUrdu ? 'rtl' : 'ltr'}
    >
      <iframe
        className="r360-embedded-portal-frame pgbc-portal-frame"
        src={iframeSrc}
        title="Building Codes Portal"
        loading="eager"
        referrerPolicy="no-referrer"
      />
    </div>
  )
}
