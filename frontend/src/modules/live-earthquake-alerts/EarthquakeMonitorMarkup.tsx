import EarthquakeHeader from './components/EarthquakeHeader'
import RecentActivityPanel from './components/RecentActivityPanel'
import GlobeSection from './components/GlobeSection'
import FooterPanels from './components/FooterPanels'
import FormulaModal from './components/FormulaModal'

/** DOM structure mirrored from public/live-earthquake-alerts.html (lines 1339-1494). */
export default function EarthquakeMonitorMarkup() {
  return (
    <div className="page">
      <EarthquakeHeader />
      <div className="layout">
        <RecentActivityPanel />
        <GlobeSection />
      </div>
      <FooterPanels />
      <FormulaModal />
    </div>
  )
}
