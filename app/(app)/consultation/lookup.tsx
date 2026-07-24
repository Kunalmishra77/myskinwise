"use client";

import * as React from "react";
import type { CustomerConsultationView } from "@/lib/consultation/customer";
import { RegimenProduct } from "@/components/features/regimen-product";

const STATUS_COPY: Record<string, { label: string; body: string }> = {
  requested: {
    label: "Request received",
    body: "Our team has your request and will message you on WhatsApp to arrange a time. A time is not booked yet.",
  },
  scheduled: {
    label: "Time being arranged",
    body: "We're confirming your consultation time with you on WhatsApp.",
  },
  in_review: {
    label: "With your expert",
    body: "A Skinwise expert is reviewing your Skin Check.",
  },
  reviewed: {
    label: "Reviewed",
    body: "Your expert has reviewed your skin and is preparing your routine.",
  },
  regimen_created: {
    label: "Your routine is ready",
    body: "Your personalised routine is below.",
  },
  completed: { label: "Completed", body: "This consultation is complete." },
  cancelled: { label: "Cancelled", body: "This consultation was cancelled." },
};

export function ConsultationLookup() {
  const [reference, setReference] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [view, setView] = React.useState<CustomerConsultationView | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setView(null);
    const res = await fetch("/api/v1/consultations/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reference: reference.trim().toUpperCase(), phone }),
    });
    setBusy(false);
    if (res.ok) {
      setView((await res.json()).consultation);
    } else if (res.status === 404) {
      setError("We couldn't find that reference for this number.");
    } else {
      setError("Please check the reference and number and try again.");
    }
  }

  if (view) {
    const copy = STATUS_COPY[view.status] ?? { label: view.status, body: "" };
    return (
      <div className="mt-8">
        <div className="rounded-3xl bg-surface p-6 shadow-soft">
          <span className="eyebrow">{view.reference}</span>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{copy.label}</h2>
          <p className="mt-2 text-ink-soft">{copy.body}</p>
        </div>

        {view.regimen && (
          <div className="mt-6 rounded-3xl bg-blush p-6">
            <h2 className="font-display text-2xl font-semibold text-ink">Your routine</h2>
            {view.regimen.durationDays && (
              <p className="mt-1 text-sm text-ink-soft">{view.regimen.durationDays}-day plan</p>
            )}
            {view.regimen.summary && <p className="mt-3 text-ink">{view.regimen.summary}</p>}

            <ol className="mt-5 flex flex-col gap-3">
              {view.regimen.items.map((item, i) => (
                <li key={i} className="rounded-2xl bg-surface p-4">
                  <span className="rounded-full bg-blush px-2.5 py-1 text-xs font-semibold uppercase text-rose-ink">
                    {item.timeOfDay === "both" ? "AM + PM" : item.timeOfDay.toUpperCase()}
                  </span>
                  {/*
                    Shows the actual bottle when the expert's reference names a
                    catalogue product, and falls back to plain text when it
                    doesn't — experts compound to order, so not every reference
                    is a catalogue item.
                  */}
                  <div className="mt-2">
                    <RegimenProduct formulationRef={item.formulationRef} />
                  </div>
                  {item.instructions && <p className="mt-1 text-sm text-ink-soft">{item.instructions}</p>}
                  {item.frequency && <p className="mt-0.5 text-sm text-ink-soft">{item.frequency}</p>}
                </li>
              ))}
            </ol>

            {view.regimen.followUp && (
              <p className="mt-4 rounded-2xl bg-surface p-4 text-sm text-ink-soft">{view.regimen.followUp}</p>
            )}
            <p className="mt-4 text-xs text-ink-soft">
              This routine was prepared by a Skinwise expert. It is guidance, not a medical diagnosis.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
      <div>
        <label htmlFor="ref" className="text-sm font-semibold text-ink">
          Reference
        </label>
        <input
          id="ref"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="SW-XXXXXXXX"
          className="mt-1 w-full rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
        />
      </div>
      <div>
        <label htmlFor="ph" className="text-sm font-semibold text-ink">
          Mobile number
        </label>
        <input
          id="ph"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-ink"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-rose-ink">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !reference || !phone}
        className="rounded-full bg-rose-ink px-6 py-3.5 font-body font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Checking…" : "Check my consultation"}
      </button>
    </form>
  );
}
