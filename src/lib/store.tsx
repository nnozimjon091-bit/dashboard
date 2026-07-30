"use client";

// Ma'lumot brauzerning localStorage'ida saqlanadi — server ham, login ham kerak emas.
//
// Demo ma'lumot — bu alohida KO'RINISH rejimi, saqlanadigan yozuv emas.
// U hech qachon localStorage'ga yozilmaydi va foydalanuvchining o'z yozuvlari
// bilan aralashmaydi: birinchi haqiqiy yozuv kiritilishi bilan demo yo'qoladi.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  EMPTY_DATA,
  type DashboardData,
  type DatasetKey,
} from "./types";
import { resolveRange, type Range, type RangeKey } from "./metrics";
import { buildDemoData } from "./seed";

const DATA_KEY = "marketing-dashboard:data:v1";
const DISMISSED_KEY = "marketing-dashboard:demo-dismissed:v1";
/** Eski versiya kaliti: "1" = demo yoqilgan, "0" = foydalanuvchi uni yopgan. */
const LEGACY_DEMO_KEY = "marketing-dashboard:demo:v1";
const RANGE_KEY = "marketing-dashboard:range:v1";

/** Demo generatori shu prefiks bilan id beradi. */
const DEMO_PREFIX = "demo-";

type Entry<K extends DatasetKey> = DashboardData[K][number];

interface StoreValue {
  /** Grafiklar chizadigan ma'lumot — demo rejimida demo, aks holda o'zingizniki. */
  data: DashboardData;
  /** Faqat foydalanuvchi kiritgan yozuvlar (demo hech qachon bu yerda bo'lmaydi). */
  ownData: DashboardData;
  /** localStorage o'qib bo'lingunicha false — shu paytgacha skeleton ko'rsatiladi. */
  hydrated: boolean;
  /** Ekrandagi raqamlar haqiqiy emas, demo ekanini bildiradi. */
  isDemo: boolean;
  rangeKey: RangeKey;
  range: Range;
  setRangeKey: (key: RangeKey) => void;
  addEntry: <K extends DatasetKey>(key: K, entry: Omit<Entry<K>, "id">) => void;
  updateEntry: <K extends DatasetKey>(
    key: K,
    id: string,
    patch: Partial<Entry<K>>,
  ) => void;
  removeEntry: (key: DatasetKey, id: string) => void;
  /** Bitta bo'limdagi hamma yozuvni o'chiradi (masalan faqat reklamani). */
  clearDataset: (key: DatasetKey) => void;
  replaceAll: (next: DashboardData) => void;
  /** Demo ko'rinishini qaytaradi (faqat o'z yozuvlaringiz bo'lmaganda mantiqiy). */
  loadDemo: () => void;
  clearAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function countRows(data: DashboardData): number {
  return (
    data.social.length + data.ads.length + data.video.length + data.sales.length
  );
}

/**
 * Oldingi versiyalarda demo yozuvlari localStorage'ga tushib qolar edi.
 * O'qishda ularni tashlab yuboramiz — aks holda ular "haqiqiy" ma'lumot
 * sifatida grafiklarga qo'shilib ketadi.
 */
function stripDemoRows(data: DashboardData): DashboardData {
  const clean = <T extends { id: string }>(rows: T[]) =>
    rows.filter((row) => !String(row.id).startsWith(DEMO_PREFIX));
  return {
    social: clean(data.social),
    ads: clean(data.ads),
    video: clean(data.video),
    sales: clean(data.sales),
  };
}

/** Noma'lum yoki buzilgan JSON'ni xavfsiz o'qish. */
function readStored(): DashboardData | null {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DashboardData>;
    return stripDemoRows({
      social: Array.isArray(parsed.social) ? parsed.social : [],
      ads: Array.isArray(parsed.ads) ? parsed.ads : [],
      video: Array.isArray(parsed.video) ? parsed.video : [],
      sales: Array.isArray(parsed.sales) ? parsed.sales : [],
    });
  } catch {
    return null;
  }
}

