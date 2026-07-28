import { z } from "zod";

/**
 * The structured observation the vision model must return, and the ONLY
 * shape the rest of the system trusts. Raw model text is never the source of
 * truth (requirement §7): the model is forced to return this schema, it is
 * validated here, and anything malformed is rejected rather than guessed at.
 *
 * The vocabulary is deliberately observational, never diagnostic. The model
 * reports what is *visible* ("visible redness"), the framework never lets it
 * assert a *condition* ("rosacea"). `certainty` on each feature keeps the
 * Observed / Inferred / Unknown distinction the spec asks for.
 */

export const VISIBLE_FEATURES = [
  "visible_shine_or_oiliness",
  "visible_dryness_or_flaking",
  "visible_redness",
  "visible_uneven_tone",
  "visible_dark_spots",
  "visible_blemishes",
  "visible_texture_irregularity",
  "visible_pores",
] as const;

/**
 * Coarse face regions used to place a marker on the photo.
 *
 * Deliberately coarse, and image-relative (left = the left of the picture),
 * because the marker is anchored to where a KIND of characteristic typically
 * shows, not to a detected pixel. The model reports "shine is visible, mainly
 * the nose/forehead"; it is not locating a lesion. Keeping the vocabulary this
 * blunt is what stops a marker from reading as a precise medical finding.
 */
export const FACE_REGIONS = [
  "forehead",
  "left_cheek",
  "right_cheek",
  "nose",
  "chin",
  "under_eye_left",
  "under_eye_right",
  "jaw",
  "overall",
] as const;

export const observationSchema = z.object({
  face_visible: z.boolean(),
  image_quality: z.enum(["good", "fair", "poor", "unusable"]),
  /**
   * Where the face sits in the image, normalised 0..1 (top-left origin). Used
   * only to anchor region markers to the actual face; the client clamps it and
   * falls back to a centred box if the model returns something implausible.
   */
  face_box: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  // Each feature the model believes it can see, with how sure it is, and the
  // coarse region it is mainly visible in.
  features: z
    .array(
      z.object({
        feature: z.enum(VISIBLE_FEATURES),
        certainty: z.enum(["observed", "possible", "unclear"]),
        region: z.enum(FACE_REGIONS),
        note: z.string().max(240),
      }),
    )
    .max(8),
  limitations: z.string().max(400),
  // The model may FLAG that something looks like it needs a person, but it
  // may never name a condition. This only ever routes to escalation.
  recommend_professional: z.boolean(),
});

export type Observation = z.infer<typeof observationSchema>;

/** The JSON Schema handed to OpenAI's structured-output mode. */
export const OBSERVATION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    face_visible: { type: "boolean" },
    image_quality: { type: "string", enum: ["good", "fair", "poor", "unusable"] },
    face_box: {
      type: "object",
      additionalProperties: false,
      properties: {
        x: { type: "number" },
        y: { type: "number" },
        width: { type: "number" },
        height: { type: "number" },
      },
      required: ["x", "y", "width", "height"],
    },
    features: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          feature: { type: "string", enum: [...VISIBLE_FEATURES] },
          certainty: { type: "string", enum: ["observed", "possible", "unclear"] },
          region: { type: "string", enum: [...FACE_REGIONS] },
          note: { type: "string" },
        },
        required: ["feature", "certainty", "region", "note"],
      },
    },
    limitations: { type: "string" },
    recommend_professional: { type: "boolean" },
  },
  required: ["face_visible", "image_quality", "face_box", "features", "limitations", "recommend_professional"],
} as const;

/** Human-readable labels for the customer view. */
export const FEATURE_LABELS: Record<(typeof VISIBLE_FEATURES)[number], string> = {
  visible_shine_or_oiliness: "Shine or oiliness",
  visible_dryness_or_flaking: "Dryness or flaking",
  visible_redness: "Redness",
  visible_uneven_tone: "Uneven tone",
  visible_dark_spots: "Dark spots",
  visible_blemishes: "Blemishes",
  visible_texture_irregularity: "Texture",
  visible_pores: "Visible pores",
};

export const CERTAINTY_LABELS: Record<"observed" | "possible" | "unclear", string> = {
  observed: "Clearly visible",
  possible: "Possibly present",
  unclear: "Hard to tell from this photo",
};

/**
 * Where each region sits WITHIN the face box, as a fraction of it (0..1).
 * The client multiplies these by the (clamped) face_box to get a point on the
 * actual photo. These are anatomical averages for a roughly front-on face —
 * enough to put a marker in the right area, which is all a region marker
 * claims to do.
 */
export const REGION_POINTS: Record<(typeof FACE_REGIONS)[number], { x: number; y: number }> = {
  forehead: { x: 0.5, y: 0.16 },
  under_eye_left: { x: 0.34, y: 0.4 },
  under_eye_right: { x: 0.66, y: 0.4 },
  left_cheek: { x: 0.27, y: 0.58 },
  right_cheek: { x: 0.73, y: 0.58 },
  nose: { x: 0.5, y: 0.52 },
  chin: { x: 0.5, y: 0.9 },
  jaw: { x: 0.5, y: 0.8 },
  overall: { x: 0.5, y: 0.5 },
};

/**
 * A sensible region for each feature, used only if the model omits one — so a
 * marker still lands somewhere reasonable (shine on the T-zone, dark circles
 * under the eye) rather than defaulting to dead centre.
 */
export const DEFAULT_REGION: Record<(typeof VISIBLE_FEATURES)[number], (typeof FACE_REGIONS)[number]> = {
  visible_shine_or_oiliness: "nose",
  visible_dryness_or_flaking: "left_cheek",
  visible_redness: "right_cheek",
  visible_uneven_tone: "left_cheek",
  visible_dark_spots: "right_cheek",
  visible_blemishes: "chin",
  visible_texture_irregularity: "forehead",
  visible_pores: "nose",
};
