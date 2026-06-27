import type { AppLanguage } from './appLocale'

/** Extended copy for secondary portal pages (not home). Merged into MaterialHubStrings. */
export type MaterialHubPageStrings = {
  notFoundTitle: string;
  notFoundBody: string;
  notFoundHome: string;
  liveInvLoading: string;
  liveInvTitle: string;
  liveInvSubtitle: string;
  liveInvFilterHub: string;
  liveInvAllHubs: string;
  liveInvLastUpdated: string;
  liveInvMaterialItems: string;
  liveInvThMaterial: string;
  liveInvThHubQty: string;
  liveInvLowStockTitle: string;
  liveInvLowStockBody: string;
  liveInvTotalTypes: string;
  liveInvTotalIssued: string;
  liveInvTotalDamaged: string;
  liveInvActiveHubs: string;
  liveInvHowToReadTitle: string;
  liveInvHowToReadLi: string;
  trainTitle: string;
  trainSubtitle: string;
  trainActiveHubs: string;
  trainGuidanceImages: string;
  trainTotalViews: string;
  trainGuidanceLibrary: string;
  trainViewsSuffix: string;
  trainMinSuffix: string;
  train1Title: string;
  train1Desc: string;
  train1Dur: string;
  train2Title: string;
  train2Desc: string;
  train2Dur: string;
  train3Title: string;
  train3Desc: string;
  train3Dur: string;
  train4Title: string;
  train4Desc: string;
  train4Dur: string;
  train5Title: string;
  train5Desc: string;
  train5Dur: string;
  train6Title: string;
  train6Desc: string;
  train6Dur: string;
  train7Title: string;
  train7Desc: string;
  train7Dur: string;
  train8Title: string;
  train8Desc: string;
  train8Dur: string;
  train9Title: string;
  train9Desc: string;
  train9Dur: string;
  hubLocLoading: string;
  hubLocTitle: string;
  hubLocSubtitle: string;
  hubLocMapTitle: string;
  hubLocMapDesc: string;
  hubLocHubDetails: string;
  hubLocStock: string;
  hubLocDamage: string;
  hubLocCoordinates: string;
  hubLocCapacity: string;
  hubLocStatus: string;
  hubLocFullyReady: string;
  hubLocModerateLbl: string;
  hubLocCritical: string;
  hubLocStockLevel: string;
  hubLocBelowThreshold: string;
  hubLocDamageRate: string;
  hubLocHighDamage: string;
  hubLocStrategicTitle: string;
  hubLocStrategicBody: string;
  hubLocTotalHomes: string;
  hubLocProvinces: string;
  hubLocEmergency247: string;
  aboutBadge: string;
  aboutHeroTitle: string;
  aboutHeroSub: string;
  aboutMissionTitle: string;
  aboutMissionBody: string;
  aboutVisionTitle: string;
  aboutVisionBody: string;
  aboutCoreTitle: string;
  aboutObj1Title: string;
  aboutObj1Desc: string;
  aboutObj2Title: string;
  aboutObj2Desc: string;
  aboutObj3Title: string;
  aboutObj3Desc: string;
  aboutObj4Title: string;
  aboutObj4Desc: string;
  aboutObj5Title: string;
  aboutObj5Desc: string;
  aboutObj6Title: string;
  aboutObj6Desc: string;
  aboutHowTitle: string;
  aboutStep1Title: string;
  aboutStep1Desc: string;
  aboutStep2Title: string;
  aboutStep2Desc: string;
  aboutStep3Title: string;
  aboutStep3Desc: string;
  aboutStep4Title: string;
  aboutStep4Desc: string;
  aboutFeaturesTitle: string;
  aboutFeat1Title: string;
  aboutFeat1F1: string;
  aboutFeat1F2: string;
  aboutFeat1F3: string;
  aboutFeat1F4: string;
  aboutFeat2Title: string;
  aboutFeat2F1: string;
  aboutFeat2F2: string;
  aboutFeat2F3: string;
  aboutFeat2F4: string;
  aboutFeat3Title: string;
  aboutFeat3F1: string;
  aboutFeat3F2: string;
  aboutFeat3F3: string;
  aboutFeat3F4: string;
  aboutFeat4Title: string;
  aboutFeat4F1: string;
  aboutFeat4F2: string;
  aboutFeat4F3: string;
  aboutFeat4F4: string;
  aboutPartnersTitle: string;
  aboutImpactTitle: string;
  aboutStatHubs: string;
  aboutStatHomes: string;
  aboutStatMaterials: string;
  aboutStatEmergency: string;
  aboutContactTitle: string;
  aboutContactBody: string;
  aboutContactOrg: string;
  aboutContactAddr: string;
  aboutContactReach: string;
  partnerGov: string;
  partnerInt: string;
  partnerNgo: string;
  partnerCsr: string;
};

