// Sana bilan ishlash, davrga ajratish va KPI hisob-kitoblari.

import type {
  AdEntry,
  CatalogEntry,
  DashboardData,
  InboundEntry,
  OutboundEntry,
  SalesEntry,
  SocialEntry,
  VideoEntry,
} from "./types";
import { monthLabel, shortDate } from "./format";

// ── Sana yordamchilari (UTC asosida, kun surilib ketmasligi uchun) ─────

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const date = parseISO(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toISO(date);
}

export function diffDays(from: string, to: string): number {
  return Math.round(
    (parseISO(to).getTime() - parseISO(from).getTime()) / 86_400_000,
  );
}

// ── Davr (range) ──────────────────────────────────────────────────────

export type RangeKey = "7" | "30" | "90" | "oy" | "hammasi" | "diapazon";

export interface Range {
  from: string;
  to: string;
}

export const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "7", label: "7 kun" },
  { value: "30", label: "30 kun" },
  { value: "90", label: "90 kun" },
  { value: "oy", label: "Shu oy" },
  { value: "hammasi", label: "Hammasi" },
  { value: "diapazon", label: "Diapazon" },
];

export function allDates(data: DashboardData): string[] {
  return [
    ...data.social.map((r) => r.date),
    ...data.ads.map((r) => r.date),
    ...data.video.map((r) => r.date),
    ...data.sales.map((r) => r.date),
    ...data.inbound.map((r) => r.date),
    ...data.outbound.map((r) => r.date),
    ...data.catalogs.map((r) => r.date),
  ];
}

export function resolveRange(
  key: RangeKey,
  data: DashboardData,
  custom?: Partial<Range>,
): Range {
  const today = todayISO();
  if (key === "diapazon") {
    const from = custom?.from || addDays(today, -29);
    const to = custom?.to || today;
    // Sanalar teskari kiritilsa, o'rnini almashtiramiz.
    return from <= to ? { from, to } : { from: to, to: from };
  }
  if (key === "oy") return { from: today.slice(0, 7) + "-01", to: today };
  if (key === "hammasi") {
    const dates = allDates(data).sort();
    return { from: dates[0] ?? addDays(today, -29), to: dates.at(-1) ?? today };
  }
  return { from: addDays(today, -(Number(key) - 1)), to: today };
}

/** Solishtirish uchun oldingi teng uzunlikdagi davr. */
export function previousRange(range: Range): Range {
  const length = diffDays(range.from, range.to) + 1;
  return {
    from: addDays(range.from, -length),
    to: addDays(range.from, -1),
  };
}

export function filterRange<T extends { date: string }>(
  rows: T[],
  range: Range,
): T[] {
  return rows.filter((row) => row.date >= range.from && row.date <= range.to);
}

export function sliceData(data: DashboardData, range: Range): DashboardData {
  return {
    social: filterRange(data.social, range),
    ads: filterRange(data.ads, range),
    video: filterRange(data.video, range),
    sales: filterRange(data.sales, range),
    inbound: filterRange(data.inbound, range),
    outbound: filterRange(data.outbound, range),
    catalogs: filterRange(data.catalogs, range),
  };
}

// ── Vaqt o'qi bo'yicha guruhlash ──────────────────────────────────────

export type Bucket = "day" | "week" | "month";

export function pickBucket(range: Range): Bucket {
  const length = diffDays(range.from, range.to) + 1;
  if (length <= 45) return "day";
  if (length <= 200) return "week";
  return "month";
}

/** Berilgan sana qaysi bo'lakka tushishini aniqlaydi (bo'lak boshining kaliti). */
export function bucketKey(iso: string, bucket: Bucket): string {
  if (bucket === "day") return iso;
  if (bucket === "month") return iso.slice(0, 7);
  const date = parseISO(iso);
  const weekday = (date.getUTCDay() + 6) % 7; // dushanba = 0
  return addDays(iso, -weekday);
}

