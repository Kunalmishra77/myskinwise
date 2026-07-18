import { describe, expect, it } from "vitest";
import { buildMetadata } from "@/config/seo";
import sitemap from "@/app/sitemap";

describe("buildMetadata", () => {
  it("sets canonical and og", () => {
    const m = buildMetadata({ title: "T", description: "D", path: "/about-us" });
    expect(m.alternates?.canonical).toBe("https://myskinwise.com/about-us");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((m.openGraph as any)?.title).toBe("T | Skinwise");
  });

  it("sets canonical for root path with no trailing slash, matching the sitemap root entry", () => {
    const m = buildMetadata({ title: "Home", description: "D", path: "/" });
    expect(m.alternates?.canonical).toBe("https://myskinwise.com");

    const rootEntry = sitemap().find((entry) => entry.url === "https://myskinwise.com");
    expect(rootEntry).toBeDefined();
    expect(m.alternates?.canonical).toBe(rootEntry?.url);
  });

  it("does not double the site suffix: title is a bare segment so the root layout's template appends it exactly once, and og/twitter titles mirror the rendered <title>", () => {
    const m = buildMetadata({ title: "About Us", description: "D", path: "/about-us" });
    // `title` itself is the bare segment — the root layout's `template`
    // ("%s | Skinwise") is what appends the suffix at render time, so it
    // must not already be baked in here (that's the doubling bug).
    expect(m.title).toBe("About Us");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ogTitle = (m.openGraph as any)?.title as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const twitterTitle = (m.twitter as any)?.title as string;
    expect(ogTitle).toBe("About Us | Skinwise");
    expect(twitterTitle).toBe("About Us | Skinwise");
    expect(ogTitle).not.toContain("| Skinwise | Skinwise");
    expect(twitterTitle).not.toContain("| Skinwise | Skinwise");
  });

  it("titleAbsolute bypasses the template: <title> and og/twitter titles all render verbatim with no site suffix", () => {
    const m = buildMetadata({
      title: "Skinwise — Personalized Skincare, Backed by Science",
      description: "D",
      path: "/",
      titleAbsolute: true,
    });
    expect(m.title).toEqual({ absolute: "Skinwise — Personalized Skincare, Backed by Science" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ogTitle = (m.openGraph as any)?.title as string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const twitterTitle = (m.twitter as any)?.title as string;
    expect(ogTitle).toBe("Skinwise — Personalized Skincare, Backed by Science");
    expect(twitterTitle).toBe("Skinwise — Personalized Skincare, Backed by Science");
    expect(ogTitle.endsWith("| Skinwise")).toBe(false);
  });
});
