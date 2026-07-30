"use client";

// Yorug'/qorong'i rejim. Tanlov <html data-theme="..."> ga yoziladi —
// CSS ham, grafik ranglari ham shu bitta manbadan oziqlanadi.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { tokensFor, type ChartTokens } from "./palette";
import { THEME_KEY } from "./theme-script";

export type ThemeChoice = "light" | "dark" | "system";
export type ThemeMode = "light" | "dark";

interface ThemeValue {
  choice: ThemeChoice;
  mode: ThemeMode;
  tokens: ChartTokens;
  setChoice: (choice: ThemeChoice) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

function systemMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>("system");
  const [mode, setMode] = useState<ThemeMode>("light");

  // Saqlangan tanlov mount'dan keyin o'qiladi — birinchi render serverdagi
  // natijaga mos bo'lib qolishi uchun. Ekran chaqnamaydi, chunki <html> ga
  // to'g'ri tema THEME_BOOTSTRAP skripti orqali allaqachon yozilgan.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as ThemeChoice | null;
    const next = stored ?? "system";
    setChoiceState(next);
    setMode(next === "system" ? systemMode() : next);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  // "Tizim" tanlangan bo'lsa, OS sozlamasi o'zgarishini kuzatib boramiz.
  useEffect(() => {
    if (choice !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setMode(query.matches ? "dark" : "light");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [choice]);

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next);
    setMode(next === "system" ? systemMode() : next);
    localStorage.setItem(THEME_KEY, next);
  }, []);

  const toggle = useCallback(() => {
    setChoice(mode === "dark" ? "light" : "dark");
  }, [mode, setChoice]);

  const value = useMemo<ThemeValue>(
    () => ({ choice, mode, tokens: tokensFor(mode), setChoice, toggle }),
    [choice, mode, setChoice, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme faqat ThemeProvider ichida ishlaydi");
  return context;
}

/** Grafiklar uchun joriy rejim ranglari. */
export function useChartTokens(): ChartTokens {
  return useTheme().tokens;
}
