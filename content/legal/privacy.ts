/**
 * Privacy Policy content (WEBSITE_CONTENT.md §15, "Privacy Policy" · slug
 * `privacy-policy`). Transcribed verbatim from the client's WordPress CSV
 * export. Nothing here is invented.
 *
 * The Contact section deliberately does NOT hardcode the support email or
 * phone number — it reads `SITE.email` / `SITE.phones.general` (config/site.ts)
 * so there is exactly one source of truth for contact details across the
 * site.
 */

import { SITE } from "@/config/site";
import type { LegalContent } from "./types";

export const PRIVACY: LegalContent = {
  title: "Privacy Policy",
  sections: [
    {
      body: 'MySkinWise (www.myskinwise.com) takes all due care and reasonable precautions, as foreseen under normal circumstances, to safeguard the privacy of its customers and visitors ("Customer/Visitor").',
    },
    {
      heading: "Information We Collect",
      body: "Personal Information, Address and Contact Details, Previous Medical History, Present Ailments/Diseases/Skin-related Concerns, Transaction Details — all provided directly, voluntarily, and unconditionally by the Customer/Visitor.",
    },
    {
      heading: "How We Use Your Information",
      body: "Improving services, maintaining accurate records, enabling follow-ups and customer support, enhancing customer satisfaction.",
    },
    {
      heading: "Information Sharing",
      body: "Internal teams and associates, consultants and service providers, vendors and third-party partners, government authorities or law enforcement (if legally required) — only when necessary and for legitimate business or legal purposes.",
    },
    {
      heading: "Data Security",
      body: "MySkinWise takes all reasonable steps and precautions to protect your data. However, due to the nature of the internet, the possibility of unauthorized access, data breaches, or misuse cannot be completely ruled out.",
    },
    {
      heading: "Contact",
      body: `For any questions about this Privacy Policy, contact us at ${SITE.email} · ${SITE.phones.general.display} · ${SITE.url}`,
    },
  ],
};
