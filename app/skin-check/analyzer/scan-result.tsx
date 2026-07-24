"use client";

import Link from "next/link";
import { Mic, ShieldCheck } from "lucide-react";
import { FEATURE_LABELS, CERTAINTY_LABELS, type Observation } from "@/lib/ai/vision-schema";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

/**
 * What the AI noticed, and what to do about it.
 *
 * Everything rendered here comes from the validated observation schema —
 * feature, certainty, the model's free-text note, image quality, limitations,
 * and the escalation flag. Nothing else exists, so nothing else is displayed.
 *
 * Deliberately NOT built, despite being the obvious "advanced AI" flourish:
 * hotspot markers pinned to regions of the face. The schema carries no
 * coordinates. Every marker would therefore be a guess drawn on a photograph
 * of someone's face and presented as analysis, and a confident dot in the
 * wrong place is worse than no dot at all.
 *
 * What is real and now shown: the submitted photo beside the findings, a
 * count of what was seen, image quality, certainty on every line, and a plain
 * "what this may mean" per feature. That last one is editorial copy keyed to
 * the controlled vocabulary — appearance-based, never naming a condition.
 */

/**
 * Appearance-based context for each controlled feature.
 *
 * Keyed to VISIBLE_FEATURES, so it cannot describe something the model is
 * incapable of reporting. Every line stays observational: it explains what
 * the look commonly relates to, and never asserts a cause or a diagnosis.
 */
const MAY_MEAN: Record<string, string> = {
  visible_shine_or_oiliness:
    "Skin can look shinier when it is producing more oil, or when a routine is stripping it and it compensates. A routine can be balanced for this.",
  visible_dryness_or_flaking:
    "Dry-looking or flaky areas often point to the skin barrier needing more support rather than more active ingredients.",
  visible_redness:
    "Visible redness can follow irritation, a product that does not suit you, or simply a warm room. Redness that persists is worth having a person look at.",
  visible_uneven_tone:
    "Tone can look uneven after sun exposure, or as marks left behind by past breakouts fade at different rates.",
  visible_dark_spots:
    "Darker patches commonly follow sun exposure, or heal slowly after a spot has cleared. They usually respond to consistency rather than intensity.",
  visible_blemishes:
    "Individual spots are normal and come and go. It is a pattern of them, rather than any one, that a routine is built around.",
  visible_texture_irregularity:
    "Texture differences show up strongly in raking light, and are usually about hydration and gentle renewal rather than scrubbing.",
  visible_pores:
    "Pore visibility is largely structural and varies by area of the face. A routine can affect how they look, not how many there are.",
};

const QUALITY_NOTE: Record<Observation["image_quality"], string> = {
  good: "Good photo quality",
  fair: "Fair photo quality",
  poor: "Low photo quality — these findings are less reliable",
  unusable: "This photo was hard to read",
};

export function ScanResult({
  observation,
  photo,
  onRestart,
}: {
  observation: Observation;
  photo: string | null;
  onRestart: () => void;
}) {
  const shown = observation.features.filter((f) => f.certainty !== "unclear");
  const clear = shown.filter((f) => f.certainty === "observed").length;

  return (
    <div>
      <Eyebrow index="02">AI visual analysis</Eyebrow>
      <h1 className="mt-4 font-display text-display font-semibold text-ink">What the AI noticed.</h1>

      {/*
        The photo that produced these findings, so the analysis is anchored to
        something the person recognises. Rendered from the local data URL they
        already hold in memory — the stored copy lives in a private bucket and
        is never surfaced to the browser.
      */}
      {photo && (
        <div className="mt-6 flex items-center gap-4 rounded-3xl bg-surface p-3 shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, deliberately not routed through next/image */}
          <img
            src={photo}
            alt="The photo you submitted"
            className="size-24 shrink-0 rounded-2xl object-cover"
          />
          <div className="min-w-0">
            <p className="font-display text-2xl font-semibold text-ink">
              {shown.length} observation{shown.length === 1 ? "" : "s"}
            </p>
            <p className="text-sm text-ink-soft">
              {clear > 0 ? `${clear} clearly visible` : "None clearly visible"}
            </p>
            <p className="mt-1 text-xs text-ink-soft">{QUALITY_NOTE[observation.image_quality]}</p>
          </div>
        </div>
      )}

      <p className="mt-4 text-sm text-ink-soft">
        These are visible characteristics only — an AI observation, not a medical diagnosis. A photo
        cannot tell the whole story; a Skinwise expert can.
      </p>

      {shown.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-3">
          {shown.map((f, i) => (
            <li key={i} className="overflow-hidden rounded-2xl bg-surface shadow-soft">
              <div className="flex items-start justify-between gap-3 px-4 pt-4">
                <span className="font-display text-lg font-semibold text-ink">
                  {FEATURE_LABELS[f.feature]}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    f.certainty === "observed" ? "bg-rose-ink text-white" : "bg-blush text-rose-ink"
                  }`}
                >
                  {CERTAINTY_LABELS[f.certainty]}
                </span>
              </div>
              {f.note && <p className="mt-1.5 px-4 text-sm text-ink-soft">{f.note}</p>}
              {MAY_MEAN[f.feature] && (
                <div className="mt-3 border-t border-ink/5 bg-blush/40 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-ink">
                    What this may mean
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">{MAY_MEAN[f.feature]}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-2xl bg-surface p-4 text-ink-soft shadow-soft">
          Nothing stood out clearly from this photo. That is common — a Skin Check tells us far more
          than a single image can.
        </p>
      )}

      {observation.recommend_professional && (
        <div className="mt-4 flex gap-3 rounded-2xl border-l-4 border-rose-ink bg-surface p-4">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-rose-ink" />
          <p className="text-sm text-ink">
            Some of what is visible is worth having a person look at. We would suggest a Skinwise
            expert — or a doctor if it is bothering you.
          </p>
        </div>
      )}

      <p className="mt-5 text-xs text-ink-soft">{observation.limitations}</p>

      {/*
        Four routes onward rather than one. This screen used to end with a
        single "Get a personalised Skin Check", which funnelled everyone into
        the questionnaire and is a large part of why the Scanner and the Skin
        Check read as the same feature. Asking the AI about your own results
        is the most natural next thing to want, so it is offered directly, by
        text or by voice.
      */}
      <h2 className="mt-10 font-display text-2xl font-semibold text-ink">What next?</h2>
      <div className="mt-4 flex flex-col gap-3">
        <Button size="lg" asChild>
          <Link href="/skin-check">Get a personalised Skin Check</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/assistant">Ask Skinwise about these observations</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/voice">
            <Mic aria-hidden="true" className="size-4" />
            Talk it through with Skinwise
          </Link>
        </Button>
        <Button size="lg" variant="outline" onClick={onRestart}>
          Scan another photo
        </Button>
      </div>
    </div>
  );
}
