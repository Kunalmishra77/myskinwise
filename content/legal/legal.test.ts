import { PRIVACY, TERMS, REFUND } from "./index";

describe("legal content", () => {
  it("terms has no lorem ipsum and shows placeholder markers", () => {
    const t = JSON.stringify(TERMS).toLowerCase();
    ["lorem", "ipsum", "platea", "porttitor"].forEach((w) => expect(t).not.toContain(w));
    expect(t).toContain("pending client input");
  });

  it("refund invents no policy", () => {
    expect(REFUND.sections.length).toBe(0);
    expect(REFUND.notice).toMatch(/pending client approval/i);
  });

  it("privacy includes the real 'Information We Collect' section", () => {
    expect(JSON.stringify(PRIVACY)).toContain("Information We Collect");
  });
});
