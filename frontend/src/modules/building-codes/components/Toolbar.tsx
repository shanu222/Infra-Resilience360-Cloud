import type { CodeCatalogItem } from '../types/pgbc'

type ToolbarProps = {
  codes: CodeCatalogItem[]
  selectedCodeId: string
  onSelectCode: (value: string) => void
}

export default function Toolbar({ codes, selectedCodeId, onSelectCode }: ToolbarProps) {
  return (
    <div className="codes-toolbar">
      <div className="codes-toolbar-search">
        <select value={selectedCodeId} onChange={(event) => onSelectCode(event.target.value)} aria-label="Select code">
          {codes.map((code) => (
            <option key={code.id} value={code.id}>
              {code.title} ({code.year})
            </option>
          ))}
        </select>
      </div>
      <div className="codes-toolbar-filter">
        <select aria-label="Filter by year" disabled>
          <option value="all">All Years</option>
        </select>
      </div>
    </div>
  )
}
