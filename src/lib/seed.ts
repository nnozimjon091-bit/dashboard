// Demo ma'lumot — dashboard birinchi ochilganda bo'sh turmasligi uchun.
// Generator deterministik: bir xil urug' har doim bir xil raqamlarni beradi.

import { addDays, todayISO } from "./metrics";
import {
  MED24_COST_PER_LEAD,
  type AdEntry,
  type CatalogEntry,
  type DashboardData,
  type InboundEntry,
  type OutboundEntry,
  type SalesEntry,
  type SocialEntry,
  type VideoEntry,
} from "./types";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Dam olish kunlarida aktivlik pasayadi — grafik tabiiyroq ko'rinadi. */
function weekendFactor(iso: string): number {
  const day = new Date(iso + "T00:00:00Z").getUTCDay();
  return day === 0 || day === 6 ? 0.72 : 1;
}

/** Kunlik byudjet, USD. Jami ≈ $460/kun — ROAS 2–3x atrofida chiqadi. */
const AD_CAMPAIGNS: { platform: AdEntry["platform"]; campaign: string; base: number }[] =
  [
    { platform: "meta", campaign: "Yozgi aksiya", base: 210 },
    { platform: "google", campaign: "Brend so'rovlari", base: 140 },
    { platform: "tiktok", campaign: "Reels trafik", base: 110 },
  ];

