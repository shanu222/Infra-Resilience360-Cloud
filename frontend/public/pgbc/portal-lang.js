/**
 * Shared language bootstrap for PGBC static pages (loaded before script.js).
 * Reads ?lang=en|ur, syncs sessionStorage, sets dir/lang, exposes appendLangToPath.
 */
;(function () {
  var params = new URLSearchParams(window.location.search || '')
  var fromUrl = params.get('lang')
  var lang =
    fromUrl === 'ur' || fromUrl === 'en'
      ? fromUrl
      : sessionStorage.getItem('r360-portal-lang') || 'en'
  sessionStorage.setItem('r360-portal-lang', lang)

  document.documentElement.lang = lang === 'ur' ? 'ur-PK' : 'en-GB'
  document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr'

  window.appendLangToPath = function (path) {
    if (!path) return path
    var l = sessionStorage.getItem('r360-portal-lang') || 'en'
    if (path.indexOf('lang=') !== -1) return path
    var sep = path.indexOf('?') !== -1 ? '&' : '?'
    return path + sep + 'lang=' + encodeURIComponent(l)
  }

  window.pgbcGo = function (path) {
    window.location.href = window.appendLangToPath ? window.appendLangToPath(path) : path
  }

  var STR = {
    en: {
      docTitle: 'Building Codes',
      navHome: 'Home',
      navLibrary: 'Codes Library',
      headerTitle: 'Building Codes',
      headerSubtitle: 'Sustainability & Energy Efficiency Standards',
      searchPlaceholder: 'Search Codes Library...',
      searchBtn: 'Search',
      welcomeTitle: 'Welcome to Building Codes',
      welcomeText:
        'Access national green building codes, sustainability standards, and energy conservation regulations through this comprehensive portal.',
      featGreenH: 'Green Building',
      featGreenP: 'Sustainable construction practices',
      featEnergyH: 'Energy Conservation',
      featEnergyP: 'Energy efficiency standards',
      featRainH: 'Rainwater Harvesting',
      featRainP: 'Water management codes',
      featSusH: 'Sustainable Design',
      featSusP: 'Eco-friendly architecture',
      publicAccess: 'Public Access',
    },
    ur: {
      docTitle: 'عمارت سازی کے کوڈز',
      navHome: 'مرکزی صفحہ',
      navLibrary: 'کوڈز لائبریری',
      headerTitle: 'عمارت سازی کے کوڈز',
      headerSubtitle: 'پائیداری اور توانائی کی بچت کے معیارات',
      searchPlaceholder: 'کوڈز لائبریری میں تلاش…',
      searchBtn: 'تلاش',
      welcomeTitle: 'عمارت سازی کے کوڈز میں خوش آمدید',
      welcomeText:
        'قومی گرین بلڈنگ کوڈز، پائیداری کے معیار، اور توانائی بچت کے ضوابط تک اس جامع پورٹل سے رسائی حاصل کریں۔',
      featGreenH: 'گرین بلڈنگ',
      featGreenP: 'پائیدار تعمیر کے طریقے',
      featEnergyH: 'توانائی کی بچت',
      featEnergyP: 'توانائی کی کارکردگی کے معیارات',
      featRainH: 'بارش کا پانی ذخیرہ',
      featRainP: 'پانی کے انتظام کے کوڈز',
      featSusH: 'پائیدار ڈیزائن',
      featSusP: 'ماحول دوست تعمیر',
      publicAccess: 'عوامی رسائی',
    },
  }

  function applyIndexStrings() {
    if (!document.getElementById('pgbc-welcome-title')) {
      return
    }
    var pack = STR[lang] || STR.en
    if (pack.docTitle) document.title = pack.docTitle
    var map = [
      ['homeBtn', 'navHome'],
      ['libraryBtn', 'navLibrary'],
      ['pgbc-header-title', 'headerTitle'],
      ['pgbc-header-subtitle', 'headerSubtitle'],
      ['librarySearch', 'searchPlaceholder'],
      ['pgbc-search-btn', 'searchBtn'],
      ['pgbc-welcome-title', 'welcomeTitle'],
      ['pgbc-welcome-text', 'welcomeText'],
      ['pgbc-feat-green-h', 'featGreenH'],
      ['pgbc-feat-green-p', 'featGreenP'],
      ['pgbc-feat-energy-h', 'featEnergyH'],
      ['pgbc-feat-energy-p', 'featEnergyP'],
      ['pgbc-feat-rain-h', 'featRainH'],
      ['pgbc-feat-rain-p', 'featRainP'],
      ['pgbc-feat-sus-h', 'featSusH'],
      ['pgbc-feat-sus-p', 'featSusP'],
    ]
    map.forEach(function (pair) {
      var el = document.getElementById(pair[0])
      var text = pack[pair[1]]
      if (el && text) {
        if (el.tagName === 'INPUT' && pair[0] === 'librarySearch') {
          el.setAttribute('placeholder', text)
        } else {
          el.textContent = text
        }
      }
    })
    var userInfo = document.getElementById('userInfo')
    if (userInfo && pack.publicAccess) userInfo.innerText = pack.publicAccess
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyIndexStrings)
  } else {
    applyIndexStrings()
  }
})()
