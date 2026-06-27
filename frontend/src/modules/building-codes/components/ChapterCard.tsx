import SectionCard from './SectionCard'
import { highlightMatch } from '../utils/textSearch'
import type { ChapterNode } from '../types/pgbc'

type ChapterCardProps = {
  chapter: ChapterNode
  chapterKey: string
  query: string
  expanded: boolean
  selectedSectionKey: string
  onToggle: () => void
  onSelectSection: (sectionKey: string) => void
}

export default function ChapterCard({
  chapter,
  chapterKey,
  query,
  expanded,
  selectedSectionKey,
  onToggle,
  onSelectSection,
}: ChapterCardProps) {
  const chapterLabel = `Chapter ${chapter.number ?? ''} ${chapter.title ?? ''}`.trim()
  return (
    <div>
      <button
        type="button"
        className={`sidebar-chapter-item${expanded ? ' active' : ''}`}
        onClick={onToggle}
        dangerouslySetInnerHTML={{ __html: highlightMatch(chapterLabel, query) }}
      />
      {expanded
        ? (chapter.sections ?? []).map((section, sectionIndex) => {
            const sectionKey = `${chapterKey}-section-${sectionIndex}`
            return (
              <SectionCard
                key={sectionKey}
                section={section}
                query={query}
                active={selectedSectionKey === sectionKey}
                onSelect={() => onSelectSection(sectionKey)}
              />
            )
          })
        : null}
    </div>
  )
}
