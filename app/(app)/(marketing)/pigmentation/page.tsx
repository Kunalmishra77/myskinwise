import { ConcernPageTemplate } from "@/components/features/concern-page-template";
import { CONCERNS } from "@/content/concerns";
import { buildMetadata } from "@/config/seo";

export const metadata = buildMetadata({
  title: "Hyperpigmentation Treatment",
  description:
    "Fade dark spots, melasma, and uneven skin tone with a personalized, science-backed hyperpigmentation routine. Take the skin quiz to get started.",
  path: "/pigmentation",
});

export default function PigmentationPage() {
  return <ConcernPageTemplate content={CONCERNS.pigmentation} />;
}
