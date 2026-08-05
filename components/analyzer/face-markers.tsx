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
 * Anatomically distinct regions a colliding marker can be nudged to, in order
 * of preference. Used ONLY when two concerns land on the same region — the
 * marker keeps the concern's OWN reported region wherever possible (credibility:
 * a "dark spots" marker belongs on the cheek the model saw it on, not on an
 * arbitrary layout slot), and moves to the nearest of these only to avoid a
 * literal stack.
 */
const NUDGE_REGIONS: FaceRegion[] = [
  "forehead",
  "left_cheek",
  "right_cheek",
  "chin",
  "under_eye_left",
  "under_eye_right",
  "nose",
  "jaw",
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

  // When we have a real detected face, place each concern at the anatomical
  // region the MODEL actually reported for it (credibility: the marker sits
  // where the analysis said it saw the thing — dark spots on the cheek it named,
  // shine on the T-zone — not on an arbitrary layout slot). Anchored inside the
  // real detected face box and sized to it, so markers are always ON the face.
  // The only adjustment is de-stacking: if two concerns share a region, the
  // later (less prominent) one is nudged to the nearest free, distinct region so
  // the circles never pile up — its own region still wins whenever it's free.
  const placed = geometry
    ? (() => {
        const g = geometry;
        const dia = Math.max(0.12, g.box.width * 0.24);
        const used = new Set<FaceRegion>();
        return shown.map((f) => {
          const own = ((f.region as FaceRegion) ?? DEFAULT_REGION[f.feature]) as FaceRegion;
          let region = own;
          if (used.has(region) || !g.regions[region]) {
            // Collision: keep it close to where the model saw it — pick the
            // nearest free region to the concern's own anchor.
            const pa = g.regions[own] ?? g.regions.overall;
            const free = NUDGE_REGIONS.filter((r) => !used.has(r) && g.regions[r]);
            region =
              free.sort(
                (a, b) =>
                  Math.hypot(g.regions[a]!.x - pa.x, g.regions[a]!.y - pa.y) -
                  Math.hypot(g.regions[b]!.x - pa.x, g.regions[b]!.y - pa.y),
              )[0] ?? "overall";
          }
          used.add(region);
          const anchor = g.regions[region] ?? g.regions.overall;
          // Upper-face markers show their label ABOVE the circle so it doesn't
          // drop into the eye zone where a lower marker's circle sits.
          const up = anchor.y < g.box.y + g.box.height * 0.42;
          return { f, up, cx: anchor.x, cy: anchor.y, dia };
        });
      })()
    : shown.map((f) => {
        const b = boxFor(f);
        return { f, up: false, cx: b.x + b.width / 2, cy: b.y + b.height / 2, dia: b.width };
      });

  // A marker is a true CIRCLE on the photo. Because width% and height% are
  // measured against a NON-square container, equal fractions would draw an
  // ellipse — so the height fraction is scaled by the image aspect ratio, which
  // makes the pixel height equal the pixel width.
  const clamp01 = (n: number, half: number) => Math.min(Math.max(n, half), 1 - half);

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

      {placed.map(({ f, cx, cy, dia, up }) => {
        const isActive = active === f.index;
        const diaH = dia * ratio; // height fraction that yields equal pixels → circle
        const left = clamp01(cx, dia / 2) - dia / 2;
        const top = clamp01(cy, diaH / 2) - diaH / 2;
        return (
          <button
            key={f.index}
            type="button"
            onClick={() => onSelect(isActive ? null : f.index)}
            aria-label={`${label(f.feature)} — ${(f.region ?? "").replace(/_/g, " ")}`}
            className={`absolute transition-all ${isActive ? "z-20" : "z-10"}`}
            style={{
              left: `${left * 100}%`,
              top: `${top * 100}%`,
              width: `${dia * 100}%`,
              height: `${diaH * 100}%`,
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
