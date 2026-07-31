import { buildMetadata } from "@/config/seo";
import { VoicePageClient } from "@/app/voice/voice-page-client";

export const metadata = buildMetadata({
  title: "Talk to Riya",
  description:
    "Speak naturally with Riya, the Skinwise AI skincare guide — the same guidance, hands-free.",
  path: "/voice",
});

export default function VoicePage() {
  return <VoicePageClient />;
}
