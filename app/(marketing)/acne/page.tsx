import { ConcernPageTemplate } from "@/components/features/concern-page-template";
import { CONCERNS } from "@/content/concerns";
import { buildMetadata } from "@/config/seo";

export const metadata = buildMetadata({
  title: "Acne Treatment",
  description:
    "Clear breakouts and prevent future acne with a personalized, dermatologist-formulated routine targeting the root cause. Take the skin quiz to get started.",
  path: "/acne",
});

export default function AcnePage() {
  return <ConcernPageTemplate content={CONCERNS.acne} />;
}
