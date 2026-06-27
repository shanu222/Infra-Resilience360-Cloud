export default function FormulaModal() {
  return (
    <div className="formula-modal" id="formulaModal">
      <div className="formula-modal-card" role="dialog" aria-modal="true" aria-labelledby="formulaModalTitle">
        <div className="formula-modal-head">
          <h3 id="formulaModalTitle">🧮 Seismic Logic & Formula</h3>
          <button className="btn back" id="formulaModalCloseBtn" type="button">
            Close
          </button>
        </div>
        <div className="formula-list">
          <div className="formula-item">
            <h4>Primary Radius</h4>
            <code>R₁ (km) = max(2, 10 + 8×(M - 5) - 0.15×DepthKm)</code>
          </div>
          <div className="formula-item">
            <h4>Secondary Radius</h4>
            <code>R₂ (km) = R₁ × 1.8</code>
          </div>
          <div className="formula-item">
            <h4>Felt Radius</h4>
            <code>Rfelt (km) = R₁ × 3.2</code>
          </div>
          <div className="formula-item">
            <h4>Affected Area</h4>
            <code>Area (km²) = π × (R₂)²</code>
          </div>
          <div className="formula-item">
            <h4>Population Estimate</h4>
            <code>Population = Math.round(population)</code>
            <div className="formula-note" id="formulaPopulationNote">
              Population is computed from the Pakistan population raster when available.
            </div>
          </div>
          <div className="formula-item">
            <h4>Building Estimate</h4>
            <code>Buildings ≈ OSM way count inside impact zones</code>
          </div>
          <div className="formula-item">
            <h4>Building Count Logic</h4>
            <code>Buildings = count(way[&quot;building&quot;]) from Overpass API</code>
            <div className="formula-breakdown">
              <code>
                Area (km²): <span className="formula-value" id="formulaAreaValue">--</span>
              </code>
              <code>
                Building Source: <span className="formula-value" id="formulaBuildingDensityValue">--</span>
              </code>
              <code id="formulaBuildingResult">Buildings = --</code>
            </div>
            <div className="formula-note" id="formulaDensitySource">
              Waiting for live OSM building query.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
