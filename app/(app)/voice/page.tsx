import { buildMetadata } from "@/config/seo";
import { VoiceAgent } from "@/app/(app)/voice/voice-agent";

export const metadata = buildMetadata({
  title: "Talk to Skinwise",
  description: "Speak naturally with the Skinwise assistant about your skin — the same guidance, hands-free.",
  path: "/voice",
});

/**
 * Voice interface. A transport around the same Skinwise AI the text
 * assistant uses — grounding, safety, customer context and CTAs are all
 * shared server-side (see /api/v1/voice → respond()).
 */
export default function VoicePage() {
  return <VoiceAgent />;
}
