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

export const observationSchema = z.object({
  face_visible: z.boolean(),
  image_quality: z.enum(["good", "fair", "poor", "unusable"]),
  // Each feature the model believes it can see, with how sure it is.
  features: z
    .array(
      z.object({
        feature: z.enum(VISIBLE_FEATURES),
        certainty: z.enum(["observed", "possible", "unclear"]),
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
    features: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          feature: { type: "string", enum: [...VISIBLE_FEATURES] },
          certainty: { type: "string", enum: ["observed", "possible", "unclear"] },
          note: { type: "string" },
        },
        required: ["feature", "certainty", "note"],
      },
    },
    limitations: { type: "string" },
    recommend_professional: { type: "boolean" },
  },
  required: ["face_visible", "image_quality", "features", "limitations", "recommend_professional"],
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
