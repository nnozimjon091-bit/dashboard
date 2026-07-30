// Meta Marketing API bilan ishlash — FAQAT server tomonida.
// Token hech qachon brauzerga yuborilmaydi: bu fayl faqat route handler'lardan
// chaqiriladi va "use client" belgisiga ega emas.

import type { AdEntry } from "./types";

export interface MetaConfig {
  token: string;
  /** Har doim "act_" prefiksi bilan */
  accountId: string;
  version: string;
  /** Qaysi action turlari lid deb hisoblanadi */
  leadActions: string[];
}

const DEFAULT_API_VERSION = "v23.0";
const DEFAULT_LEAD_ACTIONS = ["lead"];

export function readMetaConfig(): MetaConfig | null {
  const token = process.env.META_ACCESS_TOKEN?.trim();
  const account = process.env.META_AD_ACCOUNT_ID?.trim();
  if (!token || !account) return null;

  const leadActions = (process.env.META_LEAD_ACTIONS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    token,
    accountId: account.startsWith("act_") ? account : `act_${account}`,
    version: process.env.META_API_VERSION?.trim() || DEFAULT_API_VERSION,
    leadActions: leadActions.length > 0 ? leadActions : DEFAULT_LEAD_ACTIONS,
  };
}

/** Hisobot raqamini to'liq ko'rsatmaymiz: act_••••1234 */
export function maskAccount(accountId: string): string {
  const digits = accountId.replace("act_", "");
  return `act_••••${digits.slice(-4)}`;
}

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

interface MetaAction {
  action_type?: string;
  value?: string;
}

interface MetaInsightRow {
  date_start?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: MetaAction[];
}

interface MetaResponse {
  data?: MetaInsightRow[];
  paging?: { next?: string };
  error?: { message?: string; type?: string; code?: number; error_subcode?: number };
}

export class MetaApiError extends Error {
  readonly status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "MetaApiError";
    this.status = status;
  }
}

const MAX_PAGES = 25;

function firstUrl(config: MetaConfig, since: string, until: string): string {
  const params = new URLSearchParams({
    level: "campaign",
    time_increment: "1",
    time_range: JSON.stringify({ since, until }),
    fields: "campaign_name,spend,impressions,clicks,actions",
    limit: "500",
    access_token: config.token,
  });
  return `https://graph.facebook.com/${config.version}/${config.accountId}/insights?${params}`;
}

/** Kunlik, kampaniya kesimidagi natijalarni sahifama-sahifa yig'ib oladi. */
export async function fetchInsights(
  config: MetaConfig,
  since: string,
  until: string,
): Promise<MetaInsightRow[]> {
  const rows: MetaInsightRow[] = [];
  let url: string | undefined = firstUrl(config, since, until);

  for (let page = 0; page < MAX_PAGES && url; page += 1) {
    let response: Response;
    try {
      response = await fetch(url, { cache: "no-store" });
    } catch {
      throw new MetaApiError(
        "Meta serveriga ulanib bo'lmadi. Internet aloqasini tekshiring.",
        504,
      );
    }

    const payload = (await response.json().catch(() => null)) as MetaResponse | null;

    if (!response.ok || payload?.error) {
      const detail = payload?.error?.message ?? `HTTP ${response.status}`;
      // Token yoki ruxsat muammosi 400/403 bilan keladi — foydalanuvchiga
      // aynan shu xabarni ko'rsatamiz, chunki yechimi shundan bilinadi.
      throw new MetaApiError(`Meta API xatosi: ${detail}`, 502);
    }

    rows.push(...(payload?.data ?? []));
    url = payload?.paging?.next;
  }

  return rows;
}

const toNumber = (value: string | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export interface ActionSummary {
  type: string;
  total: number;
}

export interface MappedInsights {
  entries: Omit<AdEntry, "id">[];
  /** Hisobotda uchragan barcha action turlari — lid sozlamasini to'g'rilash uchun */
  availableActions: ActionSummary[];
}

export function toAdEntries(
  rows: MetaInsightRow[],
  leadActions: string[],
): MappedInsights {
  const wanted = new Set(leadActions);
  const actionTotals = new Map<string, number>();
  const entries: Omit<AdEntry, "id">[] = [];

  rows.forEach((row) => {
    if (!row.date_start || !ISO_DATE.test(row.date_start)) return;

    let leads = 0;
    (row.actions ?? []).forEach((action) => {
      if (!action.action_type) return;
      const value = toNumber(action.value);
      actionTotals.set(
        action.action_type,
        (actionTotals.get(action.action_type) ?? 0) + value,
      );
      if (wanted.has(action.action_type)) leads += value;
    });

    entries.push({
      date: row.date_start,
      platform: "meta",
      campaign: row.campaign_name?.trim() || "Nomsiz kampaniya",
      spend: Number(toNumber(row.spend).toFixed(2)),
      impressions: Math.round(toNumber(row.impressions)),
      clicks: Math.round(toNumber(row.clicks)),
      leads: Math.round(leads),
    });
  });

  const availableActions = [...actionTotals.entries()]
    .map(([type, total]) => ({ type, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  return { entries, availableActions };
}
