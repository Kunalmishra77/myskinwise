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
 */

import { SITE } from "@/config/site";
import type { LegalContent } from "./types";

export const CURRENCY_PLACEHOLDER = "[currency — pending client input]";
export const REFUND_WINDOW_PLACEHOLDER = "[refund window — pending client input]";
export const JURISDICTION_PLACEHOLDER = "[jurisdiction — pending client input]";

export const TERMS: LegalContent = {
  title: "Terms and Conditions",
  notice:
    "Some clauses (currency, refund window, governing jurisdiction) are pending final legal input and are marked accordingly.",
  sections: [
    {
      body: 'Welcome to MySkinWise.com. These Terms and Conditions ("Terms") govern your use of our website and services, including the purchase of our customized skincare products designed to address concerns such as acne, pigmentation, and other skin issues. By accessing or using MySkinWise.com, you agree to abide by these Terms. Please read them carefully.',
    },
    {
      heading: "1. Acceptance of Terms",
      body: "By accessing or using MySkinWise.com, you agree to abide by these Terms. Please read them carefully.",
    },
    {
      heading: "2. Eligibility",
      body: "You must be 18 years of age or older to use MySkinWise.com and purchase our products.",
    },
    {
      heading: "3. Customized Skincare Products",
      body: "Our skincare products are formulated based on your individual requirements. Results may vary and outcomes are not guaranteed. A patch test is recommended before use.",
    },
    {
      heading: "4. Orders and Payments",
      body: `Prices are listed in ${CURRENCY_PLACEHOLDER}. We accept various payment methods, and all payments are processed securely.`,
    },
    {
      heading: "5. Shipping and Delivery",
      body: "Delivery timelines vary by location. We are not responsible for courier delays. Customers are responsible for any applicable customs duties.",
    },
    {
      heading: "6. Returns and Refunds",
      body: `We do not accept returns except for defective or incorrect items. The refund window is ${REFUND_WINDOW_PLACEHOLDER}.`,
    },
    {
      heading: "7. User Conduct",
      body: "You agree not to engage in hacking, spamming, or posting harmful content on MySkinWise.com. We reserve the right to terminate your access for violations of this policy.",
    },
    {
      heading: "8. Intellectual Property",
      body: "All content on MySkinWise.com is owned by or licensed to MySkinWise. No content may be reproduced without our permission.",
    },
    {
      heading: "9. Medical Disclaimer",
      body: "Our products are not intended to diagnose, treat, cure, or prevent any medical condition. Please consult a dermatologist if you have pre-existing conditions or allergies.",
    },
    {
      heading: "10. Privacy Policy",
      body: "Please refer to our Privacy Policy for details on how we collect, use, and protect your information.",
    },
    {
      heading: "11. Modifications to Terms",
      body: "We reserve the right to update these Terms at any time.",
    },
    {
      heading: "12. Governing Law",
      body: `These Terms are governed by the laws of ${JURISDICTION_PLACEHOLDER}. Any disputes will be resolved through arbitration.`,
    },
    {
      heading: "13. Contact Us",
      body: `For any questions about these Terms, contact us at ${SITE.email}.`,
    },
  ],
};
