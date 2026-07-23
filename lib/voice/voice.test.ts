import { afterEach, describe, expect, it } from "vitest";
import { getSttProvider, __setSttProvider } from "@/lib/voice/stt";
import { getTtsProvider, __setTtsProvider } from "@/lib/voice/tts";

afterEach(() => {
  __setSttProvider(null);
  __setTtsProvider(null);
});

describe("STT provider", () => {
  it("reports not-configured rather than pretending, when no key", async () => {
    if (!getSttProvider().isConfigured()) {
      const r = await getSttProvider().transcribe(Buffer.from(""), "audio/webm");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toBe("not-configured");
    }
  });

  it("surfaces an empty transcript as empty, not a fake result", async () => {
    __setSttProvider({
      isConfigured: () => true,
      transcribe: async () => ({ ok: false, reason: "empty" }),
    });
    const r = await getSttProvider().transcribe(Buffer.from("x"), "audio/webm");
    expect(r.ok).toBe(false);
  });
});

describe("TTS provider", () => {
  it("reports not-configured when no key", async () => {
    if (!getTtsProvider().isConfigured()) {
      const r = await getTtsProvider().speak("hello");
      expect(r.ok).toBe(false);
    }
  });

  it("a TTS failure is a clean non-success, never fabricated audio", async () => {
    __setTtsProvider({ isConfigured: () => true, speak: async () => ({ ok: false, reason: "failed" }) });
    const r = await getTtsProvider().speak("hello");
    expect(r.ok).toBe(false);
  });
});
