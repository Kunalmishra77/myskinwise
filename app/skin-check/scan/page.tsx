import type { Metadata } from "next";
import { ScanFlow } from "@/app/skin-check/scan/scan-flow";

export const metadata: Metadata = {
  title: "AI Skin Analysis · Skinwise",
  description: "A deterministic, measurement-based skin analysis — see your scores with the evidence on your own photo.",
};

/**
 * The new deterministic-engine scan. Deliberately OUTSIDE the (app) shell (like
 * the existing analyzer) so it renders as its own full-screen flow, and separate
 * from /skin-check/analyzer so the current live scan is untouched while this is
 * validated.
 */
export default function ScanPage() {
  return <ScanFlow />;
}
