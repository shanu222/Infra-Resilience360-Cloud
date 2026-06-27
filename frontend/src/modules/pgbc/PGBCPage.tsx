import { useMemo, useState } from 'react'
import CodeTree from './components/CodeTree'
import PGBCHeader from './components/PGBCHeader'
import SearchBar from './components/SearchBar'
import Viewer from './components/Viewer'
import { usePgbcData } from './hooks/usePgbcData'
import './styles/pgbc.css'

export default function PGBCPage() {
  const [search, setSearch] = useState('')
  const {
    chapters,
    codes,
    selectedCode,
    selectedCodeId,
    setSelectedCodeId,
    expandedChapters,
    toggleChapter,
    selectedSectionKey,
    setSelectedSectionKey,
  } = usePgbcData(search)

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
    <div className="pgbc-native">
      <div className="library-card">
        <PGBCHeader title="Building Codes" subtitle="Sustainability & Energy Efficiency Standards" />

        <div className="codes-toolbar">
          <div className="codes-toolbar-search">
            <select value={selectedCodeId} onChange={(event) => setSelectedCodeId(event.target.value)} aria-label="Select code">
              {codes.map((code) => (
                <option key={code.id} value={code.id}>
                  {code.title} ({code.year})
                </option>
              ))}
            </select>
          </div>
          <div className="codes-toolbar-filter" />
        </div>

        <SearchBar value={search} onChange={setSearch} />

        <section className="active viewer-page">
          <div className="code-browser-container">
            <CodeTree
              chapters={chapters}
              query={search}
              expandedChapters={expandedChapters}
              selectedSectionKey={selectedSectionKey}
              onToggleChapter={toggleChapter}
              onSelectSection={setSelectedSectionKey}
            />
            <Viewer code={selectedCode} chapter={selectedChapter} section={selectedSection} />
          </div>
        </section>
      </div>
    </div>
  )
}
