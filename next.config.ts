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
 * Permissions-Policy allows camera and microphone on our own origin only —
 * both are genuinely used (Skin Analyzer capture, Voice Agent) and would
 * break if denied outright — while switching off features we never use.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // robots.txt already disallows these, but robots.txt is advisory and
      // does not stop a page that gets linked from being indexed. The header
      // is the enforcing half.
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
