import type { Product, ProductImage, ProductSlug, ProductStep } from "./types";

/**
 * The Skinwise product catalogue.
 *
 * Transcribed from the label photographs in `Assets/Product-Assets/`. See
 * `./types.ts` for why several prices and quantities are null — the short
 * version is that they are not legible on the packaging, and a made-up MRP is
 * a made-up legal declaration.
 *
 * Shared brand details (manufacturer, marketer, care number) are identical on
 * every label, so they live in `BRAND_LABEL` below rather than being repeated
 * nine times.
 */
export const PRODUCTS: Product[] = [
  {
    slug: "anti-acne-cleanser",
    name: "Customised Anti-Acne Cleanser",
    tagline: "Oil Control & Acne Defense Formula",
    step: "cleanse",
    description:
      "Your Customised Anti-Acne Cleanser removes dirt, excess oil & impurities to help prevent breakouts. Designed for your skin's unique needs, it ensures targeted care for better results. Enriched with soothing ingredients, it leaves your skin fresh, clean and balanced.",
    directions:
      "Apply a small amount of cleanser to damp skin. Gently massage in circular motions, focusing on acne-prone areas. Rinse thoroughly with normal water. Use twice daily.",
    ingredients: [
      "EDTA", "Glycerine", "Betaine", "Aqua Gel", "Galfusion Gentle Care",
      "Decyl Glucoside", "Coco Glucoside", "Neem Extract", "Aloe Vera Extract",
      "Cucumber Extract", "Versathix", "Tween 20", "Tea Tree Oil", "Rosemary Oil",
    ],
    ingredientsPartial: false,
    mrp: 1299,
    netQuantity: "50ml",
    concerns: ["acne"],
    imageCount: 3,
  },
  {
    slug: "depigmentation-cleanser",
    name: "Customised Depigmentation Cleanser",
    tagline: "Dark Spots Correction Formula",
    step: "cleanse",
    description:
      "Your customised Depigmentation Cleanser is expertly formulated to address your unique skin concerns. This gentle yet potent formula deeply cleanses, effectively reducing dark spots and uneven pigmentation. With consistent use, it reveals a brighter & more radiant complexion.",
    directions: null,
    ingredients: [
      "EDTA", "Glycerine", "Betaine", "Aqua Gel", "Euxyl K 712",
      "Galfusion Gentle Care", "Decyl Glucoside", "Coco Glucoside",
      "Liquorice Extract", "Mulberry Extract", "Niacinamide", "Tween 20",
      "Lavender Oil", "Frankincense Oil", "Grapefruit Oil",
    ],
    ingredientsPartial: false,
    mrp: null,
    netQuantity: null,
    concerns: ["pigmentation"],
    imageCount: 4,
  },
  {
    slug: "glowing-cleanser",
    name: "Customised Glowing Cleanser",
    tagline: "Even Tone & Radiance Formula",
    step: "cleanse",
    description:
      "Your customised Glowing Cleanser is specially made for your unique skin needs. It removes impurities, supports skin renewal and enhances texture while maintaining hydration. Enriched with soothing elements, it restores balance leaving your skin refreshed, smooth & radiant.",
    directions: null,
    ingredients: [
      "EDTA", "Glycerine", "Aqua Gel", "Euxyl K712", "Galfusion Gentle Care",
      "Decyl Glucoside", "Coco Glucoside", "Liquorice Extract", "Mulberry Extract",
      "Goji Berry Extract", "Betaine", "Niacinamide", "Lavender Oil",
      "Frankincense Oil", "Grapefruit Oil",
    ],
    ingredientsPartial: false,
    mrp: null,
    netQuantity: null,
    concerns: ["other-issues"],
    imageCount: 4,
  },
  {
    slug: "depigmentation-cream",
    name: "Customised Depigmentation Cream",
    tagline: "Dark Spots Correction Formula",
    step: "treat",
    description:
      "Your customised Depigmentation Cream is formulated with unique ingredients tailored to your skin's needs, effectively reducing dark spots. This lightweight formula nourishes & revitalizes your skin, unveiling a radiant glow over time.",
    directions:
      "Cleanse your face with Skinwise cleanser. Take a small amount of your customised depigmentation cream and gently apply it all over your face until fully absorbed. Use at night only.",
    ingredients: [
      "Aqua", "Niacinamide", "Carbomer", "Glycerine", "Lecithin",
      "Tocopheryl Acetate", "Ascorbyl Palmitate", "Aloe Vera Extract",
      "Cucumber Extract", "Polysorbate 80", "Phenoxyethanol",
      "Ethylene Diamine Tetra Acetic Acid",
    ],
    ingredientsPartial: true,
    mrp: null,
    netQuantity: null,
    concerns: ["pigmentation"],
    imageCount: 3,
  },
  {
    slug: "glowing-gel",
    name: "Customised Glowing Gel",
    tagline: "Even Tone & Radiance Formula",
    step: "treat",
    description:
      "Your customised Glowing Gel is a lightweight, refreshing formula designed to enhance your skin's natural radiance and even tone. It hydrates, brightens and improves skin texture while effortlessly absorbing into the skin.",
    directions:
      "After cleansing, apply a small amount of the gel to your face and neck. Gently massage until fully absorbed. Use daily at night only or as directed by our skincare specialist.",
    ingredients: ["Aqua", "Niacinamide", "Glycerine", "Butylene Glycol", "Biotin"],
    ingredientsPartial: true,
    mrp: null,
    netQuantity: null,
    concerns: ["other-issues"],
    imageCount: 4,
  },
  {
    slug: "day-care-cream",
    name: "Customised Day Care Cream",
    tagline: "Daily Nourishment & Hydration Formula",
    step: "moisturise",
    description:
      "Your customised Day Care Cream is a lightweight, deeply nourishing formula that hydrates, protects and strengthens your skin barrier. Each ingredient is carefully selected to address your specific skin needs, ensuring optimal results.",
    directions: null,
    ingredients: [
      "Aqua", "Glycerine", "Sodium Hyaluronate", "Niacinamide", "D-Panthenol",
      "Mulberry Root Extract", "Liquorice Extract",
    ],
    ingredientsPartial: false,
    mrp: null,
    netQuantity: null,
    concerns: ["pigmentation", "acne", "other-issues"],
    imageCount: 4,
  },
  {
    slug: "spf-30",
    name: "Customised SPF-30",
    tagline: "Long-Lasting Sun Protection Formula",
    step: "protect",
    description:
      "Our SPF-30 sunscreen is tailored to your unique skin needs. This lightweight formula provides broad-spectrum protection against UV rays. It absorbs quickly, leaving a natural finish.",
    directions:
      "Apply a generous amount of sunscreen evenly on the face & exposed skin before sun exposure. Reapply every 2-3 hours for continued protection.",
    ingredients: [
      "Aqua", "Glycerine", "Polyacrylate Cross-Polymer", "Octyl Methoxy Cinnamate",
      "Titanium Dioxide", "Cetostearyl Alcohol", "Butylene Glycol", "Phospholipids",
      "Cucumber Extract", "Cetearyl Olivate", "Sorbitan Olivate", "Aloe Vera Extract",
      "Gotu Kola Extract", "Benzophenone-3", "Citric Acid", "Fragrance",
    ],
    ingredientsPartial: false,
    mrp: 899,
    netQuantity: "50g",
    concerns: ["pigmentation", "acne", "other-issues"],
    imageCount: 4,
  },
  {
    slug: "d-tan-pack",
    name: "Customised D-Tan Pack",
    tagline: "Deep Tan Repair Formula",
    step: "mask",
    description:
      "Your customised D-Tan Pack helps reduce tan, dullness & uneven skin tone, revealing your skin's natural glow. Designed specially for your skin's unique needs, it provides targeted care where it's needed most. Packed with calming & brightening ingredients, it leaves your skin feeling refreshed, clear & even-toned.",
    directions:
      "Apply a thin, even layer of the D-Tan Pack on clean skin — focusing on tanned or dull areas. Avoid the eye and lip area. Leave it on for 10–15 minutes or until dry, then wipe off with a damp cloth or rinse with normal water. 2–3 times a week for best results.",
    ingredients: [
      "Aqua", "Allantoin", "Glyceryl Mono Stearate", "Bilberry Extract",
      "Polysorbate 80", "Lemon Extract", "Niacinamide", "Orange Extract",
      "Lavender Oil", "Frankincense Oil", "Sodium Gluconate", "Phenonip",
    ],
    ingredientsPartial: false,
    mrp: null,
    netQuantity: null,
    concerns: ["pigmentation"],
    imageCount: 3,
  },
  {
    slug: "eye-lyte-cream",
    name: "Customised Eye Lyte Cream",
    tagline: "Under-Eye Brightening & De-Puffing Formula",
    step: "eye",
    description:
      "Your customised Eye Lyte is specially formulated to target dark circles, puffiness, and fine lines around the delicate under-eye area. Infused with soothing, brightening, and hydrating ingredients, it reduces tired-looking eyes, improves skin texture and supports a refreshed, well-rested look.",
    directions:
      "Take a small amount and gently dab under the eyes using your ring finger. Use daily — morning and night — for best results. Avoid contact with eyes.",
    ingredients: [
      "Niacinamide (Vitamin B3)", "Hyaluronic Acid", "Coenzyme Q-10", "Vitamin E",
      "Ferulic Acid", "Caffeine", "Milk Daisy Flower Extract",
      "Marine Collagen Protein", "Milk Protein", "Sodium PCA", "Simulgel EG",
      "Phenonip", "DMDM Hydantoin", "Shiitake Mushroom", "Licorice",
    ],
    ingredientsPartial: false,
    mrp: null,
    netQuantity: null,
    concerns: ["other-issues"],
    imageCount: 3,
  },
];

