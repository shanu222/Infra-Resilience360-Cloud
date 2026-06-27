import { highlightMatch } from '../utils/textSearch'
import type { PgbcSection } from '../types/pgbc'

type SectionCardProps = {
  section: PgbcSection
  isSelected: boolean
  query: string
  onClick: () => void
}

export default function SectionCard({ section, isSelected, query, onClick }: SectionCardProps) {
  const label = `${section.code ?? ''} ${section.title ?? ''}`.trim() || 'Untitled section'

  return (
    <button
      type="button"
      className={`sidebar-subsection-item${isSelected ? ' active' : ''}`}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: highlightMatch(label, query) }}
    />
  )
}
