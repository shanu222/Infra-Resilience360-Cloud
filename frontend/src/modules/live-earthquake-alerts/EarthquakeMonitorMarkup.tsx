import EarthquakeHeader from './components/EarthquakeHeader'
import RecentActivityPanel from './components/RecentActivityPanel'
import GlobeSection from './components/GlobeSection'
import FooterPanels from './components/FooterPanels'
import FormulaModal from './components/FormulaModal'

function MobileViewToggle() {
  return (
    <div className="mobile-view-toggle" role="tablist" aria-label="Mobile earthquake view switcher">
      <button id="mobileEventsViewBtn" className="mobile-view-toggle-btn is-active" type="button" role="tab" aria-selected="true">
        Recent Events
      </button>
      <button id="mobileGlobeViewBtn" className="mobile-view-toggle-btn" type="button" role="tab" aria-selected="false">
        Globe View
      </button>
    </div>
  )
}

/** DOM structure mirrored from public/live-earthquake-alerts.html (lines 1339-1494). */
export default function EarthquakeMonitorMarkup() {
  return (
    <div className="page">
      <EarthquakeHeader />
      <MobileViewToggle />
      <div className="layout">
        <RecentActivityPanel />
        <GlobeSection />
      </div>
      <FooterPanels />
      <FormulaModal />
    </div>
  )
}
