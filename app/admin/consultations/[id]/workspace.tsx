"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ConsultationDetail } from "@/lib/expert/storage";
import { FEATURE_LABELS, CERTAINTY_LABELS } from "@/lib/ai/vision-schema";

const EXPERT_ID_HINT = "Select from experts table"; // single seeded expert for now

async function action(body: object): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch("/api/v1/admin/actions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

type Item = { timeOfDay: "am" | "pm" | "both"; formulationRef: string; instructions: string; frequency: string };

/**
 * The expert's working surface for one consultation. Every mutation posts to
 * the single authenticated /api/v1/admin/actions endpoint and refreshes the
 * server component, so the page always reflects real persisted state rather
 * than optimistic local guesses.
 *
 * The AI/rules outline (regimen_recommendations) informs the expert but is
 * never pre-filled into the verdict field — the verdict is typed by a human,
 * which is the whole point of the separation.
 */
export function Workspace({ detail }: { detail: ConsultationDetail }) {
  const router = useRouter();
  const [expertId, setExpertId] = React.useState(detail.review?.expertId ?? detail.assigned_expert ?? "");
  const [verdict, setVerdict] = React.useState(detail.review?.verdict ?? "");
  const [notes, setNotes] = React.useState(detail.review?.notes ?? "");
  const [summary, setSummary] = React.useState(detail.regimen?.customerSummary ?? "");
  const [followUp, setFollowUp] = React.useState(detail.regimen?.followUp ?? "");
  const [duration, setDuration] = React.useState<number | "">(detail.regimen?.durationDays ?? "");
  const [items, setItems] = React.useState<Item[]>(
    detail.regimen?.items.map((i) => ({
      timeOfDay: i.timeOfDay as Item["timeOfDay"],
      formulationRef: i.formulationRef,
      instructions: i.instructions ?? "",
      frequency: i.frequency ?? "",
    })) ?? [{ timeOfDay: "am", formulationRef: "", instructions: "", frequency: "" }],
  );
  const [msg, setMsg] = React.useState<string | null>(null);
  const refresh = () => router.refresh();

  async function saveReview() {
    if (!expertId) return setMsg("Enter the expert id first.");
    if (!verdict.trim()) return setMsg("A verdict is required.");
    const { ok } = await action({
      type: "review",
      consultationId: detail.id,
      assessmentId: detail.assessmentId,
      expertId,
      verdict,
      notes: notes || undefined,
    });
    setMsg(ok ? "Review saved." : "Could not save review.");
    if (ok) refresh();
  }

  async function saveRegimen() {
    const clean = items.filter((i) => i.formulationRef.trim());
    if (!clean.length) return setMsg("Add at least one regimen item.");
    const { ok, data } = await action({
      type: "regimen",
      consultationId: detail.id,
      assessmentId: detail.assessmentId,
      expertId,
      durationDays: duration || undefined,
      customerSummary: summary || undefined,
      followUp: followUp || undefined,
      items: clean.map((i) => ({
        timeOfDay: i.timeOfDay,
        formulationRef: i.formulationRef,
        instructions: i.instructions || undefined,
        frequency: i.frequency || undefined,
      })),
    });
    setMsg(ok ? "Regimen saved as draft." : data.status === "failed" ? "Save a review before creating a regimen." : "Could not save regimen.");
    if (ok) refresh();
  }

  async function publish() {
    if (!detail.regimen) return;
    const { ok } = await action({ type: "publishRegimen", regimenId: detail.regimen.id, consultationId: detail.id, expertId });
    setMsg(ok ? "Regimen published — the customer can now see it." : "Could not publish.");
    if (ok) refresh();
  }

  async function makeOrder() {
    if (!detail.regimen) return;
    const { ok } = await action({ type: "createOrder", consultationId: detail.id, regimenId: detail.regimen.id, expertId });
    setMsg(ok ? "Order created." : "Could not create order.");
    if (ok) refresh();
  }

  const setItem = (idx: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-semibold text-ink">{detail.reference}</h1>
        <span className="rounded-full bg-blush px-3 py-1 text-xs font-semibold text-rose-ink">
          {detail.status.replace("_", " ")}
        </span>
      </div>
      <p className="mt-1 text-ink-soft">
        {detail.lead_name} · {detail.leadPhone}
        {detail.leadEmail ? ` · ${detail.leadEmail}` : ""} · prefers {detail.preferred_time ?? "any time"}
      </p>

      {msg && (
        <p role="status" className="mt-4 rounded-2xl bg-blush p-3 text-sm text-ink">
          {msg}
        </p>
      )}

      {/* AI Skin Analyzer — INPUT to the expert's review, never a verdict.
          Photos load through an authorised admin endpoint that redirects to a
          short-lived signed URL, so no storage path or URL is in this page. */}
      {detail.analysis && (
        <section className="mt-8 rounded-3xl border-2 border-dashed border-rose-ink/20 p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-semibold text-ink">AI photo observations</h2>
            <span className="text-xs text-ink-soft">
              {detail.analysis.modelVersion ?? "AI"} · {new Date(detail.analysis.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            AI-assisted, non-diagnostic. This is input for your review — not a diagnosis and not your
            verdict.
          </p>

          {detail.analysis.imageIds.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {detail.analysis.imageIds.map((imgId) => (
                // eslint-disable-next-line @next/next/no-img-element -- authorised admin endpoint, signed-URL redirect
                <img
                  key={imgId}
                  src={`/api/v1/admin/photo/${imgId}`}
                  alt="Customer skin photo"
                  className="h-48 w-auto rounded-2xl border border-ink/10 object-cover"
                />
              ))}
            </div>
          )}

          {detail.analysis.status !== "completed" && (
            <p className="mt-4 rounded-xl bg-champagne/40 p-3 text-sm text-ink">
              Analysis status: {detail.analysis.status.replace("_", " ")}. Observations may be limited.
            </p>
          )}

          {detail.analysis.observation && detail.analysis.observation.features.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-2">
              {detail.analysis.observation.features.map((f, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-2">
                  <span className="text-ink">{FEATURE_LABELS[f.feature]}</span>
                  <span className="rounded-full bg-blush px-2.5 py-1 text-xs font-semibold text-rose-ink">
                    {CERTAINTY_LABELS[f.certainty]}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-soft">No clear features were observed.</p>
          )}
          {detail.analysis.observation?.limitations && (
            <p className="mt-3 text-xs text-ink-soft">{detail.analysis.observation.limitations}</p>
          )}
        </section>
      )}

      {/* Skin Check */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-ink">Skin Check</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Concern: {detail.concern} · Skin type: {detail.skinType ?? "not sure"}
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-2">
          {detail.answers.map((a) => (
            <div
              key={a.questionId}
              className={`rounded-xl px-4 py-2 ${a.safety ? "bg-champagne/50" : "bg-surface"}`}
            >
              <dt className="text-xs font-semibold text-ink-soft">
                {a.safety ? "⚑ " : ""}
                {a.prompt}
              </dt>
              <dd className="text-ink">{a.values.join(", ")}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Expert workspace */}
      <section className="mt-8 rounded-3xl bg-surface p-6 shadow-soft">
        <h2 className="font-display text-xl font-semibold text-ink">Expert review</h2>
        <label className="mt-4 block text-xs font-semibold text-ink-soft">Expert id ({EXPERT_ID_HINT})</label>
        <input
          value={expertId}
          onChange={(e) => setExpertId(e.target.value)}
          placeholder="expert uuid"
          className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
        />
        <label className="mt-4 block text-xs font-semibold text-ink-soft">Internal notes (never shown to the customer)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
        />
        <label className="mt-4 block text-xs font-semibold text-ink-soft">Verdict (typed by you, not the AI)</label>
        <textarea
          value={verdict}
          onChange={(e) => setVerdict(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
        />
        <button onClick={saveReview} className="mt-4 rounded-full bg-rose-ink px-5 py-2.5 text-sm font-semibold text-white">
          Save review
        </button>
      </section>

      {/* Regimen builder */}
      <section className="mt-8 rounded-3xl bg-surface p-6 shadow-soft">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Regimen</h2>
          {detail.regimen && (
            <span className="text-xs font-semibold text-ink-soft">{detail.regimen.status}</span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink-soft">Duration (days)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : "")}
              className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
            >
              <option value="">—</option>
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={45}>45</option>
            </select>
          </div>
        </div>

        <label className="mt-4 block text-xs font-semibold text-ink-soft">Customer summary (shown to the customer)</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm" />
        <label className="mt-3 block text-xs font-semibold text-ink-soft">Follow-up (shown to the customer)</label>
        <textarea value={followUp} onChange={(e) => setFollowUp(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 text-sm" />

        <h3 className="mt-5 text-sm font-semibold text-ink">Items</h3>
        {items.map((it, idx) => (
          <div key={idx} className="mt-3 grid grid-cols-1 gap-2 rounded-xl bg-warm p-3 sm:grid-cols-4">
            <select value={it.timeOfDay} onChange={(e) => setItem(idx, { timeOfDay: e.target.value as Item["timeOfDay"] })} className="rounded-lg border border-ink/15 px-2 py-2 text-sm">
              <option value="am">AM</option>
              <option value="pm">PM</option>
              <option value="both">AM + PM</option>
            </select>
            <input placeholder="formulation ref" value={it.formulationRef} onChange={(e) => setItem(idx, { formulationRef: e.target.value })} className="rounded-lg border border-ink/15 px-2 py-2 text-sm" />
            <input placeholder="instructions" value={it.instructions} onChange={(e) => setItem(idx, { instructions: e.target.value })} className="rounded-lg border border-ink/15 px-2 py-2 text-sm" />
            <input placeholder="frequency" value={it.frequency} onChange={(e) => setItem(idx, { frequency: e.target.value })} className="rounded-lg border border-ink/15 px-2 py-2 text-sm" />
          </div>
        ))}
        <button onClick={() => setItems((p) => [...p, { timeOfDay: "am", formulationRef: "", instructions: "", frequency: "" }])} className="mt-3 text-sm font-semibold text-rose-ink">
          + Add item
        </button>

        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={saveRegimen} className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink">
            Save draft
          </button>
          {detail.regimen && detail.regimen.status === "draft" && (
            <button onClick={publish} className="rounded-full bg-rose-ink px-5 py-2.5 text-sm font-semibold text-white">
              Publish to customer
            </button>
          )}
          {detail.regimen && detail.regimen.status === "published" && !detail.order && (
            <button onClick={makeOrder} className="rounded-full bg-plum px-5 py-2.5 text-sm font-semibold text-white">
              Create order
            </button>
          )}
        </div>
      </section>

      {detail.order && (
        <section className="mt-8 rounded-3xl bg-blush p-6">
          <h2 className="font-display text-xl font-semibold text-ink">Order</h2>
          <p className="mt-1 text-ink-soft">Status: {detail.order.status}</p>
        </section>
      )}
    </div>
  );
}