export function bucketLabel(key: string, bucket: Bucket): string {
  if (bucket === "month") return monthLabel(key);
  return shortDate(key);
}

function nextBucket(key: string, bucket: Bucket): string {
  if (bucket === "day") return addDays(key, 1);
  if (bucket === "week") return addDays(key, 7);
  const [y, m] = key.split("-").map(Number);
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  return `${nextY}-${String(nextM).padStart(2, "0")}`;
}

export interface SeriesPoint {
  key: string;
  label: string;
  [field: string]: string | number;
}

/**
 * Yozuvlarni vaqt bo'laklariga jamlaydi. Ma'lumot yo'q kunlar ham nol qiymat
 * bilan qo'shiladi — shunda chiziq uzilib qolmaydi.
 */
export function buildSeries<T extends { date: string }>(
  rows: T[],
  range: Range,
  bucket: Bucket,
  fields: Record<string, (row: T) => number>,
): SeriesPoint[] {
  const names = Object.keys(fields);
  const buckets = new Map<string, SeriesPoint>();

  let cursor = bucketKey(range.from, bucket);
  const last = bucketKey(range.to, bucket);
  // Cheksiz sikldan himoya: eng ko'pi bilan 400 nuqta.
  for (let guard = 0; guard < 400; guard += 1) {
    const point: SeriesPoint = { key: cursor, label: bucketLabel(cursor, bucket) };
    names.forEach((name) => {
      point[name] = 0;
    });
    buckets.set(cursor, point);
    if (cursor >= last) break;
    cursor = nextBucket(cursor, bucket);
  }

  rows.forEach((row) => {
    const point = buckets.get(bucketKey(row.date, bucket));
    if (!point) return;
    names.forEach((name) => {
      point[name] = (point[name] as number) + fields[name](row);
    });
  });

  return [...buckets.values()];
}

/** Bir xil davr va bo'lak bo'yicha qurilgan seriyalarni bitta jadvalga qo'shadi. */
export function mergeSeries(
  base: SeriesPoint[],
  ...others: SeriesPoint[][]
): SeriesPoint[] {
  return base.map((point, index) => {
    const merged: SeriesPoint = { ...point };
    others.forEach((group) => {
      const other = group[index];
      if (!other) return;
      Object.keys(other).forEach((field) => {
        if (field === "key" || field === "label") return;
        merged[field] = other[field];
      });
    });
    return merged;
  });
}

export interface StockField<T> {
  match: (row: T) => boolean;
  value: (row: T) => number;
}

/**
 * Obunachilar kabi "zaxira" ko'rsatkichlari uchun: bo'lak ichidagi oxirgi
 * qiymat olinadi (qo'shilmaydi), ma'lumot yo'q bo'lakda oldingisi saqlanadi.
 */
export function buildStockSeries<T extends { date: string }>(
  rows: T[],
  range: Range,
  bucket: Bucket,
  fields: Record<string, StockField<T>>,
): SeriesPoint[] {
  const names = Object.keys(fields);
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const grouped = new Map<string, T[]>();
  sorted.forEach((row) => {
    const key = bucketKey(row.date, bucket);
    const list = grouped.get(key);
    if (list) list.push(row);
    else grouped.set(key, [row]);
  });

  const carried: Record<string, number> = {};
  names.forEach((name) => {
    carried[name] = 0;
  });

  const skeleton = buildSeries(
    [] as { date: string }[],
    range,
    bucket,
    Object.fromEntries(names.map((name) => [name, () => 0])),
  );

  return skeleton.map((point) => {
    const rowsInBucket = grouped.get(point.key) ?? [];
    names.forEach((name) => {
      const field = fields[name];
      const matching = rowsInBucket.filter(field.match);
      if (matching.length > 0) {
        carried[name] = field.value(matching[matching.length - 1]);
      }
      point[name] = carried[name];
    });
    return point;
  });
}

// ── KPI hisoblari ─────────────────────────────────────────────────────

