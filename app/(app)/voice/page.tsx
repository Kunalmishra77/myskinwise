import { buildMetadata } from "@/config/seo";
import { VoiceConversation } from "@/components/voice/voice-conversation";

export const metadata = buildMetadata({
  title: "Talk to Skinwise",
  description:
    "Speak naturally with the Skinwise assistant about your skin — the same guidance, hands-free.",
  path: "/voice",
});

/**
 * Full-page voice interface — the same VoiceConversation the floating overlay
 * uses, without the overlay chrome. A transport around the same Skinwise AI
 * the text assistant uses: grounding, safety, customer context and CTAs are
 * all shared server-side (see /api/v1/voice -> respond()).
 */
export default function VoicePage() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-2xl flex-col lg:min-h-[calc(100dvh-4rem)]">
      <VoiceConversation />
    </div>
  );
}
