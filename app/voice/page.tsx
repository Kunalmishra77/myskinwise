import { buildMetadata } from "@/config/seo";
import { VoicePageClient } from "@/app/voice/voice-page-client";

export const metadata = buildMetadata({
  title: "Talk to Dr. Vivek",
  description:
    "Speak naturally with Dr. Vivek, your Skinwise AI skincare expert — the same guidance, hands-free.",
  path: "/voice",
});

export default function VoicePage() {
  return <VoicePageClient />;
}
