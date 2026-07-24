export type TranscriptionResult =
  | { ok: true; text: string }
  | { ok: false; reason: "not-configured" | "empty" | "timeout" | "failed" };

/**
 * Server-side speech-to-text seam. The primary STT in the product is the
 * browser's Web Speech API (free, on-device, no round trip); this server
 * provider is the FALLBACK for browsers that lack it (notably iOS Safari's
 * inconsistent support). Abstracted so the vendor can change without
 * touching the voice route.
 */
export interface SpeechToTextProvider {
  isConfigured(): boolean;
  /** @param audio the recorded clip; @param mimeType e.g. "audio/webm" */
  transcribe(audio: Buffer, mimeType: string): Promise<TranscriptionResult>;
}

class UnconfiguredStt implements SpeechToTextProvider {
  isConfigured() {
    return false;
  }
  async transcribe(): Promise<TranscriptionResult> {
    return { ok: false, reason: "not-configured" };
  }
}

/** OpenAI transcription (gpt-4o-mini-transcribe), server-only key. */
class OpenAiStt implements SpeechToTextProvider {
  private readonly model = process.env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe";
  constructor(private readonly apiKey: string) {}

  isConfigured() {
    return true;
  }

  async transcribe(audio: Buffer, mimeType: string): Promise<TranscriptionResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("mp4") ? "mp4" : "wav";
      const form = new FormData();
      form.append("model", this.model);
      form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType }), `clip.${ext}`);

      const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { authorization: `Bearer ${this.apiKey}` },
        body: form,
        signal: controller.signal,
      });
      if (!res.ok) return { ok: false, reason: "failed" };
      const data = (await res.json()) as { text?: string };
      const text = data.text?.trim();
      if (!text) return { ok: false, reason: "empty" };
      return { ok: true, text };
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return { ok: false, reason: "timeout" };
      return { ok: false, reason: "failed" };
    } finally {
      clearTimeout(timer);
    }
  }
}

let instance: SpeechToTextProvider | null = null;

export function getSttProvider(): SpeechToTextProvider {
  if (instance) return instance;
  const key = process.env.OPENAI_API_KEY;
  instance = key ? new OpenAiStt(key) : new UnconfiguredStt();
  return instance;
}

export function __setSttProvider(next: SpeechToTextProvider | null) {
  instance = next;
}
