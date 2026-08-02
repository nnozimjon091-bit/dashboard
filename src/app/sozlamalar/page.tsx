"use client";

import { useRef, useState } from "react";
import { Button, Card, cx, PageHeader, SectionTitle } from "@/components/ui";
import { longDate, num } from "@/lib/format";
import { exportCsv, exportJson, parseImported } from "@/lib/export";
import { allDates } from "@/lib/metrics";
import { countRows, useStore } from "@/lib/store";
import { useTheme, type ThemeChoice } from "@/lib/theme";
import type { DatasetKey } from "@/lib/types";

const DATASETS: { key: DatasetKey; label: string }[] = [
  { key: "social", label: "Ijtimoiy tarmoq" },
  { key: "ads", label: "Reklama" },
  { key: "video", label: "Video" },
  { key: "sales", label: "Sotuv" },
  { key: "outbound", label: "Chiquvchi operator" },
  { key: "catalogs", label: "Klinikalar katalogi" },
];

const THEME_OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: "light", label: "Yorug'" },
  { value: "dark", label: "Qorong'i" },
  { value: "system", label: "Tizim bo'yicha" },
];

export default function SettingsPage() {
  // Eksport ham, statistika ham faqat sizning yozuvlaringiz ustida ishlaydi —
  // demo ko'rinishi hech qachon faylga tushmaydi.
  const {
    ownData: data,
    isDemo,
    replaceAll,
    loadDemo,
    clearAll,
    clearDataset,
  } = useStore();
  const { choice, setChoice } = useTheme();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDataset, setConfirmDataset] = useState<DatasetKey | null>(null);

  const dates = allDates(data).sort();
  const total = countRows(data);

  const handleImport = async (file: File) => {
    const result = parseImported(await file.text());
    if (!result.ok || !result.data) {
      setMessage({ tone: "error", text: result.error ?? "Faylni o'qib bo'lmadi." });
      return;
    }
    replaceAll(result.data);
    setMessage({ tone: "ok", text: "Ma'lumotlar fayldan tiklandi." });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sozlamalar"
        description="Ko'rinish, zaxira nusxa va ma'lumotlarni boshqarish."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <SectionTitle
            title="Ko'rinish"
            hint="Tanlov shu brauzerda eslab qolinadi"
          />
          <div
            role="group"
            aria-label="Mavzu"
            className="flex flex-wrap gap-1"
          >
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={choice === option.value}
                onClick={() => setChoice(option.value)}
                className={cx(
                  "min-h-9 rounded-lg border border-line px-3 text-sm font-medium transition",
                  choice === option.value
                    ? "bg-accent-soft text-ink"
                    : "text-ink-2 hover:bg-surface-2",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Ma'lumot holati"
            hint={
              isDemo
                ? "Hozir demo ma'lumot ko'rsatilmoqda"
                : "Sizning ma'lumotlaringiz"
            }
          />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <Stat label="Jami yozuv" value={num(total)} />
            <Stat label="Ijtimoiy" value={num(data.social.length)} />
            <Stat label="Reklama" value={num(data.ads.length)} />
            <Stat label="Video" value={num(data.video.length)} />
            <Stat label="Sotuv" value={num(data.sales.length)} />
            <Stat
              label="Davr"
              value={
                dates.length
                  ? `${longDate(dates[0])} — ${longDate(dates[dates.length - 1])}`
                  : "—"
              }
            />
          </dl>
        </Card>

        <Card>
          <SectionTitle
            title="Zaxira nusxa"
            hint="Ma'lumot faqat shu brauzerda saqlanadi — vaqti-vaqti bilan nusxa oling"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => exportJson(data)}>
              JSON yuklab olish
            </Button>
            <Button onClick={() => fileInput.current?.click()}>
              JSON dan tiklash
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImport(file);
                event.target.value = "";
              }}
            />
          </div>
          <p className="mt-3 text-xs text-ink-3">
            Tiklashda mavjud ma'lumotlar fayldagisi bilan to'liq almashtiriladi.
          </p>
        </Card>

        <Card>
          <SectionTitle
            title="Excel uchun CSV"
            hint="Har bir bo'lim alohida fayl bo'lib yuklanadi"
          />
          <div className="flex flex-wrap gap-2">
            {DATASETS.map((dataset) => (
              <Button
                key={dataset.key}
                disabled={data[dataset.key].length === 0}
                onClick={() => exportCsv(data, dataset.key)}
              >
                {dataset.label}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle
          title="Ma'lumotlarni boshqarish"
          hint="Bu amallarni ortga qaytarib bo'lmaydi"
        />

        {/* Bo'lim bo'yicha tozalash — masalan tashqaridan tortilgan reklama
            yozuvlarini boshqa bo'limlarga tegmasdan olib tashlash uchun. */}
        <ul className="mb-4 divide-y divide-line border-y border-line">
          {DATASETS.map((dataset) => {
            const count = data[dataset.key].length;
            const confirming = confirmDataset === dataset.key;
            return (
              <li
                key={dataset.key}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2"
              >
                <span className="text-sm">{dataset.label}</span>
                <span className="tnum text-xs text-ink-3">
                  {num(count)} ta yozuv
                </span>
                <div className="ml-auto flex gap-1.5">
                  {confirming ? (
                    <>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          clearDataset(dataset.key);
                          setConfirmDataset(null);
                          setMessage({
                            tone: "ok",
                            text: `${dataset.label}: ${num(count)} ta yozuv o'chirildi.`,
                          });
                        }}
                      >
                        Ha, o'chir
                      </Button>
                      <Button size="sm" onClick={() => setConfirmDataset(null)}>
                        Bekor
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={count === 0}
                      onClick={() => setConfirmDataset(dataset.key)}
                    >
                      O'chirish
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center gap-2">
          {/* Demo — ko'rinish rejimi: o'z yozuvlaringiz bo'lsa, u ularni
              yashirib qo'ymasligi uchun tugma o'chirilgan turadi. */}
          <Button
            onClick={loadDemo}
            disabled={total > 0 || isDemo}
            title={
              total > 0
                ? "Avval o'z ma'lumotingizni o'chiring"
                : "Demo ko'rinishini qaytarish"
            }
          >
            Demo ko'rinishini qaytarish
          </Button>
          {confirmClear ? (
            <>
              <Button
                variant="danger"
                onClick={() => {
                  clearAll();
                  setConfirmClear(false);
                  setMessage({ tone: "ok", text: "Barcha yozuvlar o'chirildi." });
                }}
              >
                Ha, hammasini o'chir
              </Button>
              <Button onClick={() => setConfirmClear(false)}>Bekor qilish</Button>
            </>
          ) : (
            <Button variant="danger" onClick={() => setConfirmClear(true)}>
              Hamma ma'lumotni o'chirish
            </Button>
          )}
        </div>
        {confirmClear ? (
          <p className="mt-3 text-xs text-bad">
            {num(total)} ta yozuv butunlay o'chiriladi. Avval JSON nusxasini
            olib qo'ying.
          </p>
        ) : null}
      </Card>

      {message ? (
        <p
          role="status"
          className={cx(
            "text-sm",
            message.tone === "error" ? "text-bad" : "text-good",
          )}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}
