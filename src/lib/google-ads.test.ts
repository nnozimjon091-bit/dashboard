// Ishga tushirish: npm test
// Namuna Google Ads interfeysidan nusxa olingan haqiqiy hisobotdan.

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseGoogleAdsReport,
  parseRuNumber,
  parseRussianDate,
} from "./google-ads.ts";

const T = "\t";
const REPORT = [
  ["Отчет о кампании"],
  ["30 июля 2026 г. - 30 июля 2026 г."],
  [
    "Статус кампании", "Кампания", "Бюджет", "Название бюджета", "Тип бюджета",
    "Код валюты", "Статус", "Причины статуса", "Показатель оптимизации",
    "Тип кампании", "Показы", "Взаимодействия", "Показ. взаимод.",
    "Средн. цена", "Расходы",
  ],
  ["Включено", "Стоматология conv", "18", "--", "Дневной", "USD", "Допущено",
   "количество запросов ограничено", "79,49", "Поиск", "239", "26", "10,88%", "0,4", "10,5"],
  ["Включено", "Лор Енги", "27", "--", "Дневной", "USD", "Допущено",
   "количество запросов ограничено", "76,38", "Поиск", "353", "71", "20,11%", "0,37", "26,15"],
  ["Включено", "Дерматолог", "9", "--", "Дневной", "USD", "Допущено",
   "ограничено бюджетом", "71,85", "Поиск", "122", "29", "23,77%", "0,15", "4,49"],
  ["Итого (Кампании)", "--", "--", "--", "--", "USD", "--", "", "--", "--",
   "1462", "244", "16,69%", "0,33", "81,69"],
  ["Итого (Аккаунт)", "", "", "", "", "USD", "", "", "", "", "1462", "244",
   "16,69%", "0,33", "81,69"],
  ["Итого (Поиск)", "", "", "", "", "USD", "", "", "", "Поиск", "1462", "244",
   "16,69%", "0,33", "81,69"],
].map((row) => row.join(T)).join("\n");

test("rus formatidagi sonlar", () => {
  assert.equal(parseRuNumber("10,5"), 10.5);
  assert.equal(parseRuNumber("81,69"), 81.69);
  assert.equal(parseRuNumber("1 462"), 1462);
  assert.equal(parseRuNumber("1.234,56"), 1234.56);
  assert.equal(parseRuNumber("239"), 239);
  assert.equal(parseRuNumber("--"), null);
  assert.equal(parseRuNumber(""), null);
});

test("rus sanalari", () => {
  assert.equal(parseRussianDate("30 июля 2026 г."), "2026-07-30");
  assert.equal(parseRussianDate("1 мая 2026 г."), "2026-05-01");
  assert.equal(parseRussianDate("15 марта 2026 г."), "2026-03-15");
  assert.equal(parseRussianDate("31.12.2026"), "2026-12-31");
  assert.equal(parseRussianDate("Кампания"), null);
});

test("kampaniyalar o'qiladi, Итого qatorlari tashlanadi", () => {
  const result = parseGoogleAdsReport(REPORT);
  assert.deepEqual(result.campaigns, [
    "Стоматология conv",
    "Лор Енги",
    "Дерматолог",
  ]);
  assert.equal(result.entries.length, 3);
  // Jami qatori kirib qolsa, xarajat 81.69 ga sakrab ketardi.
  const spend = result.entries.reduce((total, row) => total + row.spend, 0);
  assert.equal(Number(spend.toFixed(2)), 41.14);
});

test("ustunlar to'g'ri joyiga tushadi", () => {
  const { entries } = parseGoogleAdsReport(REPORT);
  const first = entries[0];
  assert.equal(first.campaign, "Стоматология conv");
  assert.equal(first.date, "2026-07-30");
  assert.equal(first.platform, "google");
  assert.equal(first.impressions, 239);
  assert.equal(first.clicks, 26);
  assert.equal(first.spend, 10.5);
  // "Конверсии" ustuni yo'q — lid nol.
  assert.equal(first.leads, 0);
});

test("valyuta va ogohlantirishlar", () => {
  const result = parseGoogleAdsReport(REPORT);
  assert.equal(result.currency, "USD");
  assert.equal(result.hasConversions, false);
  assert.ok(result.warnings.some((w) => w.includes("Конверсии")));
});

test("Конверсии ustuni bo'lsa lid sifatida olinadi", () => {
  const withConv = REPORT.replace("Расходы", "Расходы\tКонверсии")
    .replace("0,4\t10,5", "0,4\t10,5\t3")
    .replace("0,37\t26,15", "0,37\t26,15\t7")
    .replace("0,15\t4,49", "0,15\t4,49\t2");
  const result = parseGoogleAdsReport(withConv);
  assert.equal(result.hasConversions, true);
  assert.deepEqual(
    result.entries.map((row) => row.leads),
    [3, 7, 2],
  );
});

test("ko'p kunlik hisobot uchun ogohlantirish beriladi", () => {
  const multi = REPORT.replace(
    "30 июля 2026 г. - 30 июля 2026 г.",
    "1 июля 2026 г. - 30 июля 2026 г.",
  );
  const result = parseGoogleAdsReport(multi);
  assert.deepEqual(result.range, { from: "2026-07-01", to: "2026-07-30" });
  // Kunlarga bo'lib bo'lmaydi — hammasi oxirgi kunga yoziladi.
  assert.ok(result.entries.every((row) => row.date === "2026-07-30"));
  assert.ok(result.warnings.some((w) => w.includes("JAMI")));
});

test("sarlavhasiz matn tushunarli xabar qaytaradi", () => {
  const result = parseGoogleAdsReport("bir\tikki\nuch\tto'rt");
  assert.equal(result.entries.length, 0);
  assert.match(result.warnings[0], /Кампания/);
});
