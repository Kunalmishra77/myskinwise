import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

/**
 * Guards the WordPress → Next.js cutover map.
 *
 * The URLs below are the complete set published by the live WordPress
 * sitemap (`https://myskinwise.com/wp-sitemap.xml`) as enumerated on
 * 2026-07-24. They are the pages that carry whatever SEO authority and ad
 * traffic the old site has, so every one of them must land somewhere
 * deliberate the moment DNS moves to Vercel.
 *
 * This suite is the reason a future edit cannot quietly drop one.
 */

/** Legacy paths that must resolve natively, with no redirect needed. */
const NATIVE_EQUIVALENTS = [
  "/",
  "/about-us",
  "/acne",
  "/pigmentation",
  "/other-issues",
  "/contact-us",
  "/privacy-policy",
  "/terms-and-conditions",
  "/refund-and-cancellation",
];

/** Legacy paths with no native equivalent, and where each must land. */
const EXPECTED_REDIRECTS: Record<string, string> = {
  "/acne-form-quiz": "/skin-check",
  "/pigmentation-form-quiz": "/skin-check",
  "/other-issues-form-quiz": "/skin-check",
  "/acne-product": "/products",
  "/pigmentation-product": "/products",
  "/other-issues-product": "/products",
  "/product-category/acne": "/products",
  "/product-category/pigmentation": "/products",
  "/product/:slug": "/products",
  "/cart": "/products",
  "/checkout": "/products",
  "/book-appointment-payment-page": "/consultation",
  "/other-issues-all-skin-care-19-june": "/other-issues",
  "/hello-world": "/",
  "/category/uncategorized": "/",
  "/for-testing": "/",
};

async function redirects() {
  const fn = nextConfig.redirects;
  if (!fn) throw new Error("next.config defines no redirects()");
  return fn();
}

describe("WordPress cutover redirects", () => {
  it("maps every legacy URL that has no native equivalent", async () => {
    const map = new Map((await redirects()).map((r) => [r.source, r.destination]));
    for (const [source, destination] of Object.entries(EXPECTED_REDIRECTS)) {
      expect(map.get(source), `missing or wrong redirect for ${source}`).toBe(destination);
    }
  });

  it("issues 301, not 308", async () => {
    // 308 is SEO-equivalent but not what every ad platform and audit tool
    // recognises without qualification. See the note in next.config.ts.
    for (const r of await redirects()) {
      expect(r.statusCode, `${r.source} is not a 301`).toBe(301);
    }
  });

  it("never redirects a page that exists natively", async () => {
    // Redirecting /acne to anything would throw away a ranked page that the
    // new site serves perfectly well under the same path.
    const sources = new Set((await redirects()).map((r) => r.source));
    for (const path of NATIVE_EQUIVALENTS) {
      expect(sources.has(path), `${path} exists natively and must not be redirected`).toBe(false);
    }
  });

  it("has no catch-all that would swallow the whole site", async () => {
    // A `/:path*` source would match every route and take the new site down
    // in a way that looks like a successful migration.
    for (const r of await redirects()) {
      expect(r.source).not.toBe("/:path*");
      expect(r.source).not.toBe("/(.*)");
    }
  });

  it("sends no legacy URL to a destination that is itself redirected", async () => {
    // A redirect chain loses a hop of authority and is trivially avoidable.
    const all = await redirects();
    const sources = new Set(all.map((r) => r.source));
    for (const r of all) {
      expect(sources.has(r.destination), `${r.source} points at another redirect`).toBe(false);
    }
  });

  it("declares each source exactly once", async () => {
    const sources = (await redirects()).map((r) => r.source);
    expect(new Set(sources).size, "duplicate redirect source").toBe(sources.length);
  });
});
