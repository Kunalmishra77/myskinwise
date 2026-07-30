import { describe, expect, it } from "vitest";
import { comboForConcern } from "@/content/products/combos";
import { PRODUCTS_BY_SLUG } from "@/content/products";
import { buildOrderMessage } from "@/lib/cart/use-cart";

describe("combo derivation", () => {
  it("builds a real 2-3 step routine for each concern", () => {
    for (const concern of ["acne", "pigmentation", "other-issues"]) {
      const combo = comboForConcern(concern);
      expect(combo, `no combo for ${concern}`).not.toBeNull();
      expect(combo!.products.length).toBeGreaterThanOrEqual(2);
      expect(combo!.products.length).toBeLessThanOrEqual(3);
    }
  });

  it("only ever references real catalogue products", () => {
    for (const concern of ["acne", "pigmentation", "other-issues"]) {
      for (const p of comboForConcern(concern)!.products) {
        expect(PRODUCTS_BY_SLUG.has(p.slug)).toBe(true);
      }
    }
  });

  it("leads with a cleanser — a routine is applied in order", () => {
    // The first product should be the cleanse step where the concern has one.
    for (const concern of ["acne", "pigmentation", "other-issues"]) {
      expect(comboForConcern(concern)!.products[0]!.step).toBe("cleanse");
    }
  });

  it("has no duplicate products in a combo", () => {
    for (const concern of ["acne", "pigmentation", "other-issues"]) {
      const slugs = comboForConcern(concern)!.products.map((p) => p.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("returns null for an unknown concern rather than an empty bundle", () => {
    expect(comboForConcern("eczema")).toBeNull();
  });
});

describe("WhatsApp order message", () => {
  it("shows a real price where one exists and never invents one", () => {
    const priced = PRODUCTS_BY_SLUG.get("spf-30" as never)!; // ₹899
    const unpriced = PRODUCTS_BY_SLUG.get("d-tan-pack" as never)!; // no printed price
    const msg = buildOrderMessage([
      { product: priced, qty: 2 },
      { product: unpriced, qty: 1 },
    ]);

    expect(msg).toContain("Customised SPF-30");
    expect(msg).toContain("₹899");
    expect(msg).toContain("price to confirm");
    // Quantities are shown.
    expect(msg).toContain("× 2");
    // The subtotal sums only the priced line (2 × 899 = 1,798), and flags the
    // unpriced item rather than inventing a figure for it.
    expect(msg).toContain("₹1,798");
    // The unpriced product must NOT get a rupee figure.
    expect(msg).not.toMatch(/D-Tan Pack × \d+ \(₹/);
  });

  it("is a plain order request, not a payment or a claim", () => {
    const msg = buildOrderMessage([{ product: PRODUCTS_BY_SLUG.get("spf-30" as never)!, qty: 1 }]);
    expect(msg).toContain("Skinwise order request");
    expect(msg).not.toMatch(/\bcure\b|\bguaranteed\b|\bpay now\b/i);
  });
});
