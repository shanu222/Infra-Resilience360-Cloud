import { Outlet, Link, useLocation } from 'react-router'
import { MapPin, Package, GraduationCap, Info } from 'lucide-react'
import { useMaterialHubStrings } from '@/hooks/useMaterialHubStrings'
import { usePortalLanguage } from '@/context/PortalLanguageContext'

export function PublicLayout() {
  const location = useLocation()
  const s = useMaterialHubStrings()
  const lang = usePortalLanguage()
  const isUrdu = lang === 'ur'

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden mh-portal-shell" dir={isUrdu ? 'rtl' : 'ltr'}>
      <header className="mh-glass-header sticky top-0 z-50 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3 min-w-0">
              <span className="h-10 w-10 shrink-0" aria-hidden />
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900">{s.brandShort}</h1>
                <p className="text-xs text-gray-600 truncate">{s.brandSubtitle}</p>
              </div>
            </Link>

            <nav className="hidden md:flex space-x-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isActive('/') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {s.navHome}
              </Link>
              <Link
                to="/locations"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/locations') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MapPin className="h-4 w-4" />
                <span>{s.navLocations}</span>
              </Link>
              <Link
                to="/inventory"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/inventory') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Package className="h-4 w-4" />
                <span>{s.navInventory}</span>
              </Link>
              <Link
                to="/training"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/training') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                <span>{s.navTraining}</span>
              </Link>
              <Link
                to="/about"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/about') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Info className="h-4 w-4" />
                <span>{s.navAbout}</span>
              </Link>
            </nav>

          </div>
        </div>

        <nav className="md:hidden border-t border-gray-200 px-3 py-2 flex flex-wrap gap-2 max-w-full">
          <Link
            to="/"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap ${
              isActive('/') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>{s.navHome}</span>
          </Link>
          <Link
            to="/locations"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap ${
              isActive('/locations') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>{s.navLocationsShort}</span>
          </Link>
          <Link
            to="/inventory"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap ${
              isActive('/inventory') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>{s.navInventoryShort}</span>
          </Link>
          <Link
            to="/training"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap ${
              isActive('/training') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>{s.navTraining}</span>
          </Link>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="mh-glass-footer text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-4">{s.footerAboutTitle}</h3>
              <p className="text-gray-400 text-sm whitespace-pre-line">{s.footerAboutBody}</p>
            </div>
            <div>
              <h3 className="font-bold mb-4">{s.footerLinksTitle}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/locations" className="text-gray-400 hover:text-white">
                    {s.footerLinkLocations}
                  </Link>
                </li>
                <li>
                  <Link to="/inventory" className="text-gray-400 hover:text-white">
                    {s.footerLinkInventory}
                  </Link>
                </li>
                <li>
                  <Link to="/training" className="text-gray-400 hover:text-white">
                    {s.footerLinkTraining}
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-400 hover:text-white">
                    {s.footerLinkAbout}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">{s.footerContactTitle}</h3>
              <p className="text-gray-400 text-sm whitespace-pre-line">{s.footerContactBody}</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">{s.footerCopyright}</div>
        </div>
      </footer>
    </div>
  )
}
