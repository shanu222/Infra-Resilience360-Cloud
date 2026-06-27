type SearchBarProps = {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-banner">
      <input
        id="librarySearch"
        className="search-input"
        type="text"
        value={value}
        placeholder="Search Codes Library..."
        onChange={(event) => onChange(event.target.value)}
      />
      <button id="pgbc-search-btn" type="button" className="search-button">
        Search
      </button>
    </div>
  )
}
