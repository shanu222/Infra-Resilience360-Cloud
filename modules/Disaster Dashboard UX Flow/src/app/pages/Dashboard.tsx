import { useEffect, useMemo, useState } from 'react';
import { getDisasters } from '../data/disasters';
import { DisasterCard } from '../components/DisasterCard';
import { ShieldAlert } from 'lucide-react';
import PortalBackground from '../components/PortalBackground';
import { useDisasterDashboardStrings } from '../../i18n/disasterDashboardStrings';
import { usePortalLanguage } from '../../i18n/portalLanguage';
import {
  fetchDisasterDashboardPages,
  type DisasterPageSummary,
} from '../../services/disasterDashboardApi';
import { resetDisasterDashboardMediaCache, loadDisasterDashboardMediaFromApi } from '../../utils/guidanceVideoUrls';

export default function Dashboard() {
  const t = useDisasterDashboardStrings();
  const lang = usePortalLanguage();
  const staticDisasters = getDisasters(lang);
  /** `undefined` = loading; `null` = API unreachable → use static list; `[]` = server returned no pages. */
  const [apiPages, setApiPages] = useState<DisasterPageSummary[] | null | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchDisasterDashboardPages();
        if (!cancelled) setApiPages(list);
      } catch {
        if (!cancelled) setApiPages(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    const onFocus = () => {
      resetDisasterDashboardMediaCache();
      void loadDisasterDashboardMediaFromApi();
      setRefreshKey((k) => k + 1);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const displayRows = useMemo(() => {
    const fromStatic = () =>
      staticDisasters.map((d) => ({
        id: d.id,
        name: d.name,
        icon: d.icon,
        color: d.color,
      }));

    if (apiPages === null) {
      return fromStatic();
    }
    if (apiPages !== undefined) {
      if (apiPages.length === 0) {
        console.warn('No hazards found from API, using bundled fallback');
        return fromStatic();
      }
      return apiPages.map((p) => ({
        id: p.hazardId,
        name: p.title,
        icon: String(p.icon ?? 'alert-triangle'),
        color: String(p.cardColorClass ?? 'bg-slate-500'),
      }));
    }
    return fromStatic();
  }, [apiPages, staticDisasters]);

  useEffect(() => {
    console.log('Hazards used (dashboard grid):', displayRows);
  }, [displayRows]);

  return (
    <PortalBackground>
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        {/* Header */}
        <div className="mb-12 text-center lg:mb-14">
          <div className="mb-5 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl shadow-blue-300/40">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1
            className="mb-3 text-3xl font-semibold tracking-tight drop-shadow-sm sm:text-4xl"
            style={{ color: '#f8fafc', textShadow: '0 2px 14px rgba(0,0,0,0.45)' }}
          >
            {t.title}
          </h1>
          <p
            className="mx-auto max-w-2xl text-base leading-relaxed sm:text-lg"
            style={{ color: '#e2e8f0', textShadow: '0 1px 10px rgba(0,0,0,0.35)' }}
          >
            {t.subtitle}
          </p>
        </div>

        {/* Disaster Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {displayRows.map((disaster) => (
            <DisasterCard
              key={disaster.id}
              id={disaster.id}
              name={disaster.name}
              icon={disaster.icon}
              color={disaster.color}
            />
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center lg:mt-14">
          <p className="text-sm font-medium tracking-wide text-slate-500">
            {t.footer}
          </p>
        </div>
      </div>
    </div>
    </PortalBackground>
  );
}
