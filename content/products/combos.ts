import { productsForConcern } from "@/content/products";
import type { Product, ProductStep } from "@/content/products/types";

/**
 * A suggested starter routine ("combo") for a concern, derived from the
 * catalogue rather than hand-authored — so a combo can never reference a
 * product that does not exist, and adding a product to a concern updates the
 * combo automatically.
 *
 * The rule is deliberately a real routine, not a random bundle: pick at most
 * three products, one per routine step in the order you would apply them
 * (cleanse, then treat, then protect/moisturise). That yields a coherent
 * two-to-three step set — a cleanser, a treatment, a protectant — which is
 * what a starter routine actually is.
 *
 * It is a SUGGESTION, and the copy around it says so: the expert confirms the
 * final routine after a Skin Check. Nothing here claims it is prescribed.
 */
const STEP_PRIORITY: ProductStep[] = ["cleanse", "treat", "protect", "moisturise", "mask", "eye"];

export type Combo = {
  concern: string;
  products: Product[];
};

export function comboForConcern(concern: string): Combo | null {
  const products = productsForConcern(concern);
  if (products.length < 2) return null;

  const chosen: Product[] = [];
  for (const step of STEP_PRIORITY) {
    if (chosen.length >= 3) break;
    const p = products.find((x) => x.step === step && !chosen.includes(x));
    if (p) chosen.push(p);
  }
  // If a concern is thin on steps, pad from whatever remains so a combo is
  // still a set of at least two.
  for (const p of products) {
    if (chosen.length >= 3) break;
    if (!chosen.includes(p)) chosen.push(p);
  }

  return chosen.length >= 2 ? { concern, products: chosen } : null;
}
