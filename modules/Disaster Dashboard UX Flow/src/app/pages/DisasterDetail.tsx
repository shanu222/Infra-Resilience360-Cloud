import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getDisasters } from '../data/disasters';
import type { Disaster, Guidance } from '../data/disasters';
import * as LucideIcons from 'lucide-react';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import PortalBackground from '../components/PortalBackground';
import { DisasterGuidance, type DisasterGuidanceStructured } from '../components/DisasterGuidance';
import { useDisasterDashboardStrings } from '../../i18n/disasterDashboardStrings';
import { usePortalLanguage, type PortalLang } from '../../i18n/portalLanguage';
import {
  defaultPageIdForHazard,
  fetchDisasterDashboardPage,
  type DisasterDashboardPageDoc,
} from '../../services/disasterDashboardApi';
import { loadDisasterDashboardMediaFromApi, resetDisasterDashboardMediaCache, toWebSafeUrl } from '../../utils/guidanceVideoUrls';

type DisasterDetailTheme = {
  iconGradient: string;
  iconRing: string;
  cardTint: string;
  cardBorder: string;
  cardShadow: string;
  timelineLine: string;
  timelineDot: string;
  timelineYear: string;
  seasonalIcon: string;
  seasonalActive: string;
  seasonalInactive: string;
  guidanceButton: string;
  guidanceIcon: string;
  guidanceChevron: string;
};

