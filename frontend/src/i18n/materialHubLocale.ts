import { MATERIAL_HUB_PAGE_STRINGS, type MaterialHubPageStrings } from './materialHubPageStrings'
import type { AppLanguage } from './appLocale'

export type MaterialHubStrings = {
  brandShort: string;
  brandSubtitle: string;
  navHome: string;
  navLocations: string;
  navLocationsShort: string;
  navInventory: string;
  navInventoryShort: string;
  navGuidance: string;
  navAbout: string;
  backToResilience: string;
  footerAboutTitle: string;
  footerAboutBody: string;
  footerLinksTitle: string;
  footerLinkLocations: string;
  footerLinkInventory: string;
  footerLinkGuidance: string;
  footerLinkAbout: string;
  footerContactTitle: string;
  footerContactBody: string;
  footerCopyright: string;
  loading: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaLocations: string;
  ctaInventory: string;
  statHubs: string;
  statCapacity: string;
  statStock: string;
  statSplit: string;
  statReady: string;
  statModerate: string;
  mapTitle: string;
  mapAlt: string;
  visualsTitle: string;
  readinessTitle: string;
  readinessSubtitle: string;
  hubStatusReady: string;
  hubStatusModerate: string;
  stockLevel: string;
  damageLevel: string;
  capacityLabel: string;
  materialsTitle: string;
  materialsSubtitle: string;
  quantity: string;
  inventoryChartTitle: string;
  inventoryChartSubtitle: string;
  tableTitle: string;
  tableSubtitle: string;
  colMaterial: string;
  colGilgit: string;
  colMuzaffargarh: string;
  colSukkur: string;
  carouselBadge: string;
  offerTitle: string;
  offerSubtitle: string;
  f1Title: string;
  f1Body: string;
  f1Link: string;
  f2Title: string;
  f2Body: string;
  f2Link: string;
  f3Title: string;
  f3Body: string;
  f3Link: string;
  needTitle: string;
  needBody: string;
  needCta: string;
  transparencyTitle: string;
  transparencyBody: string;
  hubImagesUnavailable: string;
  statRegions: string;
  statEmergency: string;
  mapCtaTitle: string;
  mapCtaBody: string;
  mapCtaButton: string;
  trainingFeatureTitle: string;
  trainingFeatureBody: string;
  trainingExplore: string;
  inventoryFeatureBody: string;
  poweredByNdma: string;
  navTraining: string;
  footerLinkTraining: string;
  hubNetworkTitle: string;
  hubNetworkDesc: string;
  selectHub: string;
  logisticsMap: string;
  closeHubDetails: string;
  viewHubDetails: string;
  hubMapFootnote: string;
  stockAvailable: string;
  ndmaAlt: string;
  dashboardLead: string;
  ndmaBadge: string;
  viewGuidance: string;
} & MaterialHubPageStrings;

