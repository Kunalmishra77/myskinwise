import { buildMetadata } from "@/config/seo";
import { AssessmentFlow } from "@/app/skin-check/assessment-flow";

export const metadata = buildMetadata({
  title: "Skin Check",
  description:
    "Tell us about your skin in about three minutes. A Skinwise expert reviews your answers and helps you build a routine around your concern.",
  path: "/skin-check",
});

/**
 * The Skinwise-native Skin Check.
 *
 * Renders full-screen with no site chrome — this route sits outside the
 * `(app)` route group precisely so the assessment does not compete with
 * navigation. See app/skin-check/layout.tsx.
 *
 * The flow is generated from `content/assessment/questions.ts`, the same
 * canonical model the server validates against, so the two cannot drift.
 */
export default function SkinCheckPage() {
  return <AssessmentFlow />;
}
