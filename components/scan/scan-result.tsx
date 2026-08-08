"use client";

import * as React from "react";
import Link from "next/link";
import { Mic, ShieldCheck, Sparkles } from "lucide-react";
import type { ScanResult, ScanConcern } from "@/lib/skin/types";
import { CONCERN_META, SEVERITY_LABEL, byConcernSeverity } from "@/lib/skin/concern-content";
import { Button } from "@/components/ui/button";
import { RecommendedCombo } from "@/components/products/recommended-combo";

/**
 * Renders the deterministic engine's ScanResult: the user's photo with a
 * toggleable evidence mask per concern, a score + plain-language card for each,
 * skin tone as a neutral descriptive attribute, and any quality caveats.
 *
 * Scores are 0..100 where HIGHER = clearer (fewer concerns). Every score is
 * shown WITH its evidence mask — the pixels it was measured from — because a
 * number without evidence is exactly what we don't want.
 */

const SEV_TONE: Record<string, string> = {
  clear: "bg-sage/40 text-ink",
  mild: "bg-blush text-rose-ink",
  moderate: "bg-champagne text-ink",
  significant: "bg-rose-ink text-white",
};

// Qualitative severity band (NO fake /100 numbers — the anchors aren't
// population-calibrated yet, so we surface the honest severity level instead).
const SEV_STEPS = ["clear", "mild", "moderate", "significant"] as const;
const SEV_STEP_LABEL = ["Clear", "Mild", "Moderate", "Noticeable"];
function severityIndex(sev: string | null): number {
  const i = SEV_STEPS.indexOf((sev ?? "") as (typeof SEV_STEPS)[number]);
  return i < 0 ? 0 : i;
}

// Nothing hidden now — acne is live via the hosted detector (Beta), shown with
// its real per-lesion boxes. Kept as a switch for any future concern to gate.
const HIDDEN_CONCERNS = new Set<string>();

/** A concern has on-photo evidence if the engine rendered a mask, or (for acne)
 * the detector returned lesion boxes. */
function hasEvidence(c: ScanConcern): boolean {
  return Boolean(c.mask_url) || Boolean(c.boxes && c.boxes.length > 0);
}

/** "forehead, left cheek and nose" — a natural list of the display areas. */
function formatRegions(regions: string[]): string {
  const r = regions.slice(0, 3);
  if (r.length === 1) return `your ${r[0]}`;
  if (r.length === 2) return `your ${r[0]} and ${r[1]}`;
  return `your ${r.slice(0, -1).join(", ")} and ${r[r.length - 1]}`;
}

function rgba([r, g, b]: [number, number, number], a: number) {
  return `rgba(${r},${g},${b},${a})`;
}

