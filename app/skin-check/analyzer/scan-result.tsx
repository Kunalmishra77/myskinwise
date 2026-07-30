"use client";

import * as React from "react";
import Link from "next/link";
import { Mic, ShieldCheck } from "lucide-react";
import { type Observation } from "@/lib/ai/vision-schema";
import {
  RESULT,
  FEATURE_LABELS_DISPLAY,
  CERTAINTY_LABELS_DISPLAY,
  QUALITY_NOTE,
  MAY_MEAN,
} from "@/content/i18n/scanner";
import { useTContent } from "@/lib/i18n/use-content";
import { T } from "@/components/i18n/t";
import { Button } from "@/components/ui/button";
import { FaceMarkers, type ShownFeature } from "@/components/analyzer/face-markers";
import { RecommendedCombo } from "@/components/products/recommended-combo";
import { Eyebrow } from "@/components/ui/eyebrow";

/**
 * What the AI noticed, and what to do about it.
 *
 * Everything rendered here comes from the validated observation schema —
 * feature, certainty, region, the model's free-text note, image quality,
 * limitations, and the escalation flag. Nothing else exists, so nothing else
 * is displayed.
 *
 * The on-face markers (FaceMarkers) are anchored to the coarse REGION the
 * model reports for each feature, not to pixel coordinates it does not have.
 * A marker points at the area a characteristic tends to show, and the copy
 * says exactly that — "areas we looked at", never "we detected X here". A
 * confident dot in a precise-but-wrong place would be worse than an honest
 * region marker.
 *
 * "What this may mean" is editorial copy keyed to the controlled vocabulary —
 * appearance-based, never naming a condition.
 */

/**
 * Infers a concern from the VISIBLE features only, to pick a sensible starter
 * routine. Non-diagnostic: it never names a condition, it just chooses which
 * of the three concern routines to suggest, and the expert confirms.
 */
function suggestedConcern(observation: Observation): string {
  const feats = new Set(
    observation.features.filter((f) => f.certainty !== "unclear").map((f) => f.feature),
  );
  if (feats.has("visible_dark_spots") || feats.has("visible_uneven_tone")) return "pigmentation";
  if (feats.has("visible_blemishes") || feats.has("visible_redness")) return "acne";
  return "other-issues";
}

export function ScanResult({
  observation,
  photo,
  onRestart,
}: {
  observation: Observation;
  photo: string | null;
  onRestart: () => void;
}) {
  const tc = useTContent();
  // Keep the original index so a marker and its card refer to the same thing.
  const shown: ShownFeature[] = observation.features
    .map((f, index) => ({ ...f, index }))
    .filter((f) => f.certainty !== "unclear");
  const clear = shown.filter((f) => f.certainty === "observed").length;
  const [active, setActive] = React.useState<number | null>(null);

  return (
    <div>
      <Eyebrow index="02">{tc(RESULT.eyebrow)}</Eyebrow>
      <h1 className="mt-4 font-display text-display font-semibold text-ink"><T>{RESULT.title}</T></h1>

      {/*
        The submitted photo with a marker over each observation — the centre of
        the experience. Rendered from the local data URL the browser already
        holds; the stored copy lives in a private bucket and never reaches the
        client. Markers point at the AREA a characteristic tends to show, not a
        detected spot — see FaceMarkers.
      */}
      {photo && shown.length > 0 && (
        <div className="mt-6">
          <FaceMarkers
            photo={photo}
            observation={observation}
            shown={shown}
            active={active}
            onSelect={setActive}
          />
          <p className="mt-2 text-center text-xs text-ink-soft"><T>{RESULT.markerCaption}</T></p>
        </div>
      )}

      {photo && shown.length === 0 && (
        <div className="mt-6 overflow-hidden rounded-3xl bg-plum shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, deliberately not routed through next/image */}
          <img src={photo} alt={tc(RESULT.photoAlt)} className="aspect-[3/4] w-full object-cover" />
        </div>
      )}

      <div className="mt-4 flex items-baseline justify-between gap-3">
        <p className="font-display text-xl font-semibold text-ink">
          {shown.length}{" "}
          {tc(shown.length === 1 ? RESULT.observationSingular : RESULT.observationPlural)}
        </p>
        <p className="text-xs text-ink-soft">{tc(QUALITY_NOTE[observation.image_quality] ?? "")}</p>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        {clear > 0 ? `${clear} ${tc(RESULT.clearlyVisible)} ` : ""}
        {tc(RESULT.disclaimer)}
      </p>

      {shown.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-3">
          {shown.map((f, i) => {
            const isActive = active === f.index;
            return (
              <li
                key={f.index}
                className={`overflow-hidden rounded-2xl bg-surface shadow-soft ring-2 transition ${
                  isActive ? "ring-rose-ink" : "ring-transparent"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActive(isActive ? null : f.index)}
                  className="flex w-full items-start justify-between gap-3 px-4 pt-4 text-left"
                >
                  <span className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-ink text-xs font-semibold text-white">
                      {i + 1}
                    </span>
                    {tc(FEATURE_LABELS_DISPLAY[f.feature] ?? f.feature)}
                  </span>
                  <span
                    className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      f.certainty === "observed" ? "bg-rose-ink text-white" : "bg-blush text-rose-ink"
                    }`}
                  >
                    {tc(CERTAINTY_LABELS_DISPLAY[f.certainty] ?? f.certainty)}
                  </span>
                </button>
                {f.note && <p className="mt-1.5 px-4 text-sm text-ink-soft">{f.note}</p>}
                {MAY_MEAN[f.feature] && (
                  <div className="mt-3 border-t border-ink/5 bg-blush/40 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-ink">
                      {tc(RESULT.whatThisMayMean)}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">{tc(MAY_MEAN[f.feature] ?? "")}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-6 rounded-2xl bg-surface p-4 text-ink-soft shadow-soft">
          <T>{RESULT.nothingClear}</T>
        </p>
      )}

      {observation.recommend_professional && (
        <div className="mt-4 flex gap-3 rounded-2xl border-l-4 border-rose-ink bg-surface p-4">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-rose-ink" />
          <p className="text-sm text-ink"><T>{RESULT.recommendProfessional}</T></p>
        </div>
      )}

      <p className="mt-5 text-xs text-ink-soft">{observation.limitations}</p>

      {/*
        A starter combo based on what was visible. Framed as "you might
        explore", not a diagnosis — the concern is inferred from the visible
        features only to pick a sensible routine, and the expert confirms it.
      */}
      {shown.length > 0 && (
        <div className="mt-8">
          <RecommendedCombo concern={suggestedConcern(observation)} />
        </div>
      )}

      {/*
        Four routes onward rather than one. This screen used to end with a
        single "Get a personalised Skin Check", which funnelled everyone into
        the questionnaire and is a large part of why the Scanner and the Skin
        Check read as the same feature. Asking the AI about your own results
        is the most natural next thing to want, so it is offered directly, by
        text or by voice.
      */}
      <h2 className="mt-10 font-display text-2xl font-semibold text-ink"><T>{RESULT.whatNext}</T></h2>
      <div className="mt-4 flex flex-col gap-3">
        <Button size="lg" asChild>
          <Link href="/skin-check"><T>{RESULT.ctaSkinCheck}</T></Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/assistant"><T>{RESULT.ctaAssistant}</T></Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/voice">
            <Mic aria-hidden="true" className="size-4" />
            <T>{RESULT.ctaVoice}</T>
          </Link>
        </Button>
        <Button size="lg" variant="outline" onClick={onRestart}>
          <T>{RESULT.ctaScanAnother}</T>
        </Button>
      </div>
    </div>
  );
}
