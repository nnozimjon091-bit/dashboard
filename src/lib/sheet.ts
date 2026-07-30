// Targetolog to'ldiradigan Google Sheets jadvalini o'qish.
//
// Jadval transponirlangan: sanalar ustun bo'lib yotadi, har bir soha uchun esa
// ko'rsatkichlar qator bo'lib takrorlanadi:
//
//   №  | Campaigns name | Metrics                        | ... | 1Jul2026 | 2Jul2026
//   1  | Dermatolog     | Reach                          |     |          |
//      |                | Lead soni (Result)             |     | 15       | 9
//      |                | Lead narxi (CPL)               |     | $0.72    | $1.11
//      |                | Sarflangan summa (Amount spent)|     | $10.73   | $9.99
//      |                | Conversion rate %              |     |          |
//
// Qator raqamlariga bog'lanmaymiz — ustun sarlavhalari va "Metrics" ustunidagi
// yozuvlar bo'yicha topamiz, shunda jadvalga qator qo'shilsa ham buzilmaydi.

import type { AdEntry } from "./types";

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function iso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "1Jul2026", "01.07.2026", "2026-07-01" — uchalasi ham tushuniladi. */
export function parseSheetDate(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  let match = text.match(/^(\d{1,2})[\s.\-/]*([A-Za-z]{3,})[\s.\-/]*(\d{4})$/);
  if (match) {
    const month = MONTHS[match[2].slice(0, 3).toLowerCase()];
    if (month) return iso(Number(match[3]), month, Number(match[1]));
  }

  match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return iso(Number(match[1]), Number(match[2]), Number(match[3]));

  // kun.oy.yil
  match = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (match) return iso(Number(match[3]), Number(match[2]), Number(match[1]));

  return null;
}

/**
 * "$10.73" → 10.73, "$1,234.56" → 1234.56, "10,73" → 10.73.
 * Bo'sh, "—" yoki "#DIV/0!" kabi hujayralar uchun null.
 */
