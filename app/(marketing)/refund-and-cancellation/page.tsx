import { buildMetadata } from "@/config/seo";
import { LegalPage } from "@/components/features/legal-page";
import { REFUND } from "@/content/legal";

export const metadata = buildMetadata({
  title: "Refund and Cancellation | Skinwise",
  description:
    "Skinwise's refund and cancellation policy for orders and appointment payments made on MySkinWise.com.",
  path: "/refund-and-cancellation",
});

/**
 * Refund and Cancellation page — the live source page is completely empty
 * (WEBSITE_CONTENT.md §17), so this renders only the pending-approval
 * notice from `content/legal/refund.ts`. No policy text is invented.
 * Server Component: no client-side data fetching needed.
 */
export default function RefundAndCancellationPage() {
  return <LegalPage title={REFUND.title} path="/refund-and-cancellation" sections={REFUND.sections} notice={REFUND.notice} />;
}
