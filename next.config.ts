import type { NextConfig } from "next";

/*
 * Security headers.
 *
 * Found missing by the production smoke test against the live deployment:
 * Vercel adds HSTS automatically, but nothing else, so the app was shipping
 * with no clickjacking, MIME-sniffing or referrer protection. That matters
 * more here than on a typical marketing site because these pages handle face
 * photos, phone numbers and an admin console.
 *
 * `frame-ancestors 'none'` is deliberately the ONLY CSP directive. A full
 * script/style policy is the right long-term goal, but the App Router injects
 * inline bootstrap scripts and Framer Motion writes inline styles, so a
 * strict `script-src`/`style-src` needs per-request nonces threaded through
 * middleware to avoid breaking hydration outright. Shipping a half-policy
 * with `unsafe-inline` would look like protection while providing none, so
 * the scope is kept to what actually holds.
 *
 * Permissions-Policy allows the camera on our own origin only (Skin
 * Analyzer capture) and would break if denied outright, while switching off
 * features we never use, including the microphone.
 */
/*
 * Framing: public content pages may be framed by the AI Agentix portfolio;
 * admin, API, cart, checkout, consultation and the "me" account area keep
 * `frame-ancestors 'none'` plus X-Frame-Options DENY.
 */
const PORTFOLIO_FRAME_ANCESTORS =
  process.env.PORTFOLIO_FRAME_ANCESTORS ??
  "https://agentix-portfolio.vercel.app https://ai-agentix.com https://*.ai-agentix.com";
const PUBLIC_PAGES =
  "about-us|acne|acne-scars|contact-us|dark-circles|dry-skin|oily-skin|other-issues|pigmentation|privacy-policy|refund-and-cancellation|terms-and-conditions|assistant|concerns|ingredients|learn|products|skin-types|quiz|skin-check|voice";

const publicFrameHeaders = [
  { key: "Content-Security-Policy", value: `frame-ancestors 'self' ${PORTFOLIO_FRAME_ANCESTORS}` },
];
const lockedFrameHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

/**
 * WordPress → Next.js 301s for the cutover.
 *
 * Every source below was enumerated from the live WordPress sitemap
 * (`https://myskinwise.com/wp-sitemap.xml`) on 2026-07-24, not guessed, and
 * each is mapped to the destination that matches what the visitor was
 * actually looking for. A blanket redirect to `/` would preserve the domain's
 * authority while destroying the intent behind every ranked URL and every
 * running ad, so nothing here is a catch-all.
 *
 * Paths that already exist natively under the same name (/about-us, /acne,
 * /pigmentation, /other-issues, /contact-us and the three legal pages) are
 * deliberately absent: they need no redirect, only the DNS switch.
 *
 * Two groups are worth explaining.
 *
 * The `*-form-quiz` pages were the WordPress lead funnel. They have been
 * broken for some time — verified repeatedly as HTTP 200 serving zero form
 * elements — which is precisely why the native Skin Check exists. They point
 * at it.
 *
 * The old WooCommerce shopping URLs (cart, checkout, the product listings)
 * now point at /products: there is a real cart again — a WhatsApp-order cart,
 * with no online payment — so the catalogue is the apt home for that traffic.
 * The advance-payment product and the appointment payment page have no
 * equivalent and go to the consultation request instead.
 */
const LEGACY_REDIRECTS: { source: string; destination: string }[] = [
  // The WordPress lead funnel → the native assessment.
  { source: "/acne-form-quiz", destination: "/skin-check" },
  { source: "/pigmentation-form-quiz", destination: "/skin-check" },
  { source: "/other-issues-form-quiz", destination: "/skin-check" },

  // Concern-scoped product listings → the formulation catalogue. There is no
  // per-concern filter on /products yet, so these land on the full catalogue
  // rather than a URL that would 404 or show an empty state.
  { source: "/acne-product", destination: "/products" },
  { source: "/pigmentation-product", destination: "/products" },
  { source: "/other-issues-product", destination: "/products" },
  { source: "/product-category/acne", destination: "/products" },
  { source: "/product-category/pigmentation", destination: "/products" },
  { source: "/product/:slug", destination: "/products" },

  // NOTE: /cart and /checkout are now REAL in-app pages (quantities, totals,
  // review → WhatsApp order), so they are intentionally NOT redirected. The old
  // WooCommerce product URLs above still funnel to the catalogue.
  // The advance-payment appointment page → the consultation request.
  { source: "/book-appointment-payment-page", destination: "/consultation" },

  // A dated duplicate of the Other Issues page.
  { source: "/other-issues-all-skin-care-19-june", destination: "/other-issues" },

  // WordPress defaults and leftovers carrying no intent worth preserving.
  { source: "/hello-world", destination: "/" },
  { source: "/category/uncategorized", destination: "/" },
  { source: "/for-testing", destination: "/" },

  // WordPress plumbing that should never have been indexed and must not 404
  // noisily once the domain moves.
  { source: "/wp-admin/:path*", destination: "/" },
  { source: "/wp-login.php", destination: "/" },
  // The voice agent was removed; keep old links and ads working.
  { source: "/voice", destination: "/assistant" },
];

const nextConfig: NextConfig = {
  // Self-host build: emits a minimal standalone server (`.next/standalone`) with
  // only the files needed to run, so it can be containerised and deployed on our
  // own VPS (Coolify) instead of Vercel. No effect on the Vercel deployment.
  output: "standalone",
  async redirects() {
    /*
     * `statusCode: 301` rather than `permanent: true`, which emits a 308.
     *
     * Search engines treat 308 as equivalent to 301, so this is not an SEO
     * correctness issue. It is a recognition issue: 301 is the status every
     * crawler, ad platform and migration audit tool understands without
     * qualification, and this is exactly the migration those tools will be
     * pointed at. There is nothing to gain from 308's method preservation
     * here — every one of these URLs is a GET from a search result or an ad.
     *
     * Note that a legacy URL with WordPress's trailing slash takes two hops:
     * Next normalises `/x/` to `/x` with its own 308 first, then this 301
     * fires. Both are permanent and the chain is followed and passed through,
     * so it costs one extra round trip and no ranking signal.
     */
    // `permanent` and `statusCode` are mutually exclusive in Next's Redirect
    // type — passing both is a type error, not a precedence question.
    return LEGACY_REDIRECTS.map((r) => ({ ...r, statusCode: 301 }));
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/", headers: [...securityHeaders, ...publicFrameHeaders] },
      { source: `/:page(${PUBLIC_PAGES})/:rest*`, headers: publicFrameHeaders },
      { source: `/((?!(?:${PUBLIC_PAGES})(?:/|$)).+)`, headers: lockedFrameHeaders },
      // robots.txt already disallows these, but robots.txt is advisory and
      // does not stop a page that gets linked from being indexed. The header
      // is the enforcing half.
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
