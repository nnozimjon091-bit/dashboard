// Google Ads "Отчет о кампании" hisobotini o'qish.
//
// Google Ads interfeysidan nusxa olingan yoki CSV qilib yuklangan jadval
// kutiladi. Ustunlar sarlavha nomlari bo'yicha topiladi — ularning tartibi
// yoki soni o'zgarsa ham parser buzilmaydi:
//
//   Статус кампании | Кампания | ... | Показы | Взаимодействия | ... | Расходы
//   Включено        | Уролог1  | ... | 212    | 34             | ... | 8,94
//   Итого (Кампании)| --       | ... | 1462   | 244            | ... | 81,69   ← tashlanadi
//
// Sana hisobotning yuqorisidagi davr qatoridan olinadi; agar jadvalda
// "День" ustuni bo'lsa, har bir qatorning o'z sanasi ishlatiladi.

import type { AdEntry } from "./types";
import { parseDelimited } from "./sheet-format.ts";

const RU_MONTHS: Record<string, number> = {
  янв: 1, фев: 2, мар: 3, апр: 4, ма: 5, июн: 6,
  июл: 7, авг: 8, сен: 9, окт: 10, ноя: 11, дек: 12,
};

function monthFromRussian(word: string): number | null {
  const text = word.toLowerCase();
  // "мая" va "марта" boshlanishi bir xil emas, lekin "ма" faqat "мая" ga tushadi
  for (const [stem, month] of Object.entries(RU_MONTHS)) {
    if (text.startsWith(stem)) return month;
  }
  return null;
}

function iso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "30 июля 2026 г." yoki "30.07.2026" yoki "2026-07-30" */
export function parseRussianDate(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  let match = text.match(/^(\d{1,2})\s+([А-Яа-яЁё]+)\s+(\d{4})/);
  if (match) {
    const month = monthFromRussian(match[2]);
    if (month) return iso(Number(match[3]), month, Number(match[1]));
  }

  match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return iso(Number(match[1]), Number(match[2]), Number(match[3]));

  match = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (match) return iso(Number(match[3]), Number(match[2]), Number(match[1]));

  return null;
}

/** Hisobot tepasidagi "30 июля 2026 г. - 31 июля 2026 г." qatoridan davr. */
function findReportRange(rows: string[][]): { from: string; to: string } | null {
  for (const row of rows.slice(0, 6)) {
    const line = row.join(" ");
    const found = [...line.matchAll(/(\d{1,2})\s+([А-Яа-яЁё]+)\s+(\d{4})/g)]
      .map((m) => {
        const month = monthFromRussian(m[2]);
        return month ? iso(Number(m[3]), month, Number(m[1])) : null;
      })
      .filter((value): value is string => value !== null);
    if (found.length > 0) {
      const sorted = [...found].sort();
      return { from: sorted[0], to: sorted[sorted.length - 1] };
    }
  }
  return null;
}

/**
 * Rus formatidagi son: "10,5" → 10.5, "1 462" → 1462, "16,69%" → null
 * (foizlar hisobotdan olinmaydi, ular baribir qayta hisoblanadi).
 */
