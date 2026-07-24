import { buildMetadata } from "@/config/seo";
import { LegalPage } from "@/components/features/legal-page";
import { TERMS } from "@/content/legal";

export const metadata = buildMetadata({
  title: "Terms and Conditions",
  description:
    "The Terms and Conditions governing your use of MySkinWise.com and the purchase of our customized skincare products.",
  path: "/terms-and-conditions",
});

/**
 * Terms and Conditions page — composed entirely from
 * `content/legal/terms.ts` (real, client-sourced copy from
 * WEBSITE_CONTENT.md §16, with the live Lorem-Ipsum paragraph omitted and
 * the three unfilled placeholders rendered as visible markers — see that
 * file's header comment). Server Component: no client-side data fetching
 * needed.
 */
export default function TermsAndConditionsPage() {
  return <LegalPage title={TERMS.title} path="/terms-and-conditions" sections={TERMS.sections} notice={TERMS.notice} />;
}
