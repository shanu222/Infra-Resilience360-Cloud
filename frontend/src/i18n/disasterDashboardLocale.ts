import type { AppLanguage } from './appLocale'

export type DisasterDashboardStrings = {
  title: string;
  subtitle: string;
  dashboardLead: string;
  ndmaBadge: string;
  footer: string;
  detail: {
    backToDashboard: string;
    disasterNotFound: string;
    returnToDashboard: string;
    pakistanHistory: string;
    seasonalPeriod: string;
    emergencyTitle: string;
    emergencyLine: string;
    overview: string;
    historicalEvents: string;
    seasonalInfo: string;
    riskFactors: string;
    safetyGuidance: string;
  };
  monthsShort: string[];
  guidanceUi: {
    viewGuidance: string;
    hideImage: string;
    viewImage: string;
    playVideo: string;
    speed: string;
    subtitles: string;
    subtitleOff: string;
    subtitleEnglish: string;
    subtitleUrdu: string;
    fullscreen: string;
    videoUnsupported: string;
    tapToPlay: string;
    unableToLoadVideo: string;
    videoErrNetwork: string;
    videoErrDecode: string;
    videoErrFormat: string;
    videoErrGeneric: string;
    videoLoadErrorHint: string;
    loadingVideo: string;
    videoUnavailable: string;
    audioUnavailable: string;
    imageHiddenWhileVideo: string;
    subtitlesUnavailable: string;
    listenGuidance: string;
    beforeTitle: string;
    duringTitle: string;
    afterTitle: string;
    closeFullscreen: string;
    ariaPlayVideo: string;
    ariaFullscreen: string;
    ariaListenAudio: string;
  };
};

