import { describe, expect, it } from "vitest";
import { concernGuidance, isKnownConcern } from "@/lib/ai/concern-context";

describe("concern-specific chat steering", () => {
  it("returns null for an unknown concern rather than steering blindly", () => {
    expect(concernGuidance("eczema")).toBeNull();
    expect(concernGuidance("")).toBeNull();
    expect(isKnownConcern("acne")).toBe(true);
    expect(isKnownConcern("nonsense")).toBe(false);
  });

  it("gives acne its OWN questions, not the generic set", () => {
    const acne = concernGuidance("acne")!;
    expect(acne).toContain("Focused help");
    // Acne-specific Skin Check questions, reused verbatim.
    expect(acne).toMatch(/breakouts usually look like/i);
    expect(acne).toMatch(/leave marks behind/i);
  });

  it("gives pigmentation a DIFFERENT set of questions", () => {
    const pig = concernGuidance("pigmentation")!;
    expect(pig).toMatch(/direct sun/i);
    expect(pig).toMatch(/sunscreen/i);
    // And not the acne-only questions.
    expect(pig).not.toMatch(/breakouts usually look like/i);
  });

  it("the two concerns genuinely steer differently", () => {
    expect(concernGuidance("acne")).not.toEqual(concernGuidance("pigmentation"));
  });

  it("never introduces a diagnosis or a banned claim into the steering text", () => {
    for (const slug of ["acne", "pigmentation", "other-issues"]) {
      const text = concernGuidance(slug)!.toLowerCase();
      // The steering block must not itself assert a cure/guarantee.
      expect(text).not.toMatch(/\bcure\b|\bguaranteed\b|\bpermanently\b/);
    }
  });
});