export function parseAmount(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  let text = raw.replace(/[$\s ]/g, "");
  if (!text || text === "-" || text === "—" || text.startsWith("#")) return null;
  // Vergul o'nlik ajratgichmi yoki minglikmi — nuqta borligiga qarab hal qilamiz.
  if (!text.includes(".") && /^-?\d+,\d{1,2}$/.test(text)) {
    text = text.replace(",", ".");
  } else {
    text = text.replace(/,/g, "");
  }
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/** CSV ham, jadvaldan to'g'ridan-to'g'ri nusxa olingan TSV ham tushuniladi. */
export function parseDelimited(text: string): string[][] {
  const lineEnd = text.indexOf("\n");
  const firstLine = lineEnd === -1 ? text : text.slice(0, lineEnd);
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  const delimiter = tabs >= commas ? "\t" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const cell = (row: string[] | undefined, index: number): string =>
  (row?.[index] ?? "").trim();

const normalize = (text: string): string => text.trim().toLowerCase();

type MetricKind = "leads" | "cpl" | "spend" | null;

function metricKind(label: string): MetricKind {
  const text = normalize(label);
  if (!text) return null;
  if (text.includes("lead narxi") || text.includes("cpl")) return "cpl";
  if (text.includes("sarflangan") || text.includes("amount spent")) return "spend";
  if (text.includes("lead soni") || text.includes("result")) return "leads";
  return null;
}

/** "(TG)" qo'shimchasi Telegram kampaniyasini bildiradi, qolgani Meta. */
function platformOf(campaign: string): AdEntry["platform"] {
  return /\(\s*tg\s*\)/i.test(campaign) ? "telegram" : "meta";
}

export interface SheetParseResult {
  entries: Omit<AdEntry, "id">[];
  campaigns: string[];
  range: { from: string; to: string } | null;
  warnings: string[];
}

interface DayValues {
  leads?: number;
  spend?: number;
  cpl?: number;
}

export function parseAdsSheet(text: string): SheetParseResult {
  const warnings: string[] = [];
  const grid = parseDelimited(text);
  if (grid.length === 0) {
    return { entries: [], campaigns: [], range: null, warnings: ["Jadval bo'sh."] };
  }

  // 1) Sarlavha qatoridan ustunlarni topamiz.
  let campaignCol = 1;
  let metricCol = 2;
  const headerIndex = grid.findIndex((row) =>
    row.some((value) => normalize(value).includes("campaigns name")),
  );
  if (headerIndex >= 0) {
    const header = grid[headerIndex];
    campaignCol = header.findIndex((value) =>
      normalize(value).includes("campaigns name"),
    );
    const found = header.findIndex((value) => normalize(value).includes("metric"));
    metricCol = found >= 0 ? found : campaignCol + 1;
  } else {
    warnings.push(
      "\"Campaigns name\" sarlavhasi topilmadi — standart ustunlar ishlatildi.",
    );
  }

  // 2) Sanalar qatorini topamiz: eng ko'p sana tushunilgan qator.
  let dateRowIndex = -1;
  let dateColumns: { col: number; date: string }[] = [];
  const searchLimit = Math.min(grid.length, 25);
  for (let i = 0; i < searchLimit; i += 1) {
    const found: { col: number; date: string }[] = [];
    grid[i].forEach((value, col) => {
      if (col <= metricCol) return;
      const date = parseSheetDate(value);
      if (date) found.push({ col, date });
    });
    if (found.length > dateColumns.length) {
      dateColumns = found;
      dateRowIndex = i;
    }
  }
  if (dateColumns.length < 3) {
    return {
      entries: [],
      campaigns: [],
      range: null,
      warnings: [
        "Sanalar qatori topilmadi. Sarlavhada 1Jul2026 kabi sanalar borligini tekshiring.",
      ],
    };
  }

  // Bir sana ikki marta uchrasa (jadval oxirida ba'zan takrorlanadi),
  // keyingi to'ldirilgan ustun oldingisining ustiga yoziladi.
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  dateColumns.forEach(({ date }) => {
    if (seen.has(date)) duplicates.add(date);
    seen.add(date);
  });
  if (duplicates.size > 0) {
    warnings.push(
      `Takrorlangan sana ustunlari: ${[...duplicates].join(", ")} — oxirgi to'ldirilgani olindi.`,
    );
  }

  // 3) Qatorlarni yurib chiqamiz.
  const byCampaign = new Map<string, Map<string, DayValues>>();
  const order: string[] = [];
  let current: string | null = null;

  for (let i = dateRowIndex + 1; i < grid.length; i += 1) {
    const row = grid[i];
    const name = cell(row, campaignCol);
    if (name) {
      current = name;
      if (!byCampaign.has(name)) {
        byCampaign.set(name, new Map());
        order.push(name);
      }
    }
    if (!current) continue;

    const kind = metricKind(cell(row, metricCol));
    if (!kind) continue;

    const days = byCampaign.get(current);
    if (!days) continue;

    dateColumns.forEach(({ col, date }) => {
      const value = parseAmount(row[col]);
      if (value === null) return;
      const day = days.get(date) ?? {};
      day[kind] = value;
      days.set(date, day);
    });
  }

  // 4) Yozuvlarga aylantiramiz.
  const entries: Omit<AdEntry, "id">[] = [];
  const usedDates: string[] = [];

  order.forEach((campaign) => {
    const platform = platformOf(campaign);
    const days = byCampaign.get(campaign);
    if (!days) return;
    [...days.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, values]) => {
        const leads = values.leads ?? 0;
        const spend = values.spend ?? 0;
        // Bo'sh kunlar uchun yozuv yaratmaymiz.
        if (leads === 0 && spend === 0) return;
        usedDates.push(date);
        entries.push({
          date,
          platform,
          campaign,
          spend: Number(spend.toFixed(2)),
          // Jadvalda ko'rsatish va klik yo'q — ular nol bo'lib qoladi,
          // shuning uchun CTR/CPC/CPM hisoblanmaydi.
          impressions: 0,
          clicks: 0,
          leads: Math.round(leads),
        });
      });
  });

  usedDates.sort();
  const range =
    usedDates.length > 0
      ? { from: usedDates[0], to: usedDates[usedDates.length - 1] }
      : null;

  if (entries.length === 0) {
    warnings.push("Jadvalda to'ldirilgan kun topilmadi.");
  }

  return { entries, campaigns: order, range, warnings };
}
