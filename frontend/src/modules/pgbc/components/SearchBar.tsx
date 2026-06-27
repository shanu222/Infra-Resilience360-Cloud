type SearchBarProps = {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="codes-toolbar">
      <div className="codes-toolbar-search">
        <input
          id="codeListSearchInput"
          type="text"
          value={value}
          placeholder="Search code title..."
          aria-label="Search codes"
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <div className="codes-toolbar-filter">
        <select id="codeYearFilter" aria-label="Filter by year" disabled>
          <option value="all">All Years</option>
        </select>
      </div>
    </div>
  )
}
