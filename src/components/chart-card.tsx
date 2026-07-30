"use client";

import { useState, type ReactNode } from "react";
import { IconChart, IconTable } from "@/components/icons";
import { cx, DataTable, type Column } from "@/components/ui";

export interface LegendItem {
  name: string;
  color: string;
}

/**
 * Har bir grafikning jadval ko'rinishi bor — rang orqali uzatilgan
 * ma'lumot doim matn ko'rinishida ham o'qib olinadi.
 */
export function ChartCard<T>({
  title,
  subtitle,
  legend,
  table,
  children,
}: {
  title: string;
  subtitle?: string;
  legend?: LegendItem[];
  table: {
    columns: Column<T>[];
    rows: T[];
    rowKey: (row: T, index: number) => string;
  };
  children: ReactNode;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>
          ) : null}
        </div>
        <div
          role="group"
          aria-label="Ko'rinish turi"
          className="flex overflow-hidden rounded-lg border border-line"
        >
          <ViewButton
            active={view === "chart"}
            onClick={() => setView("chart")}
            label="Grafik"
          >
            <IconChart className="h-4 w-4" />
          </ViewButton>
          <ViewButton
            active={view === "table"}
            onClick={() => setView("table")}
            label="Jadval"
          >
            <IconTable className="h-4 w-4" />
          </ViewButton>
        </div>
      </header>

      {/* Legenda ikki va undan ortiq seriyada doim ko'rinadi */}
      {legend && legend.length > 1 ? (
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
          {legend.map((item) => (
            <li
              key={item.name}
              className="flex items-center gap-1.5 text-xs text-ink-2"
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full"
                style={{ background: item.color }}
              />
              {item.name}
            </li>
          ))}
        </ul>
      ) : null}

      {view === "chart" ? (
        children
      ) : (
        <DataTable
          columns={table.columns}
          rows={table.rows}
          rowKey={table.rowKey}
          maxHeight="320px"
        />
      )}
    </section>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={cx(
        "inline-flex min-h-8 items-center gap-1.5 border-r border-line px-2.5 text-xs font-medium transition last:border-r-0",
        active ? "bg-accent-soft text-ink" : "text-ink-2 hover:bg-surface-2",
      )}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