/**
 * Details printed identically on every label. Kept here so the product detail
 * page can show the statutory information without nine copies of it.
 */
export const BRAND_LABEL = {
  manufacturedBy:
    "Meenakshi Ayurvedic, Kheri Road, Kheri Kalan, Near Kheri Hospital, Faridabad-121002",
  marketedBy:
    "Razorbill Pvt. Ltd., D-472, 2nd Floor, Ramphal Chowk, Dwarka Sec-7, New Delhi-110075",
  careNumber: "+919211530070",
  careEmail: "support@myskinwise.com",
  storage: "Store in a cool & dry place, away from direct sunlight.",
  caution: "Avoid contact with eyes. If irritation occurs, discontinue use.",
  externalUseOnly: "For external use only.",
} as const;

/** Routine order, so a regimen reads the way it is actually applied. */
const STEP_ORDER: Record<ProductStep, number> = {
  cleanse: 0,
  treat: 1,
  eye: 2,
  moisturise: 3,
  protect: 4,
  mask: 5,
};

export const PRODUCTS_BY_SLUG: ReadonlyMap<ProductSlug, Product> = new Map(
  PRODUCTS.map((p) => [p.slug, p]),
);

export function productBySlug(slug: string): Product | null {
  return PRODUCTS_BY_SLUG.get(slug as ProductSlug) ?? null;
}

