/**
 * Terms and Conditions content (WEBSITE_CONTENT.md §16, "Terms and
 * Conditions" · slug `terms-and-conditions`).
 *
 * Two deliberate alterations from the live source (see WEBSITE_CONTENT.md
 * §0 Finding #3):
 *
 * 1. The live page's un-replaced Lorem-Ipsum filler paragraph ("Platea
 *    porttitor potenti ac vitae senectus...") that sits directly under the
 *    intro is OMITTED entirely — it is not real content and must not be
 *    carried over.
 * 2. The source has three unfilled bracket placeholders — `[currency]`,
 *    `[X] days` (refund window), and `[Jurisdiction]` (governing law).
 *    Rather than inventing values for these (a real legal-exposure risk),
 *    each is rendered as a visible literal marker string so the gap stays
 *    obvious until legal/client input fills it in.
 *
 * Every clause body below is a direct, non-embellished transcription of
 * the clause summary recorded in WEBSITE_CONTENT.md §16 — no clause adds
 * any right, obligation, procedure, or number beyond what's stated there.
 * Clause 1's body reuses the intro's own verbatim closing sentence
 * ("By accessing or using MySkinWise.com, you agree to abide by these
 * Terms. Please read them carefully.") since the source records no
 * separate body text for that clause. Clause 13 reads the contact email
 * from `SITE.email` (config/site.ts) rather than hardcoding it.
 *
 * IMPORTANT — transcription, not verbatim source text: §16 itself is a
 * compressed bullet summary (e.g. "no returns except defective/incorrect
 * items; refund window stated as [X] days"), not full legal prose. Every
 * clause body here turns that bullet summary into connected sentences,
 * which necessarily adds connective phrasing beyond a literal quote. No
 * clause invents a new right, obligation, procedure, or number — but none
 * should be treated as the client's final approved legal copy either. Each
 * clause below carries a `// TODO(client-legal): verify verbatim against
 * client's approved Terms` marker so this is greppable at the clause, and
 * the page-level `notice` states the same caveat for anyone reading the
 * rendered page instead of this source file.
 */

import { SITE } from "@/config/site";
import type { LegalContent } from "./types";

export const CURRENCY_PLACEHOLDER = "[currency — pending client input]";
export const REFUND_WINDOW_PLACEHOLDER = "[refund window — pending client input]";
export const JURISDICTION_PLACEHOLDER = "[jurisdiction — pending client input]";

export const TERMS: LegalContent = {
  title: "Terms and Conditions",
  notice:
    "This Terms & Conditions text is transcribed from available source content and is pending the client's final approved legal copy; the currency, refund window, and governing jurisdiction are also pending client input and are marked accordingly.",
  sections: [
    {
      body: 'Welcome to MySkinWise.com. These Terms and Conditions ("Terms") govern your use of our website and services, including the purchase of our customized skincare products designed to address concerns such as acne, pigmentation, and other skin issues. By accessing or using MySkinWise.com, you agree to abide by these Terms. Please read them carefully.',
    },
    // TODO(client-legal): verify verbatim against client's approved Terms
    // — source §16 records no body text for this clause; this reuses the
    // intro's own verbatim closing sentence.
    {
      heading: "1. Acceptance of Terms",
      body: "By accessing or using MySkinWise.com, you agree to abide by these Terms. Please read them carefully.",
    },
    // TODO(client-legal): verify verbatim against client's approved Terms
    // — source §16 bullet is "18+ required"; expanded to a full sentence.
    {
      heading: "2. Eligibility",
      body: "You must be 18 years of age or older to use MySkinWise.com and purchase our products.",
    },
    // TODO(client-legal): verify verbatim against client's approved Terms
    // — source §16 bullets condensed into full sentences.
    {
      heading: "3. Customized Skincare Products",
      body: "Our skincare products are formulated based on your individual requirements. Results may vary and outcomes are not guaranteed. A patch test is recommended before use.",
    },
    // TODO(client-legal): verify verbatim against client's approved Terms
    // — source §16 bullets condensed into full sentences; currency still
    // pending client input (see notice).
    {
      heading: "4. Orders and Payments",
      body: `Prices are listed in ${CURRENCY_PLACEHOLDER}. We accept various payment methods, and all payments are processed securely.`,
    },
    // TODO(client-legal): verify verbatim against client's approved Terms
    // — source §16 bullet is "timelines vary by location; not responsible
    // for courier delays; customer responsible for customs/duties",
    // expanded to full sentences.
    {
      heading: "5. Shipping and Delivery",
      body: "Delivery timelines vary by location. We are not responsible for courier delays. Customers are responsible for any applicable customs duties.",
    },
    // TODO(client-legal): verify verbatim against client's approved Terms
    // — source §16 bullets condensed into full sentences; refund window
    // still pending client input (see notice).
    {
      heading: "6. Returns and Refunds",
      body: `We do not accept returns except for defective or incorrect items. The refund window is ${REFUND_WINDOW_PLACEHOLDER}.`,
    },
    // TODO(client-legal): verify verbatim against client's approved Terms
    // — source §16 bullet is "no hacking/spamming/harmful content; right
    // to terminate access"; expanded, adding connective phrasing like
    // "for violations of this policy" not present in the source bullet.
    {
      heading: "7. User Conduct",
      body: "You agree not to engage in hacking, spamming, or posting harmful content on MySkinWise.com. We reserve the right to terminate your access for violations of this policy.",
    },
    // TODO(client-legal): verify verbatim against client's approved Terms
    // — source §16 bullets condensed into full sentences.
    {
      heading: "8. Intellectual Property",
      body: "All content on MySkinWise.com is owned by or licensed to MySkinWise. No content may be reproduced without our permission.",
    },
    // TODO(client-legal): verify verbatim against client's approved Terms
    // — source §16 bullets condensed into full sentences.
    {
      heading: "9. Medical Disclaimer",
      body: "Our products are not intended to diagnose, treat, cure, or prevent any medical condition. Please consult a dermatologist if you have pre-existing conditions or allergies.",
    },
    // TODO(client-legal): verify verbatim against client's approved Terms
    // — source §16 records only "cross-reference" for this clause; the
    // sentence pointing to the Privacy Policy is synthesized, not quoted.
    {
      heading: "10. Privacy Policy",
      body: "Please refer to our Privacy Policy for details on how we collect, use, and protect your information.",
    },
    // TODO(client-legal): verify verbatim against client's approved Terms
    // — source §16 bullet is "right to update at any time"; expanded to a
    // full sentence.
    {
      heading: "11. Modifications to Terms",
      body: "We reserve the right to update these Terms at any time.",
    },
    // TODO(client-legal): verify verbatim against client's approved Terms
    // — source §16 bullets condensed into full sentences; jurisdiction
    // still pending client input (see notice).
    {
      heading: "12. Governing Law",
      body: `These Terms are governed by the laws of ${JURISDICTION_PLACEHOLDER}. Any disputes will be resolved through arbitration.`,
    },
    // TODO(client-legal): verify verbatim against client's approved Terms
    // — source §16 records only the support email for this clause; the
    // surrounding sentence is synthesized.
    {
      heading: "13. Contact Us",
      body: `For any questions about these Terms, contact us at ${SITE.email}.`,
    },
  ],
};
