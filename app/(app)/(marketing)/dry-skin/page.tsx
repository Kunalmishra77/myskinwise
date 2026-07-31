import { ConcernPageTemplate } from "@/components/features/concern-page-template";
import { CONCERNS } from "@/content/concerns";
import { buildMetadata } from "@/config/seo";

export const metadata = buildMetadata({
  title: "Dry Skin Care",
  description:
    "Rehydrate tight, flaky, dull skin and support your moisture barrier with a personalized, expert-formulated routine for dry skin. Take the skin quiz to start.",
  path: "/dry-skin",
});

export default function DrySkinPage() {
  return <ConcernPageTemplate content={CONCERNS["dry-skin"]} />;
}
