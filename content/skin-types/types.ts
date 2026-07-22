import type { IngredientSlug } from "@/content/ingredients/types";

export type SkinTypeSlug = "dry" | "oily" | "combination" | "sensitive";

/**
 * One skin type, as Skinwise's own regimen tables define it.
 *
 * The `ingredients` list and the `aim` line are transcribed from the
 * "Ingredients by skin type" tables in `Assets/WEBSITE_CONTENT.md` §5 —
 * these are the brand's real, differentiated recommendations, not a generic
 * skincare taxonomy. `characteristics`, `challenges` and `mistakes` are
 * written in plain appearance-based language and make no clinical claim.
 */
export type SkinType = {
  slug: SkinTypeSlug;
  /** Display name, e.g. "Oily skin". */
  name: string;
  /** One-line descriptor for cards and meta descriptions. */
  summary: string;
  /** How this skin type usually presents day to day. */
  characteristics: string[];
  /** What people with this skin type commonly struggle with. */
  challenges: string[];
  /** The sourced aim of the regimen for this type. */
  aim: string;
  /**
   * The sourced ingredient set for this skin type. Free-text rather than
   * `IngredientSlug[]` because the source tables name ingredients Skinwise
   * has not published a full page for (Hyaluronic Acid, Mandelic Acid,
   * Centella Asiatica...). `linkedIngredients` carries the subset that does
   * have a page, so the two never drift apart.
   */
  ingredients: string[];
  /** Ingredients from this set that have their own page. */
  linkedIngredients: IngredientSlug[];
  /** Common missteps, in everyday language. */
  mistakes: string[];
};
