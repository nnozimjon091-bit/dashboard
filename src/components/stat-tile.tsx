"use client";

import { IconArrowDown, IconArrowUp } from "@/components/icons";
import { cx } from "@/components/ui";
import { pct } from "@/lib/format";

/**
 * Ba'zi ko'rsatkichlarda pasayish yaxshi (CPL, CPC, CAC), ba'zilarida esa
 * yo'nalishning o'zi yaxshi ham, yomon ham emas (masalan byudjet) — "neutral".
 */
export type GoodDirection = "up" | "down" | "neutral";

function DeltaBadge({
  value,
  goodWhen,
}: {
  value: number;
  goodWhen: GoodDirection;
}) {
  if (!Number.isFinite(value) || value === 0) {
    return <span className="text-xs text-ink-3">o'zgarishsiz</span>;
  }
  const rising = value > 0;
  const positive = rising === (goodWhen === "up");
  const Arrow = rising ? IconArrowUp : IconArrowDown;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        goodWhen === "neutral"
          ? "text-ink-2"
          : positive
            ? "text-good"
            : "text-bad",
      )}
    >
      {/* Yo'nalish faqat rang bilan emas, strelka bilan ham ko'rsatiladi */}
      <Arrow className="h-3.5 w-3.5 shrink-0" />
      {pct(Math.abs(value))}
    </span>
  );
}

export function StatTile({
  label,
  value,
  delta,
  goodWhen = "up",
  hint,
}: {
  label: string;
  value: string;
  delta?: number;
  goodWhen?: GoodDirection;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs text-ink-2">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold leading-tight">{value}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2">
        {delta === undefined ? null : (
          <DeltaBadge value={delta} goodWhen={goodWhen} />
        )}
        {hint ? <span className="text-xs text-ink-3">{hint}</span> : null}
      </div>
    </div>
  );
}

/** Sahifaning bosh raqami — har bir ko'rinishda faqat bittadan. */
export function HeroStat({
  label,
  value,
  delta,
  goodWhen = "up",
  caption,
  children,
}: {
  label: string;
  value: string;
  delta?: number;
  goodWhen?: GoodDirection;
  caption?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-line bg-surface p-5">
      <div>
        <p className="text-sm text-ink-2">{label}</p>
        <p className="mt-1 text-[44px] font-semibold leading-none sm:text-5xl">
          {value}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2">
          {delta === undefined ? null : (
            <DeltaBadge value={delta} goodWhen={goodWhen} />
          )}
          {caption ? (
            <span className="text-xs text-ink-3">{caption}</span>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}