export const sum = <T,>(rows: T[], pick: (row: T) => number): number =>
  rows.reduce((total, row) => total + pick(row), 0);

/** Nolga bo'lishda NaN qaytaradi — format qatlami uni "—" qilib ko'rsatadi. */
export const safeDiv = (a: number, b: number): number => (b === 0 ? NaN : a / b);

export interface AdsKpis {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  ctr: number;
  cpc: number;
  cpl: number;
  cpm: number;
}

export function adsKpis(rows: AdEntry[]): AdsKpis {
  const spend = sum(rows, (r) => r.spend);
  const impressions = sum(rows, (r) => r.impressions);
  const clicks = sum(rows, (r) => r.clicks);
  const leads = sum(rows, (r) => r.leads);
  return {
    spend,
    impressions,
    clicks,
    leads,
    ctr: safeDiv(clicks, impressions),
    cpc: safeDiv(spend, clicks),
    cpl: safeDiv(spend, leads),
    cpm: safeDiv(spend * 1000, impressions),
  };
}

export interface SocialKpis {
  reach: number;
  engagement: number;
  posts: number;
  er: number;
  followers: number;
  followerGrowth: number;
}

/** Obunachilar — oqim emas, zaxira: davr oxiridagi qiymat olinadi. */
function stockByPlatform<T extends { date: string; platform: string }>(
  rows: T[],
  pick: (row: T) => number,
  edge: "first" | "last",
): number {
  const byPlatform = new Map<string, T>();
  rows.forEach((row) => {
    const current = byPlatform.get(row.platform);
    if (
      !current ||
      (edge === "last" ? row.date > current.date : row.date < current.date)
    ) {
      byPlatform.set(row.platform, row);
    }
  });
  return sum([...byPlatform.values()], pick);
}

export function socialKpis(rows: SocialEntry[]): SocialKpis {
  const reach = sum(rows, (r) => r.reach);
  const engagement = sum(rows, (r) => r.engagement);
  const followers = stockByPlatform(rows, (r) => r.followers, "last");
  const startFollowers = stockByPlatform(rows, (r) => r.followers, "first");
  return {
    reach,
    engagement,
    posts: sum(rows, (r) => r.posts),
    er: safeDiv(engagement, reach),
    followers,
    followerGrowth: followers - startFollowers,
  };
}

export interface VideoKpis {
  views: number;
  watchHours: number;
  likes: number;
  subscribers: number;
  subscriberGrowth: number;
  avgViewMinutes: number;
  videos: number;
  shorts: number;
}

export function videoKpis(rows: VideoEntry[]): VideoKpis {
  const views = sum(rows, (r) => r.views);
  const watchHours = sum(rows, (r) => r.watchHours);
  const subscribers = stockByPlatform(rows, (r) => r.subscribers, "last");
  const startSubs = stockByPlatform(rows, (r) => r.subscribers, "first");
  return {
    views,
    watchHours,
    likes: sum(rows, (r) => r.likes),
    subscribers,
    subscriberGrowth: subscribers - startSubs,
    avgViewMinutes: safeDiv(watchHours * 60, views),
    videos: sum(rows, (r) => r.videos),
    shorts: sum(rows, (r) => r.shorts),
  };
}

export interface SalesKpis {
  leads: number;
  deals: number;
  revenue: number;
  conversion: number;
  avgCheck: number;
}

export function salesKpis(rows: SalesEntry[]): SalesKpis {
  const leads = sum(rows, (r) => r.leads);
  const deals = sum(rows, (r) => r.deals);
  const revenue = sum(rows, (r) => r.revenue);
  return {
    leads,
    deals,
    revenue,
    conversion: safeDiv(deals, leads),
    avgCheck: safeDiv(revenue, deals),
  };
}

export interface InboundKpis {
  calls: number;
  deals: number;
  conversion: number;
}

export function inboundKpis(rows: InboundEntry[]): InboundKpis {
  const calls = sum(rows, (r) => r.calls);
  const deals = sum(rows, (r) => r.deals);
  return {
    calls,
    deals,
    conversion: safeDiv(deals, calls),
  };
}

