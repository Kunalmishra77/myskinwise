"use client";

import * as React from "react";
import { REGION_POINTS, DEFAULT_REGION, type Observation } from "@/lib/ai/vision-schema";
import { FEATURE_LABELS_DISPLAY } from "@/content/i18n/scanner";
import { useTContent } from "@/lib/i18n/use-content";
import type { FaceGeometry, FaceRegion } from "@/lib/analysis/face-detect";

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

/**
 * For N markers, a set of face slots known to be well separated — so the
 * circles form a clean spread (a triangle for three, a quad for four…) and can
 * never stack, whatever regions the model happened to return. Concerns are then
 * matched to the nearest slot, so a localised one still gravitates to its area.
 */
const SPREAD_LAYOUTS: FaceRegion[][] = [
  [],
  ["nose"],
  ["left_cheek", "right_cheek"],
  ["forehead", "left_cheek", "right_cheek"],
  ["forehead", "left_cheek", "right_cheek", "chin"],
  ["forehead", "left_cheek", "right_cheek", "chin", "nose"],
  ["forehead", "left_cheek", "right_cheek", "under_eye_left", "under_eye_right", "chin"],
];

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
  geometry,
  active,
  onSelect,
}: {
  photo: string;
  shown: ShownFeature[];
  geometry?: FaceGeometry | null;
  active: number | null;
  onSelect: (index: number | null) => void;
}) {
  const tc = useTContent();
  const label = (feature: string) => tc(FEATURE_LABELS_DISPLAY[feature] ?? feature);
  // Match the container to the photo's real aspect ratio so the boxes line up.
  const [ratio, setRatio] = React.useState(3 / 4);

  // When we have a real detected face, place each concern at its anatomical
  // anchor INSIDE the actual face box, sized relative to the face — so markers
  // are always ON the face and never drift into hair or background.
  //
  // The model tends to bunch several concerns into the same central region
  // (nose/cheek), which piles the circles on top of each other. So we give
  // each marker its OWN region: use the model's region when it's still free,
  // otherwise hand out the next free spot from a spread across the face. Result
  // — one marker per area, evenly distributed, never stacked.
  const placed = geometry
    ? (() => {
        const g = geometry;
        const dia = Math.max(0.12, g.box.width * 0.24);
        // Pick the pre-separated slot set for this many markers, then greedily
        // give each concern (most prominent first) its NEAREST free slot — so
        // the layout is always cleanly spread AND a localised concern still
        // lands near its real area.
        const slots = [...(SPREAD_LAYOUTS[shown.length] ?? SPREAD_LAYOUTS[6]!)];
        return shown.map((f) => {
          const preferred = ((f.region as FaceRegion) ?? DEFAULT_REGION[f.feature]) as FaceRegion;
          const pa = g.regions[preferred] ?? g.regions.overall;
          let best = 0;
          let bestD = Infinity;
          slots.forEach((s, i) => {
            const a = g.regions[s] ?? g.regions.overall;
            const d = Math.hypot(a.x - pa.x, a.y - pa.y);
            if (d < bestD) {
              bestD = d;
              best = i;
            }
          });
          const region = slots.splice(best, 1)[0] ?? "overall";
          const anchor = g.regions[region] ?? g.regions.overall;
          // Upper-face markers show their label ABOVE the circle so it doesn't
          // drop into the eye zone where a lower marker's circle sits.
          const up = anchor.y < g.box.y + g.box.height * 0.42;
          return {
            f,
            up,
            box: { x: anchor.x - dia / 2, y: anchor.y - dia / 2, width: dia, height: dia },
          };
        });
      })()
    : shown.map((f) => ({ f, up: false, box: boxFor(f) }));

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

      {placed.map(({ f, box, up }) => {
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
            {/* Concern label, pinned just outside the highlight — above for
                upper-face markers, below otherwise, so labels never collide. */}
            <span
              className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-plum/85 px-2 py-0.5 text-[10px] font-semibold text-white shadow-soft backdrop-blur ${
                up ? "bottom-full mb-1" : "top-full mt-1"
              }`}
            >
              {label(f.feature)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
