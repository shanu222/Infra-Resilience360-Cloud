import {
  getBothPopulations as getLocalPopulationEstimate,
  loadPopulationData as loadLocalPopulationData,
} from '../live-earthquake/services/populationService'
import { EARTHQUAKE_ALERT_SOUND_DATA_URI } from '../../assets/audio/earthquakeAlertSound'

/**
 * Extracted from public/live-earthquake-alerts.html and adapted for native React mounting.
 */
export function initLiveEarthquakeMonitor(root) {
    if (!root || root.__eqMonitorBooted) {
      return function noopDispose() {}
    }
    root.__eqMonitorBooted = true
    root.classList.add('eq-embed')
    document.documentElement.classList.add('eq-embed')

    var nativeGetElementById = document.getElementById.bind(document)
    var nativeQuerySelector = document.querySelector.bind(document)
    var nativeQuerySelectorAll = document.querySelectorAll.bind(document)

    document.getElementById = function (id) {
      return root.querySelector('#' + id) || nativeGetElementById(id)
    }
    document.querySelector = function (selector) {
      if (typeof selector !== 'string') return nativeQuerySelector(selector)
      return root.querySelector(selector) || nativeQuerySelector(selector)
    }
    document.querySelectorAll = function (selector) {
      var scoped = root.querySelectorAll(selector)
      if (scoped.length) return scoped
      return nativeQuerySelectorAll(selector)
    }

    var disposeFn = function () {}


      const REGION_COUNTRIES = ['Pakistan', 'India', 'Afghanistan', 'Iran', 'China'];
      const REGION_BOUNDS = {
        minLat: 20,
        maxLat: 40,
        minLng: 60,
        maxLng: 100,
      };
      const COUNTRY_BOUNDS = [
        { name: 'Pakistan', minLat: 23, maxLat: 37, minLng: 60, maxLng: 77 },
        { name: 'India', minLat: 8, maxLat: 37, minLng: 68, maxLng: 97 },
        { name: 'Afghanistan', minLat: 29, maxLat: 38, minLng: 60, maxLng: 75 },
        { name: 'Iran', minLat: 24, maxLat: 40, minLng: 44, maxLng: 64 },
        { name: 'China', minLat: 18, maxLat: 54, minLng: 73, maxLng: 135 },
      ];
      const TRACKED_COUNTRIES = COUNTRY_BOUNDS.map((item) => item.name);
      const EARTHQUAKE_LIVE_ENDPOINT = '/api/earthquake/live';
      const EARTHQUAKE_CACHE_FALLBACKS = [
        '/storage/cache/earthquake/latest.json',
        '/data/earthquake/latest.json',
      ];
      const ALERT_SOUND_URL = EARTHQUAKE_ALERT_SOUND_DATA_URI;
      const ALERT_SETTINGS_KEY = 'r360-earthquake-alert-settings';
      const NOTIFIED_EVENT_IDS_KEY = 'r360-earthquake-notified-ids';
      const LIVE_EVENTS_CACHE_KEY = 'r360-earthquake-last-good-features';
      const NOTIFICATION_PERMISSION_KEY = 'r360-earthquake-notify-permission';
      const PENDING_FOCUS_EVENT_KEY = 'r360-earthquake-focus-event';
      const NOTIFIED_EVENT_MAX_AGE_MS = 6 * 60 * 60 * 1000;

      async function fetchLocalJson(path) {
        const response = await fetch(path, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Local dataset request failed (${response.status}) for ${path}`);
        return response.json();
      }

      async function fetchJsonWithTimeout(url, timeoutMs = LIVE_FETCH_TIMEOUT_MS) {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
          if (!response.ok) throw new Error(`Request failed (${response.status}) for ${url}`);
          return response.json();
        } finally {
          window.clearTimeout(timer);
        }
      }
      const GLOBE_TEXTURES = {
        night: '/vendor/earth-night.jpg',
        'blue-marble': '/vendor/earth-blue-marble.jpg',
        satellite: '/vendor/earth-day.jpg',
        terrain: '/vendor/earth-topology.png',
      };
      const LOCAL_BUILDING_COUNT = 0;
      const MAX_PAKISTAN_BUILDINGS = 2500;
      const MAX_IMPACT_QUERY_RADIUS_METERS = 180000;
      const LIVE_REFRESH_MS = 60000;
      const LIVE_FETCH_TIMEOUT_MS = 16000;
      const MAX_FETCH_RETRIES = 2;
      const DEFAULT_GLOBE_ALTITUDE = 1.7;
      const FOCUS_GLOBE_ALTITUDE = 1.5;
      const MIN_GLOBE_ALTITUDE = 0.85;
      const MAX_GLOBE_ALTITUDE = 2.8;

      function eqLang() {
        try {
          const dataLang = document.documentElement.dataset.r360Lang;
          if (dataLang === 'ur' || dataLang === 'en') return dataLang;
          const stored = sessionStorage.getItem('r360-portal-lang');
          if (stored === 'ur' || stored === 'en') return stored;
          return new URLSearchParams(window.location.search).get('lang') === 'ur' ? 'ur' : 'en';
        } catch {
          return 'en';
        }
      }

      const EQ_I18N = {
        en: {
          docTitle: 'Live Earthquake Alerts',
          headerTitle: 'Earthquake Live Monitor',
          statusLive: 'Live Data',
          lastUpdated: 'Last Updated:',
          justNow: 'Just Now',
          back: 'Back',
          motionStop: 'Stop Motion',
          motionStart: 'Start Motion',
          fullscreen: 'Fullscreen',
          refresh: 'Refresh',
          refreshLoading: 'Refreshing...',
          formulaTitle: 'Open Formula Table',
          recentActivity: 'Recent Activity',
          locationsTab: 'Locations',
          country: 'Country',
          magnitude: 'Magnitude',
          live: 'Live',
          sourceLoading: 'Source: loading…',
          sourceLive: 'Source: live feed',
          sourceUnavailable: 'Source: unavailable',
          displayLabel: 'Display',
          allLabel: 'All',
          mobileRecentEvents: 'Recent Events',
          mobileGlobeView: 'Globe View',
          recentActivityCollapse: 'Collapse Recent Activity',
          recentActivityExpand: 'Expand Recent Activity',
          buildingsLoading: 'Buildings: loading',
          buildingsUnavailable: 'Buildings: unavailable',
          buildingsLabel: 'Buildings:',
          statsTotal: 'Total Events',
          statsAvg: 'Avg. Magnitude',
          statsLargest: 'Largest',
          statsLocations: 'Locations',
          statsCountries: 'Countries',
          magnitudeScale: 'Magnitude Scale',
          globalStats: 'Global Statistics (24h)',
          worldView: 'World View',
          impactTitle: 'Seismic Impact Assessment',
          impactEmpty: 'Click an earthquake marker to view details.',
          map2dLabel: '2D earthquake map',
          layerCycle: 'Cycle globe layer',
          defaultMode: 'Default Mode',
          switch2d: 'Switch to 2D Map',
          switch3d: 'Switch to 3D Globe',
          layerDefault: 'Default Mode',
          layerHeatmap: 'Heatmap Mode',
          layerSatellite: 'Satellite Mode',
          close: 'Close',
          formulaModalTitle: '🧮 Seismic Logic & Formula',
          formulaPopNote: 'Population is computed from the Pakistan population raster when available.',
          formulaWaitOsm: 'Waiting for live OSM building query.',
          unknownLocation: 'Unknown location',
          unknown: 'Unknown',
          primarySecondaryOuter: 'Primary {p}, Secondary {s}, Outer {o}',
          populationComputed: 'Population is computed from the Pakistan population raster when available.',
          buildingsEq: 'Buildings = {n}',
          waitingOsm: 'Waiting for live OSM building query.',
          buildingSourceShort: 'OSM Overpass API',
          buildingSourceLong: 'OSM Overpass API (way count)',
          noActiveQuakes: 'No active earthquakes',
          stateLiveSuffix: 'live',
        },
        ur: {
          docTitle: 'زلزلے کی براہ راست انتباہات',
          headerTitle: 'زلزلہ براہ راست نگرانی',
          statusLive: 'براہ راست ڈیٹا',
          lastUpdated: 'آخری اپ ڈیٹ:',
          justNow: 'ابھی',
          back: 'واپس',
          motionStop: 'حرکت روکیں',
          motionStart: 'حرکت شروع کریں',
          fullscreen: 'پوری سکرین',
          refresh: 'تازہ کریں',
          refreshLoading: 'تازہ ہو رہا ہے...',
          formulaTitle: 'فارمولہ کی جدول کھولیں',
          recentActivity: 'حالیہ سرگرمی',
          locationsTab: 'مقامات',
          country: 'ملک',
          magnitude: 'شدت',
          live: 'براہ راست',
          sourceLoading: 'ماخذ: لوڈ ہو رہا ہے…',
          sourceLive: 'ماخذ: براہ راست فیڈ',
          sourceUnavailable: 'ماخذ: دستیاب نہیں',
          displayLabel: 'دکھائیں',
          allLabel: 'تمام',
          mobileRecentEvents: 'حالیہ واقعات',
          mobileGlobeView: 'گلوب منظر',
          recentActivityCollapse: 'حالیہ سرگرمی بند کریں',
          recentActivityExpand: 'حالیہ سرگرمی کھولیں',
          buildingsLoading: 'عمارتیں: لوڈ',
          buildingsUnavailable: 'عمارتیں: دستیاب نہیں',
          buildingsLabel: 'عمارتیں:',
          statsTotal: 'کل واقعات',
          statsAvg: 'اوسط شدت',
          statsLargest: 'سب سے بڑا',
          statsLocations: 'مقامات',
          statsCountries: 'ممالک',
          magnitudeScale: 'شدت کا پیمانہ',
          globalStats: 'عالمی اعداد (۲۴ گھنٹے)',
          worldView: 'عالمی منظر',
          impactTitle: 'زلزلے کے اثر کی تشخیص',
          impactEmpty: 'تفصیل کے لیے زلزلے کا نشان منتخب کریں۔',
          map2dLabel: '۲ ڈی زلزلہ نقشہ',
          layerCycle: 'گلوب کی تہہ تبدیل کریں',
          defaultMode: 'طے شدہ موڈ',
          switch2d: '۲ ڈی نقشے پر جائیں',
          switch3d: '۳ ڈی گلوب پر جائیں',
          layerDefault: 'طے شدہ موڈ',
          layerHeatmap: 'ہیٹ میپ موڈ',
          layerSatellite: 'سیٹلائٹ موڈ',
          close: 'بند کریں',
          formulaModalTitle: '🧮 زلزلی منطق اور فارمولا',
          formulaPopNote: 'آبادی پاکستان کی آبادی راسٹر سے نکالی جاتی ہے جب دستیاب ہو۔',
          formulaWaitOsm: 'او ایس ایم عمارت کے استفسار کا انتظار۔',
          unknownLocation: 'نامعلوم مقام',
          unknown: 'نامعلوم',
          primarySecondaryOuter: 'ابتدائی {p}، ثانوی {s}، بیرونی {o}',
          populationComputed: 'آبادی پاکستان کی آبادی راسٹر سے نکالی جاتی ہے جب دستیاب ہو۔',
          buildingsEq: 'عمارتیں = {n}',
          waitingOsm: 'او ایس ایم عمارت کے استفسار کا انتظار۔',
          buildingSourceShort: 'OSM Overpass API',
          buildingSourceLong: 'OSM Overpass API (way count)',
          noActiveQuakes: 'کوئی فعال زلزلہ نہیں',
          stateLiveSuffix: 'براہ راست',
        },
      };

      function eqT(key) {
        const pack = EQ_I18N[eqLang()] || EQ_I18N.en;
        return pack[key] !== undefined ? pack[key] : EQ_I18N.en[key];
      }

      function applyEqStaticLabels() {
        const isUr = eqLang() === 'ur';
        if (isUr) {
          document.documentElement.setAttribute('lang', 'ur-PK');
          document.documentElement.setAttribute('dir', 'rtl');
        } else {
          document.documentElement.setAttribute('lang', 'en');
          document.documentElement.removeAttribute('dir');
        }
        document.title = eqT('docTitle');
        const titleEl = document.querySelector('.page .header .title');
        if (titleEl) titleEl.innerHTML = '<span class="title-icon">📡</span> ' + eqT('headerTitle');
        const st = document.querySelector('.page .header .status');
        if (st) {
          st.innerHTML =
            '<span class="dot"></span> ' +
            eqT('statusLive') +
            ' <small id="updatedAt">' +
            eqT('lastUpdated') +
            ' ' +
            eqT('justNow') +
            '</small>';
        }
        const setTxt = (id, text) => {
          const el = document.getElementById(id);
          if (el) el.textContent = text;
        };
        setTxt('backBtn', eqT('back'));
        setTxt('autoRotateBtn', eqT('motionStop'));
        setTxt('fullscreenBtn', eqT('fullscreen'));
        setRefreshButtonState(false);
        const formulaBtn = document.getElementById('formulaBtn');
        if (formulaBtn) {
          formulaBtn.setAttribute('title', eqT('formulaTitle'));
          formulaBtn.setAttribute('aria-label', eqT('formulaTitle'));
        }
        const asideH = document.querySelector('.left.card h2');
        if (asideH) asideH.textContent = eqT('recentActivity');
        const recentHead = document.querySelector('.left-head');
        if (recentHead) {
          recentHead.innerHTML = '<span>' + eqT('country') + '</span><span>' + eqT('magnitude') + '</span>';
        }
        const displayLabel = document.querySelector('.list-toolbar-label');
        if (displayLabel) displayLabel.textContent = eqT('displayLabel');
        setTxt('mobileEventsViewBtn', eqT('mobileRecentEvents'));
        setTxt('mobileGlobeViewBtn', eqT('mobileGlobeView'));
        updateRecentActivityToggle();
        const displaySelect = document.getElementById('eventDisplayCountSelect');
        if (displaySelect) {
          Array.from(displaySelect.options || []).forEach((option) => {
            if (String(option.value) === 'all') {
              option.textContent = eqT('allLabel');
            }
          });
        }
        setTxt('sourceMeta', eqT('sourceLoading'));
        const impactPopup = document.getElementById('impactPopup');
        if (impactPopup) {
          const h4 = impactPopup.querySelector('.impact-title h4');
          if (h4) h4.textContent = eqT('impactTitle');
          const empty = impactPopup.querySelector('.impact-empty');
          if (empty) empty.textContent = eqT('impactEmpty');
        }
        const map2d = document.getElementById('map2D');
        if (map2d) map2d.setAttribute('aria-label', eqT('map2dLabel'));
        const legendH = document.querySelector('.legend.card h3');
        if (legendH) legendH.textContent = eqT('magnitudeScale');
        const statsH = document.querySelector('.stats.card > h3');
        if (statsH) statsH.textContent = eqT('globalStats');
        const mini = document.querySelector('.right.card .mini');
        if (mini) mini.textContent = eqT('worldView');
        setTxt('formulaModalTitle', eqT('formulaModalTitle'));
        setTxt('formulaModalCloseBtn', eqT('close'));
        const fp = document.getElementById('formulaPopulationNote');
        if (fp) fp.textContent = eqT('formulaPopNote');
        const fds = document.getElementById('formulaDensitySource');
        if (fds) fds.textContent = eqT('formulaWaitOsm');
      }

      function setRefreshButtonState(isLoading) {
        const refreshBtn = document.getElementById('refreshBtn');
        if (!refreshBtn) return;
        refreshBtn.textContent = isLoading ? eqT('refreshLoading') : eqT('refresh');
        refreshBtn.disabled = Boolean(isLoading);
        refreshBtn.setAttribute('aria-busy', isLoading ? 'true' : 'false');
        refreshBtn.classList.toggle('is-loading', Boolean(isLoading));
      }

      function setMobilePanelView(nextView) {
        mobilePanelView = nextView === 'globe' ? 'globe' : 'events';
        const pageEl = root.querySelector('.page');
        if (!pageEl) return;
        pageEl.classList.remove('mobile-panel-events', 'mobile-panel-globe');

        const eventsBtn = document.getElementById('mobileEventsViewBtn');
        const globeBtn = document.getElementById('mobileGlobeViewBtn');
        const isEventsView = mobilePanelView === 'events';
        if (eventsBtn) {
          eventsBtn.classList.toggle('is-active', isEventsView);
          eventsBtn.setAttribute('aria-selected', isEventsView ? 'true' : 'false');
        }
        if (globeBtn) {
          globeBtn.classList.toggle('is-active', !isEventsView);
          globeBtn.setAttribute('aria-selected', isEventsView ? 'false' : 'true');
        }
        resizeGlobeViewport();
        if (is2DMap) scheduleLeafletInvalidate();
      }

      function updateRecentActivityToggle() {
        const aside = root.querySelector('.left.card');
        const toggle = document.getElementById('recentActivityToggleBtn');
        if (!aside || !toggle) return;
        const collapsed = aside.classList.contains('is-collapsed');
        toggle.textContent = collapsed ? eqT('recentActivityExpand') : eqT('recentActivityCollapse');
        toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      }

      function stripTrailingSlash(value) {
        return String(value || '').replace(/\/+$/, '');
      }

      function resolveApiBaseUrl() {
        const globalBase = stripTrailingSlash(String(window.__R360_API_BASE_URL || window.__API_BASE_URL || ''));
        if (globalBase) return globalBase;
        const envBase = stripTrailingSlash(String(window.__ENV__?.VITE_API_BASE_URL || ''));
        if (envBase) return envBase;
        return 'https://infra-resilience360-cloud-production.up.railway.app';
      }

      function buildApiTargets(path) {
        const apiBase = resolveApiBaseUrl();
        if (!apiBase) return [];
        return [`${apiBase}${path}`];
      }

      async function requestJsonWithFallback(path, options = {}) {
        const targets = buildApiTargets(path);
        let lastError = null;

        for (const target of targets) {
          try {
            const response = await fetch(target, options);
            const payload = await response.json().catch(() => null);
            if (!response.ok) {
              lastError = new Error(String(payload?.error || `Request failed (${response.status})`));
              continue;
            }
            return payload;
          } catch (error) {
            if (error?.name === 'AbortError') throw error;
            lastError = error;
          }
        }

        throw lastError || new Error('Network request failed.');
      }

      function normalizeBuildingHeight(tags) {
        const rawHeight = Number.parseFloat(String(tags?.height || '').replace(/[^\d.\-]/g, ''));
        if (Number.isFinite(rawHeight) && rawHeight > 0) return rawHeight;

        const levels = Number.parseFloat(String(tags?.['building:levels'] || '').replace(/[^\d.\-]/g, ''));
        if (Number.isFinite(levels) && levels > 0) return levels * 3;

        return 10;
      }

      function convertToGeoJSON(osmData) {
        const elements = Array.isArray(osmData?.elements) ? osmData.elements : [];
        const nodeMap = new Map();
        for (const el of elements) {
          if (el?.type === 'node' && Number.isFinite(el.lat) && Number.isFinite(el.lon)) {
            nodeMap.set(el.id, [Number(el.lon), Number(el.lat)]);
          }
        }

        const features = [];
        for (const el of elements) {
          if (el?.type !== 'way' || !el?.tags?.building) continue;

          let ring = [];
          if (Array.isArray(el.geometry) && el.geometry.length) {
            ring = el.geometry
              .map((point) => {
                const lat = Number(point?.lat);
                const lon = Number(point?.lon);
                if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
                return [lon, lat];
              })
              .filter(Boolean);
          } else if (Array.isArray(el.nodes) && el.nodes.length) {
            ring = el.nodes.map((nodeId) => nodeMap.get(nodeId)).filter(Boolean);
          }

          if (ring.length < 3) continue;

          const first = ring[0];
          const last = ring[ring.length - 1];
          if (!first || !last) continue;
          if (first[0] !== last[0] || first[1] !== last[1]) {
            ring.push([first[0], first[1]]);
          }

          features.push({
            type: 'Feature',
            properties: {
              id: el.id,
              height: normalizeBuildingHeight(el.tags || {}),
            },
            geometry: {
              type: 'Polygon',
              coordinates: [ring],
            },
          });
        }

        return {
          type: 'FeatureCollection',
          features,
        };
      }

      function renderBuildings(globeInstance, buildings) {
        if (!globeInstance) return;

        globeInstance
          .polygonsData(buildings)
          .polygonCapColor(() => 'rgba(78, 148, 255, 0.34)')
          .polygonSideColor(() => 'rgba(124, 186, 255, 0.2)')
          .polygonStrokeColor(() => 'rgba(14, 34, 66, 0.9)')
          .polygonAltitude((d) => {
            const h = Number(d?.properties?.height || 10);
            return Math.max(0.0008, Math.min(0.03, h / 12000));
          });
      }

      async function loadPakistanBuildings(globeInstance) {
        if (!globeInstance || globeInstance.__pakBuildingsLoaded || globeInstance.__pakBuildingsLoading) return;
        globeInstance.__pakBuildingsLoading = true;

        try {
          const sourceMeta = document.getElementById('sourceMeta');
          globeInstance.__pakBuildingsLoaded = true;
          if (sourceMeta) {
            sourceMeta.textContent = `${sourceLabelText || eqT('sourceLive')} · ${eqT('buildingsLabel')} ${LOCAL_BUILDING_COUNT.toLocaleString()}`;
          }
        } catch (error) {
          void error;
          const sourceMeta = document.getElementById('sourceMeta');
          if (sourceMeta)
            sourceMeta.textContent = `${sourceLabelText || eqT('sourceLive')} · ${eqT('buildingsUnavailable')}`;
        } finally {
          globeInstance.__pakBuildingsLoading = false;
        }
      }

      let globe = null;
      let quakeRows = [];
      let selectedId = null;
      let currentAltitude = DEFAULT_GLOBE_ALTITUDE;
      let eventsData = [];
      let activeGlobeLayer = 'night';
      let globeLayerTransitionTimer = null;
      let layerToggleController = null;
      let selectedImpactEvent = null;
      let filteredEvents = [];
      let selectedCountryFilter = 'all';
      let selectedSortFilter = 'latest';
      let eventSearchQuery = '';
      let selectedDisplayCount = '25';
      let refreshCountdownTimer = null;
      let nextRefreshAt = Date.now() + LIVE_REFRESH_MS;
      let alertSettings = {
        enabled: true,
        soundEnabled: true,
        threshold: 5.0,
      };
      let latestImpactAssessment = null;
      const impactBuildingCache = new Map();
      const IMPACT_BUILDING_CACHE_MAX = 48;

      function impactBuildingCacheSet(key, value) {
        impactBuildingCache.set(key, value);
        while (impactBuildingCache.size > IMPACT_BUILDING_CACHE_MAX) {
          const oldest = impactBuildingCache.keys().next().value;
          impactBuildingCache.delete(oldest);
        }
      }
      const defaultCenter = { lat: 20, lng: 15 };
      let isAutoRotateEnabled = true;
      let is2DMap = false;
      let selectedEarthquake = null;
      let globeResizeObserver = null;
      let leafletMap = null;
      let leafletLayerGroup = null;
      let leafletBaseTileLayer = null;
      let leafletBaseOverlayGroup = null;
      let leafletCountryOverlay = null;
      let leafletPlateOverlay = null;
      let leafletFaultOverlay = null;
      let mapOverlayLoadPromise = null;
      const LEAFLET_OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const defaultMapCenter = [30, 70];
      const defaultMapZoom = 4;
      let populationDataLoaded = false;
      let loadingPopulation = false;
      let refreshTimer = null;
      let refreshRetryTimer = null;
      let refreshInFlight = false;
      let activeLoadController = null;
      let pendingRefreshReason = '';
      let consecutiveLoadFailures = 0;
      function readLastGoodFeatures() {
        try {
          const raw = localStorage.getItem(LIVE_EVENTS_CACHE_KEY);
          if (!raw) return [];
          const parsed = JSON.parse(raw);
          const features = Array.isArray(parsed?.features) ? parsed.features : [];
          return dedupeEarthquakeFeatures(features);
        } catch {
          return [];
        }
      }

      function persistLastGoodFeatures(features) {
        try {
          localStorage.setItem(
            LIVE_EVENTS_CACHE_KEY,
            JSON.stringify({ updatedAt: Date.now(), features: dedupeEarthquakeFeatures(features).slice(0, 500) })
          );
        } catch {
          // ignore local storage write failures
        }
      }

      let lastGoodFeatures = readLastGoodFeatures();
      let sourceLabelText = eqT('sourceLoading');
      let pageDisposed = false;
      let globeControls = null;
      const disposeCallbacks = [];
      let alertAudio = null;
      let notificationPermissionRequested = false;
      const notifiedEventIds = new Map();
      let layerSettings = {
        countryBorders: true,
        plateBoundaries: true,
        faultLines: true,
        population: true,
        cities: true,
        labels: true,
        risk: true,
        markers: true,
      };
      let globeCountryBoundaryPaths = [];
      let globePlateBoundaryPaths = [];
      let globeFaultLinePaths = [];
      let globeOverlayDataLoaded = false;
      let globeOverlayDataLoading = null;
      let mobilePanelView = 'events';
      let lastGlobeViewportWidth = 0;
      let lastGlobeViewportHeight = 0;
      let globeResizeRaf = null;
      let globeCameraClampInProgress = false;
      let globeDeferredInitRaf = null;
      let globeDeferredInitRetries = 0;

      const COUNTRY_FILTER_OPTIONS = [
        'Pakistan', 'India', 'China', 'Afghanistan', 'Iran', 'Turkey', 'Indonesia', 'Japan', 'United States',
        'Chile', 'Mexico', 'Italy', 'Greece', 'Philippines', 'New Zealand', 'Other',
      ];

      function loadNotifiedEventIds() {
        try {
          const raw = localStorage.getItem(NOTIFIED_EVENT_IDS_KEY);
          const parsed = raw ? JSON.parse(raw) : [];
          const now = Date.now();
          if (!Array.isArray(parsed)) return;
          parsed.slice(-800).forEach((entry) => {
            if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
              const key = String(entry.id || '').trim();
              const ts = Number(entry.ts || 0);
              if (key && Number.isFinite(ts) && now - ts <= NOTIFIED_EVENT_MAX_AGE_MS) {
                notifiedEventIds.set(key, ts);
              }
              return;
            }
            const key = String(entry || '').trim();
            if (key) notifiedEventIds.set(key, now);
          });
        } catch {
          // Ignore malformed local storage payload.
        }
      }

      function persistNotifiedEventIds() {
        try {
          const now = Date.now();
          const rows = Array.from(notifiedEventIds.entries())
            .filter(([, ts]) => Number.isFinite(ts) && now - ts <= NOTIFIED_EVENT_MAX_AGE_MS)
            .slice(-800)
            .map(([id, ts]) => ({ id, ts }));
          localStorage.setItem(NOTIFIED_EVENT_IDS_KEY, JSON.stringify(rows));
        } catch {
          // Ignore storage quota issues.
        }
      }

      function loadAlertSettings() {
        try {
          const raw = localStorage.getItem(ALERT_SETTINGS_KEY);
          const parsed = raw ? JSON.parse(raw) : {};
          alertSettings = {
            enabled: parsed?.enabled !== false,
            soundEnabled: parsed?.soundEnabled !== false,
            threshold: Number.isFinite(Number(parsed?.threshold))
              ? Math.max(4, Number(parsed.threshold))
              : 5.0,
          };
        } catch {
          alertSettings = { enabled: true, soundEnabled: true, threshold: 5.0 };
        }
      }

      function persistAlertSettings() {
        try {
          localStorage.setItem(ALERT_SETTINGS_KEY, JSON.stringify(alertSettings));
        } catch {
          // Ignore storage quota issues.
        }
      }

      function updateAlertSettings(patch) {
        alertSettings = {
          enabled: patch?.enabled !== undefined ? Boolean(patch.enabled) : alertSettings.enabled,
          soundEnabled: patch?.soundEnabled !== undefined ? Boolean(patch.soundEnabled) : alertSettings.soundEnabled,
          threshold: patch?.threshold !== undefined
            ? Math.max(4, Number(patch.threshold) || 5)
            : alertSettings.threshold,
        };
        persistAlertSettings();
      }

      async function ensureNotificationPermission() {
        if (typeof Notification === 'undefined') return 'unsupported';
        if (Notification.permission === 'granted') return 'granted';
        if (Notification.permission === 'denied') return 'denied';
        if (notificationPermissionRequested) return Notification.permission;
        notificationPermissionRequested = true;
        try {
          const permission = await Notification.requestPermission();
          localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission);
          return permission;
        } catch {
          return Notification.permission;
        }
      }

      function ensureAlertAudio() {
        if (alertAudio) return alertAudio;
        alertAudio = new Audio(ALERT_SOUND_URL);
        alertAudio.preload = 'auto';
        return alertAudio;
      }

      function playAlertSound() {
        if (!alertSettings.soundEnabled) return;
        try {
          const sound = ensureAlertAudio();
          sound.currentTime = 0;
          void sound.play().catch(() => {});
        } catch {
          // Ignore autoplay restrictions.
        }
      }

      function showInAppToast(message) {
        const host = root.querySelector('.page');
        if (!host) return;
        const existing = root.querySelector('.eq-alert-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'eq-alert-toast';
        toast.textContent = message;
        host.appendChild(toast);
        window.setTimeout(() => toast.classList.add('is-visible'), 10);
        window.setTimeout(() => {
          toast.classList.remove('is-visible');
          window.setTimeout(() => toast.remove(), 260);
        }, 3200);
      }

      function buildLiveEarthquakeUrl(eventId) {
        try {
          const current = new URL(window.location.href);
          const basePath = current.pathname.replace(/\/view\/[a-z0-9-]+(?:\/.*)?$/i, '').replace(/\/+$/, '') || '/';
          const next = new URL(current.origin + (basePath === '/' ? '' : basePath) + '/view/live-earthquake-map');
          next.searchParams.set('eqEventId', String(eventId || '').trim());
          return `${next.pathname}${next.search}`;
        } catch {
          return `/view/live-earthquake-map?eqEventId=${encodeURIComponent(String(eventId || '').trim())}`;
        }
      }

      function persistPendingFocusEvent(eventItem) {
        if (!eventItem?.id) return;
        try {
          localStorage.setItem(
            PENDING_FOCUS_EVENT_KEY,
            JSON.stringify({
              id: String(eventItem.id),
              ts: Date.now(),
              lat: Number(eventItem.lat),
              lng: Number(eventItem.lng),
            }),
          );
        } catch {
          /* ignore storage write errors */
        }
      }

      async function notifyEarthquakeEvent(eventItem) {
        const title = '🌍 Significant Earthquake Detected';
        const minutesAgo = Number.isFinite(eventItem.time) ? Math.max(0, Math.floor((Date.now() - eventItem.time) / 60000)) : 0;
        const timeText = minutesAgo <= 1 ? eqT('justNow') : `${minutesAgo}m ago`;
        const depthText = Number.isFinite(eventItem.depthKm) ? `${eventItem.depthKm.toFixed(1)} km` : '-- km';
        const targetUrl = buildLiveEarthquakeUrl(eventItem.id);
        const body = `Magnitude ${eventItem.mag.toFixed(1)}\nLocation: ${eventItem.place}\nDepth: ${depthText}\nOccurred ${timeText}`;
        const options = {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: String(eventItem.id),
          requireInteraction: Number(eventItem.mag) >= 6.5,
          data: {
            eventId: String(eventItem.id),
            targetUrl,
          },
        };
        try {
          if ('serviceWorker' in navigator && document.hidden) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration?.showNotification) {
              await registration.showNotification(title, options);
              return;
            }
          }
          const n = new Notification(title, options);
          n.onclick = () => {
            persistPendingFocusEvent(eventItem);
            try {
              window.focus();
            } catch {
              /* ignore focus errors */
            }
            window.location.assign(targetUrl);
          };
        } catch {
          /* ignore notification delivery failures */
        }
      }

      function maybeNotifyForNewEvents(features) {
        if (!alertSettings.enabled) return;
        if (!Array.isArray(features) || features.length === 0) return;
        const now = Date.now();
        const notifyThreshold = Math.max(5, Number(alertSettings.threshold || 5));
        for (const [id, ts] of Array.from(notifiedEventIds.entries())) {
          if (!Number.isFinite(ts) || now - ts > NOTIFIED_EVENT_MAX_AGE_MS) {
            notifiedEventIds.delete(id);
          }
        }
        const candidates = features
          .map((item) => {
            const id = String(item?.id ?? '').trim();
            const mag = Number(item?.properties?.mag ?? 0);
            const time = Number(item?.properties?.time ?? 0);
            if (!id || !Number.isFinite(mag) || mag < notifyThreshold) return null;
            if (notifiedEventIds.has(id)) return null;
            if (!Number.isFinite(time) || now - time > 24 * 60 * 60 * 1000) return null;
            return {
              id,
              mag,
              place: String(item?.properties?.place ?? eqT('unknownLocation')),
              country: countryFromPlace(item?.properties?.place ?? ''),
              time,
              depthKm: Number(item?.geometry?.coordinates?.[2] ?? 0),
            };
          })
          .filter(Boolean)
          .sort((a, b) => Number(b.time) - Number(a.time));

        if (candidates.length === 0) return;

        candidates.forEach((eventItem) => {
          notifiedEventIds.set(eventItem.id, now);
          persistPendingFocusEvent(eventItem);
          showInAppToast(`M${eventItem.mag.toFixed(1)} · ${eventItem.country}`);
          const permission = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
          if (permission === 'granted') {
            void notifyEarthquakeEvent(eventItem);
            playAlertSound();
          }
        });
      function readPendingFocusEventId() {
        try {
          const fromQuery = new URL(window.location.href).searchParams.get('eqEventId');
          if (fromQuery) return String(fromQuery).trim();
        } catch {
          /* ignore URL parsing errors */
        }
        try {
          const raw = localStorage.getItem(PENDING_FOCUS_EVENT_KEY);
          if (!raw) return '';
          const parsed = JSON.parse(raw);
          const id = String(parsed?.id || '').trim();
          const ts = Number(parsed?.ts || 0);
          if (!id || !Number.isFinite(ts) || Date.now() - ts > NOTIFIED_EVENT_MAX_AGE_MS) return '';
          return id;
        } catch {
          return '';
        }
      }

      function clearPendingFocusEvent() {
        try {
          localStorage.removeItem(PENDING_FOCUS_EVENT_KEY);
        } catch {
          /* ignore storage errors */
        }
      }

      function applyPendingFocus(features) {
        const wantedId = readPendingFocusEventId();
        if (!wantedId) return;
        const matched = features.find((item) => String(item?.id || '') === wantedId);
        if (!matched) return;
        selectEvent(wantedId);
        clearPendingFocusEvent();
      }


        persistNotifiedEventIds();
      }

      function addDisposeCallback(fn) {
        if (typeof fn !== 'function') return;
        disposeCallbacks.push(fn);
      }

      function clearLiveTimers() {
        if (activeLoadController) {
          try {
            activeLoadController.abort();
          } catch {
            /* ignore abort errors */
          }
          activeLoadController = null;
        }
        if (refreshTimer) {
          window.clearInterval(refreshTimer);
          refreshTimer = null;
        }
        if (refreshCountdownTimer) {
          window.clearInterval(refreshCountdownTimer);
          refreshCountdownTimer = null;
        }
        if (refreshRetryTimer) {
          window.clearTimeout(refreshRetryTimer);
          refreshRetryTimer = null;
        }
        if (resizeGlobeViewportTimer) {
          window.clearTimeout(resizeGlobeViewportTimer);
          resizeGlobeViewportTimer = null;
        }
        if (globeLayerTransitionTimer) {
          window.clearTimeout(globeLayerTransitionTimer);
          globeLayerTransitionTimer = null;
        }
        if (impactPopupPositionRaf) {
          window.cancelAnimationFrame(impactPopupPositionRaf);
          impactPopupPositionRaf = null;
        }
      }

      function disposeEarthquakePage() {
        if (pageDisposed) return;
        pageDisposed = true;
        clearLiveTimers();
        pendingRefreshReason = '';
        while (disposeCallbacks.length > 0) {
          const cb = disposeCallbacks.pop();
          try {
            cb && cb();
          } catch {
            /* ignore dispose callback failure */
          }
        }
        if (globeControls && typeof globeControls.removeEventListener === 'function') {
          try {
            globeControls.removeEventListener('change', positionImpactPopup);
          } catch {
            /* ignore */
          }
        }
        globeControls = null;
        destroyLeafletMap();
      }

      const populationDensityMap = {
        Karachi: 24000,
        Lahore: 13000,
        Islamabad: 2200,
        Rawalpindi: 4800,
        Peshawar: 3500,
        Quetta: 800,
        Gilgit: 50,
        Skardu: 60,
        DefaultUrban: 5000,
        DefaultRural: 300,
      };

      async function loadPopulationRaster() {
        try {
          await loadLocalPopulationData();
          populationDataLoaded = true;
        } catch (error) {
          populationDataLoaded = false;
          void error;
        }
      }

      const usStateNames = new Set([
        'alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','west virginia','wisconsin','wyoming','district of columbia'
      ]);
      const usStateAbbr = new Set(['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']);
      const caProvinceNames = new Set(['alberta','british columbia','manitoba','new brunswick','newfoundland and labrador','northwest territories','nova scotia','nunavut','ontario','prince edward island','quebec','saskatchewan','yukon']);
      const caProvinceAbbr = new Set(['AB','BC','MB','NB','NL','NT','NS','NU','ON','PE','QC','SK','YT']);
      const countryAlias = {
        usa: 'United States',
        'u.s.a.': 'United States',
        'u.s.': 'United States',
        us: 'United States',
        uk: 'United Kingdom',
        uae: 'United Arab Emirates',
        russia: 'Russia',
        korea: 'South Korea',
        'south korea': 'South Korea',
        'north korea': 'North Korea',
      };

      const regionDisplay = typeof Intl !== 'undefined' && Intl.DisplayNames
        ? new Intl.DisplayNames(['en'], { type: 'region' })
        : null;

      function getAllCountries() {
        if (!regionDisplay || !Intl.supportedValuesOf) return [];
        try {
          return Intl.supportedValuesOf('region')
            .map((code) => regionDisplay.of(code))
            .filter((name) => Boolean(name) && typeof name === 'string' && !/^\d+$/.test(name))
            .sort((a, b) => a.localeCompare(b));
        } catch {
          return [];
        }
      }

      const allCountries = getAllCountries();
      const knownCountriesByLower = new Map(
        allCountries
          .filter((name) => typeof name === 'string' && String(name).trim())
          .map((name) => [String(name).toLowerCase(), String(name)])
      );
      const knownCountryLowerSet = new Set(knownCountriesByLower.keys());
      const countryAliasValues = new Set(Object.values(countryAlias).map((value) => String(value).toLowerCase()));

      function selectedQuakeRings(selected) {
        if (!selected) return [];

        return [
          {
            id: `${selected.id}-ring-a`,
            lat: selected.lat,
            lng: selected.lng,
            color: '#ff2a45',
            maxRadius: 5.2,
            speed: 2.2,
            period: 900,
          },
          {
            id: `${selected.id}-ring-b`,
            lat: selected.lat,
            lng: selected.lng,
            color: '#ff5f52',
            maxRadius: 4.2,
            speed: 1.8,
            period: 760,
          },
          {
            id: `${selected.id}-ring-c`,
            lat: selected.lat,
            lng: selected.lng,
            color: '#ff9a6a',
            maxRadius: 3.4,
            speed: 1.55,
            period: 620,
          },
        ];
      }

      function getVisibleEarthquakes() {
        const filteredMode = selectedCountryFilter !== 'all' || eventSearchQuery.trim().length > 0;
        if (!selectedEarthquake) return filteredMode ? filteredEvents : eventsData;
        if (!filteredMode) return eventsData.filter((item) => item.id === selectedEarthquake.id);
        return filteredEvents.filter((item) => item.id === selectedEarthquake.id);
      }

      function clearSelection() {
        selectedEarthquake = null;
        selectedId = null;
        selectedImpactEvent = null;
        latestImpactAssessment = null;
        for (const row of quakeRows) row.classList.remove('selected');
        hideImpactPopup();
        refreshPointsAppearance();
        if (is2DMap) {
          render2DMap();
        } else if (globe) {
          safePointOfView({ ...defaultCenter, altitude: DEFAULT_GLOBE_ALTITUDE }, 600);
        }
      }

      function setSelectedEarthquake(eventItem) {
        selectedEarthquake = eventItem || null;
        selectedId = selectedEarthquake ? selectedEarthquake.id : null;
        selectedImpactEvent = selectedEarthquake;

        for (const row of quakeRows) {
          row.classList.toggle('selected', row.dataset.id === selectedId);
        }

        refreshPointsAppearance();
        if (selectedEarthquake && !is2DMap && globe) {
          safePointOfView(
            { lat: selectedEarthquake.lat, lng: selectedEarthquake.lng, altitude: FOCUS_GLOBE_ALTITUDE },
            1000,
          );
        }
        if (is2DMap) {
          render2DMap();
        }
      }

      const LOCAL_MAP_GEOJSON = [
        '/maps/world.geojson',
        '/maps/countries.geojson',
        '/maps/fault-lines.geojson',
        '/maps/tectonic.geojson',
      ];

      function localOverlayStyle(feature, layerKind = 'country') {
        const geomType = String(feature?.geometry?.type || '').toLowerCase();
        const isVisible = layerKind === 'country'
          ? layerSettings.countryBorders
          : layerKind === 'plate'
            ? layerSettings.plateBoundaries
            : layerSettings.faultLines;
        const visibilityOpacity = isVisible ? 1 : 0;
        if (geomType.includes('line')) {
          return {
            color: '#4a90d9',
            weight: 1.2,
            opacity: 0.55 * visibilityOpacity,
          };
        }
        return {
          color: '#3c6ea5',
          weight: 1,
          opacity: 0.42 * visibilityOpacity,
          fillColor: '#0f2748',
          fillOpacity: 0.08 * visibilityOpacity,
        };
      }

      async function loadLocalMapOverlays() {
        if (!leafletMap || !leafletBaseOverlayGroup || typeof L === 'undefined') return;
        if (mapOverlayLoadPromise) return mapOverlayLoadPromise;

        mapOverlayLoadPromise = (async () => {
          for (const path of LOCAL_MAP_GEOJSON) {
            try {
              const geoJson = await fetchLocalJson(path);
              if (!geoJson) continue;
              const layerKind = path.includes('fault') ? 'fault' : path.includes('tectonic') ? 'plate' : 'country';
              const targetGroup = layerKind === 'fault'
                ? leafletFaultOverlay
                : layerKind === 'plate'
                  ? leafletPlateOverlay
                  : leafletCountryOverlay;
              L.geoJSON(geoJson, {
                style: (feature) => localOverlayStyle(feature, layerKind),
              }).addTo(targetGroup || leafletBaseOverlayGroup);
            } catch {
              // Keep map usable even if one local layer is unavailable.
            }
          }
        })();

        return mapOverlayLoadPromise;
      }

      function refreshMapOverlayVisibility() {
        if (leafletCountryOverlay && typeof leafletCountryOverlay.eachLayer === 'function') {
          leafletCountryOverlay.eachLayer((layer) => {
            if (typeof layer.setStyle === 'function') {
              layer.setStyle(localOverlayStyle(layer.feature, 'country'));
            }
          });
        }
        if (leafletPlateOverlay && typeof leafletPlateOverlay.eachLayer === 'function') {
          leafletPlateOverlay.eachLayer((layer) => {
            if (typeof layer.setStyle === 'function') {
              layer.setStyle(localOverlayStyle(layer.feature, 'plate'));
            }
          });
        }
        if (leafletFaultOverlay && typeof leafletFaultOverlay.eachLayer === 'function') {
          leafletFaultOverlay.eachLayer((layer) => {
            if (typeof layer.setStyle === 'function') {
              layer.setStyle(localOverlayStyle(layer.feature, 'fault'));
            }
          });
        }
      }

      function toPathCoords(coords) {
        return (Array.isArray(coords) ? coords : [])
          .map((pair) => ({
            lng: Number(pair?.[0]),
            lat: Number(pair?.[1]),
          }))
          .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
      }

      function featureToPaths(feature) {
        const geometry = feature?.geometry;
        const type = String(geometry?.type || '');
        const coords = geometry?.coordinates;
        if (type === 'LineString') {
          const points = toPathCoords(coords);
          return points.length > 1 ? [points] : [];
        }
        if (type === 'MultiLineString') {
          return (Array.isArray(coords) ? coords : [])
            .map((line) => toPathCoords(line))
            .filter((line) => line.length > 1);
        }
        if (type === 'Polygon') {
          const outer = Array.isArray(coords) ? coords[0] : [];
          const points = toPathCoords(outer);
          return points.length > 2 ? [points] : [];
        }
        if (type === 'MultiPolygon') {
          return (Array.isArray(coords) ? coords : [])
            .map((poly) => toPathCoords(Array.isArray(poly) ? poly[0] : []))
            .filter((line) => line.length > 2);
        }
        return [];
      }

      async function ensureGlobeOverlayData() {
        if (globeOverlayDataLoaded) return;
        if (globeOverlayDataLoading) return globeOverlayDataLoading;
        globeOverlayDataLoading = (async () => {
          try {
            const [countriesData, platesData, faultsData] = await Promise.all([
              fetchLocalJson('/maps/countries.geojson'),
              fetchLocalJson('/maps/tectonic.geojson'),
              fetchLocalJson('/maps/fault-lines.geojson'),
            ]);
            const toRecords = (features, kind, color) =>
              (Array.isArray(features) ? features : [])
                .flatMap((feature) => featureToPaths(feature))
                .map((coords, index) => ({ id: `${kind}-${index}`, coords, kind, color }));
            globeCountryBoundaryPaths = toRecords(countriesData?.features, 'country', 'rgba(110,175,255,0.45)');
            globePlateBoundaryPaths = toRecords(platesData?.features, 'plate', 'rgba(255,188,76,0.55)');
            globeFaultLinePaths = toRecords(faultsData?.features, 'fault', 'rgba(255,110,110,0.58)');
            globeOverlayDataLoaded = true;
          } catch {
            globeCountryBoundaryPaths = [];
            globePlateBoundaryPaths = [];
            globeFaultLinePaths = [];
            globeOverlayDataLoaded = true;
          } finally {
            globeOverlayDataLoading = null;
          }
        })();
        return globeOverlayDataLoading;
      }

      async function applyGlobeOverlayPaths() {
        if (!globe) return;
        await ensureGlobeOverlayData();
        const overlays = [];
        if (layerSettings.countryBorders) overlays.push(...globeCountryBoundaryPaths);
        if (layerSettings.plateBoundaries) overlays.push(...globePlateBoundaryPaths);
        if (layerSettings.faultLines) overlays.push(...globeFaultLinePaths);
        globe
          .pathsData(overlays)
          .pathPoints('coords')
          .pathPointLat('lat')
          .pathPointLng('lng')
          .pathColor((d) => d.color)
          .pathStroke(0.34)
          .pathDashLength(1)
          .pathDashGap(0)
          .pathDashAnimateTime(0);
      }

      function createOsmTileLayer() {
        return L.tileLayer(LEAFLET_OSM_URL, {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        });
      }

      function installLeafletBaseLayer(mode = activeGlobeLayer) {
        if (!leafletMap || typeof L === 'undefined') return;

        if (leafletBaseTileLayer) {
          leafletMap.removeLayer(leafletBaseTileLayer);
          leafletBaseTileLayer = null;
        }

        const normalized = LayerManager.normalize(mode);
        if (normalized === 'terrain') {
          leafletBaseTileLayer = createOsmTileLayer();
          leafletBaseTileLayer.addTo(leafletMap);
          return;
        }

        const textureUrl = GLOBE_TEXTURES[normalized] || GLOBE_TEXTURES.night;
        const osm = createOsmTileLayer();
        osm.addTo(leafletMap);
        leafletBaseTileLayer = osm;

        const img = new Image();
        img.onload = () => {
          if (!leafletMap || leafletBaseTileLayer !== osm) return;
          leafletMap.removeLayer(osm);
          const overlay = L.imageOverlay(textureUrl, [[-90, -180], [90, 180]], { interactive: false });
          overlay.addTo(leafletMap);
          leafletBaseTileLayer = overlay;
        };
        img.onerror = () => {
          // Keep OpenStreetMap tiles when the local texture is unavailable.
        };
        img.src = textureUrl;
      }

      function usgsLinkForEvent(event) {
        const directUrl = String(event?.url || '').trim();
        if (directUrl.startsWith('http')) return directUrl;
        const id = String(event?.id || '').trim();
        if (id) return `https://earthquake.usgs.gov/earthquakes/eventpage/${encodeURIComponent(id)}`;
        return '';
      }

      function buildMapPopupHtml(eq) {
        const country = countryFromEvent(eq);
        const utc = new Date(eq.time || Date.now()).toUTCString();
        const link = usgsLinkForEvent(eq);
        const linkHtml = link
          ? `<br/><a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">USGS Event</a>`
          : '';
        return `${escapeHtml(eq.place || eqT('unknownLocation'))}<br/>${escapeHtml(country)}<br/>M ${Number(eq.mag || 0).toFixed(1)}<br/>Depth ${Number(eq.depthKm || 0).toFixed(1)} km<br/>${utc}${linkHtml}`;
      }

      function ensureLeafletMap() {
        const mapHost = document.getElementById('map2D');
        if (!mapHost || typeof L === 'undefined') return null;
        if (leafletMap) return leafletMap;

        leafletMap = L.map(mapHost, {
          zoomControl: false,
          preferCanvas: true,
          attributionControl: false,
        }).setView(defaultMapCenter, defaultMapZoom);
        installLeafletBaseLayer(activeGlobeLayer);
        leafletBaseOverlayGroup = L.layerGroup().addTo(leafletMap);
        leafletCountryOverlay = L.layerGroup().addTo(leafletMap);
        leafletPlateOverlay = L.layerGroup().addTo(leafletMap);
        leafletFaultOverlay = L.layerGroup().addTo(leafletMap);
        leafletLayerGroup = L.layerGroup().addTo(leafletMap);
        void loadLocalMapOverlays();
        return leafletMap;
      }

      function scheduleLeafletInvalidate() {
        window.requestAnimationFrame(() => {
          if (leafletMap) leafletMap.invalidateSize(true);
        });
        [100, 300, 500].forEach((delay) => {
          window.setTimeout(() => {
            if (leafletMap) leafletMap.invalidateSize(true);
          }, delay);
        });
      }

      function destroyLeafletMap() {
        if (leafletMap) {
          leafletMap.remove();
        }
        leafletMap = null;
        leafletLayerGroup = null;
        leafletBaseTileLayer = null;
        leafletBaseOverlayGroup = null;
        leafletCountryOverlay = null;
        leafletPlateOverlay = null;
        leafletFaultOverlay = null;
        mapOverlayLoadPromise = null;
      }

      function render2DMap() {
        if (pageDisposed) return;
        if (!is2DMap) return;
        const map = ensureLeafletMap();
        if (!map || !leafletLayerGroup) return;

        leafletLayerGroup.clearLayers();
        const visible = layerSettings.markers ? getVisibleEarthquakes() : [];
        if (!visible.length) {
          map.setView(defaultMapCenter, defaultMapZoom);
          scheduleLeafletInvalidate();
          return;
        }

        if (selectedEarthquake) {
          const lat = Number(selectedEarthquake.lat);
          const lng = Number(selectedEarthquake.lng);
          const assessment = buildImpactAssessment(selectedEarthquake);
          const markerColor = markerColorForLayer(selectedEarthquake.mag);
          L.circleMarker([lat, lng], {
            radius: Math.max(5, Math.min(12, 4 + selectedEarthquake.mag)),
            color: markerColor,
            weight: 1,
            fillColor: markerColor,
            fillOpacity: 0.82,
          }).addTo(leafletLayerGroup)
            .bindPopup(buildMapPopupHtml(selectedEarthquake));
          if (layerSettings.risk) {
            L.circle([lat, lng], {
              radius: Number(assessment.secondaryRadiusKm || 0) * 1000,
              color: '#ff4b4b',
              fillColor: '#ff4b4b',
              fillOpacity: 0.2,
            }).addTo(leafletLayerGroup);
          }
          map.setView([lat, lng], 6);
        } else {
          const bounds = [];
          visible.forEach((eq) => {
            const markerColor = markerColorForLayer(eq.mag);
            const marker = L.circleMarker([eq.lat, eq.lng], {
              radius: Math.max(4, Math.min(10, 3 + eq.mag)),
              color: markerColor,
              weight: 1,
              fillColor: markerColor,
              fillOpacity: 0.82,
            }).addTo(leafletLayerGroup);
            bounds.push([eq.lat, eq.lng]);

            marker.bindPopup(buildMapPopupHtml(eq));
            marker.on('click', () => {
              if (selectedEarthquake && selectedEarthquake.id === eq.id) {
                clearSelection();
                return;
              }
              setSelectedEarthquake(eq);
            });
          });
          if (bounds.length > 1 && typeof map.fitBounds === 'function') {
            map.fitBounds(bounds, { padding: [20, 20], maxZoom: 5 });
          } else {
            map.setView(defaultMapCenter, defaultMapZoom);
          }
        }

        scheduleLeafletInvalidate();
      }

      function setIs2DMap(nextState) {
        is2DMap = Boolean(nextState);
        const globeEl = document.getElementById('globeViz');
        const mapHost = document.getElementById('map2D');
        const mapToggleBtn = document.getElementById('mapToggleBtn');

        if (mapToggleBtn) {
          mapToggleBtn.classList.toggle('is-active', is2DMap);
          mapToggleBtn.title = is2DMap ? eqT('switch3d') : eqT('switch2d');
          mapToggleBtn.setAttribute('aria-label', mapToggleBtn.title);
        }

        if (globeEl) {
          globeEl.classList.toggle('hidden', is2DMap);
          globeEl.setAttribute('aria-hidden', is2DMap ? 'true' : 'false');
        }
        if (mapHost) {
          mapHost.classList.toggle('active', is2DMap);
          mapHost.setAttribute('aria-hidden', is2DMap ? 'false' : 'true');
          mapHost.style.display = is2DMap ? 'block' : '';
          mapHost.style.visibility = is2DMap ? 'visible' : '';
          mapHost.style.opacity = is2DMap ? '1' : '';
        }

        if (globe && globe.controls) {
          const controls = globe.controls();
          controls.autoRotate = is2DMap ? false : isAutoRotateEnabled;
        }

        if (is2DMap) {
          render2DMap();
          scheduleLeafletInvalidate();
        } else {
          scheduleLeafletInvalidate();
          resizeGlobeViewport();
        }
      }

      let resizeGlobeViewportTimer = null;
      function clampAltitude(value) {
        const raw = Number(value);
        if (!Number.isFinite(raw)) return DEFAULT_GLOBE_ALTITUDE;
        return Math.max(MIN_GLOBE_ALTITUDE, Math.min(MAX_GLOBE_ALTITUDE, raw));
      }

      function getGlobeRadius() {
        if (globe && typeof globe.getGlobeRadius === 'function') {
          const radius = Number(globe.getGlobeRadius());
          if (Number.isFinite(radius) && radius > 0) return radius;
        }
        return 100;
      }

      function altitudeToDistance(altitude) {
        return (1 + clampAltitude(altitude)) * getGlobeRadius();
      }

      function distanceToAltitude(distance) {
        const radius = getGlobeRadius();
        if (!Number.isFinite(distance) || !Number.isFinite(radius) || radius <= 0) {
          return DEFAULT_GLOBE_ALTITUDE;
        }
        return clampAltitude(distance / radius - 1);
      }

      function applyCameraDistanceConstraints(controls) {
        if (!controls) return;
        controls.minDistance = altitudeToDistance(MIN_GLOBE_ALTITUDE);
        controls.maxDistance = altitudeToDistance(MAX_GLOBE_ALTITUDE);
      }

      function clampGlobeCameraDistance() {
        if (!globe || !globeControls || !globeControls.object) return;
        if (globeCameraClampInProgress) return;
        const camera = globeControls.object;
        const distance = Number(camera.position?.length?.() || 0);
        const minDistance = altitudeToDistance(MIN_GLOBE_ALTITUDE);
        const maxDistance = altitudeToDistance(MAX_GLOBE_ALTITUDE);
        if (!Number.isFinite(distance) || !Number.isFinite(minDistance) || !Number.isFinite(maxDistance)) return;
        if (distance >= minDistance && distance <= maxDistance) {
          currentAltitude = distanceToAltitude(distance);
          return;
        }
        globeCameraClampInProgress = true;
        const clampedDistance = Math.max(minDistance, Math.min(maxDistance, distance));
        const scale = clampedDistance / distance;
        camera.position.multiplyScalar(scale);
        currentAltitude = distanceToAltitude(clampedDistance);
        globeControls.update();
        globeCameraClampInProgress = false;
      }

      function safePointOfView(view, transitionMs = 0) {
        if (!globe) return;
        const next = { ...(view || {}) };
        if (next.altitude !== undefined) {
          next.altitude = clampAltitude(next.altitude);
          currentAltitude = next.altitude;
        }
        globe.pointOfView(next, transitionMs);
      }

      function resizeGlobeViewport() {
        if (resizeGlobeViewportTimer) {
          window.clearTimeout(resizeGlobeViewportTimer);
        }
        resizeGlobeViewportTimer = window.setTimeout(() => {
          resizeGlobeViewportTimer = null;
          if (!globe) return;
          const host = document.getElementById('globeViz');
          if (!host) return;
          const bounds = host.getBoundingClientRect();
          const width = Math.max(1, Math.floor(bounds.width || host.clientWidth || 0));
          const height = Math.max(1, Math.floor(bounds.height || host.clientHeight || 0));
          if (!width || !height) return;
          if (width === lastGlobeViewportWidth && height === lastGlobeViewportHeight) return;
          lastGlobeViewportWidth = width;
          lastGlobeViewportHeight = height;
          globe.width(width).height(height);
          try {
            const renderer = typeof globe.renderer === 'function' ? globe.renderer() : null;
            if (renderer && typeof renderer.setSize === 'function') {
              renderer.setSize(width, height, false);
            }
          } catch {
            /* renderer resize is optional */
          }
          applyCameraDistanceConstraints(globeControls);
          clampGlobeCameraDistance();
          try {
            if (leafletMap && typeof leafletMap.invalidateSize === 'function') {
              leafletMap.invalidateSize(true);
            }
          } catch {
            /* ignore map invalidate failures during resize churn */
          }
          positionImpactPopup();
        }, 120);
      }

      function deferGlobeInitialization() {
        if (globe || globeDeferredInitRaf) return;
        const host = document.getElementById('globeViz');
        if (!host) return;
        globeDeferredInitRaf = window.requestAnimationFrame(() => {
          globeDeferredInitRaf = null;
          const bounds = host.getBoundingClientRect();
          const width = Math.floor(bounds.width || host.clientWidth || 0);
          const height = Math.floor(bounds.height || host.clientHeight || 0);
          if (width > 24 && height > 24) {
            ensureGlobe();
            return;
          }
          globeDeferredInitRetries += 1;
          if (globeDeferredInitRetries < 18) {
            window.setTimeout(deferGlobeInitialization, 70);
          }
        });
      }

      function tierClass(m) {
        if (m >= 6) return 'm-veryhigh';
        if (m >= 5) return 'm-high';
        if (m >= 4) return 'm-medium';
        return 'm-low';
      }

      function normalizeCountryToken(token) {
        const raw = String(token || '').trim();
        if (!raw) return 'Unknown';

        const lowered = raw.toLowerCase();
        if (countryAlias[lowered]) return countryAlias[lowered];

        if (/^[A-Z]{2}$/.test(raw) && regionDisplay) {
          const display = regionDisplay.of(raw);
          if (display && display !== raw) return display;
        }

        if (knownCountryLowerSet.has(lowered)) {
          return knownCountriesByLower.get(lowered) || raw;
        }

        return raw;
      }

      function isRecognizedCountryName(value) {
        const lowered = String(value || '').trim().toLowerCase();
        if (!lowered) return false;
        return knownCountryLowerSet.has(lowered) || countryAliasValues.has(lowered);
      }

      function parseGeoFromPlace(place) {
        const raw = String(place || '').trim();
        const parts = raw.split(',').map((segment) => segment.trim()).filter(Boolean);
        const last = parts[parts.length - 1] || 'Unknown';
        const prev = parts.length > 1 ? parts[parts.length - 2] : '';

        const lastUpper = last.toUpperCase();
        const lastLower = last.toLowerCase();
        const prevUpper = prev.toUpperCase();
        const prevLower = prev.toLowerCase();

        if (usStateAbbr.has(lastUpper) || usStateNames.has(lastLower)) {
          return { country: 'United States', subdivision: last };
        }

        if (caProvinceAbbr.has(lastUpper) || caProvinceNames.has(lastLower)) {
          return { country: 'Canada', subdivision: last };
        }

        if (usStateAbbr.has(prevUpper) || usStateNames.has(prevLower)) {
          return { country: 'United States', subdivision: prev };
        }

        if (caProvinceAbbr.has(prevUpper) || caProvinceNames.has(prevLower)) {
          return { country: 'Canada', subdivision: prev };
        }

        return { country: normalizeCountryToken(last), subdivision: null };
      }

      function countryFromPlace(place) {
        return parseGeoFromPlace(place).country;
      }

      function largestCardPlace(place) {
        const raw = String(place || '').trim();
        if (!raw) return 'Unknown Location';

        const cleaned = raw.replace(/^\s*\d+(?:\.\d+)?\s*km\s+[NSEW]{1,2}\s+of\s+/i, '').trim();
        return cleaned || 'Unknown Location';
      }

      function flagFor(country) {
        const x = country.toLowerCase();
        if (x.includes('usa') || x.includes('united states')) return '🇺🇸';
        if (x.includes('mexico')) return '🇲🇽';
        if (x.includes('japan')) return '🇯🇵';
        if (x.includes('indonesia')) return '🇮🇩';
        if (x.includes('pakistan')) return '🇵🇰';
        if (x.includes('india')) return '🇮🇳';
        if (x.includes('china')) return '🇨🇳';
        if (x.includes('iran')) return '🇮🇷';
        if (x.includes('afghanistan')) return '🇦🇫';
        if (x.includes('turkey')) return '🇹🇷';
        if (x.includes('chile')) return '🇨🇱';
        if (x.includes('italy')) return '🇮🇹';
        if (x.includes('greece')) return '🇬🇷';
        if (x.includes('philippines')) return '🇵🇭';
        if (x.includes('new zealand')) return '🇳🇿';
        return '🌍';
      }

      function toPointColor(m) {
        const mag = Number(m || 0);
        if (mag >= 6.5) return 'rgba(255, 40, 60, 0.92)';
        if (mag >= 5.5) return 'rgba(255, 74, 48, 0.88)';
        if (mag >= 4.5) return 'rgba(255, 130, 36, 0.84)';
        if (mag >= 3) return 'rgba(255, 188, 58, 0.8)';
        return 'rgba(255, 214, 92, 0.74)';
      }

      function heatmapPointColor(magnitude) {
        return toPointColor(magnitude);
      }

      function markerColorForLayer(magnitude) {
        if (layerSettings.population) return heatmapPointColor(magnitude);
        return toPointColor(magnitude);
      }

      const LayerManager = (() => {
        const modes = ['night', 'blue-marble', 'satellite', 'terrain'];
        const isMode = (value) => modes.includes(value);

        return {
          getMode() {
            return activeGlobeLayer;
          },
          getTitle(mode) {
            if (mode === 'blue-marble') return 'Blue Marble';
            if (mode === 'satellite') return 'Satellite';
            if (mode === 'terrain') return 'Terrain';
            return 'Earth at Night';
          },
          normalize(mode) {
            return isMode(mode) ? mode : 'night';
          },
        };
      })();

      function LayerToggleButton(button) {
        if (!button) return { sync: () => {} };
        const panel = document.getElementById('layersPanel');

        const sync = (mode) => {
          const normalized = LayerManager.normalize(mode);
          button.dataset.layer = normalized;
          button.title = 'Layers';
          button.setAttribute('aria-label', `Layers (${LayerManager.getTitle(normalized)})`);
          button.classList.add('is-active');
        };

        button.addEventListener('click', () => {
          panel?.classList.toggle('open');
        });

        sync(LayerManager.getMode());
        return { sync };
      }

      function isWithinRegionalBounds(coordinates) {
        const lng = Number(coordinates?.[0]);
        const lat = Number(coordinates?.[1]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
        return lat >= REGION_BOUNDS.minLat && lat <= REGION_BOUNDS.maxLat &&
          lng >= REGION_BOUNDS.minLng && lng <= REGION_BOUNDS.maxLng;
      }

      function filterFeaturesByRegion(features) {
        return (Array.isArray(features) ? features : []).filter((feature) => {
          const coordinates = feature?.geometry?.coordinates;
          return isWithinRegionalBounds(coordinates);
        });
      }

      function getCountry(place) {
        const parsed = parseGeoFromPlace(place);
        const normalized = String(parsed?.country || '').trim();
        if (normalized) return normalized;
        return eqT('unknown');
      }

      function inferCountryFromCoordinates(lat, lng) {
        const latitude = Number(lat);
        const longitude = Number(lng);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
        for (const bounds of COUNTRY_BOUNDS) {
          if (
            latitude >= bounds.minLat &&
            latitude <= bounds.maxLat &&
            longitude >= bounds.minLng &&
            longitude <= bounds.maxLng
          ) {
            return bounds.name;
          }
        }
        return null;
      }

      function countryFromEvent(event) {
        const fromPlace = getCountry(event?.properties?.place || event?.place);
        if (fromPlace && fromPlace !== eqT('unknown') && isRecognizedCountryName(fromPlace)) return fromPlace;
        const lat = Number(event?.geometry?.coordinates?.[1] ?? event?.lat);
        const lng = Number(event?.geometry?.coordinates?.[0] ?? event?.lng);
        const fromCoords = inferCountryFromCoordinates(lat, lng);
        return fromCoords || fromPlace;
      }

      function buildFeatureIdentityKey(feature) {
        const rawId = String(feature?.id ?? feature?.properties?.id ?? '').trim();
        if (rawId) return `id:${rawId}`;
        return null;
      }

      function featureQualityScore(feature) {
        const props = feature?.properties || {};
        let score = 0;
        if (String(feature?.id ?? '').trim()) score += 6;
        if (String(props?.source || props?.provider || '').trim()) score += 4;
        if (String(props?.sourceLabel || '').trim()) score += 3;
        if (String(props?.url || props?.detail || '').trim()) score += 2;
        if (Number.isFinite(Number(props?.sig))) score += 1;
        if (Number.isFinite(Number(props?.updated))) score += 1;
        return score;
      }

      function shouldMergeFeatures(left, right) {
        const leftCoords = left?.geometry?.coordinates || [];
        const rightCoords = right?.geometry?.coordinates || [];
        const leftLat = Number(leftCoords[1]);
        const leftLng = Number(leftCoords[0]);
        const rightLat = Number(rightCoords[1]);
        const rightLng = Number(rightCoords[0]);
        if (![leftLat, leftLng, rightLat, rightLng].every(Number.isFinite)) return false;

        const leftTime = Number(left?.properties?.time || 0);
        const rightTime = Number(right?.properties?.time || 0);
        if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) return false;

        const leftMag = Number(left?.properties?.mag || 0);
        const rightMag = Number(right?.properties?.mag || 0);
        const latDelta = Math.abs(leftLat - rightLat);
        const lngDelta = Math.abs(leftLng - rightLng);
        const timeDeltaMs = Math.abs(leftTime - rightTime);
        const magDelta = Math.abs(leftMag - rightMag);

        return latDelta <= 0.25 && lngDelta <= 0.25 && timeDeltaMs <= 90_000 && magDelta <= 0.35;
      }

      function mergeFeatureMetadata(primary, secondary) {
        const merged = {
          ...secondary,
          ...primary,
          properties: {
            ...(secondary?.properties || {}),
            ...(primary?.properties || {}),
          },
        };
        if (!merged?.properties?.source && secondary?.properties?.source) {
          merged.properties.source = secondary.properties.source;
        }
        if (!merged?.properties?.sourceLabel && secondary?.properties?.sourceLabel) {
          merged.properties.sourceLabel = secondary.properties.sourceLabel;
        }
        if (!merged?.properties?.provider && secondary?.properties?.provider) {
          merged.properties.provider = secondary.properties.provider;
        }
        return merged;
      }

      function dedupeEarthquakeFeatures(features) {
        const list = Array.isArray(features) ? features.filter(Boolean) : [];
        if (list.length <= 1) return list;

        const byId = new Map();
        const deduped = [];
        for (const feature of list) {
          const identity = buildFeatureIdentityKey(feature);
          if (identity) {
            const existing = byId.get(identity);
            if (!existing) {
              byId.set(identity, feature);
              deduped.push(feature);
              continue;
            }
            const winner = featureQualityScore(feature) >= featureQualityScore(existing)
              ? mergeFeatureMetadata(feature, existing)
              : mergeFeatureMetadata(existing, feature);
            byId.set(identity, winner);
            const index = deduped.indexOf(existing);
            if (index >= 0) deduped[index] = winner;
            continue;
          }

          const duplicate = deduped.find((candidate) => shouldMergeFeatures(candidate, feature));
          if (!duplicate) {
            deduped.push(feature);
            continue;
          }
          const winner = featureQualityScore(feature) >= featureQualityScore(duplicate)
            ? mergeFeatureMetadata(feature, duplicate)
            : mergeFeatureMetadata(duplicate, feature);
          const duplicateIndex = deduped.indexOf(duplicate);
          if (duplicateIndex >= 0) deduped[duplicateIndex] = winner;
        }
        return deduped;
      }

      function regionFromPlace(place) {
        const raw = String(place || '').trim();
        if (!raw) return eqT('unknownLocation');
        const cleaned = raw.replace(/^\s*\d+(?:\.\d+)?\s*km\s+[NSEW]{1,2}\s+of\s+/i, '').trim();
        const parts = cleaned.split(',').map((segment) => segment.trim()).filter(Boolean);
        if (!parts.length) return eqT('unknownLocation');
        if (parts.length === 1) return parts[0];
        return parts.slice(0, parts.length - 1).join(', ') || parts[0];
      }

      function normalizeCountryFilter(country) {
        if (!country) return 'other';
        if (country === 'United States') return 'United States';
        return COUNTRY_FILTER_OPTIONS.includes(country) ? country : 'other';
      }

      function relativeTimeFromNow(value) {
        const timestamp = Number(value || 0);
        if (!Number.isFinite(timestamp) || timestamp <= 0) return '--';
        const diff = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
        if (diff < 60) return `${diff}s ago`;
        const mins = Math.floor(diff / 60);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
      }

      function getFilteredAndSortedEvents() {
        const query = eventSearchQuery.trim().toLowerCase();
        const visible = eventsData.filter((eventItem) => {
          const countryMatch = selectedCountryFilter === 'all'
            || (selectedCountryFilter === 'other'
              ? normalizeCountryFilter(eventItem.country) === 'other'
              : eventItem.country === selectedCountryFilter);
          if (!countryMatch) return false;
          if (!query) return true;
          const haystack = `${eventItem.country} ${eventItem.region} ${eventItem.place}`.toLowerCase();
          return haystack.includes(query);
        });

        visible.sort((a, b) => {
          if (selectedSortFilter === 'strongest') return b.mag - a.mag || b.time - a.time;
          if (selectedSortFilter === 'shallowest') return a.depthKm - b.depthKm || b.time - a.time;
          if (selectedSortFilter === 'deepest') return b.depthKm - a.depthKm || b.time - a.time;
          return b.time - a.time;
        });
        return visible;
      }

      function getDisplayLimit() {
        if (selectedDisplayCount === 'all') return Number.POSITIVE_INFINITY;
        const parsed = Number.parseInt(String(selectedDisplayCount || '25'), 10);
        if (!Number.isFinite(parsed) || parsed <= 0) return 25;
        return parsed;
      }

      function getEventListScrollAnchor(eventsEl, rows) {
        const previousScrollTop = Number(eventsEl?.scrollTop || 0);
        const previousScrollHeight = Number(eventsEl?.scrollHeight || 0);
        const nearTop = previousScrollTop <= 24;
        if (!eventsEl || !Array.isArray(rows) || rows.length === 0 || nearTop) {
          return { nearTop, anchorId: null, anchorOffset: 0, previousScrollTop, previousScrollHeight };
        }
        const firstVisible =
          rows.find((row) => Number(row.offsetTop || 0) + Number(row.offsetHeight || 0) >= previousScrollTop) || rows[0];
        return {
          nearTop,
          anchorId: firstVisible?.dataset?.id || null,
          anchorOffset: Math.max(0, previousScrollTop - Number(firstVisible?.offsetTop || 0)),
          previousScrollTop,
          previousScrollHeight,
        };
      }

      function restoreEventListScroll(eventsEl, rows, anchor) {
        if (!eventsEl || !anchor) return;
        if (anchor.nearTop) {
          eventsEl.scrollTop = 0;
          return;
        }

        const anchoredRow = Array.isArray(rows)
          ? rows.find((row) => String(row?.dataset?.id || '') === String(anchor.anchorId || ''))
          : null;

        if (anchoredRow) {
          eventsEl.scrollTop = Math.max(0, Number(anchoredRow.offsetTop || 0) + Number(anchor.anchorOffset || 0));
          return;
        }

        if (Number(anchor.previousScrollHeight || 0) > 0) {
          const ratio = Number(anchor.previousScrollTop || 0) / Number(anchor.previousScrollHeight || 1);
          eventsEl.scrollTop = Math.max(0, Math.round(ratio * Number(eventsEl.scrollHeight || 0)));
        }
      }

      function renderRecentActivityList() {
        const eventsEl = document.getElementById('events');
        if (!eventsEl) return;
        const previousRows = Array.from(eventsEl.querySelectorAll('.event'));
        const scrollAnchor = getEventListScrollAnchor(eventsEl, previousRows);
        filteredEvents = getFilteredAndSortedEvents();
        const displayLimit = getDisplayLimit();
        const items = Number.isFinite(displayLimit) ? filteredEvents.slice(0, displayLimit) : filteredEvents;
        eventsEl.innerHTML = items.map((e) => {
          const timeText = Number.isFinite(e.time) ? new Date(e.time).toLocaleString() : eqT('unknown');
          const latText = Number.isFinite(e.lat) ? e.lat.toFixed(2) : '--';
          const lngText = Number.isFinite(e.lng) ? e.lng.toFixed(2) : '--';
          return `
            <button class="event" data-id="${e.id}">
              <div class="meta">
                <div class="flag">${flagFor(e.country)}</div>
                <div>
                  <div class="country">${escapeHtml(e.country)}</div>
                  <div class="place">${escapeHtml(e.region)}</div>
                  <div class="event-detail-line">Depth: ${Number.isFinite(e.depthKm) ? e.depthKm.toFixed(1) : '--'} km · Time: ${escapeHtml(timeText)}</div>
                  <div class="event-detail-line">Lat: ${latText} · Lon: ${lngText} · ${escapeHtml(relativeTimeFromNow(e.time))}</div>
                </div>
              </div>
              <div class="mag">
                <span class="mag-badge ${tierClass(e.mag)}">M ${e.mag.toFixed(1)}</span>
                <div class="time">${new Date(e.time).toLocaleTimeString()}</div>
              </div>
            </button>
          `;
        }).join('');

        quakeRows = Array.from(eventsEl.querySelectorAll('.event'));
        quakeRows.forEach((row) => row.addEventListener('click', () => selectEvent(row.dataset.id)));
        for (const row of quakeRows) {
          row.classList.toggle('selected', row.dataset.id === selectedId);
        }
        restoreEventListScroll(eventsEl, quakeRows, scrollAnchor);
      }

      function fillCountryFilterOptions() {
        const select = document.getElementById('countryFilterSelect');
        if (!select) return;
        const dynamic = new Set(eventsData.map((item) => item.country).filter(Boolean));
        const preferred = COUNTRY_FILTER_OPTIONS.filter((name) => name !== 'Other');
        const options = ['all', ...preferred, ...Array.from(dynamic).filter((name) => !preferred.includes(name) && name !== 'Unknown')];
        const deduped = Array.from(new Set(options));
        const previous = selectedCountryFilter;
        select.innerHTML = deduped.map((value) => {
          const label = value === 'all' ? 'All Countries' : value;
          return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
        }).join('') + '<option value="other">Other</option>';
        select.value = previous;
      }

      function updateRefreshCountdownLabel() {
        const countdownEl = document.getElementById('refreshCountdown');
        if (!countdownEl) return;
        const seconds = Math.max(0, Math.ceil((nextRefreshAt - Date.now()) / 1000));
        countdownEl.textContent = `Next refresh: ${seconds}s`;
      }

      function buildPulseRings() {
        if (!layerSettings.risk) return [];
        if (selectedEarthquake) {
          return selectedQuakeRings(selectedEarthquake);
        }
        /**
         * Do not animate ambient pulse rings for every event — with ~100 quakes × 2–3 rings each,
         * three-globe runs hundreds of concurrent ring animations and can exhaust the GPU process
         * (Chromium "Aw, Snap" / STATUS_BREAKPOINT after minutes). Markers alone are enough until
         * the user selects an event (then selectedQuakeRings provides a small fixed set).
         */
        return [];
      }

      function setGlobeLayer(mode) {
        const nextMode = LayerManager.normalize(mode);
        const globeEl = document.getElementById('globeViz');

        activeGlobeLayer = nextMode;
        layerToggleController?.sync(nextMode);

        if (globeEl) {
          globeEl.classList.remove('layer-default', 'layer-heatmap', 'layer-satellite');
          if (nextMode === 'terrain') {
            globeEl.classList.add('layer-heatmap');
          } else if (nextMode === 'blue-marble' || nextMode === 'satellite') {
            globeEl.classList.add('layer-satellite');
          } else {
            globeEl.classList.add('layer-default');
          }
          globeEl.classList.add('layer-switching');

          if (globeLayerTransitionTimer) {
            window.clearTimeout(globeLayerTransitionTimer);
          }
          globeLayerTransitionTimer = window.setTimeout(() => {
            globeEl.classList.remove('layer-switching');
          }, 260);
        }

        if (globe && GLOBE_TEXTURES[nextMode]) {
          globe.globeImageUrl(GLOBE_TEXTURES[nextMode]);
        }

        if (leafletMap) {
          installLeafletBaseLayer(nextMode);
        }

        refreshPointsAppearance();
      }

      async function triggerAlertDispatch() {
        // Browser notifications are dispatched in-page only.
      }

      async function fetchEarthquakes() {
        const requestSignal = activeLoadController?.signal;
        try {
          const payload = await requestJsonWithFallback(EARTHQUAKE_LIVE_ENDPOINT, { cache: 'no-store', signal: requestSignal });
          const features = Array.isArray(payload?.features) ? payload.features : [];
          const dedupedFeatures = dedupeEarthquakeFeatures(features);
          const sourceLabel =
            String(payload?.sourceLabel || '').trim() ||
            (payload?.source ? `Source: ${payload.source}` : eqT('sourceLive'));

          if (dedupedFeatures.length > 0 || payload?.source || payload?.sourceLabel) {
            return {
              features: dedupedFeatures,
              sourceLabel,
              fromCache: Boolean(payload?.fromCache),
              warning: payload?.warning || null,
            };
          }
          if (payload?.warning) {
            return {
              features: [],
              sourceLabel,
              warning: payload.warning,
            };
          }
        } catch {
          // Fall through to local cache files.
        }

        for (const fallbackPath of EARTHQUAKE_CACHE_FALLBACKS) {
          try {
            const fallback = await fetchLocalJson(fallbackPath);
            const cachedFeatures = Array.isArray(fallback?.features) ? fallback.features : [];
            if (cachedFeatures.length > 0) {
              const dedupedCached = dedupeEarthquakeFeatures(cachedFeatures);
              return {
                features: dedupedCached,
                sourceLabel: 'Live feed temporarily unavailable. Displaying cached earthquakes.',
                fromCache: true,
              };
            }
          } catch {
            // Try next fallback path.
          }
        }

        const persisted = readLastGoodFeatures();
        if (persisted.length > 0) {
          return {
            features: persisted,
            sourceLabel: 'Live feed temporarily unavailable. Displaying last known cached earthquakes.',
            fromCache: true,
          };
        }

        return { features: [], sourceLabel: eqT('sourceUnavailable') };
      }

      function escapeHtml(value) {
        return String(value ?? '')
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');
      }

      function mmiAtDistance(magnitude, depthKm, distanceKm) {
        const a = 1.5;
        const b = 1.5;
        const c = 3.5;
        const depthFactor = Math.max(1, Number(depthKm || 0) * 0.3);
        const mmi = a + b * Number(magnitude || 0) - c * Math.log10(Math.max(0.1, distanceKm) + depthFactor);
        return Math.max(1, Math.min(12, mmi));
      }

      function radiusForMmi(magnitude, depthKm, targetMmi) {
        let minR = 0;
        let maxR = 2000;
        for (let i = 0; i < 48; i += 1) {
          const mid = (minR + maxR) / 2;
          const mmi = mmiAtDistance(magnitude, depthKm, mid);
          if (mmi > targetMmi) minR = mid;
          else maxR = mid;
        }
        return (minR + maxR) / 2;
      }

      function getRiskLevel(magnitude, maxMmi) {
        if (magnitude >= 7 || maxMmi >= 9) return 'Extreme';
        if (magnitude >= 6 || maxMmi >= 7.5) return 'Very High';
        if (magnitude >= 5 || maxMmi >= 6) return 'High';
        if (magnitude >= 4 || maxMmi >= 4.5) return 'Moderate';
        return 'Low';
      }

      function riskColor(level) {
        if (level === 'Extreme') return '#7f1d1d';
        if (level === 'Very High') return '#b91c1c';
        if (level === 'High') return '#dc2626';
        if (level === 'Moderate') return '#f59e0b';
        return '#3b82f6';
      }

      function areaFromRadius(radiusKm) {
        return Math.PI * radiusKm * radiusKm;
      }

      function inferDefaultDensityKey(location) {
        const raw = String(location || '').toLowerCase();
        if (!raw) return 'DefaultUrban';
        return /(rural|village|tehsil|valley|mountain|remote|district)/i.test(raw)
          ? 'DefaultRural'
          : 'DefaultUrban';
      }

      function resolveDensity(location, densityMap, unitLabel) {
        const raw = String(location || '').trim();
        const entries = Object.entries(densityMap).filter(([name]) => !name.startsWith('Default'));

        for (const [city, value] of entries) {
          if (raw.toLowerCase().includes(city.toLowerCase())) {
            return {
              value: Number(value) || 0,
              source: `Density selected for: ${city} (${Number(value).toLocaleString()} ${unitLabel})`,
              key: city,
              isDefault: false,
            };
          }
        }

        const defaultKey = inferDefaultDensityKey(raw);
        const fallbackValue = Number(densityMap[defaultKey] || densityMap.DefaultUrban || 0);
        const defaultLabel = defaultKey === 'DefaultRural' ? 'Default Rural Density' : 'Default Urban Density';
        return {
          value: fallbackValue,
          source: `Using ${defaultLabel} (${fallbackValue.toLocaleString()} ${unitLabel})`,
          key: defaultKey,
          isDefault: true,
        };
      }

      function getPopulationDensity(location) {
        return resolveDensity(location, populationDensityMap, 'people/km²');
      }

      function buildImpactAssessment(eventItem) {
        const magnitude = Number(eventItem.mag || 0);
        const depthKm = Number(eventItem.depthKm || 0);
        const location = String(eventItem.place || eventItem.properties?.place || '');

        const maxMmi = mmiAtDistance(magnitude, depthKm, 0.1);
        const primaryRadiusKm = Math.max(2, 10 + 8 * (magnitude - 5) - 0.15 * depthKm);
        const secondaryRadiusKm = primaryRadiusKm * 1.8;
        const feltRadiusKm = primaryRadiusKm * 3.2;

        const primaryArea = areaFromRadius(primaryRadiusKm);
        const secondaryArea = areaFromRadius(secondaryRadiusKm);
        const feltArea = areaFromRadius(feltRadiusKm);

        const ringSecondaryArea = Math.max(0, secondaryArea - primaryArea);
        const ringFeltArea = Math.max(0, feltArea - secondaryArea);

        const populationDensityInfo = getPopulationDensity(location);
        const populationDensity = Number.isFinite(populationDensityInfo.value) ? populationDensityInfo.value : 0;

        const primaryPopulation = Math.round(primaryArea * populationDensity);
        const secondaryPopulation = Math.round(ringSecondaryArea * populationDensity);
        const feltPopulation = Math.round(ringFeltArea * populationDensity);
        const area = secondaryArea;
        const populationAffected = Math.round(area * populationDensity);

        const totalInfra = {
          buildings: 0,
          bridges: 0,
          roadsKm: 0,
          hospitals: 0,
          schools: 0,
          emergency: 0,
          powerStations: 0,
          waterPlants: 0,
        };

        const risk = getRiskLevel(magnitude, maxMmi);
        return {
          risk,
          maxMmi,
          primaryRadiusKm,
          secondaryRadiusKm,
          feltRadiusKm,
          primaryArea,
          secondaryArea,
          feltArea,
          area,
          populationDensity,
          location,
          populationDensitySource: populationDensityInfo.source || 'Population density fallback applied.',
          primaryPopulation,
          secondaryPopulation,
          feltPopulation,
          totalPopulation: populationAffected,
          populationAffected,
          buildingsAffected: 0,
          buildingSource: eqT('buildingSourceShort'),
          impactBreakdown: {
            primary: { buildingCount: 0, population: primaryPopulation },
            secondary: { buildingCount: 0, population: secondaryPopulation },
            outer: { buildingCount: 0, population: feltPopulation },
          },
          totalInfra,
        };
      }

      async function computeDualPopulation(eventItem, baseAssessment) {
        try {
          const lat = Number(eventItem?.lat);
          const lon = Number(eventItem?.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            return null;
          }

          const result = await getLocalPopulationEstimate(
            lat,
            lon,
            Number(baseAssessment.secondaryRadiusKm || 0),
            Number(baseAssessment.area || 0),
            String(baseAssessment.location || '')
          );

          if (!result || !result.density) {
            return null;
          }

          const densityTotal = Math.max(0, Number(result.density.total || 0));
          const rasterTotal = Math.max(0, Number(result.raster || 0));
          const baseTotal = Math.max(1, Number(baseAssessment.populationAffected || 1));
          const scale = densityTotal > 0 ? densityTotal / baseTotal : 1;

          const primaryEstimated = Math.max(0, Math.round(Number(baseAssessment.primaryPopulation || 0) * scale));
          const secondaryEstimated = Math.max(0, Math.round(Number(baseAssessment.secondaryPopulation || 0) * scale));
          const outerEstimated = Math.max(0, densityTotal - primaryEstimated - secondaryEstimated);

          return {
            primaryPopulation: primaryEstimated,
            secondaryPopulation: secondaryEstimated,
            feltPopulation: outerEstimated,
            totalPopulation: densityTotal,
            populationAffected: densityTotal,
            populationDensitySource: 'Enhanced urban/rural density model',
            populationComparison: {
              raster: Math.round(rasterTotal),
              density: Math.round(densityTotal),
              urban: Math.max(0, Math.round(Number(result.density.urban || 0))),
              rural: Math.max(0, Math.round(Number(result.density.rural || 0))),
              city: String(result.density.city || 'Unknown'),
              difference: Math.round(rasterTotal - densityTotal),
              source: String(result.source || 'Failed'),
            },
          };
        } catch (error) {
          void error;
          return null;
        }
      }

      async function fetchBuildingsInRadius(lat, lon, radiusKm) {
        const safeLat = Number(lat);
        const safeLon = Number(lon);
        const safeRadiusMeters = Math.max(200, Math.min(MAX_IMPACT_QUERY_RADIUS_METERS, Math.round(Number(radiusKm || 0) * 1000)));

        if (!Number.isFinite(safeLat) || !Number.isFinite(safeLon) || !Number.isFinite(safeRadiusMeters) || safeRadiusMeters <= 0) {
          return [];
        }

        const cacheKey = `${safeLat.toFixed(3)}:${safeLon.toFixed(3)}:${safeRadiusMeters}`;
        if (impactBuildingCache.has(cacheKey)) {
          return impactBuildingCache.get(cacheKey);
        }
        impactBuildingCacheSet(cacheKey, []);
        return [];
      }

      async function analyzeImpact(eventItem) {
        const base = buildImpactAssessment(eventItem);
        const lat = Number(eventItem?.lat);
        const lon = Number(eventItem?.lng);

        loadingPopulation = true;
        const bothPopulation = await computeDualPopulation(eventItem, base);
        loadingPopulation = false;

        const populationValues = bothPopulation || {
          primaryPopulation: base.primaryPopulation,
          secondaryPopulation: base.secondaryPopulation,
          feltPopulation: base.feltPopulation,
          totalPopulation: base.totalPopulation,
          populationAffected: base.populationAffected,
          populationDensitySource: base.populationDensitySource,
          populationComparison: {
            raster: 0,
            density: base.populationAffected,
            urban: Math.round(base.populationAffected * 0.4),
            rural: Math.round(base.populationAffected * 0.6),
            city: 'Unknown',
            difference: Math.round(0 - base.populationAffected),
            source: 'Failed',
          },
        };

        const [primaryWays, secondaryWays, outerWays] = await Promise.all([
          fetchBuildingsInRadius(lat, lon, base.primaryRadiusKm),
          fetchBuildingsInRadius(lat, lon, base.secondaryRadiusKm),
          fetchBuildingsInRadius(lat, lon, base.feltRadiusKm),
        ]);

        const primaryCount = primaryWays.length;
        const secondaryCount = Math.max(0, secondaryWays.length - primaryWays.length);
        const outerCount = Math.max(0, outerWays.length - secondaryWays.length);
        const totalBuildings = primaryCount + secondaryCount + outerCount;

        return {
          ...base,
          ...populationValues,
          populationComparison: populationValues.populationComparison,
          buildingsAffected: totalBuildings,
          totalInfra: {
            ...base.totalInfra,
            buildings: totalBuildings,
          },
          impactBreakdown: {
            primary: { buildingCount: primaryCount, population: populationValues.primaryPopulation },
            secondary: { buildingCount: secondaryCount, population: populationValues.secondaryPopulation },
            outer: { buildingCount: outerCount, population: populationValues.feltPopulation },
          },
          buildingSource: eqT('buildingSourceLong'),
        };
      }

      function updateFormulaModal(assessment) {
        const areaValue = document.getElementById('formulaAreaValue');
        const buildingDensityValue = document.getElementById('formulaBuildingDensityValue');
        const resultLine = document.getElementById('formulaBuildingResult');
        const sourceLine = document.getElementById('formulaDensitySource');
        const populationNote = document.getElementById('formulaPopulationNote');
        if (!areaValue || !buildingDensityValue || !resultLine || !sourceLine || !populationNote) return;

        if (!assessment) {
          areaValue.textContent = '--';
          buildingDensityValue.textContent = '--';
          resultLine.textContent = eqT('buildingsEq').replace('{n}', '--');
          sourceLine.textContent = eqT('waitingOsm');
          populationNote.textContent = eqT('populationComputed');
          return;
        }

        const buildings = Number(assessment.buildingsAffected || 0);
        const population = Number(assessment.populationAffected || 0);
        const comparison = assessment.populationComparison || null;

        areaValue.textContent = Number(assessment.area || 0).toFixed(1);
        buildingDensityValue.textContent = assessment.buildingSource || eqT('buildingSourceShort');
        resultLine.textContent = eqT('buildingsEq').replace('{n}', buildings.toLocaleString());
        sourceLine.textContent = eqT('primarySecondaryOuter')
          .replace('{p}', assessment.impactBreakdown?.primary?.buildingCount?.toLocaleString?.() ?? '0')
          .replace('{s}', assessment.impactBreakdown?.secondary?.buildingCount?.toLocaleString?.() ?? '0')
          .replace('{o}', assessment.impactBreakdown?.outer?.buildingCount?.toLocaleString?.() ?? '0');
        const sourceText = comparison
          ? `Raster ${Number(comparison.raster || 0).toLocaleString()} | Density ${Math.round(population).toLocaleString()} | Diff ${(Number(comparison.difference || 0) >= 0 ? '+' : '') + Number(comparison.difference || 0).toLocaleString()}`
          : `Density estimate = ${Math.round(population).toLocaleString()}`;
        populationNote.textContent = sourceText;
      }

      function hideImpactPopup() {
        const popup = document.getElementById('impactPopup');
        if (!popup) return;
        popup.classList.add('is-hidden');
      }

      let impactPopupPositionRaf = null;
      function positionImpactPopup() {
        if (impactPopupPositionRaf) {
          window.cancelAnimationFrame(impactPopupPositionRaf);
        }
        impactPopupPositionRaf = window.requestAnimationFrame(() => {
          impactPopupPositionRaf = null;
          positionImpactPopupNow();
        });
      }

      function positionImpactPopupNow() {
        if (!globe || !selectedImpactEvent) return;
        const popup = document.getElementById('impactPopup');
        const host = document.getElementById('globeViz');
        if (!popup || !host) return;

        const coords = globe.getScreenCoords(selectedImpactEvent.lat, selectedImpactEvent.lng, 0);
        if (!coords || !Number.isFinite(coords.x) || !Number.isFinite(coords.y)) {
          hideImpactPopup();
          return;
        }

        const hostRect = host.getBoundingClientRect();
        const wrapRect = host.parentElement?.getBoundingClientRect() || hostRect;
        let pointX = coords.x;
        let pointY = coords.y;

        if (pointX < 0 || pointY < 0 || pointX > hostRect.width || pointY > hostRect.height) {
          pointX = coords.x - hostRect.left;
          pointY = coords.y - hostRect.top;
        }

        const popupWidth = popup.offsetWidth || 280;
        const popupHeight = popup.offsetHeight || 320;
        const leftMin = 6;
        const leftMax = Math.max(leftMin, wrapRect.width - popupWidth - 6);
        const topMin = 6;
        const topMax = Math.max(topMin, wrapRect.height - popupHeight - 10);
        const desiredLeft = pointX - popupWidth / 2;
        const desiredTop = pointY - popupHeight - 14;

        popup.style.left = `${Math.max(leftMin, Math.min(leftMax, desiredLeft))}px`;
        popup.style.top = `${Math.max(topMin, Math.min(topMax, desiredTop))}px`;
      }

      async function renderImpactPopup(eventItem) {
        const popup = document.getElementById('impactPopup');
        if (!popup || !eventItem) return;

        loadingPopulation = true;
        const baseAssessment = buildImpactAssessment(eventItem);
        const country = countryFromEvent(eventItem);
        const latText = Number.isFinite(eventItem.lat) ? eventItem.lat.toFixed(3) : '--';
        const lngText = Number.isFinite(eventItem.lng) ? eventItem.lng.toFixed(3) : '--';
        const eventTimeText = Number.isFinite(eventItem.time) ? new Date(eventItem.time).toLocaleString() : 'Unknown';
        const nearbyCities = [baseAssessment.populationComparison?.city, baseAssessment.location]
          .filter(Boolean)
          .slice(0, 2)
          .join(' | ');
        latestImpactAssessment = baseAssessment;
        updateFormulaModal(baseAssessment);
        selectedImpactEvent = eventItem;

        popup.innerHTML = `
          <div class="impact-title">
            <h4>Seismic Impact Assessment</h4>
            <button class="impact-close" id="impactPopupClose" type="button" aria-label="Close impact popup">×</button>
            <span class="impact-risk" style="background:${riskColor(baseAssessment.risk)}">${baseAssessment.risk}</span>
          </div>
          <div class="impact-subtitle">${escapeHtml(eventItem.place || 'Unknown location')} · M ${Number(eventItem.mag || 0).toFixed(1)} · Depth ${Number(eventItem.depthKm || 0).toFixed(1)} km</div>
          <div class="impact-grid">
            <div class="impact-item"><small>Country</small><strong>${escapeHtml(country)}</strong></div>
            <div class="impact-item"><small>Coordinates</small><strong>${latText}, ${lngText}</strong></div>
            <div class="impact-item"><small>Event Time</small><strong>${escapeHtml(eventTimeText)}</strong></div>
            <div class="impact-item"><small>Nearby Cities</small><strong>${escapeHtml(nearbyCities || 'Unknown')}</strong></div>
          </div>
          <div class="impact-zone-row">
            <div class="impact-zone-card primary">
              <b>Primary Zone</b>
              <span>Radius: ${baseAssessment.primaryRadiusKm.toFixed(1)} km</span>
              <span>Area: ${Math.round(baseAssessment.primaryArea).toLocaleString()} km²</span>
              <span>Population: ~${baseAssessment.primaryPopulation.toLocaleString()}</span>
            </div>
            <div class="impact-zone-card secondary">
              <b>Secondary Zone</b>
              <span>Radius: ${baseAssessment.secondaryRadiusKm.toFixed(1)} km</span>
              <span>Area: ${Math.round(baseAssessment.secondaryArea).toLocaleString()} km²</span>
              <span>Population: ~${baseAssessment.secondaryPopulation.toLocaleString()}</span>
            </div>
            <div class="impact-zone-card felt">
              <b>Felt Radius</b>
              <span>Radius: ${baseAssessment.feltRadiusKm.toFixed(1)} km</span>
              <span>Area: ${Math.round(baseAssessment.feltArea).toLocaleString()} km²</span>
              <span>Population: ~${baseAssessment.totalPopulation.toLocaleString()}</span>
            </div>
          </div>
          <div class="impact-subtitle">Infrastructure in affected area (loading live OSM buildings...)</div>
          <div class="impact-subtitle">Raster source: <span style="display:inline-block;padding:2px 8px;border-radius:999px;border:1px solid rgba(120,180,255,0.45);background:rgba(40,85,150,0.22);color:#cfe8ff;font-weight:700;">Loading...</span></div>
          <div class="impact-grid">
            <div class="impact-item"><small>Buildings</small><strong>Loading...</strong></div>
            <div class="impact-item"><small>Population (Density - Estimated)</small><strong>${baseAssessment.populationAffected.toLocaleString()}</strong></div>
            <div class="impact-item"><small>Population (Raster - Accurate)</small><strong>${loadingPopulation ? 'Loading...' : '0'}</strong></div>
            <div class="impact-item"><small>Difference</small><strong>${loadingPopulation ? 'Loading...' : `-${baseAssessment.populationAffected.toLocaleString()}`}</strong></div>
          </div>
          <div class="impact-arrow" aria-hidden="true"></div>
        `;

        popup.classList.remove('is-hidden');
        positionImpactPopup();

        const earlyCloseBtn = document.getElementById('impactPopupClose');
        if (earlyCloseBtn) {
          earlyCloseBtn.addEventListener('click', () => {
            selectedImpactEvent = null;
            hideImpactPopup();
          });
        }

        const assessment = await analyzeImpact(eventItem);
        if (!selectedImpactEvent || selectedImpactEvent.id !== eventItem.id) return;
        latestImpactAssessment = assessment;
        updateFormulaModal(assessment);

        popup.innerHTML = `
          <div class="impact-title">
            <h4>Seismic Impact Assessment</h4>
            <button class="impact-close" id="impactPopupClose" type="button" aria-label="Close impact popup">×</button>
            <span class="impact-risk" style="background:${riskColor(assessment.risk)}">${assessment.risk}</span>
          </div>
          <div class="impact-subtitle">${escapeHtml(eventItem.place || 'Unknown location')} · M ${Number(eventItem.mag || 0).toFixed(1)} · Depth ${Number(eventItem.depthKm || 0).toFixed(1)} km</div>
          <div class="impact-grid">
            <div class="impact-item"><small>Country</small><strong>${escapeHtml(country)}</strong></div>
            <div class="impact-item"><small>Coordinates</small><strong>${latText}, ${lngText}</strong></div>
            <div class="impact-item"><small>Event Time</small><strong>${escapeHtml(eventTimeText)}</strong></div>
            <div class="impact-item"><small>Nearby Cities</small><strong>${escapeHtml(nearbyCities || 'Unknown')}</strong></div>
          </div>
          <div class="impact-zone-row">
            <div class="impact-zone-card primary">
              <b>Primary Zone</b>
              <span>Radius: ${assessment.primaryRadiusKm.toFixed(1)} km</span>
              <span>Area: ${Math.round(assessment.primaryArea).toLocaleString()} km²</span>
              <span>Population: ~${assessment.primaryPopulation.toLocaleString()}</span>
            </div>
            <div class="impact-zone-card secondary">
              <b>Secondary Zone</b>
              <span>Radius: ${assessment.secondaryRadiusKm.toFixed(1)} km</span>
              <span>Area: ${Math.round(assessment.secondaryArea).toLocaleString()} km²</span>
              <span>Population: ~${assessment.secondaryPopulation.toLocaleString()}</span>
            </div>
            <div class="impact-zone-card felt">
              <b>Felt Radius</b>
              <span>Radius: ${assessment.feltRadiusKm.toFixed(1)} km</span>
              <span>Area: ${Math.round(assessment.feltArea).toLocaleString()} km²</span>
              <span>Population: ~${assessment.totalPopulation.toLocaleString()}</span>
            </div>
          </div>
          <div class="impact-subtitle">Infrastructure in affected area (estimated)</div>
          <div class="impact-subtitle">Raster source: <span style="display:inline-block;padding:2px 8px;border-radius:999px;border:1px solid rgba(120,180,255,0.45);background:rgba(40,85,150,0.22);color:#cfe8ff;font-weight:700;">${escapeHtml(String(assessment.populationComparison?.source || 'Failed'))}</span></div>
          <div class="impact-grid">
            <div class="impact-item"><small>Buildings</small><strong>${assessment.totalInfra.buildings.toLocaleString()}</strong></div>
            <div class="impact-item"><small>Population (Density - Estimated)</small><strong>${Number(assessment.populationComparison?.density || assessment.populationAffected || 0).toLocaleString()}</strong></div>
            <div class="impact-item"><small>Population (Raster - Accurate)</small><strong>${Number(assessment.populationComparison?.raster || 0).toLocaleString()}</strong></div>
            <div class="impact-item"><small>Difference</small><strong>${(Number(assessment.populationComparison?.difference || 0) >= 0 ? '+' : '') + Number(assessment.populationComparison?.difference || 0).toLocaleString()}</strong></div>
          </div>
          <div class="impact-arrow" aria-hidden="true"></div>
        `;

        popup.classList.remove('is-hidden');
        positionImpactPopup();

        const closeBtn = document.getElementById('impactPopupClose');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            selectedImpactEvent = null;
            hideImpactPopup();
          });
        }
      }

      function ensureGlobe() {
        if (globe) return globe;
        const el = document.getElementById('globeViz');
        if (!el) return null;
        const bootBounds = el.getBoundingClientRect();
        const bootWidth = Math.floor(bootBounds.width || el.clientWidth || 0);
        const bootHeight = Math.floor(bootBounds.height || el.clientHeight || 0);
        if (bootWidth <= 24 || bootHeight <= 24) {
          deferGlobeInitialization();
          return null;
        }
        globeDeferredInitRetries = 0;
        globe = Globe()(el)
          .width(Math.max(1, Math.floor(el.getBoundingClientRect().width || el.clientWidth || 0)))
          .height(Math.max(1, Math.floor(el.getBoundingClientRect().height || el.clientHeight || 0)))
          .globeImageUrl(GLOBE_TEXTURES[activeGlobeLayer])
          .bumpImageUrl('/vendor/earth-topology.png')
          .backgroundColor('rgba(0,0,0,0)')
          .showAtmosphere(true)
          .atmosphereColor('#5ca8ff')
          .atmosphereAltitude(0.18)
          .pointLabel((d) => d.label)
          .onPointClick((d) => selectEvent(d.id))
          .onGlobeClick(() => clearSelection());

        const controls = globe.controls();
        globeControls = controls;
        controls.autoRotate = isAutoRotateEnabled;
        controls.autoRotateSpeed = 0.35;
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.enablePan = false;
        applyCameraDistanceConstraints(controls);
        if (typeof controls.addEventListener === 'function') {
          const onGlobeControlsChange = () => {
            clampGlobeCameraDistance();
            positionImpactPopup();
          };
          controls.addEventListener('change', onGlobeControlsChange);
          addDisposeCallback(() => {
            if (typeof controls.removeEventListener === 'function') {
              controls.removeEventListener('change', onGlobeControlsChange);
            }
          });
        }

        window.addEventListener('resize', resizeGlobeViewport);
        addDisposeCallback(() => window.removeEventListener('resize', resizeGlobeViewport));
        if (typeof window.ResizeObserver === 'function') {
          globeResizeObserver = new window.ResizeObserver(() => {
            if (globeResizeRaf) return;
            globeResizeRaf = window.requestAnimationFrame(() => {
              globeResizeRaf = null;
              resizeGlobeViewport();
            });
          });
          globeResizeObserver.observe(el);
          addDisposeCallback(() => {
            if (globeResizeObserver) {
              globeResizeObserver.disconnect();
              globeResizeObserver = null;
            }
            if (globeResizeRaf) {
              window.cancelAnimationFrame(globeResizeRaf);
              globeResizeRaf = null;
            }
          });
        }
        window.setTimeout(resizeGlobeViewport, 30);
        loadPakistanBuildings(globe);
        return globe;
      }

      function refreshPointsAppearance() {
        if (!globe) return;

        const pulseRings = buildPulseRings();
        const visiblePoints = layerSettings.markers ? getVisibleEarthquakes() : [];

        globe.pointsData([]);
        globe.ringsData([]);

        globe
          .pointsData(visiblePoints)
          .pointLat('lat')
          .pointLng('lng')
          .pointAltitude(() => 0)
          .pointRadius((d) => {
            const factor = layerSettings.population ? 0.0056 : 0.0045;
            const base = Math.max(0.038, Math.min(0.074, 0.036 + d.mag * factor));
            if (d.id === selectedId) {
              return Math.min(0.11, base + 0.028);
            }
            return base;
          })
          .pointColor((d) => {
            if (d.id === selectedId) {
              return 'rgba(59, 226, 255, 0.98)';
            }
            return markerColorForLayer(d.mag);
          })
          .pointLabel((d) => (layerSettings.labels ? d.label : ''))
          .ringsData(pulseRings)
          .ringLat('lat')
          .ringLng('lng')
          .ringColor((d) => (t) => {
            const alpha = Math.max(0, (Number(d.opacity ?? 0.46) || 0.46) * (1 - t));
            const tone = d.color || '#ff3856';
            const r = parseInt(tone.slice(1, 3), 16);
            const g = parseInt(tone.slice(3, 5), 16);
            const b = parseInt(tone.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
          })
          .ringMaxRadius('maxRadius')
          .ringPropagationSpeed('speed')
          .ringRepeatPeriod('period');
        void applyGlobeOverlayPaths();
      }

      function setAutoRotation(enabled) {
        isAutoRotateEnabled = Boolean(enabled);
        const glb = ensureGlobe();
        if (!glb) return;
        const controls = glb.controls();
        controls.autoRotate = isAutoRotateEnabled;

        const autoRotateBtn = document.getElementById('autoRotateBtn');
        if (autoRotateBtn) {
          autoRotateBtn.textContent = isAutoRotateEnabled ? eqT('motionStop') : eqT('motionStart');
        }
      }

      function focusOn(id) {
        if (!globe || !eventsData.length) return;
        const selected = eventsData.find((item) => item.id === id);
        const target = selected || eventsData[0];
        if (!target) return;
        safePointOfView(
          { lat: target.lat, lng: target.lng, altitude: selected ? FOCUS_GLOBE_ALTITUDE : DEFAULT_GLOBE_ALTITUDE },
          1000,
        );
      }

      function selectEvent(id) {
        const selected = eventsData.find((item) => item.id === id) || null;
        if (!selected) return;

        if (selectedEarthquake && selectedEarthquake.id === id) {
          clearSelection();
          return;
        }

        setSelectedEarthquake(selected);
        void renderImpactPopup(selected);
        focusOn(id);
      }

      function render(data) {
        const eventsEl = document.getElementById('events');
        const statsGrid = document.getElementById('statsGrid');
        const updatedAt = document.getElementById('updatedAt');
        const sourceMeta = document.getElementById('sourceMeta');
        if (!eventsEl || !statsGrid || !updatedAt) return;
        const glb = ensureGlobe();
        if (!glb) return;

        eventsData = data.map((e) => {
          const mag = Number(e.properties.mag || 0);
          const lat = Number(e.geometry.coordinates?.[1]);
          const lng = Number(e.geometry.coordinates?.[0]);
          const depthKm = Number(e.geometry.coordinates?.[2] || 0);
          const country = countryFromEvent(e);
          const region = regionFromPlace(e.properties.place);
          const tsunami = Number(e.properties?.tsunami || 0) === 1;
          const significance = Number(e.properties?.sig || 0);
          const status = String(e.properties?.status || 'unknown');
          return {
            id: String(e.id ?? `${lat}-${lng}-${e.properties.time}`),
            mag,
            lat,
            lng,
            depthKm,
            country,
            region,
            tsunami,
            significance,
            status,
            url: String(e.properties?.url || e.properties?.detail || ''),
            place: String(e.properties.place || eqT('unknownLocation')),
            time: Number(e.properties.time || Date.now()),
            label: `<strong>M ${mag.toFixed(1)}</strong><br/>${escapeHtml(region)}<br/>${new Date(e.properties.time).toLocaleString()}`,
          };
        }).filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng));

        fillCountryFilterOptions();
        renderRecentActivityList();

        glb
          .pointsData(getVisibleEarthquakes())
          .pointLat('lat')
          .pointLng('lng')
          .pointAltitude(() => 0)
          .pointRadius((d) => {
            const base = Math.max(0.038, Math.min(0.074, 0.036 + d.mag * 0.0045));
            return d.id === selectedId ? Math.min(0.092, base + 0.014) : base;
          })
          .pointColor((d) => d.id === selectedId ? '#ff3553' : markerColorForLayer(d.mag));

        refreshPointsAppearance();

        if (sourceMeta) {
          const eventCount = eventsData.length;
          const countSuffix = eventCount > 0 ? ` · ${eventCount} events` : '';
          sourceMeta.textContent = `${sourceLabelText || eqT('sourceLive')}${countSuffix}`;
        }

        const mags = data.map((x) => Number(x.properties.mag || 0));
        const avg = mags.length ? mags.reduce((a, b) => a + b, 0) / mags.length : 0;
        const max = mags.length ? Math.max(...mags) : 0;
        const largestEvent = data.reduce((best, event) => {
          const mag = Number(event?.properties?.mag || 0);
          if (!best) return event;
          const bestMag = Number(best?.properties?.mag || 0);
          return mag > bestMag ? event : best;
        }, null);
        const largestPlace = largestCardPlace(largestEvent?.properties?.place);
        const countries = new Set(eventsData.map((item) => item.country).filter(Boolean)).size;

        statsGrid.innerHTML = `
          <div class="stats-item"><small>${eqT('statsTotal')}</small><strong>${data.length}</strong></div>
          <div class="stats-item"><small>${eqT('statsAvg')}</small><strong>${avg.toFixed(1)}</strong></div>
          <div class="stats-item"><small>${eqT('statsLargest')}</small><strong>M ${max.toFixed(1)}</strong><span class="stat-subtitle" title="${escapeHtml(largestPlace)}">${escapeHtml(largestPlace)}</span></div>
          <div class="stats-item"><small>${eqT('statsLocations')}</small><strong>${countries} ${eqT('statsCountries')}</strong></div>
        `;

        updatedAt.textContent = `${eqT('lastUpdated')} ${new Date().toLocaleTimeString()}`;

        if (selectedEarthquake) {
          const refreshedSelection = eventsData.find((item) => item.id === selectedEarthquake.id) || null;
          if (refreshedSelection) {
            setSelectedEarthquake(refreshedSelection);
            void renderImpactPopup(refreshedSelection);
          } else {
            clearSelection();
          }
        } else {
          refreshPointsAppearance();
          if (is2DMap) render2DMap();
        }
      }

      async function load(reason = 'poll') {
        if (pageDisposed) return;
        if (refreshInFlight) {
          pendingRefreshReason = reason;
          return;
        }

        refreshInFlight = true;
        activeLoadController = new AbortController();
        setRefreshButtonState(true);
        try {
          let payload = null;
          for (let attempt = 0; attempt < MAX_FETCH_RETRIES; attempt += 1) {
            try {
              payload = await fetchEarthquakes();
              break;
            } catch (error) {
              if (attempt >= MAX_FETCH_RETRIES - 1) throw error;
              await new Promise((resolve) => window.setTimeout(resolve, 700 * (attempt + 1)));
            }
          }

          const safeFeatures = Array.isArray(payload?.features) ? payload.features : [];
          const sourceLabel = String(payload?.sourceLabel || eqT('sourceLive'));
          sourceLabelText = payload?.warning
            ? `${sourceLabel} — ${payload.warning}`
            : sourceLabel;
          if (pageDisposed) return;
          render(safeFeatures);
          if (safeFeatures.length > 0) {
            lastGoodFeatures = safeFeatures;
            persistLastGoodFeatures(safeFeatures);
          }
          maybeNotifyForNewEvents(safeFeatures);
          applyPendingFocus(safeFeatures);
          consecutiveLoadFailures = 0;
          await triggerAlertDispatch();
        } catch (error) {
          if (error?.name === 'AbortError') {
            return;
          }
          void error;
          consecutiveLoadFailures += 1;
          sourceLabelText =
            lastGoodFeatures.length > 0
              ? `${eqT('sourceLive')} — ${eqT('justNow')}`
              : eqT('sourceUnavailable');
          if (lastGoodFeatures.length > 0) {
            if (!pageDisposed) render(lastGoodFeatures);
          } else {
            if (!pageDisposed) render([]);
          }

          if (!refreshRetryTimer) {
            const retryDelay = Math.min(10000, 1500 * consecutiveLoadFailures);
            refreshRetryTimer = window.setTimeout(() => {
              refreshRetryTimer = null;
              if (!pageDisposed) void load('retry');
            }, retryDelay);
          }
        } finally {
          activeLoadController = null;
          refreshInFlight = false;
          setRefreshButtonState(false);
          nextRefreshAt = Date.now() + LIVE_REFRESH_MS;
          updateRefreshCountdownLabel();
          if (pendingRefreshReason) {
            const nextReason = pendingRefreshReason;
            pendingRefreshReason = '';
            void load(nextReason);
          }
        }
      }

      function bindControls() {
        const backBtn = document.getElementById('backBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const autoRotateBtn = document.getElementById('autoRotateBtn');
        const formulaBtn = document.getElementById('formulaBtn');
        const formulaModal = document.getElementById('formulaModal');
        const formulaModalCloseBtn = document.getElementById('formulaModalCloseBtn');
        const countryFilterSelect = document.getElementById('countryFilterSelect');
        const sortFilterSelect = document.getElementById('sortFilterSelect');
        const eventSearchInput = document.getElementById('eventSearchInput');
        const eventDisplayCountSelect = document.getElementById('eventDisplayCountSelect');
        const recentActivityToggleBtn = document.getElementById('recentActivityToggleBtn');
        const mobileEventsViewBtn = document.getElementById('mobileEventsViewBtn');
        const mobileGlobeViewBtn = document.getElementById('mobileGlobeViewBtn');
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const layerToggleBtn = document.getElementById('layerToggleBtn');
        const layersPanel = document.getElementById('layersPanel');
        const baseLayerSelect = document.getElementById('baseLayerSelect');
        const layerCountryBorders = document.getElementById('layerCountryBorders');
        const layerPlateBoundaries = document.getElementById('layerPlateBoundaries');
        const layerFaultLines = document.getElementById('layerFaultLines');
        const layerPopulation = document.getElementById('layerPopulation');
        const layerCities = document.getElementById('layerCities');
        const layerLabels = document.getElementById('layerLabels');
        const layerRisk = document.getElementById('layerRisk');
        const layerMarkers = document.getElementById('layerMarkers');
        const mapToggleBtn = document.getElementById('mapToggleBtn');
        const resetViewBtn = document.getElementById('resetViewBtn');
        const impactPopupClose = document.getElementById('impactPopupClose');

        const bind = (node, eventName, handler) => {
          if (!node || typeof node.addEventListener !== 'function') return;
          node.addEventListener(eventName, handler);
          addDisposeCallback(() => node.removeEventListener(eventName, handler));
        };

        bind(backBtn, 'click', () => {
          if (document.documentElement.classList.contains('eq-embed')) return;
          if (window.history.length > 1) {
            window.history.back();
            return;
          }
          window.location.href = './';
        });

        bind(refreshBtn, 'click', () => {
          void load('manual');
        });

        layerToggleController = LayerToggleButton(layerToggleBtn);

        bind(autoRotateBtn, 'click', () => {
          setAutoRotation(!isAutoRotateEnabled);
        });

        bind(formulaBtn, 'click', async () => {
          let activeAssessment = latestImpactAssessment;
          if (selectedImpactEvent) {
            activeAssessment = await analyzeImpact(selectedImpactEvent);
            latestImpactAssessment = activeAssessment;
          }
          updateFormulaModal(activeAssessment || null);
          formulaModal.classList.add('open');
        });

        bind(formulaModalCloseBtn, 'click', () => {
          formulaModal.classList.remove('open');
        });

        bind(formulaModal, 'click', (event) => {
          if (event.target === formulaModal) {
            formulaModal.classList.remove('open');
          }
        });

        const onDocKeydown = (event) => {
          if (event.key === 'Escape' && formulaModal.classList.contains('open')) {
            formulaModal.classList.remove('open');
          }
        };
        document.addEventListener('keydown', onDocKeydown);
        addDisposeCallback(() => document.removeEventListener('keydown', onDocKeydown));

        bind(countryFilterSelect, 'change', () => {
          selectedCountryFilter = String(countryFilterSelect?.value || 'all');
          renderRecentActivityList();
          refreshPointsAppearance();
          if (is2DMap) render2DMap();
        });

        bind(sortFilterSelect, 'change', () => {
          selectedSortFilter = String(sortFilterSelect?.value || 'latest');
          renderRecentActivityList();
          refreshPointsAppearance();
        });

        bind(eventSearchInput, 'input', () => {
          eventSearchQuery = String(eventSearchInput?.value || '');
          renderRecentActivityList();
          refreshPointsAppearance();
          if (is2DMap) render2DMap();
        });

        bind(eventDisplayCountSelect, 'change', () => {
          selectedDisplayCount = String(eventDisplayCountSelect?.value || '25');
          renderRecentActivityList();
        });

        bind(recentActivityToggleBtn, 'click', () => {
          const aside = root.querySelector('.left.card');
          if (!aside) return;
          aside.classList.toggle('is-collapsed');
          updateRecentActivityToggle();
          resizeGlobeViewport();
          if (is2DMap) scheduleLeafletInvalidate();
        });

        bind(mobileEventsViewBtn, 'click', () => {
          setMobilePanelView('events');
        });

        bind(mobileGlobeViewBtn, 'click', () => {
          setMobilePanelView('globe');
        });

        const onLayerSettingChange = () => {
          layerSettings = {
            countryBorders: Boolean(layerCountryBorders?.checked),
            plateBoundaries: Boolean(layerPlateBoundaries?.checked),
            faultLines: Boolean(layerFaultLines?.checked),
            population: Boolean(layerPopulation?.checked),
            cities: Boolean(layerCities?.checked),
            labels: Boolean(layerLabels?.checked),
            risk: Boolean(layerRisk?.checked),
            markers: Boolean(layerMarkers?.checked),
          };
          const miniLabel = document.querySelector('.mini');
          if (miniLabel) {
            miniLabel.style.display = layerSettings.cities ? 'flex' : 'none';
          }
          refreshMapOverlayVisibility();
          refreshPointsAppearance();
          if (is2DMap) render2DMap();
        };

        bind(baseLayerSelect, 'change', () => {
          const mode = String(baseLayerSelect?.value || 'night');
          setGlobeLayer(mode);
        });
        bind(layerCountryBorders, 'change', onLayerSettingChange);
        bind(layerPlateBoundaries, 'change', onLayerSettingChange);
        bind(layerFaultLines, 'change', onLayerSettingChange);
        bind(layerPopulation, 'change', onLayerSettingChange);
        bind(layerCities, 'change', onLayerSettingChange);
        bind(layerLabels, 'change', onLayerSettingChange);
        bind(layerRisk, 'change', onLayerSettingChange);
        bind(layerMarkers, 'change', onLayerSettingChange);

        bind(document, 'click', (event) => {
          if (!layersPanel || !layerToggleBtn) return;
          if (layersPanel.contains(event.target) || layerToggleBtn.contains(event.target)) return;
          layersPanel.classList.remove('open');
        });

        bind(fullscreenBtn, 'click', async () => {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
          } else {
            await (root.querySelector('.page') || root).requestFullscreen();
          }
          scheduleLeafletInvalidate();
          resizeGlobeViewport();
        });

        const onFullscreenChange = () => {
          scheduleLeafletInvalidate();
          resizeGlobeViewport();
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        addDisposeCallback(() => document.removeEventListener('fullscreenchange', onFullscreenChange));
        const onViewportResize = () => {
          const aside = root.querySelector('.left.card');
          if (aside) {
            if (window.innerWidth > 1024) {
              aside.classList.remove('is-collapsed');
            }
            updateRecentActivityToggle();
          }
          setMobilePanelView(mobilePanelView);
        };
        const aside = root.querySelector('.left.card');
        if (aside) {
          aside.classList.remove('is-collapsed');
          updateRecentActivityToggle();
        }
        window.addEventListener('resize', onViewportResize);
        addDisposeCallback(() => window.removeEventListener('resize', onViewportResize));

        bind(zoomInBtn, 'click', () => {
          if (is2DMap && leafletMap) {
            leafletMap.zoomIn();
            return;
          }
          ensureGlobe();
          currentAltitude = clampAltitude(currentAltitude - 0.18);
          safePointOfView({ ...defaultCenter, altitude: currentAltitude }, 320);
        });

        bind(zoomOutBtn, 'click', () => {
          if (is2DMap && leafletMap) {
            leafletMap.zoomOut();
            return;
          }
          ensureGlobe();
          currentAltitude = clampAltitude(currentAltitude + 0.18);
          safePointOfView({ ...defaultCenter, altitude: currentAltitude }, 320);
        });

        bind(mapToggleBtn, 'click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          setIs2DMap(!is2DMap);
        });

        bind(resetViewBtn, 'click', () => {
          clearSelection();
          if (is2DMap) {
            render2DMap();
            return;
          }
          ensureGlobe();
          currentAltitude = DEFAULT_GLOBE_ALTITUDE;
          safePointOfView({ ...defaultCenter, altitude: currentAltitude }, 600);
        });

        if (impactPopupClose) {
          bind(impactPopupClose, 'click', () => {
            selectedImpactEvent = null;
            hideImpactPopup();
          });
        }

        setAutoRotation(true);
        setGlobeLayer('night');
        if (baseLayerSelect) {
          baseLayerSelect.value = 'night';
        }
        setIs2DMap(false);
        setMobilePanelView('events');
      }

      const globeFactory = typeof window.Globe === 'function' ? window.Globe : null;
      const leafletReady = typeof window.L !== 'undefined';

      if (!globeFactory) {
        /* noop */
      } else if (!leafletReady) {
        /* noop */
      } else {
        applyEqStaticLabels();
        const onLangChange = () => {
          applyEqStaticLabels();
          if (is2DMap) render2DMap();
        };
        window.addEventListener('r360-eq-lang-change', onLangChange);
        addDisposeCallback(() => window.removeEventListener('r360-eq-lang-change', onLangChange));
        loadAlertSettings();
        persistAlertSettings();
        window.__r360EarthquakeAlertSettings = {
          get: () => ({ ...alertSettings }),
          set: (patch) => updateAlertSettings(patch),
          requestPermission: () => ensureNotificationPermission(),
          testSound: () => playAlertSound(),
        };
        loadNotifiedEventIds();
        bindControls();
        window.addEventListener('pagehide', disposeEarthquakePage, { once: true });
        void loadPopulationRaster();
        void load('initial');
        nextRefreshAt = Date.now() + LIVE_REFRESH_MS;
        updateRefreshCountdownLabel();
        refreshCountdownTimer = window.setInterval(() => {
          if (document.hidden) return;
          updateRefreshCountdownLabel();
        }, 1000);
        refreshTimer = window.setInterval(() => {
          if (document.hidden) return;
          nextRefreshAt = Date.now() + LIVE_REFRESH_MS;
          void load('poll');
        }, LIVE_REFRESH_MS);
      }
    

    if (typeof disposeEarthquakePage === 'function') {
      disposeFn = disposeEarthquakePage
    }

    return function () {
      try {
        disposeFn()
      } catch (error) {
        void error
      }
      document.getElementById = nativeGetElementById
      document.querySelector = nativeQuerySelector
      document.querySelectorAll = nativeQuerySelectorAll
      document.documentElement.classList.remove('eq-embed')
      if (alertAudio) {
        try {
          alertAudio.pause();
        } catch {
          // Ignore teardown audio errors.
        }
      }
      if (window.__r360EarthquakeAlertSettings) {
        delete window.__r360EarthquakeAlertSettings;
      }
      root.__eqMonitorBooted = false
    }
  }
