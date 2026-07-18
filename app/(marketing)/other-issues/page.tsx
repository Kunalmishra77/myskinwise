import { ConcernPageTemplate } from "@/components/features/concern-page-template";
import { CONCERNS } from "@/content/concerns";
import { buildMetadata } from "@/config/seo";

export const metadata = buildMetadata({
  title: "Wrinkles, Open Pores & Dullness Treatment",
  description:
    "Treat wrinkles, open pores, dullness, and dark circles at the root with a personalized skincare routine. Take the skin quiz to get started.",
  path: "/other-issues",
});

export default function OtherIssuesPage() {
  return <ConcernPageTemplate content={CONCERNS["other-issues"]} />;
}