export function ScanResultView({
  result,
  photo,
  onRestart,
}: {
  result: ScanResult;
  photo: string;
  onRestart: () => void;
}) {
  // Default to showing the MOST-NOTICEABLE concern's evidence mask right away,
  // so the photo shows something the moment results load (not a bare photo that
  // only lights up on tap).
  const [active, setActive] = React.useState<string | null>(() => {
    const withEvidence = result.concerns
      .filter((c) => c.score !== null && !HIDDEN_CONCERNS.has(c.id) && hasEvidence(c))
      .slice()
      .sort(byConcernSeverity);
    return withEvidence[0]?.id ?? null;
  });
  const [ratio, setRatio] = React.useState(3 / 4);

  // Phase 8 — the narrative report + matched routine, generated from the SCORES
  // (never the image). Fetched once when the result renders.
  const [report, setReport] = React.useState<{ narrative: string; recommendConcern: string } | null>(null);
  React.useEffect(() => {
    let live = true;
    const concerns = result.concerns.map((c) => ({ id: c.id, score: c.score, severity: c.severity }));
    fetch("/api/v1/scan/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ concerns, skinType: result.derived.skin_type }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (live && d?.status === "ok") setReport({ narrative: d.narrative, recommendConcern: d.recommendConcern });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [result]);

  const scored = result.concerns
    .filter((c) => c.score !== null && !HIDDEN_CONCERNS.has(c.id))
    .slice()
    .sort(byConcernSeverity);
  // Only what actually needs attention gets a full card; everything that's fine
  // collapses into one compact "looking good" row — so the page stays short.
  const attention = scored.filter((c) => c.severity === "significant" || c.severity === "moderate");
  const minor = scored.filter((c) => c.severity !== "significant" && c.severity !== "moderate");
  const tone = result.skin_tone;
  const warnings = (result.quality.checks ?? []).filter((c) => !c.passed);

  const activeConcern = active ? result.concerns.find((c) => c.id === active) : null;
  const maskUrl =
    activeConcern?.mask_url ? `/api/v1/scan/${result.scan_id}/mask/${activeConcern.id}.png` : null;
  const activeBoxes = activeConcern?.boxes && activeConcern.boxes.length > 0 ? activeConcern.boxes : null;

  return (
    <div>
      <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-rose-ink">
        02 · Your skin analysis
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink">What we measured.</h1>

      {/* Photo with the active concern's evidence mask overlaid. */}
      <div
        className="relative mt-6 w-full overflow-hidden rounded-3xl bg-plum shadow-soft"
        style={{ aspectRatio: ratio }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
        <img
          src={photo}
          alt="Your photo"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight);
          }}
          className="h-full w-full object-cover"
        />
        {maskUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- same-origin proxy PNG
          <img
            key={maskUrl}
            src={maskUrl}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
        )}
        {/* Acne has no engine mask — draw the detector's real lesion boxes. */}
        {activeBoxes?.map((b, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="pointer-events-none absolute rounded-md border-2"
            style={{
              left: `${(b.cx - b.w / 2) * 100}%`,
              top: `${(b.cy - b.h / 2) * 100}%`,
              width: `${b.w * 100}%`,
              height: `${b.h * 100}%`,
              borderColor: rgba(CONCERN_META.acne?.rgb ?? [230, 90, 90], 0.95),
              boxShadow: "0 0 8px rgba(230,90,90,0.5)",
            }}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-ink-soft">
        {active
          ? `Highlighting: ${CONCERN_META[active]?.label ?? active}. Tap a card again to clear.`
          : "Tap a concern below to see exactly where it was measured on your photo."}
      </p>

      {/* Non-diagnostic banner. */}
      <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-blush/60 p-3.5">
        <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-rose-ink" />
        <p className="text-sm text-ink">
          A cosmetic measurement of what the photo shows — not a medical diagnosis. Each concern is
          rated by how noticeable it looks, and you can see exactly where on your photo. Still
          calibrating (Beta).
        </p>
      </div>

      {/* Skin tone — descriptive, never a "concern". */}
      {tone.fitzpatrick_estimate && (
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-surface p-4 shadow-soft">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Your skin tone</p>
            <p className="font-display text-lg font-semibold text-ink">
              Fitzpatrick {tone.fitzpatrick_estimate}
            </p>
          </div>
          <p className="max-w-[55%] text-right text-xs text-ink-soft">
            A neutral description of your natural tone — not a concern, and never scored against you.
          </p>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-4 flex gap-3 rounded-2xl border-l-4 border-champagne bg-surface p-4">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink-soft" />
          <p className="text-sm text-ink-soft">
            Photo quality was borderline on: {warnings.map((w) => w.name).join(", ")}. A cleaner,
            evenly lit photo gives a more reliable read.
          </p>
        </div>
      )}

      {attention.length === 0 && (
        <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-sage/25 p-4">
          <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink" />
          <p className="text-sm text-ink">Great news — nothing stood out as a strong concern. Here&apos;s the full read.</p>
        </div>
      )}

      {/* Full cards ONLY for what needs attention. */}
      <ul className="mt-6 flex flex-col gap-3">
        {attention.map((c) => {
          const meta = CONCERN_META[c.id];
          const isActive = active === c.id;
          const sev = c.severity ?? "";
          const sevIdx = severityIndex(c.severity);
          return (
            <li
              key={c.id}
              className={`overflow-hidden rounded-2xl bg-surface shadow-soft ring-2 transition ${
                isActive ? "ring-rose-ink" : "ring-transparent"
              }`}
            >
              <button
                type="button"
                onClick={() => setActive(isActive ? null : c.id)}
                className="flex w-full items-start justify-between gap-3 px-4 pt-4 text-left"
              >
                <span className="flex items-center gap-2.5 font-display text-lg font-semibold text-ink">
                  <span
                    aria-hidden="true"
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: rgba(meta?.rgb ?? [180, 60, 100], 1) }}
                  />
                  {meta?.label ?? c.id}
                </span>
                {sev && (
                  <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${SEV_TONE[sev] ?? "bg-blush text-rose-ink"}`}>
                    {SEVERITY_LABEL[sev] ?? sev}
                  </span>
                )}
              </button>

              {/* Honest severity meter — 4 qualitative steps, not a fake number. */}
              <div className="mt-3 px-4">
                <div className="flex items-center gap-1.5">
                  {SEV_STEP_LABEL.map((_, i) => (
                    <span
                      key={i}
                      className="h-1.5 flex-1 rounded-full transition-colors duration-500"
                      style={{
                        backgroundColor:
                          i <= sevIdx ? rgba(meta?.rgb ?? [180, 60, 100], 0.9) : "rgba(20,10,15,0.08)",
                      }}
                    />
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-ink-soft">
                  <span className={sevIdx === 0 ? "font-semibold text-ink" : ""}>Clear</span>
                  <span className={sevIdx >= 3 ? "font-semibold text-ink" : ""}>Noticeable</span>
                </div>
              </div>

              {meta?.blurb && <p className="mt-2.5 px-4 pb-1 text-sm text-ink-soft">{meta.blurb}</p>}

              {c.regions && c.regions.length > 0 && (
                <p className="px-4 pb-1 text-xs text-ink-soft">
                  <span className="font-semibold text-ink">Seen mostly on:</span> {formatRegions(c.regions)}
                </p>
              )}

              <button
                type="button"
                onClick={() => setActive(isActive ? null : c.id)}
                className="mb-3 mt-1 px-4 text-xs font-semibold text-rose-ink"
              >
                {isActive ? "Hide on photo" : hasEvidence(c) ? "Show on photo →" : ""}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Everything that's fine — one compact row, tap a chip to see it on the
          photo. Keeps the page short instead of a wall of "Clear" cards. */}
      {minor.length > 0 && (
        <div className="mt-3 rounded-2xl bg-surface p-4 shadow-soft">
          <p className="text-sm font-semibold text-ink">
            {attention.length ? "Also looking good" : "Your full read"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {minor.map((c) => {
              const meta = CONCERN_META[c.id];
              const isActive = active === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => hasEvidence(c) && setActive(isActive ? null : c.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition ${
                    isActive ? "bg-blush ring-rose-ink" : "bg-champagne/40 ring-ink/10"
                  }`}
                >
                  <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: rgba(meta?.rgb ?? [180, 60, 100], 1) }} />
                  {meta?.label ?? c.id}
                  <span className="text-ink-soft">· {SEVERITY_LABEL[c.severity ?? "clear"] ?? c.severity}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Phase 8 — personalised narrative + matched routine. */}
      <div className="mt-8">
        <h2 className="font-display text-2xl font-semibold text-ink">Your personalised read</h2>
        {report ? (
          <p className="mt-3 rounded-2xl bg-surface p-4 text-sm leading-relaxed text-ink shadow-soft">
            {report.narrative}
          </p>
        ) : (
          <div className="mt-3 space-y-2 rounded-2xl bg-surface p-4 shadow-soft" aria-hidden="true">
            <div className="h-3 w-full animate-pulse rounded bg-ink/10" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-ink/10" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-ink/10" />
          </div>
        )}
        {report?.recommendConcern && (
          <div className="mt-5">
            <RecommendedCombo concern={report.recommendConcern} />
          </div>
        )}
      </div>

      {/* Next steps. */}
      <h2 className="mt-10 font-display text-2xl font-semibold text-ink">What next?</h2>
      <div className="mt-4 flex flex-col gap-3">
        <Button size="lg" asChild>
          <Link href="/voice">
            <Mic aria-hidden="true" className="size-4" />
            Talk about your results with our expert
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/assistant">Ask about my results</Link>
        </Button>
        <Button size="lg" variant="outline" onClick={onRestart}>
          Scan again
        </Button>
      </div>
    </div>
  );
}
