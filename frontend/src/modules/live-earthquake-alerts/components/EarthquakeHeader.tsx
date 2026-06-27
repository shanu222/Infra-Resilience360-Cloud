function FormulaButton() {
  return (
    <button
      className="btn formula"
      id="formulaBtn"
      type="button"
      title="Open Formula Table"
      aria-label="Open Formula Table"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 6h16" />
        <path d="M4 12h8" />
        <path d="M4 18h12" />
        <path d="M17 10v8" />
        <path d="M13 14h8" />
      </svg>
    </button>
  )
}

export default function EarthquakeHeader() {
  return (
    <div className="header">
      <div className="title">
        <span className="title-icon">📡</span> Earthquake Live Monitor
      </div>
      <div className="status">
        <span className="dot" />
        Live Data <small id="updatedAt">Last Updated: Just Now</small> <small id="refreshCountdown">Next refresh: --</small>
      </div>
      <div className="actions">
        <button className="btn back" id="backBtn" type="button">
          Back
        </button>
        <button className="btn" id="autoRotateBtn" type="button">
          Stop Motion
        </button>
        <button className="btn" id="fullscreenBtn" type="button">
          Fullscreen
        </button>
        <button className="btn primary" id="refreshBtn" type="button">
          Refresh
        </button>
        <FormulaButton />
      </div>
    </div>
  )
}
