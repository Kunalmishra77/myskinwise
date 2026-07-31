import { ConcernPageTemplate } from "@/components/features/concern-page-template";
import { CONCERNS } from "@/content/concerns";
import { buildMetadata } from "@/config/seo";

export const metadata = buildMetadata({
  title: "Acne Scar & Mark Care",
  description:
    "Help fade the look of post-acne marks and scars with a personalized, expert-formulated routine and daily protection. Take the skin quiz to get started.",
  path: "/acne-scars",
});

export default function AcneScarsPage() {
  return <ConcernPageTemplate content={CONCERNS["acne-scars"]} />;
}