const STRINGS: Record<AppLanguage, DisasterDashboardStrings> = {
  en: {
    title: "Disaster Dashboard",
    subtitle:
      "Comprehensive disaster information and safety guidance for Pakistan. Select a disaster type to learn about preparedness, response, and recovery measures.",
    dashboardLead:
      "National hazard intelligence for preparedness, response, and recovery. Select a disaster to explore history, seasonal risk, safety guidance, and local multimedia briefings.",
    ndmaBadge: "NDMA Pakistan",
    footer: "Stay informed. Stay prepared. Stay safe.",
    detail: {
      backToDashboard: "Back to Dashboard",
      disasterNotFound: "Disaster Not Found",
      returnToDashboard: "Return to Dashboard",
      pakistanHistory: "Pakistan History",
      seasonalPeriod: "Seasonal Period",
      emergencyTitle: "Emergency Contacts",
      emergencyLine:
        "National Emergency: 15 | Rescue Services: 1122 | Police: 15",
      overview: "Overview",
      historicalEvents: "Historical Events",
      seasonalInfo: "Seasonal Information",
      riskFactors: "Risk Factors",
      safetyGuidance: "Safety Guidance",
    },
    monthsShort: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    guidanceUi: {
      viewGuidance: "View Guidance",
      hideImage: "Hide Image",
      viewImage: "View Image",
      playVideo: "▶ Play Video",
      speed: "Speed",
      subtitles: "Subtitles",
      subtitleOff: "Off",
      subtitleEnglish: "English",
      subtitleUrdu: "Urdu",
      fullscreen: "Fullscreen",
      videoUnsupported: "Your browser does not support HTML5 video.",
      tapToPlay: "Tap play to start the video on your device.",
      unableToLoadVideo: "We couldn't load this guidance video.",
      videoErrNetwork: "The browser reported a network error while fetching the video.",
      videoErrDecode: "The file could not be decoded. It may be damaged or incomplete.",
      videoErrFormat:
        "The file was not found, or this browser cannot play it. Prefer MP4 with H.264 video and AAC audio.",
      videoErrGeneric: "The file may be missing on the server or blocked by your network.",
      videoLoadErrorHint:
        "If you manage this deployment: add the file as public/videos/<disaster>.mp4 at the site root, or as public/videos/<disaster>/video.mp4 inside the Disaster Dashboard public folder, then rebuild. In DevTools → Network, a 404 means the path does not match.",
      loadingVideo: "Loading video...",
      videoUnavailable:
        "Content is temporarily unavailable. Please check your connection and try again.",
      audioUnavailable: "Guidance audio is not available for this disaster yet.",
      imageHiddenWhileVideo: "Image is hidden while video is playing.",
      subtitlesUnavailable: "Subtitles are currently unavailable for this video.",
      listenGuidance: "🎧 Listen Guidance",
      beforeTitle: "Before Disaster (Preparedness)",
      duringTitle: "During Disaster",
      afterTitle: "After Disaster",
      closeFullscreen: "Close fullscreen image",
      ariaPlayVideo: "Play guidance video",
      ariaFullscreen: "Open video in fullscreen",
      ariaListenAudio: "Listen guidance audio",
    },
  },
  ur: {
    title: "آفات کا ڈیش بورڈ",
    subtitle:
      "پاکستان کے لیے جامع آفات کی معلومات اور حفاظتی رہنمائی۔ تیاری، ردعمل، اور بحالی کے اقدامات جاننے کے لیے آفات کی قسم منتخب کریں۔",
    dashboardLead:
      "تیاری، ردعمل، اور بحالی کے لیے قومی خطرے کی معلومات۔ تاریخ، موسمی خطرہ، حفاظتی رہنمائی، اور مقامی ملٹی میڈیا بریفنگ کے لیے آفت منتخب کریں۔",
    ndmaBadge: "این ڈی ایم اے پاکستان",
    footer: "باخبر رہیں۔ تیار رہیں۔ محفوظ رہیں۔",
    detail: {
      backToDashboard: "ڈیش بورڈ پر واپس",
      disasterNotFound: "آفت نہیں ملی",
      returnToDashboard: "ڈیش بورڈ پر واپس جائیں",
      pakistanHistory: "پاکستان میں تاریخ",
      seasonalPeriod: "موسمی دور",
      emergencyTitle: "ہنگامی رابطے",
      emergencyLine:
        "قومی ہنگامی نمبر: 15 | بچاؤ خدمات: 1122 | پولیس: 15",
      overview: "جائزہ",
      historicalEvents: "تاریخی واقعات",
      seasonalInfo: "موسمی معلومات",
      riskFactors: "خطرے کے عوامل",
      safetyGuidance: "حفاظتی رہنمائی",
    },
    monthsShort: [
      "جنوری",
      "فروری",
      "مارچ",
      "اپریل",
      "مئی",
      "جون",
      "جولائی",
      "اگست",
      "ستمبر",
      "اکتوبر",
      "نومبر",
      "دسمبر",
    ],
    guidanceUi: {
      viewGuidance: "رہنمائی دیکھیں",
      hideImage: "تصویر چھپائیں",
      viewImage: "تصویر دیکھیں",
      playVideo: "▶ ویڈیو چلائیں",
      speed: "رفتار",
      subtitles: "ذیلی عنوانات",
      subtitleOff: "بند",
      subtitleEnglish: "انگریزی",
      subtitleUrdu: "اردو",
      fullscreen: "پوری سکرین",
      videoUnsupported: "آپ کا براؤزر HTML5 ویڈیو کی حمایت نہیں کرتا۔",
      tapToPlay: "آلہ پر ویڈیو شروع کرنے کے لیے چلائیں پر تھپتھائیں۔",
      unableToLoadVideo: "ہم یہ رہنمائی ویڈیو لوڈ نہیں کر سکے۔",
      videoErrNetwork: "براؤزر نے ویڈیو لاتے وقت نیٹ ورک کی خرابی بتائی۔",
      videoErrDecode: "فائل ڈیکوڈ نہیں ہو سکی۔ شاید نقصان دیدہ یا نامکمل ہے۔",
      videoErrFormat:
        "فائل نہیں ملی یا براؤزر یہ فارمیٹ نہیں چلا سکتا۔ ترجیحاً H.264 + AAC والا MP4 استعمال کریں۔",
      videoErrGeneric: "فائل سرور پر موجود نہیں یا نیٹ ورک نے روکا ہو سکتا ہے۔",
      videoLoadErrorHint:
        "اگر آپ ڈپلائے کرتے ہیں: سائٹ روٹ پر public/videos/<آفت>.mp4 رکھیں، یا Disaster Dashboard کے public/videos/<آفت>/video.mp4، پھر دوبارہ بِلڈ کریں۔ DevTools → Network میں 404 کا مطلب غلط پاتھ ہے۔",
      loadingVideo: "ویڈیو لوڈ ہو رہی ہے...",
      videoUnavailable:
        "مواد عارضی طور پر دستیاب نہیں ہے۔ براہ کرم اپنا کنکشن چیک کریں اور دوبارہ کوشش کریں۔",
      audioUnavailable: "اس آفت کے لیے ابھی آڈیو رہنمائی دستیاب نہیں۔",
      imageHiddenWhileVideo: "ویڈیو چلتے وقت تصویر چھپی ہوئی ہے۔",
      subtitlesUnavailable: "اس ویڈیو کے لیے ذیلی عنوانات فی الوقت دستیاب نہیں۔",
      listenGuidance: "🎧 آڈیو رہنمائی سنیں",
      beforeTitle: "آفت سے پہلے (تیاری)",
      duringTitle: "آفت کے دوران",
      afterTitle: "آفت کے بعد",
      closeFullscreen: "پوری سکرین تصویر بند کریں",
      ariaPlayVideo: "رہنمائی ویڈیو چلائیں",
      ariaFullscreen: "ویڈیو پوری سکرین میں کھولیں",
      ariaListenAudio: "رہنمائی آڈیو سنیں",
    },
  },
};

export const disasterDashboardLocale = STRINGS;

export function getDisasterDashboardStrings(lang: AppLanguage): DisasterDashboardStrings {
  return STRINGS[lang];
}
