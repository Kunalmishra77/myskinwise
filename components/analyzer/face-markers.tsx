"use client";

import * as React from "react";
import { REGION_POINTS, DEFAULT_REGION, type Observation } from "@/lib/ai/vision-schema";
import { FEATURE_LABELS_DISPLAY } from "@/content/i18n/scanner";
import { useTContent } from "@/lib/i18n/use-content";

/**
 * The submitted photo with each visible characteristic highlighted where the
 * model actually saw it.
 *
 * Localisation: the vision model returns, per feature, a normalised bounding
 * box (`area`, 0..1 over the whole image) marking where it sees that thing —
 * so acne on the left cheek, dark circles under the eyes and shine on the
 * forehead each get their OWN highlight in their OWN place, rather than a
 * shared region template. The box is model-estimated and therefore
 * approximate; that honesty is why the copy says "areas we looked at", not
 * "detected exactly here". When a box is missing or implausible we fall back to
 * the coarse region anchor.
 *
 * Coordinate accuracy across sizes: the container's aspect ratio is set to the
 * photo's own, so the image fills it with no crop or letterbox and the
 * normalised boxes map straight to CSS percentages — correct on any screen,
 * at any image dimension.
 */
export type ShownFeature = Observation["features"][number] & { index: number };

type Box = { x: number; y: number; width: number; height: number };

/** A sane on-image box for a feature: its model box if usable, else its region. */
function boxFor(f: ShownFeature): Box {
  const a = f.area;
  const finite = a && [a.x, a.y, a.width, a.height].every((n) => Number.isFinite(n));
  if (finite && a.width > 0.03 && a.height > 0.03 && a.width < 0.9 && a.height < 0.9) {
    const width = Math.min(Math.max(a.width, 0.09), 0.5);
    const height = Math.min(Math.max(a.height, 0.09), 0.5);
    return {
      width,
      height,
      x: Math.min(Math.max(a.x, 0), 1 - width),
      y: Math.min(Math.max(a.y, 0), 1 - height),
    };
  }
  // Fallback: centre a default-sized box on the region anchor.
  const region = f.region ?? DEFAULT_REGION[f.feature];
  const rp = REGION_POINTS[region] ?? REGION_POINTS.overall;
  const width = 0.24;
  const height = 0.24;
  return {
    width,
    height,
    x: Math.min(Math.max(rp.x - width / 2, 0), 1 - width),
    y: Math.min(Math.max(rp.y - height / 2, 0), 1 - height),
  };
}

export function FaceMarkers({
  photo,
  shown,
  active,
  onSelect,
}: {
  photo: string;
  shown: ShownFeature[];
  active: number | null;
  onSelect: (index: number | null) => void;
}) {
  const tc = useTContent();
  const label = (feature: string) => tc(FEATURE_LABELS_DISPLAY[feature] ?? feature);
  // Match the container to the photo's real aspect ratio so the boxes line up.
  const [ratio, setRatio] = React.useState(3 / 4);

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl bg-plum shadow-soft"
      style={{ aspectRatio: ratio }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local data URL, deliberately not routed through next/image */}
      <img
        src={photo}
        alt="The photo you submitted"
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight);
        }}
        className="h-full w-full object-cover"
      />

      {shown.map((f) => {
        const box = boxFor(f);
        const isActive = active === f.index;
        return (
          <button
            key={f.index}
            type="button"
            onClick={() => onSelect(isActive ? null : f.index)}
            aria-label={`${label(f.feature)} — ${(f.region ?? "").replace(/_/g, " ")}`}
            className={`absolute transition-all ${isActive ? "z-20" : "z-10"}`}
            style={{
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${box.width * 100}%`,
              height: `${box.height * 100}%`,
            }}
          >
            {/* The highlight over the affected area. */}
            <span
              className={`absolute inset-0 rounded-[50%] border-2 transition-all ${
                isActive
                  ? "border-white bg-rose-ink/30 shadow-lift"
                  : "border-rose-ink/90 bg-rose-ink/15"
              }`}
            />
            {!isActive && (
              <span className="absolute inset-0 rounded-[50%] border border-rose-ink/50 motion-safe:animate-ping" />
            )}
            {/* Concern label, pinned just under the highlight. */}
            <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-plum/85 px-2 py-0.5 text-[10px] font-semibold text-white shadow-soft backdrop-blur">
              {label(f.feature)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
