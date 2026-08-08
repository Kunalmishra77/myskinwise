"use client";

import * as React from "react";
import type { ReviewScan } from "@/lib/expert/reviews";
import { CONCERN_META } from "@/lib/skin/concern-content";

const OPTIONS: { key: "accurate" | "partial" | "wrong"; label: string; tone: string }[] = [
  { key: "accurate", label: "Accurate", tone: "bg-sage/40 text-ink" },
  { key: "partial", label: "Partial", tone: "bg-champagne text-ink" },
  { key: "wrong", label: "Wrong", tone: "bg-rose-ink text-white" },
];

/**
 * One scan for the dermatologist to review: the photo, the engine's scores, and
 * an accurate/partial/wrong control per concern. Saving stores the verdict.
 */
export function ReviewCard({ scan }: { scan: ReviewScan }) {
  const [verdict, setVerdict] = React.useState<Record<string, string>>(scan.verdict ?? {});
  const [saved, setSaved] = React.useState(Boolean(scan.verdict));
  const [busy, setBusy] = React.useState(false);

  async function save() {
    setBusy(true);
    const res = await fetch("/api/v1/admin/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: scan.id, verdict }),
    }).catch(() => null);
    setBusy(false);
    setSaved(res?.ok === true);
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-surface p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        {scan.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed private-bucket URL
          <img src={scan.photoUrl} alt="Scan" className="h-48 w-40 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="flex h-48 w-40 shrink-0 items-center justify-center rounded-xl bg-ink/5 text-xs text-ink-soft">
            No photo
          </div>
        )}

        <div className="flex-1">
          <p className="text-xs text-ink-soft">
            {scan.reference} · {new Date(scan.createdAt).toLocaleString("en-IN")}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {scan.concerns.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink">
                  {CONCERN_META[c.id]?.label ?? c.id}
                  <span className="ml-2 text-xs text-ink-soft">{c.score}/100 · {c.severity}</span>
                </span>
                <span className="flex gap-1">
                  {OPTIONS.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => {
                        setVerdict((v) => ({ ...v, [c.id]: o.key }));
                        setSaved(false);
                      }}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                        verdict[c.id] === o.key ? o.tone : "bg-ink/5 text-ink-soft hover:bg-ink/10"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={busy || Object.keys(verdict).length === 0}
              className="rounded-full bg-rose-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Saving…" : "Save review"}
            </button>
            {saved && <span className="text-xs font-semibold text-sage">Saved ✓</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
