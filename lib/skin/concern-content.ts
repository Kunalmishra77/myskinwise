/**
 * Display metadata for each measured concern — label, plain-language
 * (appearance-based, non-diagnostic) explanation, and the overlay colour that
 * matches the engine's evidence mask. Client-safe (pure data).
 */

export type ConcernMeta = {
  label: string;
  blurb: string;
  /** rgb, matches skin-cv-service mask_renderer CONCERN_COLOURS. */
  rgb: [number, number, number];
};

export const CONCERN_META: Record<string, ConcernMeta> = {
  pigmentation: {
    label: "Pigmentation",
    blurb: "Spots and areas that look darker than your overall tone — often from sun or past marks.",
    rgb: [150, 90, 50],
  },
  redness: {
    label: "Redness",
    blurb: "Areas that appear redder — can come and go with sensitivity or heat.",
    rgb: [220, 60, 60],
  },
  dark_circles: {
    label: "Dark circles",
    blurb: "How much lighter your cheeks look than the skin just under your eyes.",
    rgb: [120, 80, 160],
  },
  wrinkles: {
    label: "Fine lines",
    blurb: "Fine lines and creases the photo picks up — mainly the forehead and around the eyes.",
    rgb: [40, 160, 160],
  },
  pores: {
    label: "Pores",
    blurb: "How visible the pores look, mostly across the nose and cheeks.",
    rgb: [60, 120, 220],
  },
  oiliness: {
    label: "Shine / oiliness",
    blurb: "Shine on the skin at the moment of the photo — strongest across the T-zone.",
    rgb: [230, 200, 60],
  },
  texture: {
    label: "Texture",
    blurb: "How even or smooth the surface looks across the cheeks.",
    rgb: [90, 180, 90],
  },
  acne: {
    label: "Breakouts",
    blurb: "Active breakouts the photo picks up. Detection is Beta — a Skinwise expert confirms.",
    rgb: [230, 90, 90],
  },
};

export const SEVERITY_LABEL: Record<string, string> = {
  clear: "Clear",
  mild: "Mild",
  moderate: "Moderate",
  significant: "Noticeable",
};

/** Order concerns most-noticeable first (lowest score = most concern). */
export function byConcernSeverity(a: { score: number | null }, b: { score: number | null }): number {
  const sa = a.score ?? 999;
  const sb = b.score ?? 999;
  return sa - sb;
}
