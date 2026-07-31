// Seriya nomlari va ularning rang tartibi. Rang shu ro'yxatdagi o'ringa
// bog'langan — filtr seriyani olib tashlasa ham qolganlarining rangi o'zgarmaydi.

export const SERIES_ORDER = {
  /** Daromad — 1-slot (ko'k), xarajat — 2-slot (to'q sariq) */
  money: ["revenue", "spend"],
  funnel: ["leads", "deals"],
  /** Javob berilgan — 1-slot, o'tkazib yuborilgan — 2-slot */
  calls: ["answered", "missed"],
  /**
   * Kanal ranglari butun dashboard bo'ylab bitta ro'yxatdan olinadi —
   * Instagram qaysi grafikda bo'lmasin, doim bir xil rangda.
   */
  platform: ["instagram", "telegram", "youtube", "tiktok"],
  adsPlatform: ["meta", "google", "tiktok", "telegram"],
  catalog: ["clinics_uz", "med24"],
} as const;

export const SERIES_LABELS: Record<string, string> = {
  revenue: "Daromad",
  spend: "Reklama xarajati",
  leads: "Lidlar",
  deals: "Bitimlar",
  instagram: "Instagram",
  telegram: "Telegram",
  youtube: "YouTube",
  tiktok: "TikTok",
  meta: "Meta Ads",
  google: "Google Ads",
  clinics_uz: "Clinics.uz",
  med24: "Med24",
};
