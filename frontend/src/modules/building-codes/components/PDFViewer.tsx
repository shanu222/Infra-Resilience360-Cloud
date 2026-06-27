import type { ChapterNode, CodeCatalogItem, SectionNode } from '../types/pgbc'

type PDFViewerProps = {
  code: CodeCatalogItem | null
  chapter: ChapterNode | null
  section: SectionNode | null
}

export default function PDFViewer({ code, chapter, section }: PDFViewerProps) {
  const chapterTitle = chapter ? `Chapter ${chapter.number ?? ''} ${chapter.title ?? ''}`.trim() : 'Select a chapter'
  const sectionTitle = section ? `${section.code ?? ''} ${section.title ?? ''}`.trim() : 'Select a section from the list'

  return (
    <div className="browser-main">
      <div className="browser-header">
        <h2>{code?.title ?? 'Building Codes'}</h2>
        <p>Complete Code Navigation</p>
      </div>

      <div className="browser-content-area">
        <h3>{chapterTitle}</h3>
        <p>{sectionTitle}</p>
      </div>

      <div className="content-button-group">
        {code?.pdfPath ? (
          <a href={code.pdfPath} target="_blank" rel="noreferrer">
            <button type="button">View PDF</button>
          </a>
        ) : null}
      </div>
    </div>
  )
}
