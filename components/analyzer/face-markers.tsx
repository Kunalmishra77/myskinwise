"use client";

import * as React from "react";
import { REGION_POINTS, DEFAULT_REGION, type Observation } from "@/lib/ai/vision-schema";
import { FEATURE_LABELS_DISPLAY } from "@/content/i18n/scanner";
import { useTContent } from "@/lib/i18n/use-content";

/**
 * The submitted photo with a marker over each observation, drawn where that
 * kind of characteristic typically shows on the face.
 *
 * Honesty note that shapes the whole component: the AI does not return pixel
 * coordinates of a concern. It returns a coarse region ("shine, mainly the
 * nose") and an approximate face box. A marker is therefore anchored to the
 * anatomical position of that region within the face box — it points at the
 * area, not at a detected lesion. The copy around it says "areas we looked at",
 * never "we detected X here", because the former is true and the latter is not.
 *
 * Markers and the observation cards share a selected index, so tapping either
 * highlights the other.
 */
export type ShownFeature = Observation["features"][number] & { index: number };

// A plausible centred box for when the model returns something unusable — face
// photos are centred, so this is a safe default rather than a guess that could
// push markers off the image.
const FALLBACK_BOX = { x: 0.12, y: 0.06, width: 0.76, height: 0.88 };

function clampBox(box: Observation["face_box"]) {
  const ok =
    Number.isFinite(box.x) &&
    Number.isFinite(box.y) &&
    Number.isFinite(box.width) &&
    Number.isFinite(box.height) &&
    box.width > 0.15 &&
    box.height > 0.15 &&
    box.x >= -0.05 &&
    box.y >= -0.05 &&
    box.x + box.width <= 1.05 &&
    box.y + box.height <= 1.05;
  const b = ok ? box : FALLBACK_BOX;
  return {
    x: Math.min(Math.max(b.x, 0), 1),
    y: Math.min(Math.max(b.y, 0), 1),
    width: Math.min(b.width, 1),
    height: Math.min(b.height, 1),
  };
}

export function FaceMarkers({
  photo,
  observation,
  shown,
  active,
  onSelect,
}: {
  photo: string;
  observation: Observation;
  shown: ShownFeature[];
  active: number | null;
  onSelect: (index: number | null) => void;
}) {
  const tc = useTContent();
  const label = (feature: string) => tc(FEATURE_LABELS_DISPLAY[feature] ?? feature);
  const box = clampBox(observation.face_box);

  // Give each concern its OWN area instead of letting them pile up in one spot.
  // The model often returns a vague/"overall" region for several features at
  // once; when it does, we fall back to the feature's natural anatomical home
  // (shine→nose, blemishes→chin, dark spots→cheek, pores→nose, …) and avoid
  // reusing a region already taken, so the highlights spread across the face.
  const usedRegions = new Set<string>();
  const regionFor: Record<number, (typeof shown)[number]["region"]> = {};
  for (const f of shown) {
    const modelRegion = f.region && f.region !== "overall" ? f.region : DEFAULT_REGION[f.feature];
    let region = modelRegion;
    if (usedRegions.has(region)) {
      const home = DEFAULT_REGION[f.feature];
      if (!usedRegions.has(home)) region = home;
    }
    usedRegions.add(region);
    regionFor[f.index] = region;
  }

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-plum shadow-soft">
      {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, deliberately not routed through next/image */}
      <img src={photo} alt="The photo you submitted" className="h-full w-full object-cover" />

      {shown.map((f, i) => {
        const region = regionFor[f.index] ?? DEFAULT_REGION[f.feature];
        const rp = REGION_POINTS[region] ?? REGION_POINTS.overall;
        // Point within the face box, then within the image.
        let left = (box.x + rp.x * box.width) * 100;
        let top = (box.y + rp.y * box.height) * 100;
        // Nudge the rare remaining highlights that still share a region apart.
        const dup = shown.slice(0, i).filter((g) => regionFor[g.index] === region).length;
        if (dup) {
          left += (dup % 2 ? 1 : -1) * 8;
          top += Math.ceil(dup / 2) * 8;
        }
        const isActive = active === f.index;
        return (
          <button
            key={f.index}
            type="button"
            onClick={() => onSelect(isActive ? null : f.index)}
            aria-label={`${label(f.feature)} — ${region.replace(/_/g, " ")}`}
            className={`absolute aspect-square w-[22%] -translate-x-1/2 -translate-y-1/2 transition-all sm:w-[20%] ${
              isActive ? "z-20 scale-110" : "z-10"
            }`}
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            {/* A highlighted region over the affected area (not a numbered dot).
                It marks the AREA a characteristic shows in, not an exact pixel —
                which is why it is a soft zone, not a precise circle. */}
            <span
              className={`absolute inset-0 rounded-full border-2 transition-all ${
                isActive
                  ? "border-white bg-rose-ink/30 shadow-lift"
                  : "border-rose-ink/90 bg-rose-ink/15"
              }`}
            />
            {!isActive && (
              <span className="absolute inset-0 rounded-full border border-rose-ink/50 motion-safe:animate-ping" />
            )}
            {/* The concern label, pinned just under the highlight. */}
            <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-plum/85 px-2 py-0.5 text-[10px] font-semibold text-white shadow-soft backdrop-blur">
              {label(f.feature)}
            </span>
          </button>
        );
      })}

      {/* When a marker is active, name it over the photo. */}
      {active !== null &&
        (() => {
          const f = shown.find((s) => s.index === active);
          if (!f) return null;
          return (
            <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-plum/80 px-4 py-2.5 text-center backdrop-blur">
              <p className="text-sm font-semibold text-white">{label(f.feature)}</p>
            </div>
          );
        })()}
    </div>
  );
}
