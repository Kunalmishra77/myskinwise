import { coreValues, founderStory, approach } from "./about";

describe("about content", () => {
  it("has all 5 core value titles from WEBSITE_CONTENT.md §2", () => {
    const titles = coreValues.map((v) => v.title);
    expect(titles).toEqual([
      "Personalization",
      "Integrity",
      "Sustainability",
      "Innovation",
      "Community",
    ]);
  });

  it("names the founder Anant Sanadhya with the full 3-paragraph story", () => {
    expect(founderStory.name).toBe("Anant Sanadhya");
    expect(founderStory.paragraphs).toHaveLength(3);
  });

  it("has exactly 3 approach pillars", () => {
    expect(approach).toHaveLength(3);
  });
});
