import ChapterCard from './ChapterCard'
import type { ChapterNode } from '../types/pgbc'

type ChapterTreeProps = {
  chapters: ChapterNode[]
  query: string
  expandedChapters: Record<string, boolean>
  selectedSectionKey: string
  onToggleChapter: (chapterKey: string) => void
  onSelectSection: (sectionKey: string) => void
}

export default function ChapterTree({
  chapters,
  query,
  expandedChapters,
  selectedSectionKey,
  onToggleChapter,
  onSelectSection,
}: ChapterTreeProps) {
  return (
    <aside className="browser-sidebar">
      <div className="sidebar-header">
        <h3 className="sidebar-title">BUILDING CODE OF PAKISTAN</h3>
      </div>
      <h4 className="chapters-heading">Chapters</h4>
      <div className="chapters-sidebar">
        {chapters.map((chapter, chapterIndex) => {
          const chapterKey = `chapter-${chapterIndex}`
          return (
            <ChapterCard
              key={chapterKey}
              chapter={chapter}
              chapterKey={chapterKey}
              query={query}
              expanded={Boolean(expandedChapters[chapterKey])}
              selectedSectionKey={selectedSectionKey}
              onToggle={() => onToggleChapter(chapterKey)}
              onSelectSection={onSelectSection}
            />
          )
        })}
      </div>
    </aside>
  )
}
