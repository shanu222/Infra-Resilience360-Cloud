import ChapterCard from './ChapterCard'
import type { PgbcChapter } from '../types/pgbc'

type CodeTreeProps = {
  chapters: PgbcChapter[]
  query: string
  expandedChapters: Record<string, boolean>
  selectedSectionKey: string
  onToggleChapter: (chapterKey: string) => void
  onSelectSection: (sectionKey: string) => void
}

export default function CodeTree({
  chapters,
  query,
  expandedChapters,
  selectedSectionKey,
  onToggleChapter,
  onSelectSection,
}: CodeTreeProps) {
  return (
    <div className="browser-sidebar">
      <div className="sidebar-header">
        <h3 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>
          BUILDING CODE
          <br />
          OF PAKISTAN
        </h3>
        <input type="text" readOnly value={query} placeholder="Search code..." className="search-box" />
      </div>
      <h4 style={{ margin: '15px 0 10px 0', color: '#a0d4c4', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Chapters
      </h4>
      <div className="chapters-sidebar">
        {chapters.map((chapter, chapterIndex) => {
          const chapterKey = `chapter-${chapterIndex}`
          return (
            <ChapterCard
              key={chapterKey}
              chapter={chapter}
              chapterKey={chapterKey}
              expanded={Boolean(expandedChapters[chapterKey])}
              query={query}
              selectedSectionKey={selectedSectionKey}
              onToggle={() => onToggleChapter(chapterKey)}
              onSelectSection={onSelectSection}
            />
          )
        })}
      </div>
    </div>
  )
}
