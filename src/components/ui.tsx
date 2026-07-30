"use client";

import type { ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

// ── Karta va sarlavhalar ──────────────────────────────────────────────

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-xl border border-line bg-surface p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-ink-2">{description}</p>
        ) : null}
      </div>
      {actions}
    </header>
  );
}

export function SectionTitle({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      {hint ? <p className="mt-0.5 text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
}

// ── Boshqaruv elementlari ─────────────────────────────────────────────

type ButtonVariant = "primary" | "ghost" | "danger";
/**
 * O'lcham className orqali emas, alohida prop bilan beriladi: Tailwind'da
 * bir xil xususiyatning ikki klassi to'qnashsa, qaysi biri g'olib bo'lishini
 * atribut tartibi emas, CSS tartibi hal qiladi.
 */
type ButtonSize = "md" | "sm" | "icon" | "iconSm";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:opacity-90",
  ghost: "border border-line bg-surface text-ink hover:bg-surface-2",
  danger: "border border-line text-bad hover:bg-surface-2",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  md: "min-h-9 px-3 text-sm",
  sm: "min-h-8 px-2.5 text-xs",
  icon: "h-9 w-9 text-sm",
  iconSm: "h-8 w-8 text-xs",
};

export function Button({
  variant = "ghost",
  size = "md",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        SIZE_STYLES[size],
        BUTTON_STYLES[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-2">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ink-3">{hint}</span> : null}
    </label>
  );
}

const CONTROL =
  "w-full min-h-9 rounded-lg border border-line bg-surface px-3 text-sm text-ink " +
  "focus:outline-2 focus:outline-offset-0 focus:outline-accent";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(CONTROL, "tnum", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(CONTROL, "pr-8", className)} {...props}>
      {children}
    </select>
  );
}

// ── Bo'sh holat ───────────────────────────────────────────────────────

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line px-6 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-ink-2">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

// ── Jadval ────────────────────────────────────────────────────────────

export interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyText = "Ma'lumot yo'q",
  maxHeight,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyText?: string;
  maxHeight?: string;
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-3">{emptyText}</p>;
  }
  return (
    <div className="overflow-x-auto" style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}>
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cx(
                  "whitespace-nowrap px-3 py-2 text-xs font-medium text-ink-3",
                  column.align === "right" ? "text-right" : "text-left",
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={rowKey(row, index)}
              className="border-b border-line last:border-0"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cx(
                    "whitespace-nowrap px-3 py-2",
                    column.align === "right" ? "text-right tnum" : "text-left",
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
