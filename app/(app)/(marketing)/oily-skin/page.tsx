import { ConcernPageTemplate } from "@/components/features/concern-page-template";
import { CONCERNS } from "@/content/concerns";
import { buildMetadata } from "@/config/seo";

export const metadata = buildMetadata({
  title: "Oily Skin Care",
  description:
    "Balance shine and congestion without stripping your skin, with a personalized, expert-formulated routine built for oily skin. Take the skin quiz to start.",
  path: "/oily-skin",
});

export default function OilySkinPage() {
  return <ConcernPageTemplate content={CONCERNS["oily-skin"]} />;
}