export const MATERIAL_HUB_PAGE_STRINGS: Record<AppLanguage, MaterialHubPageStrings> = {
  en: {
    notFoundTitle: "Page not found",
    notFoundBody: "This URL does not match any section of the portal.",
    notFoundHome: "Go to home",
    liveInvLoading: "Loading live inventory…",
    liveInvTitle: "Live Inventory Dashboard",
    liveInvSubtitle: "Real-time material stock levels across all hubs",
    liveInvFilterHub: "Filter by Hub",
    liveInvAllHubs: "All Hubs",
    liveInvLastUpdated: "Last Updated:",
    liveInvMaterialItems: "Material Items",
    liveInvThMaterial: "Material",
    liveInvThHubQty: "Hub Quantity",
    liveInvLowStockTitle: "Low Hub Stock Alert",
    liveInvLowStockBody: "{n} material(s) below 20% hub coverage threshold.",
    liveInvTotalTypes: "Total Material Types",
    liveInvTotalIssued: "Total Items Issued",
    liveInvTotalDamaged: "Total Damaged Items",
    liveInvActiveHubs: "Active Hubs",
    liveInvHowToReadTitle: "How to Read This Data",
    liveInvHowToReadLi: "Hub Quantity: Quantity currently assigned to the selected hub",
    trainTitle: "Material Hub Guidance Gallery",
    trainSubtitle: "Image-first guidance resources based on current Material Hub inventory data",
    trainActiveHubs: "Active Hubs",
    trainGuidanceImages: "Guidance Images",
    trainTotalViews: "Total Views",
    trainGuidanceLibrary: "Guidance Library",
    trainViewsSuffix: "views",
    trainMinSuffix: "min",
    train1Title: "Bamboo Installation Guide",
    train1Desc:
      "Step-by-step bamboo pole setup with correct spacing and secure anchoring for shelter frames.",
    train1Dur: "15 min",
    train2Title: "Wooden Stick Chick Mat Application",
    train2Desc:
      "How to weave, align, and fix chick mats onto structural members for durable wall sections.",
    train2Dur: "12 min",
    train3Title: "Polythene Sheet Usage",
    train3Desc:
      "Best practices for waterproof polythene sheet layering, overlap direction, and edge sealing.",
    train3Dur: "10 min",
    train4Title: "Cotton Rope Tying Methods",
    train4Desc:
      "Reliable knotting and lashing methods to increase joint strength and material stability.",
    train4Dur: "9 min",
    train5Title: "Steel Girder Placement",
    train5Desc:
      "Safe girder positioning sequence, alignment checks, and load path considerations on site.",
    train5Dur: "18 min",
    train6Title: "CGI Sheet Roofing",
    train6Desc:
      "Proper corrugated sheet overlap, fastener spacing, and ridge detailing for leak-resistant roofs.",
    train6Dur: "20 min",
    train7Title: "Wooden Plank Assembly",
    train7Desc:
      "Plank joining and frame integration workflow to improve rigidity and long-term performance.",
    train7Dur: "14 min",
    train8Title: "EPS Panel Fitting",
    train8Desc:
      "Correct EPS panel placement and fixing methods to ensure thermal efficiency and fit accuracy.",
    train8Dur: "16 min",
    train9Title: "Pallet Handling and Storage",
    train9Desc:
      "Material handling and stacking standards to prevent moisture damage and keep pallet stock organized.",
    train9Dur: "11 min",
    hubLocLoading: "Loading hub locations…",
    hubLocTitle: "Material Hub Locations",
    hubLocSubtitle: "Strategic hubs positioned across Pakistan for rapid disaster response",
    hubLocMapTitle: "Interactive Global Hub Map",
    hubLocMapDesc:
      "Risk-map style geographic base with zoom controls, country highlighting, and clickable hub locations.",
    hubLocHubDetails: "Hub Details",
    hubLocStock: "Stock:",
    hubLocDamage: "Damage:",
    hubLocCoordinates: "Coordinates:",
    hubLocCapacity: "Capacity:",
    hubLocStatus: "Status:",
    hubLocFullyReady: "🟢 Fully Ready",
    hubLocModerateLbl: "🟡 Moderate",
    hubLocCritical: "🔴 Critical",
    hubLocStockLevel: "Stock Level",
    hubLocBelowThreshold: "⚠️ Below threshold",
    hubLocDamageRate: "Damage Rate",
    hubLocHighDamage: "⚠️ High damage",
    hubLocStrategicTitle: "Strategic Impact",
    hubLocStrategicBody:
      "Our material hubs are strategically positioned to provide rapid response capabilities across multiple provinces, ensuring that disaster-affected communities receive timely support.",
    hubLocTotalHomes: "Total Homes Capacity",
    hubLocProvinces: "Provinces Covered",
    hubLocEmergency247: "Emergency Response",
    aboutBadge: "About NMHDP",
    aboutHeroTitle: "National Material Hub Digital Portal",
    aboutHeroSub:
      "A comprehensive platform for transparent disaster material management, community resilience building, and rapid emergency response across Pakistan.",
    aboutMissionTitle: "Our Mission",
    aboutMissionBody:
      "To provide transparent, efficient, and accessible disaster relief material management that empowers communities, ensures accountability, and accelerates reconstruction efforts across Pakistan through digital innovation and strategic coordination.",
    aboutVisionTitle: "Our Vision",
    aboutVisionBody:
      "To establish Pakistan as a model for disaster preparedness and resilient infrastructure, where every community has immediate access to reconstruction materials and the knowledge to rebuild stronger after disasters.",
    aboutCoreTitle: "Core Objectives",
    aboutObj1Title: "Disaster Preparedness",
    aboutObj1Desc:
      "Maintain strategic material reserves across provinces for rapid emergency response",
    aboutObj2Title: "Community Resilience",
    aboutObj2Desc:
      "Empower communities through training and skill development in disaster-resilient construction",
    aboutObj3Title: "Transparency & Accountability",
    aboutObj3Desc: "Provide real-time public access to inventory levels and material distribution",
    aboutObj4Title: "Reconstruction Capacity",
    aboutObj4Desc: "Enable reconstruction of 600+ homes through our network of material hubs",
    aboutObj5Title: "Early Response",
    aboutObj5Desc:
      "Facilitate immediate material issuance to disaster-affected areas through PDMA coordination",
    aboutObj6Title: "Partner Collaboration",
    aboutObj6Desc:
      "Coordinate with international organizations, NGOs, and CSR partners for enhanced impact",
    aboutHowTitle: "How NMHDP Works",
    aboutStep1Title: "Disaster Assessment",
    aboutStep1Desc: "PDMA conducts rapid assessment of affected areas and material needs",
    aboutStep2Title: "Digital Request",
    aboutStep2Desc:
      "PDMA submits material request through online portal with supporting documentation",
    aboutStep3Title: "Approval & Dispatch",
    aboutStep3Desc: "NDMA reviews and approves request, materials dispatched from nearest hub",
    aboutStep4Title: "Community Training",
    aboutStep4Desc:
      "Local teams trained on proper installation and reconstruction techniques",
    aboutFeaturesTitle: "Platform Features",
    aboutFeat1Title: "Live Inventory Management",
    aboutFeat1F1: "Real-time stock levels across all hubs",
    aboutFeat1F2: "Automatic alerts at 75% threshold",
    aboutFeat1F3: "Damage tracking and quality monitoring",
    aboutFeat1F4: "Material turnover analytics",
    aboutFeat2Title: "Digital Issuance Workflow",
    aboutFeat2F1: "Online request submission by PDMAs",
    aboutFeat2F2: "Automated routing and approvals",
    aboutFeat2F3: "Digital acknowledgment system",
    aboutFeat2F4: "Utilization tracking",
    aboutFeat3Title: "Public Transparency Dashboard",
    aboutFeat3F1: "Open access to hub locations and stock levels",
    aboutFeat3F2: "Disaster readiness index by region",
    aboutFeat3F3: "Partner and donor information",
    aboutFeat3F4: "Response timeline updates",
    aboutFeat4Title: "Training & Skill Development",
    aboutFeat4F1: "Video tutorial library",
    aboutFeat4F2: "Certification programs",
    aboutFeat4F3: "Community training camps",
    aboutFeat4F4: "Reconstruction manuals",
    aboutPartnersTitle: "Our Partners",
    aboutImpactTitle: "Our Impact",
    aboutStatHubs: "Active Hubs",
    aboutStatHomes: "Home Capacity",
    aboutStatMaterials: "Materials Stocked",
    aboutStatEmergency: "Emergency Ready",
    aboutContactTitle: "Get In Touch",
    aboutContactBody:
      "For inquiries, partnerships, or emergency assistance, contact NDMA Pakistan",
    aboutContactOrg: "National Disaster Management Authority",
    aboutContactAddr: "Prime Minister's Office, Islamabad, Pakistan",
    aboutContactReach: "Email: info@ndma.gov.pk | Phone: +92-51-9205200",
    partnerGov: "Government",
    partnerInt: "International",
    partnerNgo: "NGO",
    partnerCsr: "CSR",
  },
  ur: {
    notFoundTitle: "صفحہ نہیں ملا",
    notFoundBody: "یہ یو آر ایل پورٹل کے کسی حصے سے میل نہیں کھاتا۔",
    notFoundHome: "مرکزی صفحہ پر جائیں",
    liveInvLoading: "موجودہ ذخیرہ لوڈ ہو رہا ہے…",
    liveInvTitle: "موجودہ ذخیرے کا ڈیش بورڈ",
    liveInvSubtitle: "تمام مراکز میں مواد کی حقیقی وقت کی سطح",
    liveInvFilterHub: "مرکز کے لحاظ سے فلٹر",
    liveInvAllHubs: "تمام مراکز",
    liveInvLastUpdated: "آخری اپ ڈیٹ:",
    liveInvMaterialItems: "مواد کی اشیاء",
    liveInvThMaterial: "مادہ",
    liveInvThHubQty: "مرکز کی مقدار",
    liveInvLowStockTitle: "مرکز میں کم ذخیرے کی انتباہ",
    liveInvLowStockBody: "{n} مواد ۲۰٪ مرکز کوریج سے کم ہیں۔",
    liveInvTotalTypes: "مواد کی اقسام (کل)",
    liveInvTotalIssued: "کل جاری کردہ اشیاء",
    liveInvTotalDamaged: "کل خراب اشیاء",
    liveInvActiveHubs: "فعال مراکز",
    liveInvHowToReadTitle: "اس ڈیٹا کو کیسے پڑھیں",
    liveInvHowToReadLi: "مرکز کی مقدار: منتخب مرکز کو تفویض کردہ موجودہ مقدار",
    trainTitle: "مواد کے مرکز کی رہنمائی کی گیلری",
    trainSubtitle: "موجودہ مرکز کے ذخیرے پر مبنی تصویری رہنمائی",
    trainActiveHubs: "فعال مراکز",
    trainGuidanceImages: "رہنمائی کی تصاویر",
    trainTotalViews: "کل دیکھنے والے",
    trainGuidanceLibrary: "رہنمائی کا ذخیرہ",
    trainViewsSuffix: "دیکھنے والے",
    trainMinSuffix: "منٹ",
    train1Title: "بامبو نصب کرنے کی رہنمائی",
    train1Desc:
      "پناہ کے فریم کے لیے درست فاصلے اور محفوظ لنگر کے ساتھ بامبو کھمبے کی ترتیب۔",
    train1Dur: "۱۵ منٹ",
    train2Title: "لکڑی کی چیک میٹ کی تنصیب",
    train2Desc:
      "پائیدار دیواروں کے لیے چیک میٹ بننا، سیدھ میں لانا، اور ساختی حصوں پر جمانا۔",
    train2Dur: "۱۲ منٹ",
    train3Title: "پولیتھین شیٹ کا استعمال",
    train3Desc:
      "واٹر پروف پرت، اوورلیپ کی سمت، اور کناروں کی سیلنگ کے بہترین طریقے۔",
    train3Dur: "۱۰ منٹ",
    train4Title: "کپاس کی رسی باندھنے کے طریقے",
    train4Desc:
      "جوڑ کی مضبوطی اور استحکام کے لیے قابل اعتماد گرہیں اور باندھنا۔",
    train4Dur: "۹ منٹ",
    train5Title: "اسٹیل گرڈر کی جگہ",
    train5Desc:
      "محفوظ ترتیب، سیدھ کی جانچ، اور سائٹ پر بوجھ کے راستے۔",
    train5Dur: "۱۸ منٹ",
    train6Title: "سی جی آئی شیٹ کی چھت",
    train6Desc:
      "درست اوورلیپ، فاسنر فاصلہ، اور رسن کے تفصیلات تاکہ چھت رسن نہ ہو۔",
    train6Dur: "۲۰ منٹ",
    train7Title: "لکڑی کے تختے کی تنصیب",
    train7Desc:
      "تختوں کو جوڑنا اور فریم میں ملا کر سختی اور طوالت بہتر بنانا۔",
    train7Dur: "۱۴ منٹ",
    train8Title: "ای ایس پی پینل فٹنگ",
    train8Desc:
      "درست پینل کی جگہ اور فکسنگ تاکہ حرارتی کارکردگی اور درست فٹ۔",
    train8Dur: "۱۶ منٹ",
    train9Title: "پیلیٹ سنبھالنا اور ذخیرہ",
    train9Desc:
      "نمی سے بچاؤ اور پیلیٹ اسٹاک کی ترتیب کے لیے معیارات۔",
    train9Dur: "۱۱ منٹ",
    hubLocLoading: "مراکز کے مقامات لوڈ ہو رہے ہیں…",
    hubLocTitle: "مواد کے مراکز کے مقامات",
    hubLocSubtitle: "پاکستان میں تیز آفات کے جواب کے لیے منصوبہ بند مراکز",
    hubLocMapTitle: "عالمی مرکز کا انٹرایکٹو نقشہ",
    hubLocMapDesc:
      "زوم، ملک کی نشاندہی، اور کلک کے قابل مرکز کے ساتھ جغرافیائی بنیاد۔",
    hubLocHubDetails: "مرکز کی تفصیلات",
    hubLocStock: "ذخیرہ:",
    hubLocDamage: "نقصان:",
    hubLocCoordinates: "نقاط:",
    hubLocCapacity: "گنجائش:",
    hubLocStatus: "حالت:",
    hubLocFullyReady: "🟢 مکمل تیار",
    hubLocModerateLbl: "🟡 درمیانہ",
    hubLocCritical: "🔴 سنگین",
    hubLocStockLevel: "ذخیرے کی سطح",
    hubLocBelowThreshold: "⚠️ حد سے کم",
    hubLocDamageRate: "نقصان کی شرح",
    hubLocHighDamage: "⚠️ زیادہ نقصان",
    hubLocStrategicTitle: "منصوبہ بند اثر",
    hubLocStrategicBody:
      "ہمارے مواد کے مرکز متعدد صوبوں میں تیز رسائی فراہم کرنے کے لیے رکھے گئے ہیں تاکہ متاثرہ کمیونٹیز کو بروقت مدد ملے۔",
    hubLocTotalHomes: "گھروں کی کل گنجائش",
    hubLocProvinces: "صوبے",
    hubLocEmergency247: "ہنگامی جواب",
    aboutBadge: "این ایم ایچ ڈی پی کے بارے میں",
    aboutHeroTitle: "قومی مواد کے ڈیجیٹل مرکز کا پورٹل",
    aboutHeroSub:
      "شفاف آفات کے مواد کا انتظام، کمیونٹی کی لچک، اور پاکستان بھر میں فوری ہنگامی جواب کے لیے جامع پلیٹ فارم۔",
    aboutMissionTitle: "ہمارا مشن",
    aboutMissionBody:
      "شفاف، موثر، اور قابل رسائی امداد کے مواد کا انتظام فراہم کرنا؛ کمیونٹیز کو بااختیار بنانا، جوابدہی یقینی بنانا، اور ڈیجیٹل جدت کے ذریعے تعمیر نو تیز کرنا۔",
    aboutVisionTitle: "ہمارا وژن",
    aboutVisionBody:
      "پاکستان کو آفات کی تیاری اور مضبوط انفراسٹرکچر کا ماڈل بنانا، جہاں ہر کمیونٹی کو تعمیر نو کے مواد اور مضبوط تعمیر کے علم تک فوری رسائی ہو۔",
    aboutCoreTitle: "بنیادی مقاصد",
    aboutObj1Title: "آفات کی تیاری",
    aboutObj1Desc: "فوری جواب کے لیے صوبوں میں مواد کے ذخائر برقرار رکھنا",
    aboutObj2Title: "کمیونٹی کی لچک",
    aboutObj2Desc: "مضبوط تعمیر میں تربیت اور مہارت سے کمیونٹیز کو بااختیار بنانا",
    aboutObj3Title: "شفافیت اور جوابدہی",
    aboutObj3Desc: "ذخیرے اور تقسیم تک براہِ راست عوامی رسائی",
    aboutObj4Title: "تعمیر نو کی صلاحیت",
    aboutObj4Desc: "مراکز کے نیٹ ورک سے ۶۰۰+ گھروں کی تعمیر نو ممکن بنانا",
    aboutObj5Title: "ابتدائی جواب",
    aboutObj5Desc: "پی ڈی ایم اے کے تعاون سے متاثرہ علاقوں میں فوری مواد کی فراہمی",
    aboutObj6Title: "شراکت داری",
    aboutObj6Desc: "بین الاقوامی اداروں، این جی اوز، اور سی ایس آر شراکت سے مزید اثر",
    aboutHowTitle: "این ایم ایچ ڈی پی کیسے کام کرتا ہے",
    aboutStep1Title: "آفات کی تشخیص",
    aboutStep1Desc: "پی ڈی ایم اے متاثرہ علاقوں اور مواد کی ضرورت کا فوری جائزہ",
    aboutStep2Title: "ڈیجیٹل درخواست",
    aboutStep2Desc: "آن لائن پورٹل سے دستاویزات کے ساتھ درخواست",
    aboutStep3Title: "منظوری اور روانگی",
    aboutStep3Desc: "این ڈی ایم اے منظوری، قریب ترین مرکز سے مواد",
    aboutStep4Title: "کمیونٹی تربیت",
    aboutStep4Desc: "مقامی ٹیموں کو نصب اور تعمیر نو کی تکنیک",
    aboutFeaturesTitle: "پلیٹ فارم کی خصوصیات",
    aboutFeat1Title: "موجودہ ذخیرے کا انتظام",
    aboutFeat1F1: "تمام مراکز میں براہِ راست ذخیرے کی سطح",
    aboutFeat1F2: "۷۵٪ پر خودکار انتباہ",
    aboutFeat1F3: "نقصان اور معیار کی نگرانی",
    aboutFeat1F4: "مواد کے کاروبار کا تجزیہ",
    aboutFeat2Title: "ڈیجیٹل اجراء کا ورک فلو",
    aboutFeat2F1: "پی ڈی ایم اے کی آن لائن درخواست",
    aboutFeat2F2: "خودکار روٹنگ اور منظوریاں",
    aboutFeat2F3: "ڈیجیٹل تصدیق",
    aboutFeat2F4: "استعمال کی نگرانی",
    aboutFeat3Title: "عوامی شفافیت ڈیش بورڈ",
    aboutFeat3F1: "مراکز اور ذخیرے تک کھلا رسائی",
    aboutFeat3F2: "علاقے وار تیاری کا اشاریہ",
    aboutFeat3F3: "شراکت دار اور عطیہ دہندگان",
    aboutFeat3F4: "جواب کے وقت کی تازہ کاری",
    aboutFeat4Title: "تربیت اور مہارت",
    aboutFeat4F1: "ویڈیو لائبریری",
    aboutFeat4F2: "سرٹیفیکیشن",
    aboutFeat4F3: "کمیونٹی کیمپ",
    aboutFeat4F4: "تعمیر نو کی دستیابیاں",
    aboutPartnersTitle: "ہمارے شراکت دار",
    aboutImpactTitle: "ہمارا اثر",
    aboutStatHubs: "فعال مراکز",
    aboutStatHomes: "گھروں کی گنجائش",
    aboutStatMaterials: "مواد کا ذخیرہ",
    aboutStatEmergency: "ہنگامی تیاری",
    aboutContactTitle: "رابطہ کریں",
    aboutContactBody: "سوالات، شراکت، یا ہنگامی مدد کے لیے این ڈی ایم اے سے رابطہ کریں",
    aboutContactOrg: "قومی آفات کے انتظام کا ادارہ",
    aboutContactAddr: "وزیراعظم کا دفتر، اسلام آباد، پاکستان",
    aboutContactReach: "ای میل: info@ndma.gov.pk | فون: +92-51-9205200",
    partnerGov: "حکومت",
    partnerInt: "بین الاقوامی",
    partnerNgo: "این جی او",
    partnerCsr: "سی ایس آر",
  },
};
