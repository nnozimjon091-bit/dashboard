// Ishga tushirish: npm test
//
// Namuna haqiqiy jadvaldan olingan: sanalar ustun bo'lib yotadi, har bir soha
// uchun ko'rsatkichlar qator bo'lib takrorlanadi.

import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAdsSheet, parseAmount, parseSheetDate } from "./sheet.ts";

const T = "\t";
const rows = [
  ["№", "Campaigns name", "Metrics", "Reja Oylik", "Fakt", "", "Fakt (kunlik )"],
  ["", "", "", "", "Miqdor", "%", "1Jul2026", "2Jul2026", "3Jul2026", "4Jul2026"],
  ["Lead (Kunlik to'ldirib boriladi!)"],
  ["1", "Dermatolog", "Reach"],
  ["", "", "Lead soni (Result)", "", "", "", "15", "9", "12", "7"],
  ["", "", "Lead narxi (CPL)", "", "", "", "$0.72", "$1.11", "$0.70", "$1.35"],
  ["", "", "Sarflangan summa (Amount spent)", "", "", "", "$10.73", "$9.99", "$8.38", "$9.43"],
  ["", "", "Conversion rate %"],
  [""],
  ["2", "UZD", "Reach"],
  // O'rtada bo'sh kun bor — u yozuv yaratmasligi kerak.
  ["", "", "Lead soni (Result)", "", "", "", "11", "", "3", "8"],
  ["", "", "Sarflangan summa (Amount spent)", "", "", "", "$11.86", "", "$10.56", "$12.17"],
  [""],
  ["8", "Dermatolog (TG)", "Reach"],
  ["", "", "Lead soni (Result)"],
  ["", "", "Sarflangan summa (Amount spent)", "", "", "", "$5.39", "$6.18"],
].map((row) => row.join(T));

const SHEET = rows.join("\n");

test("sana formatlari", () => {
  assert.equal(parseSheetDate("1Jul2026"), "2026-07-01");
  assert.equal(parseSheetDate("31Jul2026"), "2026-07-31");
  assert.equal(parseSheetDate("01.07.2026"), "2026-07-01");
  assert.equal(parseSheetDate("2026-07-01"), "2026-07-01");
  assert.equal(parseSheetDate("Miqdor"), null);
  assert.equal(parseSheetDate(""), null);
});

test("summa formatlari", () => {
  assert.equal(parseAmount("$10.73"), 10.73);
  assert.equal(parseAmount("$1,234.56"), 1234.56);
  assert.equal(parseAmount("10,73"), 10.73);
  assert.equal(parseAmount("15"), 15);
  assert.equal(parseAmount(""), null);
  assert.equal(parseAmount("—"), null);
  assert.equal(parseAmount("#DIV/0!"), null);
});

test("sohalar va yozuvlar to'g'ri ajratiladi", () => {
  const result = parseAdsSheet(SHEET);
  assert.deepEqual(result.campaigns, ["Dermatolog", "UZD", "Dermatolog (TG)"]);

  const first = result.entries.find(
    (row) => row.campaign === "Dermatolog" && row.date === "2026-07-01",
  );
  assert.ok(first);
  assert.equal(first.leads, 15);
  assert.equal(first.spend, 10.73);
  assert.equal(first.platform, "meta");
  // Jadvaldagi CPL $0.72 — sarf ÷ lid ham shuni beradi.
  assert.equal((first.spend / first.leads).toFixed(2), "0.72");
});

test("bo'sh kunlar uchun yozuv yaratilmaydi", () => {
  const result = parseAdsSheet(SHEET);
  const uzd = result.entries
    .filter((row) => row.campaign === "UZD")
    .map((row) => row.date);
  assert.deepEqual(uzd, ["2026-07-01", "2026-07-03", "2026-07-04"]);
});

test("(TG) kampaniyasi Telegram deb belgilanadi, lidsiz ham qabul qilinadi", () => {
  const result = parseAdsSheet(SHEET);
  const tg = result.entries.filter((row) => row.campaign === "Dermatolog (TG)");
  assert.equal(tg.length, 2);
  assert.equal(tg[0].platform, "telegram");
  assert.equal(tg[0].leads, 0);
  assert.equal(tg[0].spend, 5.39);
});

test("davr chegaralari to'ldirilgan kunlar bo'yicha aniqlanadi", () => {
  const result = parseAdsSheet(SHEET);
  assert.deepEqual(result.range, { from: "2026-07-01", to: "2026-07-04" });
});

test("CSV ham, vergul o'rniga tab ishlatilgan nusxa ham o'qiladi", () => {
  const csv = SHEET.split("\n")
    .map((line) =>
      line
        .split(T)
        .map((value) => (value.includes(",") ? `"${value}"` : value))
        .join(","),
    )
    .join("\n");
  const fromCsv = parseAdsSheet(csv);
  const fromTsv = parseAdsSheet(SHEET);
  assert.deepEqual(fromCsv.entries, fromTsv.entries);
});

test("sanalar qatori topilmasa tushunarli xabar qaytadi", () => {
  const result = parseAdsSheet("a\tb\tc\n1\t2\t3");
  assert.equal(result.entries.length, 0);
  assert.match(result.warnings[0], /Sanalar qatori topilmadi/);
});