const STRINGS: Record<AppLanguage, MaterialHubStrings> = {
  en: {
    brandShort: "NMHDP",
    brandSubtitle: "National Material Hub Portal",
    navHome: "Home",
    navLocations: "Hub Locations",
    navLocationsShort: "Locations",
    navInventory: "Live Inventory",
    navInventoryShort: "Inventory",
    navGuidance: "Guidance",
    navAbout: "About",
    backToResilience: "← Back to Resilience Home",
    footerAboutTitle: "About NMHDP",
    footerAboutBody:
      "National Material Hub Digital Portal — facilitating disaster preparedness, community resilience, and transparent material distribution across Pakistan.",
    footerLinksTitle: "Quick Links",
    footerLinkLocations: "Hub Locations",
    footerLinkInventory: "Live Inventory",
    footerLinkGuidance: "Guidance Library",
    footerLinkAbout: "About Us",
    footerContactTitle: "Contact",
    footerContactBody: "National Disaster Management Authority\nPrime Minister's Office, Islamabad\nEmail: info@ndma.gov.pk",
    footerCopyright: "© 2026 NDMA Pakistan. All rights reserved.",
    loading: "Loading portal data…",
    heroBadge: "Pakistan Disaster Reconstruction Support Platform",
    heroTitle: "National Material Hub Digital Portal",
    heroSubtitle:
      "Facilitating disaster preparedness, community resilience, and transparent material distribution across Pakistan",
    ctaLocations: "View Hub Locations",
    ctaInventory: "Check Live Inventory",
    statHubs: "Active Material Hubs",
    statCapacity: "Homes Reconstruction Capacity",
    statStock: "Average Stock Level",
    statSplit: "Hub Status Split",
    statReady: "Ready",
    statModerate: "Moderate",
    mapTitle: "Pakistan Hub Map",
    mapAlt: "Pakistan map with hub zones",
    visualsTitle: "Hub Visuals",
    readinessTitle: "Disaster Readiness Index",
    readinessSubtitle: "Real-time status of material hubs across Pakistan",
    hubStatusReady: "Ready",
    hubStatusModerate: "Moderate",
    stockLevel: "Stock Level",
    damageLevel: "Damage Level",
    capacityLabel: "Capacity: {n} homes",
    materialsTitle: "Materials Available",
    materialsSubtitle: "Visual catalog sourced from local NDMA material assets.",
    quantity: "Quantity",
    inventoryChartTitle: "Inventory Status",
    inventoryChartSubtitle: "Bar chart comparison of hub quantities per material.",
    tableTitle: "Inventory Table",
    tableSubtitle: "Material quantities distributed across all hubs.",
    colMaterial: "Material",
    colGilgit: "Gilgit",
    colMuzaffargarh: "Muzaffargarh",
    colSukkur: "Sukkur",
    carouselBadge: "Material Hub",
    offerTitle: "What We Offer",
    offerSubtitle: "Comprehensive disaster management and community support",
    f1Title: "Live Inventory Tracking",
    f1Body:
      "Real-time visibility into material stocks across all hubs with automatic alerts when inventory falls below safety thresholds.",
    f1Link: "View Inventory →",
    f2Title: "Guidance Gallery",
    f2Body:
      "Swipe-friendly guidance image gallery for each material category, including bamboo, CGI sheet, EPS panel, wooden plank, and more.",
    f2Link: "Open Gallery →",
    f3Title: "Strategic Hub Locations",
    f3Body:
      "Material hubs strategically positioned in Gilgit, Muzaffargarh, and Sukkur to ensure rapid response to disasters across regions.",
    f3Link: "View Map →",
    needTitle: "Need Disaster Relief Materials?",
    needBody:
      "PDMAs can submit requests through our digital issuance workflow for fast-tracked approval and dispatch.",
    needCta: "View Live Inventory",
    transparencyTitle: "Transparency Notice",
    transparencyBody:
      "All data on this portal is updated in real-time to ensure maximum transparency and accountability. Stock levels below 75% trigger automatic alerts to NDMA headquarters for replenishment as per the Issuance SOP.",
    hubImagesUnavailable: "Hub images unavailable.",
    statRegions: "Strategic hub regions (Gilgit, Muzaffargarh, Sukkur, Jalozai)",
    statEmergency: "Emergency Response Ready",
    mapCtaTitle: "National Hub Network Map",
    mapCtaBody:
      "View all material hubs on an interactive Pakistan map with hub imagery, materials, and guidance",
    mapCtaButton: "Open interactive map",
    trainingFeatureTitle: "Training & Certification",
    trainingFeatureBody:
      "Professional training programs on disaster-resilient construction techniques, including bamboo frame installation and EPS panel fitting.",
    trainingExplore: "Explore Training",
    inventoryFeatureBody:
      "Current material stock levels across all national hubs with hub-level inventory visibility.",
    poweredByNdma: "Powered by NDMA",
    navTraining: "Training",
    footerLinkTraining: "Training Programs",
    hubNetworkTitle: "Material Hub Network",
    hubNetworkDesc:
      "Explore Pakistan's national material hub locations — where supplies are staged and dispatched for disaster reconstruction.",
    selectHub: "Select hub",
    logisticsMap: "National logistics map",
    closeHubDetails: "Close hub details",
    viewHubDetails: "View {location} hub details",
    hubMapFootnote:
      "Tap a hub marker or use the selector above to zoom to a location and open operational details, materials, and guidance resources served from Local Multimedia Guidance.",
    stockAvailable: "Stock Available",
    ndmaAlt: "NDMA",
    dashboardLead: "National hazard intelligence for preparedness, response, and recovery.",
    ndmaBadge: "NDMA Pakistan",
    viewGuidance: "View guidance",
    ...MATERIAL_HUB_PAGE_STRINGS.en,
  },
  ur: {
    brandShort: "این ایم ایچ ڈی پی",
    brandSubtitle: "قومی مواد کے مرکز کا پورٹل",
    navHome: "مرکزی صفحہ",
    navLocations: "مراکز کے مقامات",
    navLocationsShort: "مقامات",
    navInventory: "موجودہ ذخیرہ",
    navInventoryShort: "ذخیرہ",
    navGuidance: "رہنمائی",
    navAbout: "تعارف",
    backToResilience: "← واپس لچک پورٹل پر",
    footerAboutTitle: "این ایم ایچ ڈی پی کے بارے میں",
    footerAboutBody:
      "قومی مواد کے ڈیجیٹل مرکز کا پورٹل — پاکستان بھر میں تیاری، کمیونٹی کی لچک، اور شفاف مواد کی تقسیم کو آسان بنانا۔",
    footerLinksTitle: "فوری روابط",
    footerLinkLocations: "مراکز کے مقامات",
    footerLinkInventory: "موجودہ ذخیرہ",
    footerLinkGuidance: "رہنمائی کا ذخیرہ",
    footerLinkAbout: "ہمارے بارے میں",
    footerContactTitle: "رابطہ",
    footerContactBody:
      "قومی آفات کے انتظام کا ادارہ\nوزیراعظم کا دفتر، اسلام آباد\nای میل: info@ndma.gov.pk",
    footerCopyright: "© ۲۰۲۶ این ڈی ایم اے پاکستان۔ تمام حقوق محفوظ ہیں۔",
    loading: "پورٹل کا ڈیٹا لوڈ ہو رہا ہے…",
    heroBadge: "پاکستان میں آفات کے بعد تعمیر نو کا پلیٹ فارم",
    heroTitle: "قومی مواد کے ڈیجیٹل مرکز کا پورٹل",
    heroSubtitle:
      "تیاری، کمیونٹی کی لچک، اور پاکستان بھر میں مواد کی شفاف تقسیم کو آسان بنانا",
    ctaLocations: "مراکز کے مقامات دیکھیں",
    ctaInventory: "موجودہ ذخیرہ دیکھیں",
    statHubs: "فعال مواد کے مرکز",
    statCapacity: "گھروں کی تعمیر نو کی گنجائش",
    statStock: "اوسط ذخیرے کی سطح",
    statSplit: "مراکز کی حیثیت",
    statReady: "تیار",
    statModerate: "درمیانہ",
    mapTitle: "پاکستان کا نقشہ — مرکز",
    mapAlt: "مراکز کے زون کے ساتھ پاکستان کا نقشہ",
    visualsTitle: "مراکز کی تصاویر",
    readinessTitle: "آفات کی تیاری کا اشاریہ",
    readinessSubtitle: "پاکستان بھر میں مواد کے مراکز کی حالت",
    hubStatusReady: "تیار",
    hubStatusModerate: "درمیانہ",
    stockLevel: "ذخیرے کی سطح",
    damageLevel: "نقصان کی سطح",
    capacityLabel: "گنجائش: {n} گھر",
    materialsTitle: "دستیاب مواد",
    materialsSubtitle: "مقامی این ڈی ایم اے کے اثاثوں سے بصری فہرست۔",
    quantity: "مقدار",
    inventoryChartTitle: "ذخیرے کی حالت",
    inventoryChartSubtitle: "ہر مادے کے لیے مرکز وار مقدار کا موازنہ۔",
    tableTitle: "ذخیرے کی جدول",
    tableSubtitle: "تمام مراکز میں تقسیم شدہ مادے۔",
    colMaterial: "مادہ",
    colGilgit: "گلگت",
    colMuzaffargarh: "مظفرگڑھ",
    colSukkur: "سکھر",
    carouselBadge: "مواد کا مرکز",
    offerTitle: "ہم کیا پیش کرتے ہیں",
    offerSubtitle: "جامع آفات کا انتظام اور کمیونٹی کی معاونت",
    f1Title: "براہِ راست ذخیرے کی نگرانی",
    f1Body:
      "تمام مراکز میں مواد کے ذخیرے کی فوری جھلک؛ جب ذخیرہ حفاظتی حد سے نیچے ہو تو خودکار انتباہ۔",
    f1Link: "ذخیرہ دیکھیں ←",
    f2Title: "رہنمائی کی تصویری گیلری",
    f2Body:
      "ہر مادے کے لیے سوائپ کے قابل تصویری گیلری — بامبو، سی جی آئی شیٹ، ای ایس پی پینل، لکڑی کے تختے وغیرہ۔",
    f2Link: "گیلری کھولیں ←",
    f3Title: "مراکز کے منصوبہ بند مقامات",
    f3Body:
      "گلگت، مظفرگڑھ، اور سکھر میں مواد کے مرکز تاکہ علاقوں میں تیزی سے جواب ممکن ہو۔",
    f3Link: "نقشہ دیکھیں ←",
    needTitle: "آفات کی امداد کا مواد درکار ہے؟",
    needBody:
      "پی ڈی ایم اے ہمارے ڈیجیٹل اجراء کے ورک فلو سے درخواست بھیج سکتے ہیں؛ منظوری اور روانگی تیز۔",
    needCta: "موجودہ ذخیرہ دیکھیں",
    transparencyTitle: "شفافیت کا نوٹس",
    transparencyBody:
      "اس پورٹل کا تمام ڈیٹا براہِ راست اپ ڈیٹ ہوتا ہے تاکہ شفافیت اور جوابدہی برقرار رہے۔ ۷۵٪ سے کم ذخیرے پر این ڈی ایم اے ہیڈ کوارٹر کو خودکار انتباہ جاتا ہے، اجراء کے ایس او پی کے مطابق۔",
    hubImagesUnavailable: "مراکز کی تصاویر دستیاب نہیں۔",
    statRegions: "منصوبہ بند علاقے (گلگت، مظفرگڑھ، سکھر، جالوزئی)",
    statEmergency: "ہنگامی جواب کے لیے تیار",
    mapCtaTitle: "قومی مرکز نیٹ ورک کا نقشہ",
    mapCtaBody:
      "تعامری پاکستان نقشے پر تمام مواد کے مراکز — تصاویر، مواد، اور رہنمائی کے ساتھ",
    mapCtaButton: "تعامری نقشہ کھولیں",
    trainingFeatureTitle: "تربیت اور سرٹیفیکیشن",
    trainingFeatureBody:
      "آفات سے محفوظ تعمیر کی تکنیکوں پر پیشہ ورانہ تربیت، بشمول بامبو فریم اور ای ایس پی پینل کی تنصیب۔",
    trainingExplore: "تربیت دیکھیں",
    inventoryFeatureBody:
      "تمام قومی مراکز میں موجودہ مواد کے ذخیرے کی مرکز وار نگرانی۔",
    poweredByNdma: "این ڈی ایم اے کی طرف سے",
    navTraining: "تربیت",
    footerLinkTraining: "تربیتی پروگرام",
    hubNetworkTitle: "مواد کے مراکز کا نیٹ ورک",
    hubNetworkDesc:
      "پاکستان کے قومی مواد کے مراکز — جہاں آفات کے بعد تعمیر نو کے لیے سامان جمع اور روانہ کیا جاتا ہے۔",
    selectHub: "مرکز منتخب کریں",
    logisticsMap: "قومی لاجسٹکس نقشہ",
    closeHubDetails: "مرکز کی تفصیل بند کریں",
    viewHubDetails: "{location} مرکز کی تفصیل دیکھیں",
    hubMapFootnote:
      "نشان یا اوپر والے منتخب کنندہ سے مرکز پر زوم کریں اور عملی تفصیل، مواد، اور مقامی رہنمائی کھولیں۔",
    stockAvailable: "ذخیرہ دستیاب",
    ndmaAlt: "این ڈی ایم اے",
    dashboardLead: "تیاری، ردعمل، اور بحالی کے لیے قومی خطرے کی معلومات۔",
    ndmaBadge: "این ڈی ایم اے پاکستان",
    viewGuidance: "رہنمائی دیکھیں",
    ...MATERIAL_HUB_PAGE_STRINGS.ur,
  },
};

export const materialHubLocale = STRINGS;

export function getMaterialHubStrings(lang: AppLanguage): MaterialHubStrings {
  return STRINGS[lang];
}
