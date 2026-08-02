// Marketing dashboard uchun ma'lumot modellari.
// Barcha yozuvlar kunlik: bitta sana + bitta platforma = bitta yozuv.

export type SocialPlatform = "instagram" | "telegram";
export type AdsPlatform = "meta" | "google" | "tiktok" | "telegram";
export type VideoPlatform = "youtube" | "tiktok";
export type SalesSource =
  | "instagram"
  | "telegram"
  | "youtube"
  | "tiktok"
  | "google"
  | "boshqa";

export interface SocialEntry {
  id: string;
  date: string; // YYYY-MM-DD
  platform: SocialPlatform;
  followers: number; // kun oxiridagi obunachilar soni
  reach: number; // qamrov
  engagement: number; // like + izoh + saqlash + ulashish
  posts: number; // shu kuni chiqarilgan postlar
}

export interface AdEntry {
  id: string;
  date: string;
  platform: AdsPlatform;
  campaign: string;
  spend: number; // USD
  impressions: number;
  clicks: number;
  leads: number;
}

export interface VideoEntry {
  id: string;
  date: string;
  platform: VideoPlatform;
  views: number;
  subscribers: number; // kun oxiridagi obunachilar
  watchHours: number; // ko'rish soatlari
  likes: number;
}

export interface SalesEntry {
  id: string;
  date: string;
  source: SalesSource;
  leads: number;
  deals: number; // yopilgan bitimlar
  revenue: number; // USD
}

/** Asosiy raqamga kelgan qo'ng'iroqlar — kanal kesimida, kunlik jami. */
export interface InboundEntry {
  id: string;
  date: string;
  /** Ro'yxatdan tanlangan (kanonik kod) yoki qo'lda yozilgan erkin nom. */
  source: string;
  calls: number; // jami kelgan qo'ng'iroqlar
  answered: number; // shundan javob berilgani
  deals: number; // qo'ng'iroqlardan chiqqan sotuvlar
}

/** Operatorlar qilgan chiquvchi qo'ng'iroqlar natijasi — kunlik jami. */
export interface OutboundEntry {
  id: string;
  date: string;
  leads: number;
  deals: number;
}

export type CatalogSource = "clinics_uz" | "med24";

/**
 * Klinikalar katalogidan (Clinics.uz, Med24) kelgan lidlar — kunlik, katalog
 * kesimida. `spend` ikki xil mantiqqa ega: Clinics.uz uchun oylik to'lov
 * qo'lda kiritiladi; Med24 uchun har lid uchun MED24_COST_PER_LEAD narxidan
 * hisoblanadi (kiritish formasida bo'sh qoldirilsa avtomatik).
 */
export interface CatalogEntry {
  id: string;
  date: string;
  catalog: CatalogSource;
  leads: number;
  deals: number; // yopilgan sotuvlar
  revenue: number; // USD
  spend: number; // USD
}

export interface DashboardData {
  social: SocialEntry[];
  ads: AdEntry[];
  video: VideoEntry[];
  sales: SalesEntry[];
  inbound: InboundEntry[];
  outbound: OutboundEntry[];
  catalogs: CatalogEntry[];
}

export type DatasetKey = keyof DashboardData;

export const EMPTY_DATA: DashboardData = {
  social: [],
  ads: [],
  video: [],
  sales: [],
  inbound: [],
  outbound: [],
  catalogs: [],
};

// ── Ko'rinadigan nomlar ────────────────────────────────────────────────

export const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "telegram", label: "Telegram" },
];

export const ADS_PLATFORMS: { value: AdsPlatform; label: string }[] = [
  { value: "meta", label: "Meta Ads" },
  { value: "google", label: "Google Ads" },
  { value: "tiktok", label: "TikTok Ads" },
  { value: "telegram", label: "Telegram Ads" },
];

export const VIDEO_PLATFORMS: { value: VideoPlatform; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
];

export const SALES_SOURCES: { value: SalesSource; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "telegram", label: "Telegram" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "google", label: "Google" },
  { value: "boshqa", label: "Boshqa" },
];

export const CATALOG_SOURCES: { value: CatalogSource; label: string }[] = [
  { value: "clinics_uz", label: "Clinics.uz" },
  { value: "med24", label: "Med24" },
];

/**
 * Med24 har bir lid uchun shuncha to'laydi (USD). Kiritish formasida
 * "Xarajat" maydoni bo'sh qoldirilsa, shu qiymatdan avtomatik hisoblanadi.
 */
export const MED24_COST_PER_LEAD = 1;

/**
 * Erkin yozilgan matnni ro'yxatdagi kanonik qiymatga moslaydi (masalan
 * "Instagram" → "instagram"), shunda eski yozuvlar bilan guruhlash buzilmaydi.
 * Mos kelmasa, yozilgan matnning o'zi qaytadi.
 */
export function normalizeToKnown(
  list: { value: string; label: string }[],
  raw: string,
): string {
  const trimmed = raw.trim();
  const match = list.find(
    (item) =>
      item.value.toLowerCase() === trimmed.toLowerCase() ||
      item.label.toLowerCase() === trimmed.toLowerCase(),
  );
  return match ? match.value : trimmed;
}

export function labelFor(
  list: { value: string; label: string }[],
  value: string,
): string {
  return list.find((item) => item.value === value)?.label ?? value;
}
