/**
 * Static display copy for the site footer and the customer "Me" space (/me).
 *
 * Same rationale as content/i18n/scanner.ts and content/i18n/pages.ts: this
 * copy would otherwise live inline in the components, where the i18n
 * translator (scripts/translate-content.mjs) can't reach it. Centralised here
 * as pure data — no imports — so the translator's "extract every string
 * literal" mode sources every string and produces Hindi keyed by the exact
 * English text.
 *
 * Deliberately NOT here (stays English in the .tsx): the brand/legal name,
 * addresses, phone numbers, email, WhatsApp/social URLs and handles, the
 * copyright line, and page `metadata` — none of which are translated.
 */

export const FOOTER = {
  reachOut: "Reach Out",
  visitLinks: "Visit Links",
  subscribeNow: "Subscribe Now",
  subscribeTagline: "Never miss our updates! Subscribe today!",
  customerCare: "Customer Care",

  // Static nav labels (concern labels come from SITE.concerns, wrapped inline).
  home: "Home",
  aboutUs: "About Us",
  contactUs: "Contact us",

  // Legal link labels.
  privacyPolicy: "Privacy Policy",
  terms: "Terms & Conditions",
  refund: "Refund & Cancellation",
} as const;

export const ME = {
  eyebrow: "Your space",
  title: "Your skincare journey, in one place.",
  intro:
    "Skinwise does not ask you to create an account. When you complete a Skin Check, we send your results straight to your WhatsApp — and this is where they will live.",

  comingTitle: "Coming here soon",
  coming1: "Your skin profile and the concern you told us about",
  coming2: "The routine your expert put together for you",
  coming3: "Your consultation and order history",
  coming4: "Your photos, with the option to delete them at any time",

  startSkinCheck: "Start your Skin Check",

  needPersonTitle: "Need a person?",
  needPersonBody: "Our team answers directly — no bots, no queue.",
} as const;