const DETAIL_THEMES: Record<string, DisasterDetailTheme> = {
  flood: {
    iconGradient: 'from-sky-500 to-blue-600',
    iconRing: 'ring-blue-100',
    cardTint: 'from-sky-50/85 to-blue-100/70',
    cardBorder: 'border-blue-200/80',
    cardShadow: 'shadow-blue-200/65',
    timelineLine: 'border-blue-200',
    timelineDot: 'bg-blue-600',
    timelineYear: 'text-blue-700',
    seasonalIcon: 'text-blue-600',
    seasonalActive: 'bg-blue-500 text-white shadow-blue-300/60',
    seasonalInactive: 'bg-blue-50/60 text-blue-200',
    guidanceButton: 'hover:bg-blue-50/70',
    guidanceIcon: 'from-blue-500 to-indigo-600',
    guidanceChevron: 'text-blue-300'
  },
  earthquake: {
    iconGradient: 'from-orange-500 to-red-500',
    iconRing: 'ring-orange-100',
    cardTint: 'from-orange-50/85 to-red-100/65',
    cardBorder: 'border-orange-200/80',
    cardShadow: 'shadow-orange-200/60',
    timelineLine: 'border-orange-200',
    timelineDot: 'bg-orange-600',
    timelineYear: 'text-orange-700',
    seasonalIcon: 'text-orange-600',
    seasonalActive: 'bg-orange-500 text-white shadow-orange-300/60',
    seasonalInactive: 'bg-orange-50/60 text-orange-200',
    guidanceButton: 'hover:bg-orange-50/70',
    guidanceIcon: 'from-orange-500 to-red-500',
    guidanceChevron: 'text-orange-300'
  },
  'urban-fire': {
    iconGradient: 'from-red-500 to-rose-600',
    iconRing: 'ring-red-100',
    cardTint: 'from-red-50/85 to-rose-100/65',
    cardBorder: 'border-red-200/80',
    cardShadow: 'shadow-red-200/60',
    timelineLine: 'border-red-200',
    timelineDot: 'bg-red-600',
    timelineYear: 'text-red-700',
    seasonalIcon: 'text-red-600',
    seasonalActive: 'bg-red-500 text-white shadow-red-300/60',
    seasonalInactive: 'bg-red-50/60 text-red-200',
    guidanceButton: 'hover:bg-red-50/70',
    guidanceIcon: 'from-red-500 to-orange-500',
    guidanceChevron: 'text-red-300'
  },
  'crop-fire': {
    iconGradient: 'from-amber-500 to-orange-500',
    iconRing: 'ring-amber-100',
    cardTint: 'from-amber-50/85 to-orange-100/65',
    cardBorder: 'border-amber-200/80',
    cardShadow: 'shadow-amber-200/65',
    timelineLine: 'border-amber-200',
    timelineDot: 'bg-amber-600',
    timelineYear: 'text-amber-700',
    seasonalIcon: 'text-amber-600',
    seasonalActive: 'bg-amber-500 text-white shadow-amber-300/60',
    seasonalInactive: 'bg-amber-50/60 text-amber-200',
    guidanceButton: 'hover:bg-amber-50/70',
    guidanceIcon: 'from-amber-500 to-orange-500',
    guidanceChevron: 'text-amber-300'
  },
  heatwave: {
    iconGradient: 'from-yellow-400 to-orange-500',
    iconRing: 'ring-yellow-100',
    cardTint: 'from-yellow-50/85 to-orange-100/65',
    cardBorder: 'border-yellow-200/80',
    cardShadow: 'shadow-yellow-200/65',
    timelineLine: 'border-yellow-200',
    timelineDot: 'bg-yellow-500',
    timelineYear: 'text-yellow-700',
    seasonalIcon: 'text-yellow-600',
    seasonalActive: 'bg-yellow-500 text-white shadow-yellow-300/60',
    seasonalInactive: 'bg-yellow-50/60 text-yellow-200',
    guidanceButton: 'hover:bg-yellow-50/70',
    guidanceIcon: 'from-yellow-500 to-orange-500',
    guidanceChevron: 'text-yellow-300'
  },
  'load-shedding': {
    iconGradient: 'from-violet-500 to-indigo-600',
    iconRing: 'ring-violet-100',
    cardTint: 'from-violet-50/85 to-indigo-100/65',
    cardBorder: 'border-violet-200/80',
    cardShadow: 'shadow-violet-200/60',
    timelineLine: 'border-violet-200',
    timelineDot: 'bg-violet-600',
    timelineYear: 'text-violet-700',
    seasonalIcon: 'text-violet-600',
    seasonalActive: 'bg-violet-500 text-white shadow-violet-300/60',
    seasonalInactive: 'bg-violet-50/60 text-violet-200',
    guidanceButton: 'hover:bg-violet-50/70',
    guidanceIcon: 'from-violet-500 to-indigo-600',
    guidanceChevron: 'text-violet-300'
  },
  'storm-cyclone': {
    iconGradient: 'from-indigo-500 to-blue-600',
    iconRing: 'ring-indigo-100',
    cardTint: 'from-indigo-50/85 to-blue-100/70',
    cardBorder: 'border-indigo-200/80',
    cardShadow: 'shadow-indigo-200/60',
    timelineLine: 'border-indigo-200',
    timelineDot: 'bg-indigo-600',
    timelineYear: 'text-indigo-700',
    seasonalIcon: 'text-indigo-600',
    seasonalActive: 'bg-indigo-500 text-white shadow-indigo-300/60',
    seasonalInactive: 'bg-indigo-50/60 text-indigo-200',
    guidanceButton: 'hover:bg-indigo-50/70',
    guidanceIcon: 'from-indigo-500 to-blue-600',
    guidanceChevron: 'text-indigo-300'
  },
  landslide: {
    iconGradient: 'from-amber-700 to-stone-600',
    iconRing: 'ring-amber-100',
    cardTint: 'from-amber-50/85 to-stone-100/65',
    cardBorder: 'border-amber-200/80',
    cardShadow: 'shadow-amber-200/60',
    timelineLine: 'border-amber-200',
    timelineDot: 'bg-amber-700',
    timelineYear: 'text-amber-800',
    seasonalIcon: 'text-amber-700',
    seasonalActive: 'bg-amber-700 text-white shadow-amber-300/60',
    seasonalInactive: 'bg-amber-50/60 text-amber-200',
    guidanceButton: 'hover:bg-amber-50/70',
    guidanceIcon: 'from-amber-700 to-stone-600',
    guidanceChevron: 'text-amber-300'
  },
  'cold-wave': {
    iconGradient: 'from-cyan-500 to-blue-600',
    iconRing: 'ring-cyan-100',
    cardTint: 'from-cyan-50/85 to-blue-100/65',
    cardBorder: 'border-cyan-200/80',
    cardShadow: 'shadow-cyan-200/60',
    timelineLine: 'border-cyan-200',
    timelineDot: 'bg-cyan-600',
    timelineYear: 'text-cyan-700',
    seasonalIcon: 'text-cyan-600',
    seasonalActive: 'bg-cyan-500 text-white shadow-cyan-300/60',
    seasonalInactive: 'bg-cyan-50/60 text-cyan-200',
    guidanceButton: 'hover:bg-cyan-50/70',
    guidanceIcon: 'from-cyan-500 to-blue-600',
    guidanceChevron: 'text-cyan-300'
  },
  smog: {
    iconGradient: 'from-slate-500 to-gray-600',
    iconRing: 'ring-slate-100',
    cardTint: 'from-slate-50/85 to-gray-100/65',
    cardBorder: 'border-slate-200/80',
    cardShadow: 'shadow-slate-200/60',
    timelineLine: 'border-slate-200',
    timelineDot: 'bg-slate-600',
    timelineYear: 'text-slate-700',
    seasonalIcon: 'text-slate-600',
    seasonalActive: 'bg-slate-500 text-white shadow-slate-300/60',
    seasonalInactive: 'bg-slate-100 text-slate-300',
    guidanceButton: 'hover:bg-slate-50/70',
    guidanceIcon: 'from-slate-500 to-gray-600',
    guidanceChevron: 'text-slate-300'
  }
};

