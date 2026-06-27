import { highlightMatch } from '../utils/textSearch'
import type { SectionNode } from '../types/pgbc'

type SectionCardProps = {
  section: SectionNode
  query: string
  active: boolean
  onSelect: () => void
}

export default function SectionCard({ section, query, active, onSelect }: SectionCardProps) {
  const label = `${section.code ?? ''} ${section.title ?? ''}`.trim() || 'Untitled section'
  return (
    <button
      type="button"
      className={`sidebar-subsection-item${active ? ' active' : ''}`}
      onClick={onSelect}
      dangerouslySetInnerHTML={{ __html: highlightMatch(label, query) }}
    />
  )
}
