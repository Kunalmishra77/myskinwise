import { describe, expect, it } from "vitest";
import { buildMetadata } from "@/config/seo";

describe("buildMetadata", () => {
  it("sets canonical and og", () => {
    const m = buildMetadata({ title: "T", description: "D", path: "/about-us" });
    expect(m.alternates?.canonical).toBe("https://myskinwise.com/about-us");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((m.openGraph as any)?.title).toBe("T");
  });

  it("sets canonical for root path", () => {
    const m = buildMetadata({ title: "Home", description: "D", path: "/" });
    expect(m.alternates?.canonical).toBe("https://myskinwise.com/");
  });
});
