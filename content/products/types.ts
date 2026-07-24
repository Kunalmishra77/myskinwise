import type { ConcernSlug } from "@/content/concerns/types";

export type ProductSlug =
  | "anti-acne-cleanser"
  | "depigmentation-cleanser"
  | "glowing-cleanser"
  | "depigmentation-cream"
  | "glowing-gel"
  | "day-care-cream"
  | "spf-30"
  | "d-tan-pack"
  | "eye-lyte-cream";

/** Where a product sits in a routine. Drives ordering in a regimen. */
export type ProductStep = "cleanse" | "treat" | "moisturise" | "protect" | "mask" | "eye";

/**
 * One Skinwise formulation.
 *
 * EVERY field is transcribed from the physical product labels photographed in
 * `Assets/Product-Assets/*.pdf`. Nothing is inferred, and nothing is written
 * to make a page look fuller.
 *
 * That rule has a visible consequence: most products have `mrp: null`. The
 * jars photograph with the statutory panel wrapped around a curve, so the
 * price is genuinely unreadable on seven of the nine. Guessing a price for a
 * regulated cosmetic — or copying one product's price onto another — would be
 * inventing a legal declaration, so those render as "price on confirmation"
 * until the client supplies the real figures. Same for `netQuantity`.
 *
 * `ingredients` is likewise only what is legible. Where the label text runs
 * off the curve of a jar, `ingredientsPartial` is true and the UI says the
 * list is abridged rather than presenting a truncated INCI list as complete —
 * an incomplete ingredient list read as complete is an allergy risk.
 */
export type Product = {
  slug: ProductSlug;
  /** Product name exactly as printed on the label. */
  name: string;
  /** The formula line printed under the name, e.g. "Oil Control & Acne Defense Formula". */
  tagline: string;
  step: ProductStep;
  /** Description paragraph, transcribed from the label. */
  description: string;
  /** Directions for use, transcribed from the label. Null when not legible. */
  directions: string | null;
  /** INCI-style actives list as printed. May be abridged — see `ingredientsPartial`. */
  ingredients: string[];
  /** True when the label text was clipped by the packaging curve. */
  ingredientsPartial: boolean;
  /** Maximum retail price in rupees, or null when not legible on the label. */
  mrp: number | null;
  /** Net quantity as printed, e.g. "50ml". Null when not legible. */
  netQuantity: string | null;
  /** Concerns this product addresses, per its printed formula line. */
  concerns: ConcernSlug[];
  /** How many photographs exist for this product in `public/products/<slug>/`. */
  imageCount: number;
};

/** A single product photograph, resolved from the slug. */
export type ProductImage = {
  src: string;
  alt: string;
  /** True for the shot used as the product's primary presentation image. */
  primary: boolean;
};
