import { FAQS } from "./faqs";

describe("FAQS", () => {
  it("contains no lorem ipsum / latin-filler placeholder text", () => {
    const all = Object.values(FAQS)
      .flat()
      .map((f) => f.answer.toLowerCase())
      .join(" ");
    ["lorem", "ipsum", "platea", "porttitor", "raptures declared"].forEach((w) =>
      expect(all).not.toContain(w),
    );
  });

  it("has the 5 shared general FAQs", () => {
    expect(FAQS.generalFaqs.length).toBe(5);
  });

  it("every FAQ set has non-empty, unique ids", () => {
    for (const [key, items] of Object.entries(FAQS)) {
      expect(items.length, key).toBeGreaterThan(0);
      const ids = items.map((f) => f.id);
      expect(new Set(ids).size, key).toBe(ids.length);
      items.forEach((f) => {
        expect(f.id.trim().length, key).toBeGreaterThan(0);
        expect(f.question.trim().length, key).toBeGreaterThan(0);
        expect(f.answer.trim().length, key).toBeGreaterThan(0);
      });
    }
  });
});
