"use client";

// Meta Ads sinxronizatsiyasi. Token brauzerga umuman kelmaydi — bu komponent
// faqat o'z serverimizdagi /api/meta/* ga murojaat qiladi.

import { useEffect, useState } from "react";
import { Button, Card, cx, Field, Input, SectionTitle } from "@/components/ui";
import { longDate, num } from "@/lib/format";
import { useStore } from "@/lib/store";

const PASSWORD_KEY = "marketing-dashboard:meta-password";

interface MetaStatus {
  configured: boolean;
  account: string | null;
  apiVersion: string | null;
  leadActions: string[];
  passwordRequired: boolean;
}

interface ActionSummary {
  type: string;
  total: number;
}

interface SyncResult {
  added: number;
  updated: number;
  availableActions: ActionSummary[];
  leadActions: string[];
}

export function MetaSync() {
  const { range, importAds } = useStore();
  const [status, setStatus] = useState<MetaStatus | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetch("/api/meta/status")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: MetaStatus) => {
        setStatus(data);
        // Saqlangan parol faqat u haqiqatan kerak bo'lganda o'qiladi.
        if (data.passwordRequired) {
          setPassword(sessionStorage.getItem(PASSWORD_KEY) ?? "");
        }
      })
      .catch(() => setUnavailable(true));
  }, []);

  const sync = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/meta/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(password ? { "x-dashboard-password": password } : {}),
        },
        body: JSON.stringify({ since: range.from, until: range.to }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.error ?? "Sinxronizatsiya bajarilmadi.");
        return;
      }
      if (password) sessionStorage.setItem(PASSWORD_KEY, password);
      const counts = importAds(payload.entries ?? []);
      setResult({
        ...counts,
        availableActions: payload.availableActions ?? [],
        leadActions: payload.leadActions ?? [],
      });
    } catch {
      setError("Serverga ulanib bo'lmadi.");
    } finally {
      setBusy(false);
    }
  };

  // Server qismi yo'q (masalan statik hosting) — kartani umuman ko'rsatmaymiz.
  if (unavailable || status === null) return null;

  if (!status.configured) {
    return (
      <Card>
        <SectionTitle
          title="Meta Ads ulanmagan"
          hint="Ulansa, kunlik xarajat, klik va lidlar avtomatik tortiladi"
        />
        <p className="text-sm text-ink-2">
          Vercel'da (yoki lokal <code className="text-ink">.env.local</code>{" "}
          faylida) quyidagi ikkita o'zgaruvchini o'rnating:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-ink-2">
          <li>
            <code className="text-ink">META_ACCESS_TOKEN</code> — Business
            Manager'dagi System User tokeni (<code>ads_read</code> ruxsati bilan)
          </li>
          <li>
            <code className="text-ink">META_AD_ACCOUNT_ID</code> — reklama
            hisobi raqami, masalan <code>act_1234567890</code>
          </li>
        </ul>
        <p className="mt-3 text-xs text-ink-3">
          To'liq qo'llanma README faylining "Meta Ads integratsiyasi" bo'limida.
          Token faqat serverda o'qiladi va brauzerga hech qachon yuborilmaydi.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle
        title="Meta Ads sinxronizatsiyasi"
        hint={`${status.account} · lid sifatida: ${status.leadActions.join(", ")}`}
      />

      <div className="flex flex-wrap items-end gap-3">
        {status.passwordRequired ? (
          <div className="w-full max-w-[220px]">
            <Field label="Parol">
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••"
              />
            </Field>
          </div>
        ) : null}
        <Button variant="primary" onClick={sync} disabled={busy}>
          {busy ? "Tortilmoqda…" : "Meta'dan tortish"}
        </Button>
        <p className="text-xs text-ink-3">
          Davr: {longDate(range.from)} — {longDate(range.to)} (yuqoridagi filtr
          bo'yicha)
        </p>
      </div>

      {error ? (
        <p role="status" className="mt-3 text-sm text-bad">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-3">
          <p role="status" className="text-sm text-good">
            Tayyor: {num(result.added)} ta yangi yozuv qo'shildi,{" "}
            {num(result.updated)} tasi yangilandi.
          </p>
          {result.availableActions.length > 0 ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-ink-3">
                Meta qaytargan action turlari ({result.availableActions.length})
                — lid sozlamasini to'g'rilash uchun
              </summary>
              <ul className="mt-2 space-y-0.5">
                {result.availableActions.map((action) => (
                  <li
                    key={action.type}
                    className={cx(
                      "flex justify-between gap-4 text-xs",
                      result.leadActions.includes(action.type)
                        ? "font-medium text-ink"
                        : "text-ink-2",
                    )}
                  >
                    <code>{action.type}</code>
                    <span className="tnum">{num(action.total)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-3">
                Kerakli turni <code>META_LEAD_ACTIONS</code> o'zgaruvchisiga
                vergul bilan yozing (masalan{" "}
                <code>onsite_conversion.messaging_conversation_started_7d</code>{" "}
                — Messenger'ga yo'naltiruvchi kampaniyalar uchun).
              </p>
            </details>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
