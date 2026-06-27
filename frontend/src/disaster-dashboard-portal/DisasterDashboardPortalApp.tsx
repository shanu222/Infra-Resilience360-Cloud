import { MemoryRouter, Route, Routes } from 'react-router'
import { Dashboard } from './pages/Dashboard'
import { DisasterDetail } from './pages/DisasterDetail'

/** Disaster Dashboard UX Flow (local content-backed data). */
export function DisasterDashboardPortalApp() {
  return (
    <div className="disaster-dashboard-portal-root min-h-0 w-full max-w-full overflow-x-hidden">
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/disaster/:id" element={<DisasterDetail />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    </div>
  )
}
