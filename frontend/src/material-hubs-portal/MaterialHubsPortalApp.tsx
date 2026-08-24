import { MemoryRouter, Route, Routes } from 'react-router'
import { PublicLayout } from './layouts/PublicLayout'
import { AboutPage } from './pages/public/AboutPage'
import { HomePage } from './pages/public/HomePage'
import { HubLocations } from './pages/public/HubLocations'
import { LiveInventory } from './pages/public/LiveInventory'
import { TrainingPortal } from './pages/public/TrainingPortal'

/** Native Material Hub Digital Portal (public routes only, static S3-backed data). */
export function MaterialHubsPortalApp() {
  return (
    <div className="material-hubs-portal-root min-h-0 w-full max-w-full overflow-x-hidden">
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="locations" element={<HubLocations />} />
            <Route path="inventory" element={<LiveInventory />} />
            <Route path="training" element={<TrainingPortal />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </div>
  )
}