export function parseRuNumber(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const text = raw.replace(/[\s  ]/g, "").replace(/%/g, "");
  if (!text || text === "--" || text === "—" || text === "-") return null;
  // Vergul o'nlik ajratgich: "1.234,56" ham, "10,5" ham to'g'ri o'qiladi.
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

const normalize = (text: string): string =>
  text.trim().toLowerCase().replace(/\s+/g, " ");

/** Sarlavhalarni nomi bo'yicha topamiz — tartibiga bog'lanmaymiz. */
const COLUMN_ALIASES = {
  campaign: ["кампания", "campaign"],
  impressions: ["показы", "impressions", "impr."],
  clicks: ["взаимодействия", "клики", "clicks", "interactions"],
  spend: ["расходы", "стоимость", "cost", "spend"],
  conversions: ["конверсии", "conversions", "conv."],
  currency: ["код валюты", "валюта", "currency code", "currency"],
  date: ["день", "дата", "day", "date"],
} as const;

type ColumnKey = keyof typeof COLUMN_ALIASES;

function findColumns(header: string[]): Partial<Record<ColumnKey, number>> {
  const found: Partial<Record<ColumnKey, number>> = {};
  (Object.keys(COLUMN_ALIASES) as ColumnKey[]).forEach((key) => {
    const aliases = COLUMN_ALIASES[key] as readonly string[];
    // Avval aniq moslik: "Кампания" bilan "Статус кампании" chalkashmasligi uchun.
    let index = header.findIndex((cell) => aliases.includes(normalize(cell)));
    if (index < 0) {
      index = header.findIndex((cell) =>
        aliases.some((alias) => normalize(cell).startsWith(alias)),
      );
    }
    if (index >= 0) found[key] = index;
  });
  return found;
}

const isTotalRow = (row: string[]): boolean =>
  row
    .slice(0, 2)
    .some((cell) => /^(итого|total)\b/i.test(cell.trim()));

export interface GoogleAdsParseResult {
  entries: Omit<AdEntry, "id">[];
  campaigns: string[];
  range: { from: string; to: string } | null;
  currency: string | null;
  hasConversions: boolean;
  warnings: string[];
}

export function parseGoogleAdsReport(text: string): GoogleAdsParseResult {
  const warnings: string[] = [];
  const grid = parseDelimited(text).filter((row) =>
    row.some((cell) => cell.trim() !== ""),
  );
  const empty: GoogleAdsParseResult = {
    entries: [],
    campaigns: [],
    range: null,
    currency: null,
    hasConversions: false,
    warnings,
  };

  if (grid.length === 0) {
    warnings.push("Jadval bo'sh.");
    return empty;
  }

  // 1) Sarlavha qatori — "Кампания" ustuni bor qator.
  const headerIndex = grid.findIndex(
    (row) => findColumns(row).campaign !== undefined,
  );
  if (headerIndex < 0) {
    warnings.push(
      "\"Кампания\" ustuni topilmadi. Hisobotni sarlavha qatori bilan birga nusxalang.",
    );
    return empty;
  }
  const columns = findColumns(grid[headerIndex]);
  const campaignCol = columns.campaign as number;

  if (columns.spend === undefined) {
    warnings.push("\"Расходы\" ustuni topilmadi — xarajat nol bo'lib qoladi.");
  }

  // 2) Sana: qatorda "День" ustuni bo'lsa har birinikini, aks holda hisobot davrini.
  const reportRange = findReportRange(grid.slice(0, headerIndex));
  if (!reportRange && columns.date === undefined) {
    warnings.push(
      "Sana topilmadi. Hisobot tepasidagi davr qatorini ham nusxalang.",
    );
    return empty;
  }

  // 3) Qatorlarni o'qiymiz.
  const entries: Omit<AdEntry, "id">[] = [];
  const campaigns: string[] = [];
  let currency: string | null = null;
  let hasConversions = false;

  for (let i = headerIndex + 1; i < grid.length; i += 1) {
    const row = grid[i];
    if (isTotalRow(row)) continue;

    const campaign = (row[campaignCol] ?? "").trim();
    if (!campaign || campaign === "--") continue;

    const date =
      (columns.date !== undefined
        ? parseRussianDate(row[columns.date] ?? "")
        : null) ?? reportRange?.to ?? null;
    if (!date) continue;

    if (currency === null && columns.currency !== undefined) {
      const code = (row[columns.currency] ?? "").trim().toUpperCase();
      if (code && code !== "--") currency = code;
    }

    const conversions =
      columns.conversions !== undefined
        ? parseRuNumber(row[columns.conversions])
        : null;
    if (conversions !== null) hasConversions = true;

    if (!campaigns.includes(campaign)) campaigns.push(campaign);
    entries.push({
      date,
      platform: "google",
      campaign,
      spend: Number((parseRuNumber(row[columns.spend ?? -1]) ?? 0).toFixed(2)),
      impressions: Math.round(parseRuNumber(row[columns.impressions ?? -1]) ?? 0),
      clicks: Math.round(parseRuNumber(row[columns.clicks ?? -1]) ?? 0),
      leads: Math.round(conversions ?? 0),
    });
  }

  if (entries.length === 0) {
    warnings.push("Kampaniya qatorlari topilmadi.");
    return { ...empty, range: reportRange, currency };
  }

  // Hisobot bir necha kunlik jami bo'lsa, uni kunlarga bo'lib bo'lmaydi.
  if (
    columns.date === undefined &&
    reportRange &&
    reportRange.from !== reportRange.to
  ) {
    warnings.push(
      `Hisobot ${reportRange.from} — ${reportRange.to} oralig'idagi JAMI. Hammasi ${reportRange.to} sanasiga yozildi. Kunlik kesim uchun hisobotga "День" ustunini qo'shing.`,
    );
  }

  if (!hasConversions) {
    warnings.push(
      "Hisobotda \"Конверсии\" ustuni yo'q — lidlar nol bo'lib qoladi, CPL hisoblanmaydi.",
    );
  }

  if (currency && currency !== "USD") {
    warnings.push(
      `Hisobot valyutasi ${currency}, dashboard esa USD'da. Raqamlar aralashib ketadi.`,
    );
  }

  return { entries, campaigns, range: reportRange, currency, hasConversions, warnings };
}
