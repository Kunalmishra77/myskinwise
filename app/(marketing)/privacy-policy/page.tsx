import { buildMetadata } from "@/config/seo";
import { LegalPage } from "@/components/features/legal-page";
import { PRIVACY } from "@/content/legal";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How Skinwise collects, uses, shares, and protects the personal information you provide as a customer or visitor of MySkinWise.com.",
  path: "/privacy-policy",
});

/**
 * Privacy Policy page — composed entirely from `content/legal/privacy.ts`
 * (real, client-sourced copy from WEBSITE_CONTENT.md §15). Server
 * Component: no client-side data fetching needed.
 */
export default function PrivacyPolicyPage() {
  return <LegalPage title={PRIVACY.title} path="/privacy-policy" sections={PRIVACY.sections} notice={PRIVACY.notice} />;
}
