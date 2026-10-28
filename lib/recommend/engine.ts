import { PRODUCTS, sortByRoutineStep } from "@/content/products";
import type { Product, ProductSlug } from "@/content/products/types";

/**
 * Deterministic, knowledge-base-driven product recommendation.
 *
 * The chat agent must NEVER pick products from generic AI knowledge — it
 * asks this engine, which selects from the REAL Skinwise catalogue using
 * explicit rules over the customer's concern + skin type. Every product it
 * returns has a traceable reason (concern match + skin-type suitability), so
 * "why this product?" always has an answer.
 *
 * SCOPE NOTE: the live catalogue is 9 real products (content/products). Several
 * products referenced in the product brief (Acne Gel, Acne Lightening Gel,
 * Pigmentation Serum, Skin Lightening Gel, Rejuvten Face Mask) are NOT in the
 * app yet — they need real label data before they can be added. Until then the
 * engine recommends only from what genuinely exists; it never invents a product.
 *
 * Skin-type suitability below is RECOMMENDATION LOGIC (which real product suits
 * which skin type), derived from each product's real formula line — not invented
 * product data. It is the one table to tune as the catalogue grows.
 */

export type SkinType = "oily" | "dry" | "normal" | "combination" | "sensitive";

// Which skin types each REAL product is best suited to. An empty list = suits
// all skin types (cleansers/SPF/eye are broadly suitable).
const SKIN_FIT: Partial<Record<ProductSlug, SkinType[]>> = {
  "anti-acne-cleanser": ["oily", "combination", "normal"],
  "glowing-cleanser": ["dry", "normal", "sensitive"],
  "depigmentation-cream": ["dry", "normal", "sensitive"], // richer night cream
  "glowing-gel": ["oily", "combination", "normal"], // lightweight gel
  "day-care-cream": ["dry", "normal", "sensitive"],
  // Owner products, per the brief's skin-type rules for pigmentation:
  "skin-lightening-gel": ["oily", "combination", "sensitive"], // pigmentation, oily/sensitive
  "pigmentation-lotion": ["normal", "combination"], // pigmentation, normal/combination
  // acne-gel (only acne treatment) and pigmentation-serum (escalation) suit all
  // skin types — no fit entry.
};

function suitsSkin(p: Product, skin?: SkinType): boolean {
  if (!skin) return true;
  const fit = SKIN_FIT[p.slug];
  return !fit || fit.includes(skin);
}

/** Products for a concern, skin-type-suitable first, in routine order. */
function forConcern(concern: string, skin?: SkinType): Product[] {
  const matches = PRODUCTS.filter((p) => (p.concerns as string[]).includes(concern));
  const fit = matches.filter((p) => suitsSkin(p, skin));
  const rest = matches.filter((p) => !suitsSkin(p, skin));
  return [...sortByRoutineStep(fit), ...sortByRoutineStep(rest)];
}

export type Recommendation = {
  products: Product[];
  /** One short reason per product, parallel to `products` — for the UI. */
  reasons: string[];
  primaryConcern: string;
  secondaryConcern?: string;
};

/**
 * Select up to 3 products: a CLEANSER + a TREATMENT for the primary concern
 * (skin-type refined), then a THIRD driven by the secondary concern if there is
 * one, else a supportive protect/eye/mask/moisturise step. Never random, never
 * more than one product per routine step, always real catalogue products.
 */
export function recommendProducts(input: {
  primaryConcern: string;
  secondaryConcern?: string;
  skinType?: SkinType;
}): Recommendation | null {
  const { primaryConcern, secondaryConcern, skinType } = input;
  const primary = forConcern(primaryConcern, skinType);
  if (primary.length === 0) return null;

  const chosen: Product[] = [];
  const reasons: string[] = [];
  const usedSteps = new Set<string>();
  const take = (p: Product | undefined, reason: string) => {
    if (!p || chosen.includes(p) || usedSteps.has(p.step)) return;
    chosen.push(p);
    reasons.push(reason);
    usedSteps.add(p.step);
  };

  // 1) Cleanser for the primary concern.
  take(primary.find((p) => p.step === "cleanse"), `Cleanser for your ${primaryConcern.replace(/-/g, " ")}`);
  // 2) Treatment for the primary concern (skin-type already ordered it first).
  take(primary.find((p) => p.step === "treat"), `Targets your ${primaryConcern.replace(/-/g, " ")}`);

  // 3) Secondary concern's treatment/cleanser, else a supportive step.
  if (secondaryConcern) {
    const sec = forConcern(secondaryConcern, skinType);
    take(sec.find((p) => p.step === "treat"), `Also helps your ${secondaryConcern.replace(/-/g, " ")}`);
    take(sec.find((p) => p.step === "eye"), `For your ${secondaryConcern.replace(/-/g, " ")}`);
    take(sec.find((p) => p.step === "mask"), `Supports your ${secondaryConcern.replace(/-/g, " ")}`);
  }
  // Fill any remaining slot with a supportive step from the primary concern:
  // protect (SPF) first — daily protection suits almost everyone.
  for (const step of ["protect", "eye", "mask", "moisturise"] as const) {
    if (chosen.length >= 3) break;
    take(
      primary.find((p) => p.step === step),
      step === "protect" ? "Daily sun protection" : `Supports your ${primaryConcern.replace(/-/g, " ")}`,
    );
  }

  const ordered = sortByRoutineStep(chosen);
  // Keep reasons aligned to the reordered products.
  const reasonBySlug = new Map(chosen.map((p, i) => [p.slug, reasons[i]!]));
  return chosen.length >= 2
    ? {
        products: ordered,
        reasons: ordered.map((p) => reasonBySlug.get(p.slug) ?? ""),
        primaryConcern,
        secondaryConcern,
      }
    : null;
}