export function buildDemoData(days = 90): DashboardData {
  const random = mulberry32(20260730);
  const jitter = (spread: number) => 1 + (random() - 0.5) * spread;

  const social: SocialEntry[] = [];
  const ads: AdEntry[] = [];
  const video: VideoEntry[] = [];
  const sales: SalesEntry[] = [];
  const inbound: InboundEntry[] = [];
  const outbound: OutboundEntry[] = [];
  const catalogs: CatalogEntry[] = [];

  let igFollowers = 8_240;
  let tgFollowers = 3_115;
  let ytSubscribers = 5_460;
  let ttSubscribers = 12_300;

  const start = addDays(todayISO(), -(days - 1));

  for (let index = 0; index < days; index += 1) {
    const date = addDays(start, index);
    const weekend = weekendFactor(date);
    // Kampaniya bosqichma-bosqich kuchayib boradi.
    const growth = 1 + index / (days * 2.5);

    // ── Ijtimoiy tarmoqlar ──
    igFollowers += Math.round(28 * growth * jitter(0.9) * weekend);
    tgFollowers += Math.round(14 * growth * jitter(1.1) * weekend);

    const igReach = Math.round(7_400 * growth * weekend * jitter(0.5));
    social.push({
      id: `demo-social-ig-${date}`,
      date,
      platform: "instagram",
      followers: igFollowers,
      reach: igReach,
      engagement: Math.round(igReach * (0.052 * jitter(0.4))),
      posts: random() > 0.45 ? 1 : random() > 0.8 ? 2 : 0,
    });

    const tgReach = Math.round(2_600 * growth * weekend * jitter(0.45));
    social.push({
      id: `demo-social-tg-${date}`,
      date,
      platform: "telegram",
      followers: tgFollowers,
      reach: tgReach,
      engagement: Math.round(tgReach * (0.038 * jitter(0.5))),
      posts: random() > 0.35 ? 1 : 0,
    });

    // ── Reklama kampaniyalari ──
    let dailyLeads = 0;
    AD_CAMPAIGNS.forEach((campaign, order) => {
      const spend = Number((campaign.base * growth * weekend * jitter(0.35)).toFixed(2));
      const impressions = Math.round(spend * 120 * jitter(0.3));
      const clicks = Math.round(impressions * 0.0135 * jitter(0.35));
      const leads = Math.max(0, Math.round(clicks * 0.03 * jitter(0.5)));
      dailyLeads += leads;
      ads.push({
        id: `demo-ad-${order}-${date}`,
        date,
        platform: campaign.platform,
        campaign: campaign.campaign,
        spend,
        impressions,
        clicks,
        leads,
      });
    });

    // ── Video ──
    ytSubscribers += Math.round(11 * growth * jitter(1.2));
    const ytViews = Math.round(1_850 * growth * weekend * jitter(0.7));
    video.push({
      id: `demo-video-yt-${date}`,
      date,
      platform: "youtube",
      views: ytViews,
      subscribers: ytSubscribers,
      watchHours: Number((ytViews * 0.062 * jitter(0.3)).toFixed(1)),
      likes: Math.round(ytViews * 0.041 * jitter(0.4)),
    });

    ttSubscribers += Math.round(26 * growth * jitter(1.3));
    const ttViews = Math.round(12_400 * growth * weekend * jitter(0.9));
    video.push({
      id: `demo-video-tt-${date}`,
      date,
      platform: "tiktok",
      views: ttViews,
      subscribers: ttSubscribers,
      watchHours: Number((ttViews * 0.0085 * jitter(0.3)).toFixed(1)),
      likes: Math.round(ttViews * 0.052 * jitter(0.4)),
    });

    // ── Sotuv va lidlar ──
    const mix: { source: SalesEntry["source"]; share: number; check: number }[] = [
      { source: "instagram_facebook", share: 0.4, check: 210 },
      { source: "telegram", share: 0.26, check: 185 },
      { source: "website_google_ads", share: 0.22, check: 260 },
      { source: "youtube", share: 0.12, check: 240 },
    ];

    mix.forEach(({ source, share, check }, order) => {
      const leads = Math.max(0, Math.round(dailyLeads * share * jitter(0.5)));
      if (leads === 0) return;
      const deals = Math.max(0, Math.round(leads * 0.24 * jitter(0.8)));
      sales.push({
        id: `demo-sale-${order}-${date}`,
        date,
        source,
        leads,
        deals,
        revenue: Number((deals * check * jitter(0.25)).toFixed(2)),
      });

      // ── Kiruvchi qo'ng'iroqlar ──
      // Har bir lid ortida bir nechta qo'ng'iroq bo'ladi.
      const calls = Math.max(0, Math.round(leads * 1.8 * jitter(0.4)));
      if (calls === 0) return;
      inbound.push({
        id: `demo-in-${order}-${date}`,
        date,
        source,
        calls,
        deals: Math.max(0, Math.round(calls * 0.14 * jitter(0.7))),
      });
    });

    // ── Chiquvchi qo'ng'iroqlar ──
    const outLeads = Math.max(0, Math.round(18 * weekend * jitter(0.6)));
    outbound.push({
      id: `demo-out-${date}`,
      date,
      leads: outLeads,
      deals: Math.max(0, Math.round(outLeads * 0.19 * jitter(0.8))),
    });

    // ── Klinikalar katalogi ──
    // Clinics.uz: oylik obuna to'lovi, har oyning 1-kunida.
    const clinicsLeads = Math.max(0, Math.round(4 * weekend * jitter(0.6)));
    const clinicsDeals = Math.max(0, Math.round(clinicsLeads * 0.22 * jitter(0.8)));
    catalogs.push({
      id: `demo-cat-clinics-${date}`,
      date,
      catalog: "clinics_uz",
      leads: clinicsLeads,
      deals: clinicsDeals,
      revenue: Number((clinicsDeals * 210 * jitter(0.25)).toFixed(2)),
      spend: date.slice(8, 10) === "01" ? 150 : 0,
    });

    // Med24: har lid uchun to'lov — spend leads'dan avtomatik hisoblanadi.
    const med24Leads = Math.max(0, Math.round(3 * weekend * jitter(0.7)));
    const med24Deals = Math.max(0, Math.round(med24Leads * 0.2 * jitter(0.8)));
    catalogs.push({
      id: `demo-cat-med24-${date}`,
      date,
      catalog: "med24",
      leads: med24Leads,
      deals: med24Deals,
      revenue: Number((med24Deals * 220 * jitter(0.25)).toFixed(2)),
      spend: Number((med24Leads * MED24_COST_PER_LEAD).toFixed(2)),
    });
  }

  return { social, ads, video, sales, inbound, outbound, catalogs };
}
