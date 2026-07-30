import { CONCERNS } from "./index";
import { FAQS } from "@/content/faqs";

describe("CONCERNS", () => {
  it("each concern is well-formed and typo-free", () => {
    for (const c of Object.values(CONCERNS)) {
      expect(c.process.length).toBe(4);
      expect(c.types.length).toBeGreaterThan(0);
      expect(c.ingredientsByType.length).toBeGreaterThan(0);
      expect(JSON.stringify(c)).not.toMatch(/pigmetnation/i);
    }
  });

  it("pigmentation and acne have transcribed causes", () => {
    expect(CONCERNS.pigmentation.causes.length).toBeGreaterThan(0);
    expect(CONCERNS.acne.causes.length).toBeGreaterThan(0);
  });

  it("other-issues has its own causes, never the copy-pasted acne block (content-accuracy fix)", () => {
    // other-issues now carries causes authored specifically for it (ageing,
    // sun, dehydration, dead-skin buildup, lifestyle). The content-accuracy
    // guarantee is not "empty" but "not the acne causes" — the original bug
    // was the Acne "Reasons of Acne" block (Excess Oil, Bacterial Growth,
    // Clogged Pores, ...) copy-pasted onto this page.
    const titles = CONCERNS["other-issues"].causes.map((c) => c.title.toLowerCase());
    expect(titles.length).toBeGreaterThan(0);
    for (const acneTitle of CONCERNS.acne.causes.map((c) => c.title.toLowerCase())) {
      expect(titles).not.toContain(acneTitle);
    }
  });

  it("objectionFaqs reference the shared FAQS sets, never re-transcribed", () => {
    expect(CONCERNS.pigmentation.objectionFaqs).toBe(FAQS.pigmentationObjections);
    expect(CONCERNS.acne.objectionFaqs).toBe(FAQS.acneObjections);
    expect(CONCERNS["other-issues"].objectionFaqs).toBe(FAQS.otherIssuesObjections);
  });
});
