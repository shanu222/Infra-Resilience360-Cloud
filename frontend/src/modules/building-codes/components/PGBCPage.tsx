import { useMemo, useState } from 'react'
import { useBuildingCodesData } from '../hooks/useBuildingCodesData'
import ChapterTree from './ChapterTree'
import PDFViewer from './PDFViewer'
import SearchBar from './SearchBar'
import Toolbar from './Toolbar'
import '../styles/pgbc.css'

export default function PGBCPage() {
  const [search, setSearch] = useState('')
  const {
    codes,
    chapters,
    selectedCode,
    selectedCodeId,
    setSelectedCodeId,
    expandedChapters,
    toggleChapter,
    selectedSectionKey,
    setSelectedSectionKey,
  } = useBuildingCodesData(search)

  const selectedChapter = useMemo(() => {
    const parts = selectedSectionKey.split('-')
    const chapterIndex = Number(parts[1] ?? -1)
    if (!Number.isInteger(chapterIndex) || chapterIndex < 0) return null
    return chapters[chapterIndex] ?? null
  }, [chapters, selectedSectionKey])

  const selectedSection = useMemo(() => {
    const parts = selectedSectionKey.split('-')
    const chapterIndex = Number(parts[1] ?? -1)
    const sectionIndex = Number(parts[3] ?? -1)
    if (!Number.isInteger(chapterIndex) || !Number.isInteger(sectionIndex)) return null
    return chapters[chapterIndex]?.sections?.[sectionIndex] ?? null
  }, [chapters, selectedSectionKey])

  return (
    <div className="building-codes-native">
      <div className="library-card">
        <h2 className="library-title">Building Codes</h2>
        <p className="library-subtitle">Sustainability & Energy Efficiency Standards</p>

        <Toolbar codes={codes} selectedCodeId={selectedCodeId} onSelectCode={setSelectedCodeId} />
        <SearchBar value={search} onChange={setSearch} />

        <section className="active viewer-page">
          <div className="code-browser-container">
            <ChapterTree
              chapters={chapters}
              query={search}
              expandedChapters={expandedChapters}
              selectedSectionKey={selectedSectionKey}
              onToggleChapter={toggleChapter}
              onSelectSection={setSelectedSectionKey}
            />
            <PDFViewer code={selectedCode} chapter={selectedChapter} section={selectedSection} />
          </div>
        </section>
      </div>
    </div>
  )
}
