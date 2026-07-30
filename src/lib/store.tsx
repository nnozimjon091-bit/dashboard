"use client";

// Ma'lumot brauzerning localStorage'ida saqlanadi — server ham, login ham kerak emas.

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
  type AdEntry,
  type DashboardData,
  type DatasetKey,
} from "./types";
import { resolveRange, type Range, type RangeKey } from "./metrics";
import { buildDemoData } from "./seed";

const DATA_KEY = "marketing-dashboard:data:v1";
const DEMO_KEY = "marketing-dashboard:demo:v1";
const RANGE_KEY = "marketing-dashboard:range:v1";

type Entry<K extends DatasetKey> = DashboardData[K][number];

interface StoreValue {
  data: DashboardData;
  /** localStorage o'qib bo'lingunicha false — shu paytgacha skeleton ko'rsatiladi. */
  hydrated: boolean;
  /** Ekrandagi raqamlar haqiqiy emas, demo ma'lumot ekanini bildiradi. */
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
  /**
   * Meta Ads sinxronizatsiyasi uchun: sana + platforma + kampaniya bo'yicha
   * mavjud yozuv topilsa ustiga yoziladi, topilmasa qo'shiladi.
   */
  importAds: (entries: Omit<AdEntry, "id">[]) => { added: number; updated: number };
  replaceAll: (next: DashboardData, demo?: boolean) => void;
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

/** Nomalum yoki buzilgan JSON'ni xavfsiz o'qish. */
function readStored(): DashboardData | null {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DashboardData>;
    return {
      social: Array.isArray(parsed.social) ? parsed.social : [],
      ads: Array.isArray(parsed.ads) ? parsed.ads : [],
      video: Array.isArray(parsed.video) ? parsed.video : [],
      sales: Array.isArray(parsed.sales) ? parsed.sales : [],
    };
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [hydrated, setHydrated] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [rangeKey, setRangeKeyState] = useState<RangeKey>("30");

  // Birinchi render serverdagi natijaga mos bo'lishi shart, shuning uchun
  // localStorage faqat mount'dan keyin o'qiladi. Effekt bir marta ishlaydi —
  // qayta-qayta render zanjiri hosil bo'lmaydi.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setData(stored);
      setIsDemo(localStorage.getItem(DEMO_KEY) === "1");
    } else {
      // Birinchi tashrif: bo'sh ekran o'rniga demo ko'rsatiladi.
      setData(buildDemoData());
      setIsDemo(true);
      localStorage.setItem(DEMO_KEY, "1");
    }
    const storedRange = localStorage.getItem(RANGE_KEY) as RangeKey | null;
    if (storedRange) setRangeKeyState(storedRange);
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(RANGE_KEY, rangeKey);
  }, [rangeKey, hydrated]);

  /** Foydalanuvchi o'z ma'lumotini kiritgan zahoti demo belgisi olib tashlanadi. */
  const dropDemoFlag = useCallback(() => {
    setIsDemo((current) => {
      if (current) localStorage.setItem(DEMO_KEY, "0");
      return false;
    });
  }, []);

  const addEntry = useCallback(
    <K extends DatasetKey>(key: K, entry: Omit<Entry<K>, "id">) => {
      setData((current) => ({
        ...current,
        [key]: [...current[key], { ...entry, id: newId() }],
      }));
      dropDemoFlag();
    },
    [dropDemoFlag],
  );

  const updateEntry = useCallback(
    <K extends DatasetKey>(key: K, id: string, patch: Partial<Entry<K>>) => {
      setData((current) => ({
        ...current,
        [key]: current[key].map((row) =>
          row.id === id ? { ...row, ...patch } : row,
        ),
      }));
      dropDemoFlag();
    },
    [dropDemoFlag],
  );

  const removeEntry = useCallback(
    (key: DatasetKey, id: string) => {
      setData((current) => ({
        ...current,
        [key]: current[key].filter((row) => row.id !== id),
      }));
      dropDemoFlag();
    },
    [dropDemoFlag],
  );

  const importAds = useCallback(
    (entries: Omit<AdEntry, "id">[]) => {
      // Hisoblash setData ichida emas, joriy holat ustida bajariladi —
      // StrictMode updater'ni ikki marta chaqirsa ham son ikkilanmaydi.
      const next = [...data.ads];
      let added = 0;
      let updated = 0;

      entries.forEach((entry) => {
        const index = next.findIndex(
          (row) =>
            row.date === entry.date &&
            row.platform === entry.platform &&
            row.campaign === entry.campaign,
        );
        if (index >= 0) {
          next[index] = { ...next[index], ...entry };
          updated += 1;
        } else {
          next.push({ ...entry, id: newId() });
          added += 1;
        }
      });

      if (added > 0 || updated > 0) {
        setData((current) => ({ ...current, ads: next }));
        dropDemoFlag();
      }
      return { added, updated };
    },
    [data.ads, dropDemoFlag],
  );

  const replaceAll = useCallback((next: DashboardData, demo = false) => {
    setData(next);
    setIsDemo(demo);
    localStorage.setItem(DEMO_KEY, demo ? "1" : "0");
  }, []);

  const loadDemo = useCallback(() => {
    replaceAll(buildDemoData(), true);
  }, [replaceAll]);

  const clearAll = useCallback(() => {
    replaceAll(EMPTY_DATA, false);
  }, [replaceAll]);

  const setRangeKey = useCallback((key: RangeKey) => setRangeKeyState(key), []);

  const range = useMemo(() => resolveRange(rangeKey, data), [rangeKey, data]);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      hydrated,
      isDemo,
      rangeKey,
      range,
      setRangeKey,
      addEntry,
      updateEntry,
      removeEntry,
      importAds,
      replaceAll,
      loadDemo,
      clearAll,
    }),
    [
      data,
      hydrated,
      isDemo,
      rangeKey,
      range,
      setRangeKey,
      addEntry,
      updateEntry,
      removeEntry,
      importAds,
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
