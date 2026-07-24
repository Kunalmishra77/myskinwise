import type { ImageKey } from "@/content/assets";
import type { ConcernSlug } from "@/content/concerns/types";
import type { SkinTypeSlug } from "@/content/skin-types/types";

export type IngredientSlug =
  | "vitamin-c"
  | "niacinamide"
  | "salicylic-acid"
  | "kojic-acid"
  | "retinol"
  | "alpha-arbutin";

/**
 * One researched ingredient, as used across the Skinwise concern pages.
 *
 * Every field here traces to material the brand already published — the
 * `summary` lines come from the written descriptions attached to the
 * ingredient photography in `content/assets.ts`, and the concern/skin-type
 * links come from the "Research-Driven Ingredients" tables in
 * `content/concerns/*`. Nothing on these pages is invented.
 *
 * `considerations` deliberately carries general, uncontroversial usage
 * guidance only (patch testing, sun sensitivity, pregnancy caution) — the
 * sort of thing printed on the products themselves. It never states a
 * clinical outcome, a percentage, or a treatment claim. See the platform
 * architecture spec §8.2 for the claim-language rules this obeys.
 */
export type Ingredient = {
  slug: IngredientSlug;
  /** Display name, e.g. "Vitamin C". */
  name: string;
  /** Short descriptor shown under the name, e.g. "Brightening antioxidant". */
  role: string;
  /** One-sentence benefit statement, sourced from the brand's own asset copy. */
  summary: string;
  /** Photograph from the IMAGES map. */
  image: ImageKey;
  /** Plain-language explanation of what the ingredient is. */
  whatItIs: string;
  /** What it is commonly used for, in appearance-based language. */
  commonlyUsedFor: string[];
  /** Who tends to reach for it. */
  suitedTo: string;
  /** General usage guidance. Never a medical instruction. */
  considerations: string[];
  /** Where it usually sits in a routine. */
  routineNote: string;
  /** Concerns this ingredient appears against in the concern content. */
  concerns: ConcernSlug[];
  /** Skin types whose sourced regimen includes this ingredient. */
  skinTypes: SkinTypeSlug[];
};
