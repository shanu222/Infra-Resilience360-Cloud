import type { PgbcChapter, PgbcCode, PgbcSection } from '../types/pgbc'

type ViewerProps = {
  code: PgbcCode | null
  chapter: PgbcChapter | null
  section: PgbcSection | null
}

export default function Viewer({ code, chapter, section }: ViewerProps) {
  const chapterTitle = chapter ? `Chapter ${chapter.number ?? ''} ${chapter.title ?? ''}`.trim() : 'Select a chapter'
  const sectionTitle = section ? `${section.code ?? ''} ${section.title ?? ''}`.trim() : 'Select a section from the tree'

  return (
    <div className="browser-main">
      <div id="browserHeader" style={{ marginBottom: 20, borderBottom: '2px solid #026440', paddingBottom: 15 }}>
        <h2 id="viewerCodeTitle" style={{ margin: '0 0 5px 0', color: '#043617' }}>
          {code?.title ?? 'Code'}
        </h2>
        <p id="viewerCodeSubtitle" style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
          Complete Code Navigation
        </p>
      </div>

      <div id="viewerMainList" className="browser-content-area">
        <h3>{chapterTitle}</h3>
        <p>{sectionTitle}</p>
      </div>

      <div id="viewerActions" className="content-button-group">
        {code?.pdfPath ? (
          <a href={code.pdfPath} target="_blank" rel="noreferrer">
            <button type="button" style={{ background: '#5fc087', color: '#fff' }}>
              👁️ View PDF
            </button>
          </a>
        ) : null}
      </div>
    </div>
  )
}
