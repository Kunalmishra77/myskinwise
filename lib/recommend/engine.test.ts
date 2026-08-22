import { recommendProducts } from "@/lib/recommend/engine";

/**
 * The engine must pick REAL catalogue products by concern + skin type, never
 * random, never more than one per routine step, always a coherent cleanse →
 * treat/support set. (The catalogue is 9 products, so some concerns have no
 * dedicated "treat" product yet — the engine then fills with real supportive
 * steps rather than inventing one.)
 */
describe("recommendProducts", () => {
  it("acne / oily → anti-acne cleanser + real supportive steps, no unrelated products", () => {
    const r = recommendProducts({ primaryConcern: "acne", skinType: "oily" })!;
    expect(r).not.toBeNull();
    expect(r.products.length).toBeGreaterThanOrEqual(2);
    expect(r.products[0]!.slug).toBe("anti-acne-cleanser");
    // Every product must genuinely address acne (or be daily protection/support).
    for (const p of r.products) {
      const ok = (p.concerns as string[]).includes("acne") || p.step === "protect";
      expect(ok).toBe(true);
    }
    // One product per routine step (no two cleansers etc.).
    expect(new Set(r.products.map((p) => p.step)).size).toBe(r.products.length);
  });

  it("acne (any skin type) → Anti-Acne Cleanser + Acne Gel", () => {
    for (const skinType of ["normal", "oily", "sensitive"] as const) {
      const r = recommendProducts({ primaryConcern: "acne", skinType })!;
      const slugs = r.products.map((p) => p.slug);
      expect(slugs).toContain("anti-acne-cleanser");
      expect(slugs).toContain("acne-gel");
    }
  });

  it("pigmentation / oily → Skin Lightening Gel; pigmentation / dry → depigmentation cream", () => {
    const oily = recommendProducts({ primaryConcern: "pigmentation", skinType: "oily" })!;
    expect(oily.products.map((p) => p.slug)).toContain("skin-lightening-gel");
  });

  it("other-issues → a coherent set, every product addresses the concern", () => {
    const r = recommendProducts({ primaryConcern: "other-issues" })!;
    expect(r.products.length).toBeGreaterThanOrEqual(2);
    for (const p of r.products) {
      const ok = (p.concerns as string[]).includes("other-issues") || p.step === "protect";
      expect(ok).toBe(true);
    }
  });

  it("pigmentation / dry → depigmentation cleanser + depigmentation cream", () => {
    const r = recommendProducts({ primaryConcern: "pigmentation", skinType: "dry" })!;
    const slugs = r.products.map((p) => p.slug);
    expect(slugs).toContain("depigmentation-cleanser");
    expect(slugs).toContain("depigmentation-cream");
  });

  it("dark-circles → includes the eye product, not random face products", () => {
    const r = recommendProducts({ primaryConcern: "dark-circles" })!;
    expect(r.products.map((p) => p.slug)).toContain("eye-lyte-cream");
  });

  it("secondary concern influences the third product without dropping the primary", () => {
    const r = recommendProducts({ primaryConcern: "acne", secondaryConcern: "pigmentation", skinType: "oily" })!;
    expect(r.products[0]!.slug).toBe("anti-acne-cleanser"); // primary keeps priority
    // pigmentation's treatment can appear as the supporting third product.
    expect(r.products.some((p) => (p.concerns as string[]).includes("pigmentation"))).toBe(true);
  });

  it("returns null for an unknown concern (never invents a product)", () => {
    expect(recommendProducts({ primaryConcern: "not-a-real-concern" })).toBeNull();
  });
});
