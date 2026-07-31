"use client";

import * as React from "react";
import Link from "next/link";
import { Mic, ShieldCheck, Sparkles } from "lucide-react";
import { type Observation, clampProminence, prominenceLabel } from "@/lib/ai/vision-schema";
import {
  RESULT,
  FEATURE_LABELS_DISPLAY,
  CERTAINTY_LABELS_DISPLAY,
  PROMINENCE_WORDS,
  QUALITY_WORDS,
  MAY_MEAN,
} from "@/content/i18n/scanner";
import { useTContent } from "@/lib/i18n/use-content";
import { T } from "@/components/i18n/t";
import { getSession } from "@/lib/consultation/session";
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
  // If the user arrived here from a Voice/Chat conversation, prefer the concern
  // they told us over the one inferred from the photo — the combo then reflects
  // the whole consultation, not just the scan.
  const [sessionConcern, setSessionConcern] = React.useState<string | undefined>();
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setSessionConcern(getSession().concern), []);
  // Keep the ORIGINAL index so a marker and its card refer to the same thing,
  // then order the cards by how prominent each characteristic is in the photo —
  // most noticeable first — so the meter and the ordering tell the same story.
  const shown: ShownFeature[] = observation.features
    .map((f, index) => ({ ...f, index }))
    .filter((f) => f.certainty !== "unclear")
    .sort((a, b) => clampProminence(b.prominence) - clampProminence(a.prominence));
  const clear = shown.filter((f) => f.certainty === "observed").length;
  const [active, setActive] = React.useState<number | null>(null);

  // Photo-quality as a small meter (appearance of the image, not the skin).
  const qualityFill: Record<Observation["image_quality"], number> = {
    good: 100,
    fair: 66,
    poor: 34,
    unusable: 12,
  };

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

      {/* The line that must never be missed: this is a look at a photo, not a
          medical read. Given prominence, it is placed as a standing banner. */}
      <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-blush/60 p-3.5">
        <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-rose-ink" />
        <p className="text-sm text-ink"><T>{RESULT.nonDiagnostic}</T></p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-xl font-semibold text-ink">
          {shown.length}{" "}
          {tc(shown.length === 1 ? RESULT.observationSingular : RESULT.observationPlural)}
        </p>
        {/* Photo-quality meter — about the image, not the skin. */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-soft">{tc(RESULT.photoQuality)}</span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-rose-ink"
              style={{ width: `${qualityFill[observation.image_quality]}%` }}
            />
          </div>
          <span className="text-xs font-medium text-ink">
            {tc(QUALITY_WORDS[observation.image_quality] ?? "")}
          </span>
        </div>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        {clear > 0 ? `${clear} ${tc(RESULT.clearlyVisible)} ` : ""}
        {tc(RESULT.disclaimer)}
      </p>

      {shown.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-3">
          {shown.map((f) => {
            const isActive = active === f.index;
            const prominence = clampProminence(f.prominence);
            const word = prominenceLabel(f.prominence);
            return (
              <li
                key={f.index}
                className={`overflow-hidden rounded-2xl bg-surface pb-4 shadow-soft ring-2 transition ${
                  isActive ? "ring-rose-ink" : "ring-transparent"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActive(isActive ? null : f.index)}
                  className="flex w-full items-start justify-between gap-3 px-4 pt-4 text-left"
                >
                  <span className="flex items-center gap-2.5 font-display text-lg font-semibold text-ink">
                    <span className="size-2.5 shrink-0 rounded-full bg-rose-ink" aria-hidden="true" />
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

                {/* Visual-prominence meter — how noticeable in the PHOTO, with
                    the label saying exactly that so it can't read as severity. */}
                <div className="mt-3 px-4">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-medium text-ink-soft">{tc(RESULT.prominence)}</span>
                    <span className="font-semibold text-ink">
                      {tc(PROMINENCE_WORDS[word] ?? word)} · {prominence}/100
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose to-rose-ink transition-[width] duration-500"
                      style={{ width: `${prominence}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-ink-soft/80">{tc(RESULT.prominenceHint)}</p>
                </div>

                {f.note && <p className="mt-2.5 px-4 text-sm text-ink-soft">{f.note}</p>}
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
          <RecommendedCombo concern={sessionConcern ?? suggestedConcern(observation)} />
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
        {/* Primary next step: Riya reads the scan back by voice (she picks up
            the analysis from the shared session). */}
        <Button size="lg" asChild>
          <Link href="/voice">
            <Mic aria-hidden="true" className="size-4" />
            <T>{RESULT.ctaVoice}</T>
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/assistant"><T>{RESULT.ctaAssistant}</T></Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/skin-check"><T>{RESULT.ctaSkinCheck}</T></Link>
        </Button>
        <Button size="lg" variant="outline" onClick={onRestart}>
          <T>{RESULT.ctaScanAnother}</T>
        </Button>
      </div>
    </div>
  );
}