export interface OutboundKpis {
  leads: number;
  deals: number;
  conversion: number;
}

export function outboundKpis(rows: OutboundEntry[]): OutboundKpis {
  const leads = sum(rows, (r) => r.leads);
  const deals = sum(rows, (r) => r.deals);
  return { leads, deals, conversion: safeDiv(deals, leads) };
}

export interface CatalogKpis {
  leads: number;
  deals: number;
  revenue: number;
  spend: number;
  conversion: number;
  cpl: number;
  roas: number;
}

export function catalogKpis(rows: CatalogEntry[]): CatalogKpis {
  const leads = sum(rows, (r) => r.leads);
  const deals = sum(rows, (r) => r.deals);
  const revenue = sum(rows, (r) => r.revenue);
  const spend = sum(rows, (r) => r.spend);
  return {
    leads,
    deals,
    revenue,
    spend,
    conversion: safeDiv(deals, leads),
    cpl: safeDiv(spend, leads),
    roas: safeDiv(revenue, spend),
  };
}

export interface OverviewKpis {
  ads: AdsKpis;
  social: SocialKpis;
  video: VideoKpis;
  sales: SalesKpis;
  inbound: InboundKpis;
  outbound: OutboundKpis;
  catalogs: CatalogKpis;
  /** Reklama xarajati + Klinikalar katalogi xarajati. */
  totalSpend: number;
  /** Sotuv daromadi + Klinikalar katalogi daromadi. */
  totalRevenue: number;
  /** Sotuv voronkasi lidlari + Klinikalar katalogi lidlari. */
  totalLeads: number;
  /** Sotuv bitimlari + Klinikalar katalogi bitimlari. */
  totalDeals: number;
  /** Pullik kanallardan (reklama + katalog) kelgan lidlar — CPL uchun. */
  paidLeads: number;
  cpl: number;
  conversion: number;
  avgCheck: number;
  roas: number;
  cac: number;
  profit: number;
}

export function overviewKpis(data: DashboardData): OverviewKpis {
  const ads = adsKpis(data.ads);
  const sales = salesKpis(data.sales);
  const catalogs = catalogKpis(data.catalogs);

  // Klinikalar katalogi ham pullik lid manbai (Reklama kabi), ham sotuv
  // natijasi (daromad/bitim) beradi — shuning uchun ikkala tomonga ham
  // qo'shiladi: xarajat reklama xarajatiga, daromad/lid/bitim esa sotuv
  // ko'rsatkichlariga. Aks holda xarajat oshadi-yu, unga mos daromad
  // hisobga kirmay, ROAS va Sof foyda noto'g'ri chiqadi.
  const totalSpend = ads.spend + catalogs.spend;
  const totalRevenue = sales.revenue + catalogs.revenue;
  const totalLeads = sales.leads + catalogs.leads;
  const totalDeals = sales.deals + catalogs.deals;
  const paidLeads = ads.leads + catalogs.leads;

  return {
    ads,
    social: socialKpis(data.social),
    video: videoKpis(data.video),
    sales,
    inbound: inboundKpis(data.inbound),
    outbound: outboundKpis(data.outbound),
    catalogs,
    totalSpend,
    totalRevenue,
    totalLeads,
    totalDeals,
    paidLeads,
    cpl: safeDiv(totalSpend, paidLeads),
    conversion: safeDiv(totalDeals, totalLeads),
    avgCheck: safeDiv(totalRevenue, totalDeals),
    roas: safeDiv(totalRevenue, totalSpend),
    cac: safeDiv(totalSpend, totalDeals),
    profit: totalRevenue - totalSpend,
  };
}

/** Ikki davr orasidagi nisbiy o'zgarish. Baza nol bo'lsa — NaN. */
export function delta(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return NaN;
  return safeDiv(current - previous, Math.abs(previous));
}
