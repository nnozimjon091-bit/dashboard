// Grafik ranglari — validatsiyadan o'tgan kategorik palitra.
// Yorug' va qorong'i rejim uchun bir xil sakkiz rang, har biri o'z foniga moslangan.
// Slotlar tartibi o'zgartirilmaydi: rang seriyaga biriktiriladi, reytingga emas.

export interface ChartTokens {
  series: readonly string[];
  surface: string;
  grid: string;
  axis: string;
  muted: string;
  ink: string;
  ink2: string;
  good: string;
  bad: string;
}

export const LIGHT_TOKENS: ChartTokens = {
  series: [
    "#2a78d6", // 1 ko'k
    "#eb6834", // 2 to'q sariq
    "#1baf7a", // 3 akvamarin
    "#eda100", // 4 sariq
    "#e87ba4", // 5 pushti
    "#008300", // 6 yashil
    "#4a3aa7", // 7 binafsha
    "#e34948", // 8 qizil
  ],
  surface: "#ffffff",
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  muted: "#898781",
  ink: "#0b0b0b",
  ink2: "#52514e",
  good: "#006300",
  bad: "#d03b3b",
};

export const DARK_TOKENS: ChartTokens = {
  series: [
    "#3987e5",
    "#d95926",
    "#199e70",
    "#c98500",
    "#d55181",
    "#008300",
    "#9085e9",
    "#e66767",
  ],
  surface: "#1a1a19",
  grid: "#2c2c2a",
  axis: "#383835",
  muted: "#898781",
  ink: "#ffffff",
  ink2: "#c3c2b7",
  good: "#0ca30c",
  bad: "#e66767",
};

export function tokensFor(mode: "light" | "dark"): ChartTokens {
  return mode === "dark" ? DARK_TOKENS : LIGHT_TOKENS;
}

/**
 * Rang seriyaning nomiga (entity) biriktiriladi, ro'yxatdagi o'rniga emas —
 * shunda filtr seriyani olib tashlaganda qolganlarining rangi o'zgarmaydi.
 */
export function seriesColor(
  tokens: ChartTokens,
  key: string,
  order: readonly string[],
): string {
  const index = order.indexOf(key);
  return tokens.series[(index < 0 ? 0 : index) % tokens.series.length];
}