const DASHBOARD_BACK_BUTTON_CLASS =
  'inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold text-white bg-gradient-to-b from-indigo-400 via-blue-500 to-cyan-600 border border-cyan-300/75 transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_rgb(8,98,146),0_10px_20px_rgba(8,98,146,0.35)] hover:-translate-y-[2px] hover:from-indigo-300 hover:via-blue-400 hover:to-cyan-500 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_5px_0_rgb(8,98,146),0_14px_24px_rgba(8,98,146,0.42)] active:translate-y-[1px] active:scale-[0.99]';

function normalizeGuidanceFromContent(raw: unknown): Guidance | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const phase = (arr: unknown): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'text' in item) {
        return String((item as { text?: string }).text ?? '');
      }
      return '';
    });
  };
  return {
    before: phase(o.before),
    during: phase(o.during),
    after: phase(o.after),
  };
}

function mergeDisasterWithPage(staticD: Disaster, page: DisasterDashboardPageDoc | null, lang: PortalLang): Disaster {
  if (!page) return staticD;
  const c = (page.content || {}) as Record<string, unknown>;
  const isUr = lang === 'ur';
  const cmsGuidance = normalizeGuidanceFromContent(c.guidance);
  const guidance: Guidance =
    !isUr && cmsGuidance && (cmsGuidance.before.length || cmsGuidance.during.length || cmsGuidance.after.length)
      ? cmsGuidance
      : staticD.guidance;

  const pickStr = (v: unknown, fallback: string) => {
    if (typeof v !== 'string') return fallback;
    const t = v.trim();
    return t.length > 0 ? v : fallback;
  };

  return {
    ...staticD,
    name: isUr ? staticD.name : pickStr(page.title, staticD.name),
    description: isUr ? staticD.description : pickStr(c.description, staticD.description),
    icon: pickStr(c.icon, staticD.icon),
    timeline: Array.isArray(c.timeline) && (c.timeline as unknown[]).length > 0 ? (c.timeline as Disaster['timeline']) : staticD.timeline,
    seasonalPeriod: isUr ? staticD.seasonalPeriod : pickStr(c.seasonalPeriod, staticD.seasonalPeriod),
    seasonalMonths:
      Array.isArray(c.seasonalMonths) && (c.seasonalMonths as unknown[]).length > 0
        ? (c.seasonalMonths as number[])
        : staticD.seasonalMonths,
    guidance,
    color: pickStr(c.cardColorClass, staticD.color),
  };
}