function readDismissed(): boolean {
  const current = localStorage.getItem(DISMISSED_KEY);
  if (current !== null) return current === "1";
  // Eski kalitdan ko'chirish: "0" — foydalanuvchi demoni yopgan bo'lgan.
  return localStorage.getItem(LEGACY_DEMO_KEY) === "0";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ownData, setOwnData] = useState<DashboardData>(EMPTY_DATA);
  const [demoDismissed, setDemoDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [rangeKey, setRangeKeyState] = useState<RangeKey>("30");

  // Birinchi render serverdagi natijaga mos bo'lishi shart, shuning uchun
  // localStorage faqat mount'dan keyin o'qiladi. Effekt bir marta ishlaydi —
  // qayta-qayta render zanjiri hosil bo'lmaydi.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = readStored();
    if (stored) setOwnData(stored);
    setDemoDismissed(readDismissed());
    const storedRange = localStorage.getItem(RANGE_KEY) as RangeKey | null;
    if (storedRange) setRangeKeyState(storedRange);
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(DATA_KEY, JSON.stringify(ownData));
  }, [ownData, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(DISMISSED_KEY, demoDismissed ? "1" : "0");
  }, [demoDismissed, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(RANGE_KEY, rangeKey);
  }, [rangeKey, hydrated]);

  // Demo har seansda qaytadan yasaladi (sanalari bugunga nisbatan) va
  // hech qayerga saqlanmaydi.
  const demoData = useMemo(() => buildDemoData(), []);

  // Demo faqat o'z yozuvlaringiz umuman bo'lmaganda ko'rinadi. Shu sababli
  // birinchi yozuvni kiritishingiz bilan u o'z-o'zidan yo'qoladi.
  const isDemo = !demoDismissed && countRows(ownData) === 0;
  const data = isDemo ? demoData : ownData;

  const addEntry = useCallback(
    <K extends DatasetKey>(key: K, entry: Omit<Entry<K>, "id">) => {
      const id = newId();
      setOwnData((current) => ({
        ...current,
        [key]: [...current[key], { ...entry, id }],
      }));
    },
    [],
  );

  const updateEntry = useCallback(
    <K extends DatasetKey>(key: K, id: string, patch: Partial<Entry<K>>) => {
      setOwnData((current) => ({
        ...current,
        [key]: current[key].map((row) =>
          row.id === id ? { ...row, ...patch } : row,
        ),
      }));
    },
    [],
  );

  const removeEntry = useCallback((key: DatasetKey, id: string) => {
    setOwnData((current) => ({
      ...current,
      [key]: current[key].filter((row) => row.id !== id),
    }));
  }, []);

  /** Bitta bo'limni butunlay tozalaydi, qolganlariga tegmaydi. */
  const clearDataset = useCallback((key: DatasetKey) => {
    setOwnData((current) => ({ ...current, [key]: [] }));
    setDemoDismissed(true);
  }, []);

  const replaceAll = useCallback((next: DashboardData) => {
    setOwnData(stripDemoRows(next));
    setDemoDismissed(true);
  }, []);

  const loadDemo = useCallback(() => setDemoDismissed(false), []);

  const clearAll = useCallback(() => {
    setOwnData(EMPTY_DATA);
    setDemoDismissed(true);
  }, []);

  const setRangeKey = useCallback((key: RangeKey) => setRangeKeyState(key), []);

  const range = useMemo(() => resolveRange(rangeKey, data), [rangeKey, data]);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      ownData,
      hydrated,
      isDemo,
      rangeKey,
      range,
      setRangeKey,
      addEntry,
      updateEntry,
      removeEntry,
      clearDataset,
      replaceAll,
      loadDemo,
      clearAll,
    }),
    [
      data,
      ownData,
      hydrated,
      isDemo,
      rangeKey,
      range,
      setRangeKey,
      addEntry,
      updateEntry,
      removeEntry,
      clearDataset,
      replaceAll,
      loadDemo,
      clearAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore faqat StoreProvider ichida ishlaydi");
  return context;
}
