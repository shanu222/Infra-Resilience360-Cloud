function MagnitudeLegend() {
  return (
    <section className="legend card">
      <h3>Magnitude Scale</h3>
      <div className="legend-row">
        <span className="dot-s" style={{ color: '#49aefe' }}>
          •
        </span>
        <span>M &lt; 4.0</span>
        <span className="dot-s" style={{ color: '#e7d73b' }}>
          •
        </span>
        <span>4.0 - 5.0</span>
        <span className="dot-s" style={{ color: '#ff972a' }}>
          •
        </span>
        <span>5.0 - 6.0</span>
        <span className="dot-s" style={{ color: '#ff3553' }}>
          •
        </span>
        <span>&gt; 6.0</span>
      </div>
    </section>
  )
}

function StatisticsPanel() {
  return (
    <section className="stats card">
      <h3>Global Statistics (24h)</h3>
      <div className="stats-grid" id="statsGrid" />
    </section>
  )
}

export default function FooterPanels() {
  return (
    <div className="footer">
      <MagnitudeLegend />
      <StatisticsPanel />
    </div>
  )
}
