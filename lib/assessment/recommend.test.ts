import { buildRegimenOutline } from "@/lib/assessment/recommend";
import type { SubmitAssessmentInput } from "@/lib/assessment/schema";

function input(overrides: Partial<SubmitAssessmentInput["answers"]> = {}, concern = "acne") {
  return {
    concern,
    answers: { skin_type: "oily", severity: "moderate", ...overrides },
    contact: { name: "Test Person", phone: "9876543210" },
    consent: { contactConsent: true, policyVersion: "2026-07-21" },
  } as SubmitAssessmentInput;
}

describe("safety exclusions", () => {
  // These are the highest-consequence rules in the product. They must be
  // hard exclusions, not preferences, and must survive any future edit.
  it("never suggests retinol or salicylic acid to a pregnant user", () => {
    const out = buildRegimenOutline(input({ pregnancy: "pregnant" }));
    const names = out.ingredients.map((i) => i.slug);
    expect(names).not.toContain("retinol");
    expect(names).not.toContain("salicylic-acid");
  });

  it("applies the same exclusions while breastfeeding", () => {
    const out = buildRegimenOutline(input({ pregnancy: "breastfeeding" }));
    expect(out.ingredients.map((i) => i.slug)).not.toContain("retinol");
  });

  it("explains what it withheld rather than silently dropping it", () => {
    const out = buildRegimenOutline(input({ pregnancy: "pregnant" }));
    expect(out.excluded.length).toBeGreaterThan(0);
    for (const item of out.excluded) {
      expect(item.because.length).toBeGreaterThan(0);
    }
  });

  it("holds retinol back from sensitive skin", () => {
    const out = buildRegimenOutline(input({ skin_type: "sensitive" }, "pigmentation"));
    expect(out.ingredients.map((i) => i.slug)).not.toContain("retinol");
  });

  it("does suggest retinol when nothing contraindicates it", () => {
    const out = buildRegimenOutline(input({ skin_type: "dry", pregnancy: "no" }, "pigmentation"));
    expect(out.ingredients.map((i) => i.slug)).toContain("retinol");
  });
});

describe("escalation to a doctor", () => {
  it("recommends professional care for deep painful breakouts", () => {
    const out = buildRegimenOutline(input({ acne_type: ["nodules"] }));
    expect(out.recommendProfessional).toBe(true);
    expect(out.professionalReason).toBeTruthy();
  });

  it("recommends professional care when prescription treatment has already failed", () => {
    const out = buildRegimenOutline(
      input({ severity: "significant", tried_before: "prescription" }),
    );
    expect(out.recommendProfessional).toBe(true);
  });

  it("does not escalate an ordinary mild case", () => {
    const out = buildRegimenOutline(input({ severity: "mild", tried_before: "nothing" }));
    expect(out.recommendProfessional).toBe(false);
  });
});

describe("traceability", () => {
  it("records a rule for every outline it produces", () => {
    const out = buildRegimenOutline(input());
    expect(out.rules.length).toBeGreaterThan(0);
    for (const rule of out.rules) {
      expect(rule.id).toBeTruthy();
      expect(rule.because).toBeTruthy();
    }
  });

  it("gives every suggested ingredient a stated reason", () => {
    const out = buildRegimenOutline(input());
    expect(out.ingredients.length).toBeGreaterThan(0);
    for (const ingredient of out.ingredients) {
      expect(ingredient.because, `${ingredient.slug} has no reason`).toBeTruthy();
    }
  });

  it("copes with an unknown skin type instead of failing", () => {
    const out = buildRegimenOutline(input({ skin_type: "unsure" }));
    expect(out.skinTypeLabel).toBeNull();
    expect(out.rules.some((r) => r.id === "skin-type-unknown")).toBe(true);
  });
});

describe("output never states a treatment claim", () => {
  it("avoids cure and treatment language in all generated prose", () => {
    const banned = /\b(cure[sd]?|treats?|heals?|permanent(ly)?|guarantee[ds]?|diagnos)/i;
    for (const concern of ["acne", "pigmentation", "other-issues"]) {
      for (const pregnancy of ["no", "pregnant"]) {
        const out = buildRegimenOutline(input({ pregnancy }, concern));
        const prose = [
          ...out.guidance,
          ...out.rules.map((r) => r.because),
          ...out.ingredients.map((i) => i.because),
          ...out.excluded.map((e) => e.because),
          out.professionalReason ?? "",
        ].join(" ");
        expect(prose, `${concern}/${pregnancy} produced a prohibited claim`).not.toMatch(banned);
      }
    }
  });
});
