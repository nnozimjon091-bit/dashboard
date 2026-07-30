// Raqamlarni o'zbekcha ko'rinishda formatlash. Valyuta — USD.

const UZ = "uz-UZ";

/** Katta sonlarni qisqartiradi: 1 284 → "1 284", 12 900 → "12,9K", 4 200 000 → "4,2M" */
export function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return trim(value / 1_000_000) + "M";
  if (abs >= 10_000) return trim(value / 1_000) + "K";
  return new Intl.NumberFormat(UZ, { maximumFractionDigits: 0 }).format(value);
}

function trim(value: number): string {
  return new Intl.NumberFormat(UZ, { maximumFractionDigits: 1 }).format(value);
}

/** To'liq son, bo'sh joy bilan ajratilgan: 1 284 350 */
export function num(value: number, digits = 0): string {
  return new Intl.NumberFormat(UZ, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

/** Stat tile va hero raqamlar uchun: $12,9K */
export function usdCompact(value: number): string {
  return "$" + compact(value);
}

/** Jadval va tooltip uchun to'liq summa: $1 284 */
export function usd(value: number, digits = 0): string {
  return "$" + num(value, digits);
}

/** Kichik summalar (CPC, CPL) uchun sentlar bilan: $0,42 */
export function usdFine(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return "$" + num(value, value < 10 ? 2 : 0);
}

/** 0.0432 → "4,3%" */
export function pct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return num(value * 100, digits) + "%";
}

/** ROAS kabi koeffitsiyentlar: 3,4x */
export function ratio(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return num(value, digits) + "x";
}

const MONTHS_SHORT = [
  "yan",
  "fev",
  "mar",
  "apr",
  "may",
  "iyn",
  "iyl",
  "avg",
  "sen",
  "okt",
  "noy",
  "dek",
];

/** "2026-07-30" → "30 iyl" */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1] ?? ""}`.trim();
}

/** "2026-07-30" → "30 iyl 2026" */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1] ?? ""} ${y}`;
}

/** "2026-07" → "iyl 2026" */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS_SHORT[m - 1] ?? ""} ${y}`;
}
