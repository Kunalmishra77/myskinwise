import { permanentRedirect } from "next/navigation";

/**
 * Legacy route. The concern-page "Analyse your skin" CTA used to resolve
 * here to a placeholder while the real assessment was built. The native
 * Skin Check now exists at /skin-check, so this permanently redirects there
 * — keeping any old internal or external /quiz/* links working while sending
 * everyone into the real funnel. Concern-page CTAs now point at /skin-check
 * directly.
 */
export default async function LegacyQuizRedirect() {
  permanentRedirect("/skin-check");
}