export default function DisasterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = useDisasterDashboardStrings();
  const lang = usePortalLanguage();
  const disasters = getDisasters(lang);
  const [cmsPage, setCmsPage] = useState<DisasterDashboardPageDoc | null | undefined>(undefined);
  const [detailRefresh, setDetailRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const pageId = id ? defaultPageIdForHazard(id) : '';
    if (!pageId) {
      setCmsPage(null);
      return;
    }
    void (async () => {
      try {
        const doc = await fetchDisasterDashboardPage(pageId);
        if (!cancelled) setCmsPage(doc);
      } catch {
        if (!cancelled) setCmsPage(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, detailRefresh]);

  useEffect(() => {
    const onFocus = () => {
      resetDisasterDashboardMediaCache();
      void loadDisasterDashboardMediaFromApi();
      setDetailRefresh((k) => k + 1);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const staticDisaster = disasters.find(d => d.id === id);

  const disaster = useMemo(() => {
    if (!staticDisaster) return undefined;
    if (cmsPage === undefined) return staticDisaster;
    return mergeDisasterWithPage(staticDisaster, cmsPage, lang);
  }, [staticDisaster, cmsPage, lang]);

  if (!staticDisaster) {
    return (
      <PortalBackground>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-gray-900 mb-2">{t.detail.disasterNotFound}</h2>
          <button 
            onClick={() => navigate('/')}
            className={DASHBOARD_BACK_BUTTON_CLASS}
          >
            {t.detail.returnToDashboard}
          </button>
        </div>
      </div>
      </PortalBackground>
    );
  }

  const iconSlug = String(disaster.icon ?? 'alert-triangle').trim() || 'alert-triangle';
  const IconComponent = (LucideIcons as Record<string, ComponentType<{ className?: string }>>)[
    iconSlug.split('-').map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) :
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('')
  ] || LucideIcons.AlertTriangle;

  const monthNames = t.monthsShort;
  const theme = DETAIL_THEMES[disaster.id] ?? DETAIL_THEMES.flood;
  const timeline = Array.isArray(disaster.timeline) ? disaster.timeline : [];
  const seasonalMonths = Array.isArray(disaster.seasonalMonths) ? disaster.seasonalMonths : [];

  const pageContent = cmsPage && cmsPage.content && typeof cmsPage.content === 'object' ? cmsPage.content : null;
  const gm =
    pageContent && typeof pageContent.guidanceMedia === 'object' && pageContent.guidanceMedia
      ? (pageContent.guidanceMedia as Record<string, string>)
      : null;
  const cm =
    pageContent &&
    !Array.isArray(pageContent.media) &&
    typeof pageContent.media === 'object' &&
    pageContent.media
      ? (pageContent.media as Record<string, string>)
      : null;
  const pickMedia = (a?: string, b?: string) => {
    const first = toWebSafeUrl(String(a ?? '').trim());
    if (first) return first;
    const second = toWebSafeUrl(String(b ?? '').trim());
    return second ?? '';
  };
  const mergedGuidanceMedia = {
    image: pickMedia(cm?.image, gm?.image),
    video: pickMedia(cm?.video, gm?.video),
    audio: pickMedia(cm?.audio, gm?.audio),
  };
  const styles = cmsPage?.styles && typeof cmsPage.styles === 'object' ? (cmsPage.styles as Record<string, string>) : null;
  const textTone = styles?.textColor ? { color: styles.textColor } : undefined;

  return (
    <PortalBackground
      backgroundImage={pageContent ? String(pageContent.backgroundImage ?? '') : ''}
      backgroundVideo={pageContent ? String(pageContent.backgroundVideo ?? '') : ''}
    >
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className={`${DASHBOARD_BACK_BUTTON_CLASS} mb-6`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t.detail.backToDashboard}</span>
        </button>

        {/* Header */}
        <div
          className={`rounded-2xl border ${theme.cardBorder} bg-gradient-to-br ${theme.cardTint} shadow-lg ${theme.cardShadow} backdrop-blur-md p-8 mb-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl`}
          style={styles?.primaryColor ? { borderColor: styles.primaryColor } : undefined}
        >
          <div className="flex items-start gap-6">
            <div
              className={`bg-gradient-to-br ${theme.iconGradient} ring-4 ${theme.iconRing} w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md`}
              style={
                styles?.primaryColor
                  ? { backgroundImage: `linear-gradient(135deg, ${styles.primaryColor}, ${styles.secondaryColor || styles.primaryColor})` }
                  : undefined
              }
            >
              <IconComponent className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-slate-900 mb-3 font-bold" style={textTone}>
                {disaster.name}
              </h1>
              <p className="text-slate-700 leading-relaxed" style={textTone}>
                {disaster.description}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className={`rounded-2xl border ${theme.cardBorder} bg-gradient-to-br ${theme.cardTint} shadow-lg ${theme.cardShadow} backdrop-blur-md p-8 mb-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl`}>
          <div className="flex items-center gap-3 mb-6">
            <Clock className={`w-6 h-6 ${theme.timelineYear}`} />
            <h2 className="text-slate-900">{t.detail.pakistanHistory}</h2>
          </div>
          <div className="space-y-4">
            {timeline.map((event, index) => (
              <div key={index} className={`flex items-center gap-4 pl-4 border-l-2 ${theme.timelineLine}`}>
                <div className={`w-3 h-3 ${theme.timelineDot} rounded-full shadow-sm -ml-[25px]`}></div>
                <div className="flex-1 py-2">
                  <div className="flex items-baseline gap-3">
                    <span className={`${theme.timelineYear} font-mono`}>{event.year}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-slate-700">{event.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seasonal Period Section */}
        <div className={`rounded-2xl border ${theme.cardBorder} bg-gradient-to-br ${theme.cardTint} shadow-lg ${theme.cardShadow} backdrop-blur-md p-8 mb-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl`}>
          <div className="flex items-center gap-3 mb-6">
            <Calendar className={`w-6 h-6 ${theme.seasonalIcon}`} />
            <h2 className="text-slate-900">{t.detail.seasonalPeriod}</h2>
          </div>
          <p className="text-slate-700 mb-6">{disaster.seasonalPeriod}</p>
          
          {/* Month Calendar Strip */}
          <div className="grid grid-cols-12 gap-2">
            {monthNames.map((month, index) => {
              const isActive = seasonalMonths.includes(index);
              return (
                <div
                  key={month}
                  className={`text-center py-3 rounded-lg transition-all ${
                    isActive
                      ? `${theme.seasonalActive} shadow-md scale-105`
                      : `${theme.seasonalInactive}`
                  }`}
                >
                  <div className="text-xs font-medium">{month}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Guidance Section */}
        <DisasterGuidance
          disaster={disaster.id}
          disasterName={disaster.name}
          guidance={disaster.guidance}
          guidanceStructured={
            lang === 'en' && pageContent?.guidance && typeof pageContent.guidance === 'object'
              ? (pageContent.guidance as DisasterGuidanceStructured)
              : undefined
          }
          mediaOverride={
            mergedGuidanceMedia.image || mergedGuidanceMedia.video || mergedGuidanceMedia.audio
              ? mergedGuidanceMedia
              : undefined
          }
          strings={t.guidanceUi}
        />

        {/* Emergency Note */}
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <LucideIcons.Phone className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-red-900 mb-1">{t.detail.emergencyTitle}</h4>
              <p className="text-red-700 text-sm">{t.detail.emergencyLine}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PortalBackground>
  );
}
