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

  it("other-issues omits the copy-pasted acne causes block (content-accuracy fix)", () => {
    expect(CONCERNS["other-issues"].causes.length).toBe(0);
  });

  it("objectionFaqs reference the shared FAQS sets, never re-transcribed", () => {
    expect(CONCERNS.pigmentation.objectionFaqs).toBe(FAQS.pigmentationObjections);
    expect(CONCERNS.acne.objectionFaqs).toBe(FAQS.acneObjections);
    expect(CONCERNS["other-issues"].objectionFaqs).toBe(FAQS.otherIssuesObjections);
  });
});
