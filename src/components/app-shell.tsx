"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  IconAds,
  IconEntry,
  IconMoon,
  IconOverview,
  IconSales,
  IconSettings,
  IconSocial,
  IconSun,
  IconVideo,
} from "@/components/icons";
import { Button, cx } from "@/components/ui";
import { longDate } from "@/lib/format";
import { RANGE_OPTIONS, type RangeKey } from "@/lib/metrics";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";

interface NavItem {
  href: string;
  label: string;
  Icon: (props: { className?: string }) => React.JSX.Element;
  /** Sarlavhadagi davr filtri shu sahifadagi grafiklarga taalluqlimi. */
  scoped: boolean;
}

const NAV: NavItem[] = [
  { href: "/", label: "Umumiy ko'rinish", Icon: IconOverview, scoped: true },
  { href: "/ijtimoiy", label: "Ijtimoiy tarmoq", Icon: IconSocial, scoped: true },
  { href: "/reklama", label: "Reklama", Icon: IconAds, scoped: true },
  { href: "/video", label: "Video", Icon: IconVideo, scoped: true },
  { href: "/sotuv", label: "Sotuv va lidlar", Icon: IconSales, scoped: true },
  { href: "/kiritish", label: "Ma'lumot kiritish", Icon: IconEntry, scoped: false },
  { href: "/sozlamalar", label: "Sozlamalar", Icon: IconSettings, scoped: false },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { hydrated, isDemo, rangeKey, range, setRangeKey, clearAll } = useStore();
  const current = NAV.find((item) => item.href === pathname);
  const showFilter = current?.scoped ?? false;

  return (
    <div className="min-h-screen">
      <a
        href="#asosiy"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Asosiy qismga o'tish
      </a>

      <Sidebar pathname={pathname} />

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-line bg-plane/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
            <div className="mr-auto min-w-0">
              <p className="truncate text-sm font-semibold">
                {current?.label ?? "Marketing Dashboard"}
              </p>
              {showFilter ? (
                <p className="truncate text-xs text-ink-3">
                  {longDate(range.from)} — {longDate(range.to)}
                </p>
              ) : null}
            </div>
            {showFilter ? (
              <RangeFilter value={rangeKey} onChange={setRangeKey} />
            ) : null}
            <ThemeToggle />
          </div>
          <MobileNav pathname={pathname} />
        </header>

        <main id="asosiy" className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">
          {hydrated && isDemo ? <DemoBanner onClear={clearAll} /> : null}
          {hydrated ? children : <LoadingSkeleton />}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span
          aria-hidden="true"
          className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm font-bold text-white"
        >
          M
        </span>
        <span className="text-sm font-semibold leading-tight">
          Marketing
          <span className="block text-xs font-normal text-ink-3">Dashboard</span>
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 pb-4" aria-label="Asosiy menyu">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-accent-soft font-medium text-ink"
                  : "text-ink-2 hover:bg-surface-2 hover:text-ink",
              )}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </nav>
      <p className="px-5 pb-5 text-xs leading-relaxed text-ink-3">
        Ma'lumotlar shu brauzerda saqlanadi.
      </p>
    </aside>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="flex gap-1 overflow-x-auto border-t border-line px-3 py-2 lg:hidden"
      aria-label="Asosiy menyu"
    >
      {NAV.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition",
              active
                ? "bg-accent-soft font-medium text-ink"
                : "text-ink-2 hover:bg-surface-2",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Bitta filtr qatori — sahifadagi barcha grafiklar shu kesimga qayta chiziladi. */
function RangeFilter({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (key: RangeKey) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Davrni tanlash"
      className="flex overflow-hidden rounded-lg border border-line bg-surface"
    >
      {RANGE_OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cx(
              "min-h-9 border-r border-line px-2.5 text-xs font-medium transition last:border-r-0 sm:px-3",
              active
                ? "bg-accent-soft text-ink"
                : "text-ink-2 hover:bg-surface-2",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ThemeToggle() {
  const { mode, toggle } = useTheme();
  return (
    <Button
      onClick={toggle}
      aria-label={
        mode === "dark" ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"
      }
      title={mode === "dark" ? "Yorug' rejim" : "Qorong'i rejim"}
      size="icon"
    >
      {mode === "dark" ? <IconSun /> : <IconMoon />}
    </Button>
  );
}

function DemoBanner({ onClear }: { onClear: () => void }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3">
      <p className="mr-auto text-sm text-ink-2">
        <span className="font-medium text-ink">Demo ma'lumot ko'rsatilmoqda.</span>{" "}
        O'z raqamlaringizni kiritsangiz, u avtomatik almashadi.
      </p>
      <Link
        href="/kiritish"
        className="inline-flex min-h-9 items-center rounded-lg bg-accent px-3 text-sm font-medium text-white hover:opacity-90"
      >
        Ma'lumot kiritish
      </Link>
      <Button onClick={onClear}>Demoni tozalash</Button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-24 rounded-xl border border-line bg-surface" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="h-24 rounded-xl border border-line bg-surface"
          />
        ))}
      </div>
      <div className="h-72 rounded-xl border border-line bg-surface" />
    </div>
  );
}