/**
 * THE source of product image paths. Nothing else in the app builds a
 * `/products/...` URL by hand.
 *
 * Filenames are positional (`1.jpg`, `2.jpg`, …) and follow the order of the
 * photographs in the supplied PDF, which puts the presentation shot first.
 * Alt text is deliberately generic for the secondary shots: they are label
 * panels, and which panel a given shot shows varies between products, so
 * claiming "ingredients panel" would be wrong about half the time.
 */
export function productImages(product: Product): ProductImage[] {
  return Array.from({ length: product.imageCount }, (_, i) => ({
    src: `/products/${product.slug}/${i + 1}.jpg`,
    alt: i === 0 ? product.name : `${product.name} — packaging view ${i + 1}`,
    primary: i === 0,
  }));
}

/** The single image used wherever there is only room for one. */
export function primaryProductImage(product: Product): ProductImage {
  // imageCount is >= 1 for every catalogue entry, asserted by the test suite.
  return productImages(product)[0]!;
}

/** Products addressing a concern, in the order they'd be applied. */
export function productsForConcern(concern: string): Product[] {
  return PRODUCTS.filter((p) => (p.concerns as string[]).includes(concern)).sort(
    (a, b) => STEP_ORDER[a.step] - STEP_ORDER[b.step],
  );
}

export function sortByRoutineStep(products: Product[]): Product[] {
  return [...products].sort((a, b) => STEP_ORDER[a.step] - STEP_ORDER[b.step]);
}

/**
 * Best-effort match from an expert's free-text `formulation_ref` to a
 * catalogue product.
 *
 * Regimen items predate the catalogue and store whatever the expert typed, so
 * this must never throw or guess wildly: an unmatched ref renders as plain
 * text exactly as it does today. Matching is on a normalised comparison of
 * the slug and the printed name, plus a small set of the abbreviations that
 * appear on the source filenames ("d-tan", "spf"), so "SPF 30", "spf-30" and
 * "Customised SPF-30" all resolve to the same product.
 */
export function matchFormulation(ref: string): Product | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const target = norm(ref);
  if (!target) return null;

  for (const p of PRODUCTS) {
    if (norm(p.slug) === target || norm(p.name) === target) return p;
  }
  // Fall back to containment, longest slug first so "depigmentation-cleanser"
  // is preferred over a shorter slug that happens to be a substring.
  const byLength = [...PRODUCTS].sort((a, b) => b.slug.length - a.slug.length);
  for (const p of byLength) {
    if (target.includes(norm(p.slug)) || norm(p.name).includes(target)) return p;
  }
  return null;
}
