// Zaxira nusxa (JSON) va Excel uchun CSV eksporti.

import type { DashboardData, DatasetKey } from "./types";

export function downloadFile(
  filename: string,
  content: string,
  type: string,
): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportJson(data: DashboardData): void {
  const stamp = new Date().toISOString().slice(0, 10);
  downloadFile(
    `marketing-dashboard-${stamp}.json`,
    JSON.stringify(data, null, 2),
    "application/json",
  );
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(",")),
  ];
  // BOM — Excel faylni UTF-8 deb tanishi uchun.
  return "﻿" + lines.join("\n");
}

export function exportCsv(data: DashboardData, dataset: DatasetKey): void {
  const rows = data[dataset] as unknown as Record<string, unknown>[];
  const csv = toCsv([...rows].sort((a, b) => String(a.date).localeCompare(String(b.date))));
  if (!csv) return;
  const stamp = new Date().toISOString().slice(0, 10);
  downloadFile(`${dataset}-${stamp}.csv`, csv, "text/csv;charset=utf-8");
}

export interface ImportResult {
  ok: boolean;
  data?: DashboardData;
  error?: string;
}

/** Yuklangan JSON'ni tekshirib, faqat kutilgan shakldagi ma'lumotni qabul qiladi. */
export function parseImported(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Fayl JSON formatida emas." };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, error: "Fayl ichida ma'lumot topilmadi." };
  }
  const source = parsed as Partial<Record<DatasetKey, unknown>>;
  const keys: DatasetKey[] = [
    "social",
    "ads",
    "video",
    "sales",
    "outbound",
    "catalogs",
  ];
  const known = keys.filter((key) => Array.isArray(source[key]));
  if (known.length === 0) {
    return {
      ok: false,
      error: "Faylda kutilgan bo'limlar (social / ads / video / sales …) topilmadi.",
    };
  }
  return {
    ok: true,
    data: {
      social: Array.isArray(source.social) ? source.social : [],
      ads: Array.isArray(source.ads) ? source.ads : [],
      video: Array.isArray(source.video) ? source.video : [],
      sales: Array.isArray(source.sales) ? source.sales : [],
      outbound: Array.isArray(source.outbound) ? source.outbound : [],
      catalogs: Array.isArray(source.catalogs) ? source.catalogs : [],
    } as DashboardData,
  };
}
