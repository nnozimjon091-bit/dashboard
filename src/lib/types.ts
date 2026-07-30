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

export interface DashboardData {
  social: SocialEntry[];
  ads: AdEntry[];
  video: VideoEntry[];
  sales: SalesEntry[];
}

export type DatasetKey = keyof DashboardData;

export const EMPTY_DATA: DashboardData = {
  social: [],
  ads: [],
  video: [],
  sales: [],
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

export function labelFor(
  list: { value: string; label: string }[],
  value: string,
): string {
  return list.find((item) => item.value === value)?.label ?? value;
}
