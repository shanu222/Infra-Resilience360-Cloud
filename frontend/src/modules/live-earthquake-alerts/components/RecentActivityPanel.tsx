export default function RecentActivityPanel() {
  return (
    <aside className="left card">
      <h2>Recent Activity</h2>
      <div className="left-filters">
        <select id="countryFilterSelect" aria-label="Filter by country" defaultValue="all">
          <option value="all">All Countries</option>
        </select>
        <select id="sortFilterSelect" aria-label="Sort earthquakes" defaultValue="latest">
          <option value="latest">Latest</option>
          <option value="strongest">Strongest</option>
          <option value="shallowest">Shallowest</option>
          <option value="deepest">Deepest</option>
        </select>
        <input id="eventSearchInput" type="search" placeholder="Search country or place..." aria-label="Search earthquakes" />
      </div>
      <div className="list-toolbar">
        <label htmlFor="eventDisplayCountSelect" className="list-toolbar-label">
          Display
        </label>
        <select id="eventDisplayCountSelect" className="list-toolbar-select" aria-label="Display earthquake rows" defaultValue="25">
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="all">All</option>
        </select>
      </div>
      <div className="left-head">
        <span>Country</span>
        <span>Magnitude</span>
      </div>
      <div className="events" id="events" />
      <div id="sourceMeta" className="source-meta">
        Source: loading…
      </div>
    </aside>
  )
}
