"use client";

import * as React from "react";
import { ScanFace } from "lucide-react";
import { SCANNER } from "@/content/i18n/scanner";
import { useTContent } from "@/lib/i18n/use-content";
import { T } from "@/components/i18n/t";
import { Button } from "@/components/ui/button";
import { patchSession } from "@/lib/consultation/session";

/**
 * A small, informative gate shown ONCE before the first face scan of a session
 * — for both the direct website scan and the voice → scan handoff, since both
 * land on the analyzer. It collects a name + mobile number so the scan becomes
 * a real lead the Skinwise team can follow up on, then unlocks the scan. A
 * returning scanner in the same session (leadId already stored) skips it.
 */
export function LeadGate({ onDone }: { onDone: () => void }) {
  const tc = useTContent();
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Light client check; the server normalises + validates authoritatively.
  const phoneOk = /^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").replace(/^(91|0)/, ""));
  const canSubmit = name.trim().length > 0 && phoneOk && consent && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError(tc(SCANNER.leadBadName));
    if (!phoneOk) return setError(tc(SCANNER.leadBadMobile));
    setBusy(true);
    try {
      const res = await fetch("/api/v1/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 201 && data?.leadId) {
        patchSession({ leadId: data.leadId, leadName: name.trim() });
        onDone();
      } else {
        setError(tc(data?.message ?? SCANNER.leadFailed));
      }
    } catch {
      setError(tc(SCANNER.leadFailed));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="flex size-12 items-center justify-center rounded-2xl bg-blush text-rose-ink">
        <ScanFace aria-hidden="true" className="size-6" />
      </span>
      <h1 className="mt-4 font-display text-3xl font-semibold text-ink"><T>{SCANNER.leadTitle}</T></h1>
      <p className="mt-2 text-sm text-ink-soft"><T>{SCANNER.leadBody}</T></p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink"><T>{SCANNER.leadName}</T></span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tc(SCANNER.leadNamePlaceholder)}
            autoComplete="name"
            className="rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink"><T>{SCANNER.leadMobile}</T></span>
          <div className="flex items-center rounded-2xl border border-ink/15 bg-surface focus-within:ring-2 focus-within:ring-rose-ink">
            <span className="pl-4 pr-2 text-ink-soft">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
              placeholder={tc(SCANNER.leadMobilePlaceholder)}
              autoComplete="tel"
              className="w-full rounded-r-2xl bg-transparent py-3 pr-4 text-ink focus-visible:outline-none"
            />
          </div>
        </label>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 size-5 shrink-0 accent-[#b74a68]"
          />
          <span className="text-xs text-ink-soft"><T>{SCANNER.leadConsent}</T></span>
        </label>

        {error && <p role="alert" className="text-sm text-rose-ink">{error}</p>}

        <Button type="submit" size="lg" disabled={!canSubmit}>
          <T>{busy ? SCANNER.leadSaving : SCANNER.leadCta}</T>
        </Button>
      </form>
    </div>
  );
}
