"use client";

// Google Ads "Отчет о кампании" hisobotini yopishtirib yuklash.
// Hammasi brauzerda o'qiladi — serverga hech narsa yuborilmaydi.

import { useState } from "react";
import { Button, Card, SectionTitle } from "@/components/ui";
import { longDate, num, usd } from "@/lib/format";
import { parseGoogleAdsReport, type GoogleAdsParseResult } from "@/lib/google-ads";
import { useStore } from "@/lib/store";

interface Outcome {
  added: number;
  updated: number;
  parsed: GoogleAdsParseResult;
}

export function GoogleAdsImport() {
  const { importAds } = useStore();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const load = () => {
    setError(null);
    setOutcome(null);
    if (!text.trim()) {
      setError("Avval hisobotni yopishtiring.");
      return;
    }
    const parsed = parseGoogleAdsReport(text);
    if (parsed.entries.length === 0) {
      setError(parsed.warnings[0] ?? "Hisobotdan kampaniya topilmadi.");
      return;
    }
    const counts = importAds(parsed.entries);
    setOutcome({ ...counts, parsed });
    setText("");
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle
          title="Hisobotni yuklash"
          hint="Google Ads → Kampaniyalar → jadvalni nusxalab shu yerga yopishtiring"
        />
        <Button onClick={() => setOpen((value) => !value)}>
          {open ? "Yopish" : "Hisobot yuklash"}
        </Button>
      </div>

      {open ? (
        <div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={6}
            placeholder={
              "Отчет о кампании\n30 июля 2026 г. - 30 июля 2026 г.\nСтатус кампании\tКампания\t…\tПоказы\tВзаимодействия\t…\tРасходы\nВключено\tСтоматология conv\t…\t239\t26\t…\t10,5"
            }
            className="w-full rounded-lg border border-line bg-surface p-3 font-mono text-xs text-ink focus:outline-2 focus:outline-accent"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={load}>
              Qo'shish
            </Button>
            <span className="text-xs text-ink-3">
              Sarlavha qatori va ustidagi sana qatori ham kerak. Bir hisobotni
              ikki marta yuklasangiz takror yig'ilmaydi.
            </span>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="status" className="mt-3 text-sm text-bad">
          {error}
        </p>
      ) : null}

      {outcome ? <Result outcome={outcome} /> : null}
    </Card>
  );
}

function Result({ outcome }: { outcome: Outcome }) {
  const { added, updated, parsed } = outcome;
  const spend = parsed.entries.reduce((total, row) => total + row.spend, 0);
  const clicks = parsed.entries.reduce((total, row) => total + row.clicks, 0);

  return (
    <div className="mt-3 space-y-2">
      <p role="status" className="text-sm text-good">
        {num(added)} ta yangi yozuv qo'shildi, {num(updated)} tasi yangilandi.
      </p>
      <p className="text-xs text-ink-3">
        {parsed.campaigns.length} ta kampaniya · {usd(spend, 2)} xarajat ·{" "}
        {num(clicks)} klik
        {parsed.range
          ? ` · ${longDate(parsed.range.from)}${
              parsed.range.from === parsed.range.to
                ? ""
                : ` — ${longDate(parsed.range.to)}`
            }`
          : ""}
      </p>
      {parsed.warnings.map((warning) => (
        <p key={warning} className="text-xs text-ink-2">
          ⚠ {warning}
        </p>
      ))}
    </div>
  );
}
