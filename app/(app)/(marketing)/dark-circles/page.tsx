import { ConcernPageTemplate } from "@/components/features/concern-page-template";
import { CONCERNS } from "@/content/concerns";
import { buildMetadata } from "@/config/seo";

export const metadata = buildMetadata({
  title: "Dark Circle Care",
  description:
    "Brighten the look of tired, dark under-eyes with a personalized, expert-formulated routine — matched to what is actually causing your dark circles. Take the skin quiz to start.",
  path: "/dark-circles",
});

export default function DarkCirclesPage() {
  return <ConcernPageTemplate content={CONCERNS["dark-circles"]} />;
}
