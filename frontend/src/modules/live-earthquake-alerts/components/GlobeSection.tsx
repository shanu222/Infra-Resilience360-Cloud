function GlobeControls() {
  return (
    <div className="tools">
      <button className="tool" id="zoomInBtn" type="button">
        +
      </button>
      <button className="tool" id="zoomOutBtn" type="button">
        −
      </button>
      <button
        className="tool layer-toggle"
        id="layerToggleBtn"
        type="button"
        data-layer="default"
        aria-label="Cycle globe layer"
        title="Default Mode"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 3 3 8l9 5 9-5-9-5z" />
          <path d="m3 12 9 5 9-5" />
          <path d="m3 16 9 5 9-5" />
        </svg>
      </button>
      <button
        className="tool map-toggle"
        id="mapToggleBtn"
        type="button"
        aria-label="Switch to 2D Map"
        title="Switch to 2D Map"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
          <path d="M9 4v14" />
          <path d="M15 6v14" />
        </svg>
      </button>
      <button className="tool" id="resetViewBtn" type="button">
        🌐
      </button>
    </div>
  )
}

function LayerPanel() {
  return (
    <div className="layers-panel" id="layersPanel" aria-label="Layers panel">
      <div className="layers-panel__head">Layers</div>
      <label>
        <span>Base</span>
        <select id="baseLayerSelect" defaultValue="night">
          <option value="night">Earth at Night</option>
          <option value="blue-marble">Blue Marble</option>
          <option value="satellite">Satellite</option>
          <option value="terrain">Terrain</option>
        </select>
      </label>
      <label><input id="layerCountryBorders" type="checkbox" defaultChecked /> Country Borders</label>
      <label><input id="layerPlateBoundaries" type="checkbox" defaultChecked /> Plate Boundaries</label>
      <label><input id="layerFaultLines" type="checkbox" defaultChecked /> Fault Lines</label>
      <label><input id="layerPopulation" type="checkbox" defaultChecked /> Population</label>
      <label><input id="layerCities" type="checkbox" defaultChecked /> Cities</label>
      <label><input id="layerLabels" type="checkbox" defaultChecked /> Labels</label>
      <label><input id="layerRisk" type="checkbox" defaultChecked /> Risk Layers</label>
      <label><input id="layerMarkers" type="checkbox" defaultChecked /> Earthquake Markers</label>
    </div>
  )
}

export default function GlobeSection() {
  return (
    <section className="right card">
      <div className="globe-wrap">
        <div id="globeViz" className="globe" />
        <div id="map2D" className="map2d" aria-label="2D earthquake map" />
        <LayerPanel />
        <GlobeControls />
        <div
          className="impact-popup is-hidden"
          id="impactPopup"
          role="dialog"
          aria-live="polite"
          aria-label="Seismic impact details"
        >
          <div className="impact-title">
            <h4>Seismic Impact Assessment</h4>
            <button className="impact-close" id="impactPopupClose" type="button" aria-label="Close impact popup">
              ×
            </button>
          </div>
          <div className="impact-empty">Click an earthquake marker to view details.</div>
          <div className="impact-arrow" aria-hidden="true" />
        </div>
      </div>
      <div className="mini">World View</div>
    </section>
  )
}
