"use client";

import { useRouter } from "next/navigation";
import { VoiceConversation } from "@/components/voice/voice-conversation";

/**
 * The full-screen voice page. Standalone (outside the app shell) so the voice
 * call has the whole viewport — no marketing footer or bottom nav competing —
 * which is what lets VoiceConversation's centre stage actually centre Riya's
 * orb. The X returns home.
 */
export function VoicePageClient() {
  const router = useRouter();
  return (
    <div className="h-dvh bg-warm">
      <VoiceConversation onClose={() => router.push("/")} />
    </div>
  );
}
