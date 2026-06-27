/**
 * Extracted from public/live-earthquake-alerts.html.
 * Preserves original monitor logic; scoped to a React mount root.
 */
(function () {
  function initLiveEarthquakeMonitor(root) {
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
      function stripTrailingSlash(value) {
        return String(value || '').replace(/\/+$/, '');
      }

      function resolveApiBaseUrl() {
        const globalBase = stripTrailingSlash(String(window.__R360_API_BASE_URL || window.__API_BASE_URL || ''));
        if (globalBase) return globalBase;
        const envBase = stripTrailingSlash(String(window.__ENV__?.VITE_API_BASE_URL || window.__ENV__?.VITE_API_URL || ''));
        if (envBase) return envBase;
        if (window.location.port === '5173') {
          return `${window.location.protocol}//${window.location.hostname}:10000`;
        }
        return 'https://infra-resilience360-cloud-production.up.railway.app';
      }

      function resolveMediaBaseUrl() {
        const globalMediaBase = stripTrailingSlash(String(window.__R360_MEDIA_BASE_URL || ''));
        if (globalMediaBase) return globalMediaBase;
        const envMediaBase = stripTrailingSlash(
          String(window.__ENV__?.VITE_MEDIA_BASE_URL || window.__ENV__?.VITE_PUBLIC_MEDIA_BASE_URL || '')
        );
        if (envMediaBase) return envMediaBase;
        return '';
      }

      function mediaUrl(relativePath) {
        const clean = String(relativePath || '').replace(/^\/+/, '');
        const mediaBase = resolveMediaBaseUrl();
        if (mediaBase) return `${mediaBase}/content/${clean}`;
        return `${resolveApiBaseUrl()}/content/${clean}`;
      }

      const LOCAL_EARTHQUAKE_SOURCES = [
        '/data/earthquake/latest.json',
        '/data/earthquake/recent.json',
        '/data/earthquake/historical.json',
        mediaUrl('live-earthquake-alerts/earthquakes.json'),
      ];
      const LOCAL_SUBSCRIBERS_KEY = 'r360-earthquake-local-subscribers';

      async function fetchLocalJson(path) {
        const response = await fetch(path, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Local dataset request failed (${response.status}) for ${path}`);
        return response.json();
      }
      const GLOBE_TEXTURES = {
        default: '/vendor/earth-night.jpg',
        heatmap: '/vendor/earth-night.jpg',
        satellite: '/vendor/earth-day.jpg',
      };
      const LOCAL_BUILDING_COUNT = 0;
      const MAX_PAKISTAN_BUILDINGS = 2500;
      const MAX_IMPACT_QUERY_RADIUS_METERS = 180000;
      const LIVE_REFRESH_MS = 60000;
      const LIVE_FETCH_TIMEOUT_MS = 16000;
      const MAX_FETCH_RETRIES = 1;

      function eqLang() {
        try {
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
          uploadEmails: 'Upload Emails',
          motionStop: 'Stop Motion',
          motionStart: 'Start Motion',
          fullscreen: 'Fullscreen',
          refresh: 'Refresh',
          formulaTitle: 'Open Formula Table',
          recentActivity: 'Recent Activity',
          locationsTab: 'Locations',
          country: 'Country',
          magnitude: 'Magnitude',
          live: 'Live',
          sourceLoading: 'Source: loading…',
          sourceLive: 'Source: live feed',
          sourceUnavailable: 'Source: unavailable',
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
          emailModalTitle: 'Earthquake Email Alerts (M > 5)',
          close: 'Close',
          emailHelp:
            'Enter Gmail addresses to receive live notifications for earthquakes above magnitude 5. This subscription is shared across devices.',
          emailPlaceholder: 'example@gmail.com',
          addGmail: 'Add Gmail',
          thresholdTag: 'Threshold: M 5.0+',
          noSubscribers: 'No Gmail subscribers added yet.',
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
          thresholdPrefix: 'Threshold:',
        },
        ur: {
          docTitle: 'زلزلے کی براہ راست انتباہات',
          headerTitle: 'زلزلہ براہ راست نگرانی',
          statusLive: 'براہ راست ڈیٹا',
          lastUpdated: 'آخری اپ ڈیٹ:',
          justNow: 'ابھی',
          back: 'واپس',
          uploadEmails: 'ای میل اپ لوڈ',
          motionStop: 'حرکت روکیں',
          motionStart: 'حرکت شروع کریں',
          fullscreen: 'پوری سکرین',
          refresh: 'تازہ کریں',
          formulaTitle: 'فارمولہ کی جدول کھولیں',
          recentActivity: 'حالیہ سرگرمی',
          locationsTab: 'مقامات',
          country: 'ملک',
          magnitude: 'شدت',
          live: 'براہ راست',
          sourceLoading: 'ماخذ: لوڈ ہو رہا ہے…',
          sourceLive: 'ماخذ: براہ راست فیڈ',
          sourceUnavailable: 'ماخذ: دستیاب نہیں',
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
          emailModalTitle: 'زلزلے کی ای میل انتباہات (M > 5)',
          close: 'بند کریں',
          emailHelp:
            '۵ سے بڑی شدت کے زلزلوں کی فوری اطلاع کے لیے جی میل پتے درج کریں۔ یہ سبسکرپشن تمام آلات پر مشترک ہے۔',
          emailPlaceholder: 'example@gmail.com',
          addGmail: 'جی میل شامل کریں',
          thresholdTag: 'حد: M 5.0+',
          noSubscribers: 'ابھی کوئی جی میل سبسکرائبر نہیں۔',
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
          thresholdPrefix: 'حد:',
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
        setTxt('emailAlertsBtn', eqT('uploadEmails'));
        setTxt('autoRotateBtn', eqT('motionStop'));
        setTxt('fullscreenBtn', eqT('fullscreen'));
        setTxt('refreshBtn', eqT('refresh'));
        const formulaBtn = document.getElementById('formulaBtn');
        if (formulaBtn) {
          formulaBtn.setAttribute('title', eqT('formulaTitle'));
          formulaBtn.setAttribute('aria-label', eqT('formulaTitle'));
        }
        const asideH = document.querySelector('.left.card h2');
        if (asideH) asideH.textContent = eqT('recentActivity');
        setTxt('tabRecentBtn', eqT('recentActivity'));
        setTxt('tabLocationsBtn', eqT('locationsTab'));
        const recentHead = document.querySelector('#recentPanel .left-head');
        if (recentHead) {
          recentHead.innerHTML = '<span>' + eqT('country') + '</span><span>' + eqT('magnitude') + '</span>';
        }
        const locHead = document.querySelector('#locationsPanel .left-head');
        if (locHead) {
          locHead.innerHTML = '<span>' + eqT('country') + '</span><span>' + eqT('live') + '</span>';
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
        setTxt('emailModalTitle', eqT('emailModalTitle'));
        setTxt('emailModalCloseBtn', eqT('close'));
        const emailHelp = document.querySelector('.email-help');
        if (emailHelp) emailHelp.textContent = eqT('emailHelp');
        const emailInput = document.getElementById('emailInput');
        if (emailInput) emailInput.setAttribute('placeholder', eqT('emailPlaceholder'));
        setTxt('emailAddBtn', eqT('addGmail'));
        setTxt('formulaModalTitle', eqT('formulaModalTitle'));
        setTxt('formulaModalCloseBtn', eqT('close'));
        const fp = document.getElementById('formulaPopulationNote');
        if (fp) fp.textContent = eqT('formulaPopNote');
        const fds = document.getElementById('formulaDensitySource');
        if (fds) fds.textContent = eqT('formulaWaitOsm');
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
            sourceMeta.textContent = `${window.__sourceLabel || eqT('sourceLive')} · ${eqT('buildingsLabel')} ${LOCAL_BUILDING_COUNT.toLocaleString()}`;
          }
        } catch (error) {
          void error;
          const sourceMeta = document.getElementById('sourceMeta');
          if (sourceMeta)
            sourceMeta.textContent = `${window.__sourceLabel || eqT('sourceLive')} · ${eqT('buildingsUnavailable')}`;
        } finally {
          globeInstance.__pakBuildingsLoading = false;
        }
      }

      let globe = null;
      let quakeRows = [];
      let selectedId = null;
      let currentAltitude = 1.7;
      let eventsData = [];
      let activeGlobeLayer = 'default';
      let globeLayerTransitionTimer = null;
      let layerToggleController = null;
      let selectedImpactEvent = null;
      let locationsData = [];
      let activeLeftTab = 'recent';
      let expandedCountry = null;
      let emailSubscribers = [];
      let isEmailModalOpen = false;
      let earthquakeAlertThreshold = 5;
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
      let leafletMap = null;
      let leafletLayerGroup = null;
      const defaultMapCenter = [30, 70];
      const defaultMapZoom = 4;
      let populationServiceModule = null;
      let populationDataLoaded = false;
      let loadingPopulation = false;
      let refreshTimer = null;
      let refreshRetryTimer = null;
      let refreshInFlight = false;
      let pendingRefreshReason = '';
      let consecutiveLoadFailures = 0;
      let lastGoodFeatures = [];
      let pageDisposed = false;
      let globeControls = null;
      const disposeCallbacks = [];

      function addDisposeCallback(fn) {
        if (typeof fn !== 'function') return;
        disposeCallbacks.push(fn);
      }

      function clearLiveTimers() {
        if (refreshTimer) {
          window.clearInterval(refreshTimer);
          refreshTimer = null;
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

      async function ensurePopulationService() {
        if (populationServiceModule) return populationServiceModule;
        populationServiceModule = await import('/services/populationService.js');
        return populationServiceModule;
      }

      async function loadPopulationRaster() {
        try {
          const service = await ensurePopulationService();
          await service.loadPopulationData();
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
        if (!selectedEarthquake) return eventsData;
        return eventsData.filter((item) => item.id === selectedEarthquake.id);
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
          globe.pointOfView({ ...defaultCenter, altitude: 1.7 }, 600);
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
          globe.pointOfView({ lat: selectedEarthquake.lat, lng: selectedEarthquake.lng, altitude: 1.5 }, 1000);
        }
        if (is2DMap) {
          render2DMap();
        }
      }

      function ensureLeafletMap() {
        const mapHost = document.getElementById('map2D');
        if (!mapHost || typeof L === 'undefined') return null;
        if (leafletMap) return leafletMap;

        leafletMap = L.map(mapHost, { zoomControl: false, preferCanvas: true }).setView(defaultMapCenter, defaultMapZoom);
        // Local-only mode: do not bind remote tile providers.
        leafletLayerGroup = L.layerGroup().addTo(leafletMap);
        return leafletMap;
      }

      function destroyLeafletMap() {
        if (leafletMap) {
          leafletMap.remove();
        }
        leafletMap = null;
        leafletLayerGroup = null;
      }

      function render2DMap() {
        if (pageDisposed) return;
        if (!is2DMap) return;
        const map = ensureLeafletMap();
        if (!map || !leafletLayerGroup) return;

        leafletLayerGroup.clearLayers();
        const visible = getVisibleEarthquakes();
        if (!visible.length) {
          map.setView(defaultMapCenter, defaultMapZoom);
          return;
        }

        if (selectedEarthquake) {
          const lat = Number(selectedEarthquake.lat);
          const lng = Number(selectedEarthquake.lng);
          const assessment = buildImpactAssessment(selectedEarthquake);
          L.marker([lat, lng]).addTo(leafletLayerGroup)
            .bindPopup(`${escapeHtml(selectedEarthquake.place || 'Unknown')}<br/>M ${Number(selectedEarthquake.mag || 0).toFixed(1)}`);
          L.circle([lat, lng], {
            radius: Number(assessment.secondaryRadiusKm || 0) * 1000,
            color: '#ff4b4b',
            fillColor: '#ff4b4b',
            fillOpacity: 0.2,
          }).addTo(leafletLayerGroup);
          map.setView([lat, lng], 6);
        } else {
          visible.forEach((eq) => {
            const marker = L.circleMarker([eq.lat, eq.lng], {
              radius: 4,
              color: '#5aa7ff',
              weight: 1,
              fillColor: '#5aa7ff',
              fillOpacity: 0.7,
            }).addTo(leafletLayerGroup);

            marker.bindPopup(`${escapeHtml(eq.place || 'Unknown')}<br/>M ${Number(eq.mag || 0).toFixed(1)}<br/>${new Date(eq.time).toLocaleString()}`);
            marker.on('click', () => {
              if (selectedEarthquake && selectedEarthquake.id === eq.id) {
                clearSelection();
                return;
              }
              setSelectedEarthquake(eq);
            });
          });
          map.setView(defaultMapCenter, defaultMapZoom);
        }

        window.setTimeout(() => {
          if (leafletMap) leafletMap.invalidateSize();
        }, 40);
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

        if (globeEl) globeEl.classList.toggle('hidden', is2DMap);
        if (mapHost) mapHost.classList.toggle('active', is2DMap);

        if (is2DMap) {
          render2DMap();
        } else {
          destroyLeafletMap();
        }
      }

      let resizeGlobeViewportTimer = null;
      function resizeGlobeViewport() {
        if (resizeGlobeViewportTimer) {
          window.clearTimeout(resizeGlobeViewportTimer);
        }
        resizeGlobeViewportTimer = window.setTimeout(() => {
          resizeGlobeViewportTimer = null;
          if (!globe) return;
          const host = document.getElementById('globeViz');
          if (!host) return;
          const width = Math.max(320, Math.floor(host.clientWidth));
          const height = Math.max(280, Math.floor(host.clientHeight));
          globe.width(width).height(height);
          positionImpactPopup();
        }, 120);
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

        return raw;
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
        if (activeGlobeLayer === 'heatmap') return heatmapPointColor(magnitude);
        return toPointColor(magnitude);
      }

      const LayerManager = (() => {
        const modes = ['default', 'heatmap', 'satellite'];

        const isMode = (value) => modes.includes(value);

        return {
          getMode() {
            return activeGlobeLayer;
          },
          getTitle(mode) {
            const m = mode === 'heatmap' ? 'heatmap' : mode === 'satellite' ? 'satellite' : 'default';
            if (m === 'heatmap') return eqT('layerHeatmap');
            if (m === 'satellite') return eqT('layerSatellite');
            return eqT('layerDefault');
          },
          cycle() {
            const currentIndex = modes.indexOf(activeGlobeLayer);
            const nextIndex = (currentIndex + 1) % modes.length;
            const nextMode = modes[nextIndex];
            setGlobeLayer(nextMode);
            return nextMode;
          },
          normalize(mode) {
            return isMode(mode) ? mode : 'default';
          },
        };
      })();

      function LayerToggleButton(button) {
        if (!button) return { sync: () => {} };

        const sync = (mode) => {
          const normalized = LayerManager.normalize(mode);
          button.dataset.layer = normalized;
          button.title = LayerManager.getTitle(normalized);
          button.setAttribute('aria-label', LayerManager.getTitle(normalized));
          button.classList.add('is-active');
        };

        button.addEventListener('click', () => {
          const nextMode = LayerManager.cycle();
          sync(nextMode);
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
        if (!place) return 'Unknown';

        const text = String(place).toLowerCase();
        if (text.includes('pakistan')) return 'Pakistan';
        if (text.includes('india')) return 'India';
        if (text.includes('afghanistan')) return 'Afghanistan';
        if (text.includes('iran')) return 'Iran';
        if (text.includes('china')) return 'China';
        return 'Other';
      }

      function countryFromEvent(event) {
        return getCountry(event?.properties?.place);
      }

      function countByCountry(features) {
        const counts = {
          Pakistan: 0,
          India: 0,
          Afghanistan: 0,
          Iran: 0,
          China: 0,
        };

        for (const feature of Array.isArray(features) ? features : []) {
          const country = getCountry(feature?.properties?.place);
          if (Object.prototype.hasOwnProperty.call(counts, country)) {
            counts[country] += 1;
          }
        }

        return counts;
      }

      function buildPulseRings() {
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
          globeEl.classList.add(`layer-${nextMode}`, 'layer-switching');

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

        refreshPointsAppearance();
      }

      function setLeftTab(tab) {
        activeLeftTab = tab === 'locations' ? 'locations' : 'recent';

        const recentBtn = document.getElementById('tabRecentBtn');
        const locationsBtn = document.getElementById('tabLocationsBtn');
        const recentPanel = document.getElementById('recentPanel');
        const locationsPanel = document.getElementById('locationsPanel');

        if (!recentBtn || !locationsBtn || !recentPanel || !locationsPanel) return;

        const isRecent = activeLeftTab === 'recent';
        recentBtn.classList.toggle('active', isRecent);
        locationsBtn.classList.toggle('active', !isRecent);
        recentPanel.classList.toggle('active', isRecent);
        locationsPanel.classList.toggle('active', !isRecent);
      }

      function buildLocationsData(data, countryCounts = null) {
        const map = new Map();
        const counts = countryCounts || countByCountry(data);

        for (const name of TRACKED_COUNTRIES) {
          map.set(name, {
            country: name,
            total: Number(counts[name] || 0),
            subdivisions: new Map(),
          });
        }

        for (const event of data) {
          const country = countryFromEvent(event);
          if (!map.has(country)) continue;
          const eventId = String(event.id ?? `${event.geometry.coordinates?.[1]}-${event.geometry.coordinates?.[0]}-${event.properties.time}`);

          const countryEntry = map.get(country);

          const subdivisionKey = String(event?.properties?.place || 'Other Areas').split(',').map((segment) => segment.trim()).filter(Boolean).slice(0, 2).join(', ') || 'Other Areas';
          if (!countryEntry.subdivisions.has(subdivisionKey)) {
            countryEntry.subdivisions.set(subdivisionKey, {
              name: subdivisionKey,
              events: [],
            });
          }

          countryEntry.subdivisions.get(subdivisionKey).events.push({
            id: eventId,
            place: String(event.properties.place || 'Unknown'),
            mag: Number(event.properties.mag || 0),
            time: Number(event.properties.time || Date.now()),
          });
        }

        const rows = Array.from(map.values()).map((entry) => {
          const subdivisions = Array.from(entry.subdivisions.values())
            .map((item) => ({
              name: item.name,
              events: item.events.sort((a, b) => b.mag - a.mag),
            }))
            .sort((a, b) => b.events.length - a.events.length || a.name.localeCompare(b.name));

          return {
            country: entry.country,
            total: entry.total,
            subdivisions,
          };
        });

        rows.sort((a, b) => {
          if (a.total > 0 && b.total > 0) return b.total - a.total || a.country.localeCompare(b.country);
          if (a.total > 0) return -1;
          if (b.total > 0) return 1;
          return a.country.localeCompare(b.country);
        });

        return rows;
      }

      function updateLiveCounts(features) {
        const counts = countByCountry(features);
        void counts;
        locationsData = buildLocationsData(features, counts);
        renderLocationsPanel();
      }

      function renderLocationsPanel() {
        const host = document.getElementById('locationsList');
        if (!host) return;

        host.innerHTML = locationsData.map((countryRow) => {
          const isExpanded = expandedCountry === countryRow.country;
          const rowClass = `country-row ${countryRow.total > 0 ? 'active-country' : ''} ${isExpanded ? 'expanded' : ''}`;
          const countClass = `country-count ${countryRow.total > 0 ? 'live' : ''}`;

          const details = countryRow.total > 0
            ? countryRow.subdivisions.map((sub) => {
                const events = sub.events.map((ev) => `
                  <button class="state-event" data-event-id="${ev.id}">
                    <span>${ev.place}</span>
                    <strong>M ${ev.mag.toFixed(1)}</strong>
                  </button>
                `).join('');

                return `
                  <div class="state-block">
                    <div class="state-head">
                      <span class="state-name">${sub.name}</span>
                      <span>${sub.events.length} ${eqT('stateLiveSuffix')}</span>
                    </div>
                    <div class="state-events">${events}</div>
                  </div>
                `;
              }).join('')
            : '<div class="state-empty">' + eqT('noActiveQuakes') + '</div>';

          return `
            <div class="${rowClass}">
              <button type="button" class="country-head" data-country="${countryRow.country}">
                <span class="country-name">${countryRow.country}</span>
                <span class="${countClass}">${countryRow.total}</span>
              </button>
              <div class="country-details">${details}</div>
            </div>
          `;
        }).join('');

        host.querySelectorAll('.country-head').forEach((button) => {
          button.addEventListener('click', () => {
            const country = button.getAttribute('data-country');
            expandedCountry = expandedCountry === country ? null : country;
            renderLocationsPanel();
          });
        });

        host.querySelectorAll('.state-event').forEach((button) => {
          button.addEventListener('click', (event) => {
            event.stopPropagation();
            const eventId = button.getAttribute('data-event-id');
            if (eventId) selectEvent(eventId);
            setLeftTab('recent');
          });
        });
      }

      function setEmailStatus(message, isError = false) {
        const statusEl = document.getElementById('emailStatus');
        if (!statusEl) return;
        statusEl.textContent = message || '';
        statusEl.classList.toggle('error', Boolean(isError));
      }

      function renderSubscribersList() {
        const host = document.getElementById('emailSubscribersList');
        const thresholdTag = document.getElementById('emailThresholdTag');
        if (!host) return;

        if (thresholdTag) {
          thresholdTag.textContent = `${eqT('thresholdPrefix')} M ${Number(earthquakeAlertThreshold || 5).toFixed(1)}+`;
        }

        if (!emailSubscribers.length) {
          host.innerHTML = '<div class="state-empty">' + eqT('noSubscribers') + '</div>';
          return;
        }

        host.innerHTML = emailSubscribers.map((subscriber) => `
          <div class="email-sub-item">
            <div>
              <div>${subscriber.email}</div>
              <div class="email-tag">Subscribed ${new Date(subscriber.subscribedAt || Date.now()).toLocaleString()}</div>
            </div>
            <button class="btn back" type="button" data-remove-email="${subscriber.email}">Remove</button>
          </div>
        `).join('');

        host.querySelectorAll('[data-remove-email]').forEach((button) => {
          button.addEventListener('click', async () => {
            const email = button.getAttribute('data-remove-email');
            if (!email) return;

            try {
              emailSubscribers = emailSubscribers.filter((entry) => entry.email !== email);
              localStorage.setItem(
                LOCAL_SUBSCRIBERS_KEY,
                JSON.stringify({
                  threshold: earthquakeAlertThreshold,
                  subscribers: emailSubscribers,
                }),
              );
              setEmailStatus(`Removed ${email}`);
              renderSubscribersList();
            } catch (error) {
              setEmailStatus(error?.message || 'Failed to remove subscriber.', true);
            }
          });
        });
      }

      function openEmailModal() {
        const modal = document.getElementById('emailModal');
        if (!modal) return;
        modal.classList.add('open');
        isEmailModalOpen = true;
      }

      function closeEmailModal() {
        const modal = document.getElementById('emailModal');
        if (!modal) return;
        modal.classList.remove('open');
        isEmailModalOpen = false;
      }

      async function loadSubscribers() {
        try {
          const payloadRaw = localStorage.getItem(LOCAL_SUBSCRIBERS_KEY);
          const payload = payloadRaw ? JSON.parse(payloadRaw) : {};
          emailSubscribers = Array.isArray(payload?.subscribers) ? payload.subscribers : [];
          earthquakeAlertThreshold = Number(payload?.threshold ?? 5) || 5;
          renderSubscribersList();
        } catch (error) {
          setEmailStatus(error?.message || 'Unable to load subscribers.', true);
        }
      }

      async function addSubscriberFromInput() {
        const input = document.getElementById('emailInput');
        if (!input) return;

        const email = String(input.value || '').trim().toLowerCase();
        if (!email) {
          setEmailStatus('Please enter a Gmail address.', true);
          return;
        }

        try {
          const current = emailSubscribers.filter((entry) => entry.email !== email);
          current.unshift({ email, subscribedAt: new Date().toISOString() });
          emailSubscribers = current;
          localStorage.setItem(
            LOCAL_SUBSCRIBERS_KEY,
            JSON.stringify({
              threshold: earthquakeAlertThreshold,
              subscribers: emailSubscribers,
            }),
          );
          input.value = '';
          setEmailStatus(`Subscribed ${email} for live M > ${earthquakeAlertThreshold} alerts.`);
          renderSubscribersList();
        } catch (error) {
          setEmailStatus(error?.message || 'Failed to subscribe Gmail.', true);
        }
      }

      async function triggerAlertDispatch() {
        // Local-only mode: alert dispatch remains in-page only.
      }

      async function fetchEarthquakes() {
        for (const sourcePath of LOCAL_EARTHQUAKE_SOURCES) {
          try {
            const payload = await fetchLocalJson(sourcePath);
            const features = Array.isArray(payload?.features) ? payload.features : [];
            if (features.length > 0) {
              return {
                features,
                sourceLabel: `Source: local dataset (${sourcePath})`,
              };
            }
          } catch {
            // Continue to next local source.
          }
        }
        return { features: [], sourceLabel: 'Source: local dataset unavailable' };
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
          const service = await ensurePopulationService();
          const lat = Number(eventItem?.lat);
          const lon = Number(eventItem?.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            return null;
          }

          const result = await service.getBothPopulations(
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
        globe = Globe()(el)
          .width(Math.max(320, Math.floor(el.clientWidth)))
          .height(Math.max(280, Math.floor(el.clientHeight)))
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
        if (typeof controls.addEventListener === 'function') {
          controls.addEventListener('change', positionImpactPopup);
        }

        window.addEventListener('resize', resizeGlobeViewport);
        addDisposeCallback(() => window.removeEventListener('resize', resizeGlobeViewport));
        window.setTimeout(resizeGlobeViewport, 30);
        loadPakistanBuildings(globe);
        return globe;
      }

      function refreshPointsAppearance() {
        if (!globe) return;

        const pulseRings = buildPulseRings();

        globe.pointsData([]);
        globe.ringsData([]);

        globe
          .pointsData(getVisibleEarthquakes())
          .pointLat('lat')
          .pointLng('lng')
          .pointAltitude(() => 0)
          .pointRadius((d) => {
            const base = Math.max(0.038, Math.min(0.074, 0.036 + d.mag * 0.0045));
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
      }

      function setAutoRotation(enabled) {
        isAutoRotateEnabled = Boolean(enabled);
        const glb = ensureGlobe();
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
        globe.pointOfView({ lat: target.lat, lng: target.lng, altitude: selected ? 1.5 : 1.7 }, 1000);
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

        const items = data.slice(0, 200);
        const globeItems = data;
        eventsEl.innerHTML = items.map((e) => {
          const country = countryFromEvent(e);
          const mag = Number(e.properties.mag || 0);
          const t = new Date(e.properties.time);
          const id = String(e.id ?? `${e.geometry.coordinates[1]}-${e.geometry.coordinates[0]}-${e.properties.time}`);
          return `
            <button class="event" data-id="${id}">
              <div class="meta">
                <div class="flag">${flagFor(country)}</div>
                <div>
                  <div class="country">${country}</div>
                  <div class="place">${e.properties.place || ''}</div>
                </div>
              </div>
              <div class="mag">
                <span class="mag-badge ${tierClass(mag)}">M ${mag.toFixed(1)}</span>
                <div class="time">${t.toLocaleTimeString()}</div>
              </div>
            </button>
          `;
        }).join('');

        quakeRows = Array.from(eventsEl.querySelectorAll('.event'));
        quakeRows.forEach((row) => row.addEventListener('click', () => selectEvent(row.dataset.id)));

        eventsData = globeItems.map((e) => {
          const mag = Number(e.properties.mag || 0);
          const lat = Number(e.geometry.coordinates?.[1]);
          const lng = Number(e.geometry.coordinates?.[0]);
          const depthKm = Number(e.geometry.coordinates?.[2] || 0);
          return {
            id: String(e.id ?? `${lat}-${lng}-${e.properties.time}`),
            mag,
            lat,
            lng,
            depthKm,
            place: String(e.properties.place || eqT('unknownLocation')),
            time: Number(e.properties.time || Date.now()),
            label: `<strong>M ${mag.toFixed(1)}</strong><br/>${e.properties.place || eqT('unknown')}<br/>${new Date(e.properties.time).toLocaleString()}`,
          };
        }).filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng));

        updateLiveCounts(data);

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
          sourceMeta.textContent = window.__sourceLabel || eqT('sourceLive');
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
        const countries = locationsData.filter((row) => row.total > 0).length;

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
          window.__sourceLabel = sourceLabel;
          if (pageDisposed) return;
          render(safeFeatures);
          if (safeFeatures.length > 0) {
            lastGoodFeatures = safeFeatures;
          }
          consecutiveLoadFailures = 0;
          await triggerAlertDispatch();
        } catch (error) {
          void error;
          consecutiveLoadFailures += 1;
          window.__sourceLabel = eqT('sourceUnavailable');
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
          refreshInFlight = false;
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
        const emailAlertsBtn = document.getElementById('emailAlertsBtn');
        const formulaBtn = document.getElementById('formulaBtn');
        const emailModal = document.getElementById('emailModal');
        const emailModalCloseBtn = document.getElementById('emailModalCloseBtn');
        const emailAddBtn = document.getElementById('emailAddBtn');
        const formulaModal = document.getElementById('formulaModal');
        const formulaModalCloseBtn = document.getElementById('formulaModalCloseBtn');
        const emailInput = document.getElementById('emailInput');
        const tabRecentBtn = document.getElementById('tabRecentBtn');
        const tabLocationsBtn = document.getElementById('tabLocationsBtn');
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const layerToggleBtn = document.getElementById('layerToggleBtn');
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

        bind(emailAlertsBtn, 'click', async () => {
          openEmailModal();
          await loadSubscribers();
        });

        bind(emailModalCloseBtn, 'click', () => {
          closeEmailModal();
        });

        bind(emailAddBtn, 'click', async () => {
          await addSubscriberFromInput();
        });

        bind(emailInput, 'keydown', async (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            await addSubscriberFromInput();
          }
        });

        bind(emailModal, 'click', (event) => {
          if (event.target === emailModal) {
            closeEmailModal();
          }
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
          if (event.key === 'Escape' && isEmailModalOpen) {
            closeEmailModal();
          }
          if (event.key === 'Escape' && formulaModal.classList.contains('open')) {
            formulaModal.classList.remove('open');
          }
        };
        document.addEventListener('keydown', onDocKeydown);
        addDisposeCallback(() => document.removeEventListener('keydown', onDocKeydown));

        bind(tabRecentBtn, 'click', () => setLeftTab('recent'));
        bind(tabLocationsBtn, 'click', () => setLeftTab('locations'));

        bind(fullscreenBtn, 'click', async () => {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
          } else {
            await (root.querySelector('.page') || root).requestFullscreen();
          }
        });

        bind(zoomInBtn, 'click', () => {
          if (is2DMap && leafletMap) {
            leafletMap.zoomIn();
            return;
          }
          const glb = ensureGlobe();
          currentAltitude = Math.max(0.85, currentAltitude - 0.18);
          glb.pointOfView({ ...defaultCenter, altitude: currentAltitude }, 320);
        });

        bind(zoomOutBtn, 'click', () => {
          if (is2DMap && leafletMap) {
            leafletMap.zoomOut();
            return;
          }
          const glb = ensureGlobe();
          currentAltitude = Math.min(2.8, currentAltitude + 0.18);
          glb.pointOfView({ ...defaultCenter, altitude: currentAltitude }, 320);
        });

        bind(mapToggleBtn, 'click', () => {
          setIs2DMap(!is2DMap);
        });

        bind(resetViewBtn, 'click', () => {
          clearSelection();
          if (is2DMap) {
            render2DMap();
            return;
          }
          const glb = ensureGlobe();
          currentAltitude = 1.7;
          glb.pointOfView({ ...defaultCenter, altitude: currentAltitude }, 600);
        });

        if (impactPopupClose) {
          bind(impactPopupClose, 'click', () => {
            selectedImpactEvent = null;
            hideImpactPopup();
          });
        }

        setAutoRotation(true);
        setLeftTab(activeLeftTab);
        setGlobeLayer('default');
        setIs2DMap(false);
      }

      const globeFactory = typeof window.Globe === 'function' ? window.Globe : null;
      const leafletReady = typeof window.L !== 'undefined';

      if (!globeFactory) {
        /* noop */
      } else if (!leafletReady) {
        /* noop */
      } else {
        applyEqStaticLabels();
        bindControls();
        window.addEventListener('pagehide', disposeEarthquakePage, { once: true });
        loadSubscribers();
        void loadPopulationRaster();
        void load('initial');
        refreshTimer = window.setInterval(() => {
          if (document.hidden) return;
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
      root.__eqMonitorBooted = false
    }
  }

  window.initLiveEarthquakeMonitor = initLiveEarthquakeMonitor
})()
