"use client";

// Targetolog jadvalidan reklama yozuvlarini olib kirish.
//
// Ikki yo'l bor va ikkalasi ham bitta parserdan foydalanadi:
//   1) Havoladan — server publish qilingan CSV'ni o'qiydi (sozlash kerak).
//   2) Yopishtirish — jadvaldan nusxa olib qo'yasiz, hech qanday sozlash yo'q.

import { useEffect, useState } from "react";
import { Button, Card, SectionTitle } from "@/components/ui";
import { num } from "@/lib/format";
import { parseAdsSheet, type SheetParseResult } from "@/lib/sheet";
import { useStore } from "@/lib/store";
import { longDate } from "@/lib/format";

const PASSWORD_KEY = "marketing-dashboard:sheets-password";

interface SheetStatus {
  configured: boolean;
  passwordRequired: boolean;
}

interface Outcome {
  added: number;
  updated: number;
  parsed: SheetParseResult;
}

export function SheetSync() {
  const { importAds } = useStore();
  const [status, setStatus] = useState<SheetStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [password, setPassword] = useState("");
  const [pasted, setPasted] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);

  useEffect(() => {
    fetch("/api/sheets")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: SheetStatus) => {
        setStatus(data);
        if (data.passwordRequired) {
          setPassword(sessionStorage.getItem(PASSWORD_KEY) ?? "");
        }
      })
      .catch(() => setStatus({ configured: false, passwordRequired: false }));
  }, []);

  const apply = (parsed: SheetParseResult) => {
    const counts = importAds(parsed.entries);
    setOutcome({ ...counts, parsed });
  };

  const fromLink = async () => {
    setBusy(true);
    setError(null);
    setOutcome(null);
    try {
      const response = await fetch("/api/sheets", {
        method: "POST",
        headers: password ? { "x-dashboard-password": password } : undefined,
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.error ?? "Jadvalni o'qib bo'lmadi.");
        return;
      }
      if (password) sessionStorage.setItem(PASSWORD_KEY, password);
      apply(payload as SheetParseResult);
    } catch {
      setError("Serverga ulanib bo'lmadi.");
    } finally {
      setBusy(false);
    }
  };

  // Yopishtirish yo'li serverga umuman murojaat qilmaydi.
  const fromPaste = () => {
    setError(null);
    setOutcome(null);
    if (!pasted.trim()) {
      setError("Avval jadvalni yopishtiring.");
      return;
    }
    const parsed = parseAdsSheet(pasted);
    if (parsed.entries.length === 0) {
      setError(parsed.warnings[0] ?? "Jadvaldan yozuv topilmadi.");
      return;
    }
    apply(parsed);
    setPasted("");
  };

  if (status === null) return null;

  return (
    <Card>
      <SectionTitle
        title="Jadvaldan olish"
        hint="Targetolog to'ldiradigan Google Sheets'dan kunlik sarf va lidlar"
      />

      <div className="flex flex-wrap items-end gap-3">
        {status.configured ? (
          <>
            {status.passwordRequired ? (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-2">
                  Parol
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-9 w-[180px] rounded-lg border border-line bg-surface px-3 text-sm focus:outline-2 focus:outline-accent"
                />
              </label>
            ) : null}
            <Button variant="primary" onClick={fromLink} disabled={busy}>
              {busy ? "Olinmoqda…" : "Havoladan olish"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-ink-2">
            Avtomatik olish uchun <code className="text-ink">SHEETS_CSV_URL</code>{" "}
            o'zgaruvchisini o'rnating. Hozircha jadvalni qo'lda yopishtirsangiz
            ham bo'ladi.
          </p>
        )}
        <Button onClick={() => setPasteOpen((open) => !open)}>
          {pasteOpen ? "Yopishtirishni yopish" : "Yopishtirib olish"}
        </Button>
      </div>

      {pasteOpen ? (
        <div className="mt-3">
          <textarea
            value={pasted}
            onChange={(event) => setPasted(event.target.value)}
            rows={5}
            placeholder="Jadvalni oching → Ctrl+A → Ctrl+C → shu yerga Ctrl+V"
            className="w-full rounded-lg border border-line bg-surface p-3 font-mono text-xs text-ink focus:outline-2 focus:outline-accent"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={fromPaste}>
              Yopishtirilgandan olish
            </Button>
            <span className="text-xs text-ink-3">
              Bu yo'l serverga hech narsa yubormaydi — hammasi brauzerda.
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
  return (
    <div className="mt-3 space-y-2">
      <p role="status" className="text-sm text-good">
        Tayyor: {num(added)} ta yangi yozuv qo'shildi, {num(updated)} tasi
        yangilandi.
      </p>
      <p className="text-xs text-ink-3">
        {parsed.campaigns.length} ta soha
        {parsed.range
          ? ` · ${longDate(parsed.range.from)} — ${longDate(parsed.range.to)}`
          : ""}
        {" · "}
        {parsed.campaigns.join(", ")}
      </p>
      {parsed.warnings.length > 0 ? (
        <ul className="space-y-0.5">
          {parsed.warnings.map((warning) => (
            <li key={warning} className="text-xs text-ink-2">
              ⚠ {warning}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-xs text-ink-3">
        Jadvalda ko'rsatish va klik yo'q, shuning uchun CTR, CPC va CPM
        hisoblanmaydi. CPL sarf ÷ lid formulasi bilan qayta hisoblanadi —
        jadvaldagidan bir necha sentga farq qilishi mumkin.
      </p>
    </div>
  );
}
