import { Outlet, Link, useLocation } from "react-router";
import { Building2, MapPin, Package, GraduationCap, Info } from "lucide-react";
import { useMaterialHubStrings } from "../../i18n/materialHubStrings";

const resolveMaterialHubBackgroundUrl = () => {
  if (typeof window === "undefined") {
    return "/assets/images/material_hub_bg.png";
  }

  const marker = "/material-hubs";
  const markerIndex = window.location.pathname.indexOf(marker);
  const basePath = markerIndex === -1 ? "" : window.location.pathname.slice(0, markerIndex + marker.length);
  return `${basePath}/assets/images/material_hub_bg.png`;
};

export function PublicLayout() {
  const t = useMaterialHubStrings();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const desktopNavBase =
    "relative flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform active:translate-y-[1px] active:scale-[0.99]";
  const desktopNavActive =
    "text-white bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-600 border border-emerald-300/70 ring-1 ring-emerald-200/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_0_rgb(5,120,93),0_12px_22px_rgba(5,120,93,0.35)]";
  const desktopNavIdle =
    "text-slate-700 bg-gradient-to-b from-white to-slate-100/95 border border-slate-300/85 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_3px_0_rgb(203,213,225),0_8px_16px_rgba(15,23,42,0.12)] hover:-translate-y-[2px] hover:text-slate-800 hover:bg-gradient-to-b hover:from-white hover:to-emerald-50 hover:border-emerald-300/80 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_0_rgb(52,211,153),0_12px_20px_rgba(16,185,129,0.22)]";

  const mobileNavBase =
    "relative flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap font-semibold transition-all duration-300 active:translate-y-[1px] active:scale-[0.99]";
  const mobileNavActive =
    "text-white bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-600 border border-emerald-300/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_0_rgb(5,120,93),0_10px_18px_rgba(5,120,93,0.32)]";
  const mobileNavIdle =
    "text-slate-700 bg-gradient-to-b from-white to-slate-100/95 border border-slate-300/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_0_rgb(203,213,225),0_6px_12px_rgba(15,23,42,0.1)] hover:-translate-y-[1px] hover:bg-gradient-to-b hover:from-white hover:to-emerald-50 hover:border-emerald-300/80 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_3px_0_rgb(52,211,153),0_10px_16px_rgba(16,185,129,0.2)]";

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${resolveMaterialHubBackgroundUrl()})` }}
    >
      <div className="min-h-screen w-full bg-white/15">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-emerald-600 to-blue-600 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{t.brandShort}</h1>
                <p className="text-xs text-gray-600">{t.brandSubtitle}</p>
              </div>
            </Link>
            
            <nav className="hidden md:flex space-x-1">
              <Link
                to="/"
                className={`${desktopNavBase} ${
                  isActive('/') 
                    ? desktopNavActive
                    : desktopNavIdle
                }`}
              >
                {t.navHome}
              </Link>
              <Link
                to="/locations"
                className={`${desktopNavBase} ${
                  isActive('/locations') 
                    ? desktopNavActive
                    : desktopNavIdle
                }`}
              >
                <MapPin className="h-4 w-4" />
                <span>{t.navLocations}</span>
              </Link>
              <Link
                to="/inventory"
                className={`${desktopNavBase} ${
                  isActive('/inventory') 
                    ? desktopNavActive
                    : desktopNavIdle
                }`}
              >
                <Package className="h-4 w-4" />
                <span>{t.navInventory}</span>
              </Link>
              <Link
                to="/training"
                className={`${desktopNavBase} ${
                  isActive('/training') 
                    ? desktopNavActive
                    : desktopNavIdle
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                <span>{t.navGuidance}</span>
              </Link>
              <Link
                to="/about"
                className={`${desktopNavBase} ${
                  isActive('/about') 
                    ? desktopNavActive
                    : desktopNavIdle
                }`}
              >
                <Info className="h-4 w-4" />
                <span>{t.navAbout}</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-gray-200 px-4 py-2 flex overflow-x-auto space-x-2">
          <Link
            to="/"
            className={`${mobileNavBase} ${
              isActive('/') 
                ? mobileNavActive
                : mobileNavIdle
            }`}
          >
            <span>{t.navHome}</span>
          </Link>
          <Link
            to="/locations"
            className={`${mobileNavBase} ${
              isActive('/locations') 
                ? mobileNavActive
                : mobileNavIdle
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>{t.navLocationsShort}</span>
          </Link>
          <Link
            to="/inventory"
            className={`${mobileNavBase} ${
              isActive('/inventory') 
                ? mobileNavActive
                : mobileNavIdle
            }`}
          >
            <Package className="h-4 w-4" />
            <span>{t.navInventoryShort}</span>
          </Link>
          <Link
            to="/training"
            className={`${mobileNavBase} ${
              isActive('/training') 
                ? mobileNavActive
                : mobileNavIdle
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>{t.navGuidance}</span>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-4">{t.footerAboutTitle}</h3>
              <p className="text-gray-400 text-sm">{t.footerAboutBody}</p>
            </div>
            <div>
              <h3 className="font-bold mb-4">{t.footerLinksTitle}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/locations" className="text-gray-400 hover:text-white">{t.footerLinkLocations}</Link></li>
                <li><Link to="/inventory" className="text-gray-400 hover:text-white">{t.footerLinkInventory}</Link></li>
                <li><Link to="/training" className="text-gray-400 hover:text-white">{t.footerLinkGuidance}</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white">{t.footerLinkAbout}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">{t.footerContactTitle}</h3>
              <p className="text-gray-400 text-sm whitespace-pre-line">{t.footerContactBody}</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            {t.footerCopyright}
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
