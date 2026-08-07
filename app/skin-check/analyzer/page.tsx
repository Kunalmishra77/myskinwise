import { buildMetadata } from "@/config/seo";
import { ScanFlow } from "@/app/skin-check/scan/scan-flow";

export const metadata = buildMetadata({
  title: "AI Skin Analysis",
  description:
    "Take or upload a photo for a deterministic, measurement-based skin analysis — see your scores with the evidence on your own photo.",
  path: "/skin-check/analyzer",
});

/**
 * The scan is now the deterministic engine (skin-cv-service). The old
 * OpenAI-vision Analyzer has been retired from the flow — this route (which all
 * the "Scan" links point at) renders the new measurement-based experience so
 * there is a single, reliable scanner. The old Analyzer component and
 * /api/v1/analysis remain in the tree but are no longer user-facing.
 */
export default function AnalyzerPage() {
  return <ScanFlow />;
}
