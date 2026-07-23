import { buildMetadata } from "@/config/seo";
import { Analyzer } from "@/app/skin-check/analyzer/analyzer";

export const metadata = buildMetadata({
  title: "Skin Analyzer",
  description:
    "Take or upload a photo for an AI-assisted look at your visible skin — then get a personalised Skin Check reviewed by a real expert.",
  path: "/skin-check/analyzer",
});

/**
 * Full-screen analyzer flow. Lives under /skin-check (outside the app shell)
 * so it renders immersive, like the assessment. It is AI-ASSISTED OBSERVATION,
 * not diagnosis — the framing is carried through every screen.
 */
export default function AnalyzerPage() {
  return <Analyzer />;
}
