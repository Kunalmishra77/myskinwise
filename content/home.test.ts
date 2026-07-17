import { valueProps, processSteps, clinicalClaims } from "./home";

describe("home content", () => {
  it("has the 4 value-prop titles from WEBSITE_CONTENT.md §1", () => {
    const titles = valueProps.map((v) => v.title);
    expect(titles).toEqual([
      "Your Problems, Our Priority",
      "Expert Guidance, Every Step of the Way",
      "Seamless Service, Happy Journey",
      "Results that Speak for Themselves",
    ]);
  });

  it("has the 4 process steps, in order, with verbatim body copy", () => {
    expect(processSteps).toHaveLength(4);
    expect(processSteps.map((s) => s.body)).toEqual([
      "Take us through your skin journey for us to understand what you have been going through and how we can help.",
      "Our trained personnel will listen to your concerns and guide you with the right solutions for your skin issues.",
      "We develop a skin treatment routine to treat your problems and get it delivered at your doorstep.",
      "Follow routine and experience actual improvements in your skin. Do share your feedback too.",
    ]);
  });

  it("does not fabricate clinical-study percentages", () => {
    const all = JSON.stringify(clinicalClaims);
    expect(all).not.toMatch(/\d+%/);
    expect(clinicalClaims.claims).toHaveLength(4);
    expect(clinicalClaims.disclaimer).toContain("28 days");
  });
});
