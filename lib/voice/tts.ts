export type SpeechResult =
  | { ok: true; audioBase64: string; mimeType: string }
  | { ok: false; reason: "not-configured" | "timeout" | "failed" };

/**
 * Server-side text-to-speech seam. OpenAI TTS is the primary because it is
 * consistent across devices (the browser's SpeechSynthesis voice quality
 * varies wildly and is poor on many Android devices); the browser is the
 * client-side FALLBACK when this fails. Abstracted so the vendor can change
 * without touching the voice route.
 */
export interface TextToSpeechProvider {
  isConfigured(): boolean;
  speak(text: string): Promise<SpeechResult>;
}

class UnconfiguredTts implements TextToSpeechProvider {
  isConfigured() {
    return false;
  }
  async speak(): Promise<SpeechResult> {
    return { ok: false, reason: "not-configured" };
  }
}

/** OpenAI TTS (gpt-4o-mini-tts), server-only key. */
class OpenAiTts implements TextToSpeechProvider {
  private readonly model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
  private readonly voice = process.env.OPENAI_TTS_VOICE || "shimmer";
  constructor(private readonly apiKey: string) {}

  isConfigured() {
    return true;
  }

  async speak(text: string): Promise<SpeechResult> {
    // Hard cap the spoken length: voice replies must be short, and this also
    // caps cost per turn regardless of what the model returned.
    const input = text.slice(0, 700);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ model: this.model, voice: this.voice, input, response_format: "mp3" }),
        signal: controller.signal,
      });
      if (!res.ok) return { ok: false, reason: "failed" };
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0) return { ok: false, reason: "failed" };
      return { ok: true, audioBase64: buf.toString("base64"), mimeType: "audio/mpeg" };
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return { ok: false, reason: "timeout" };
      return { ok: false, reason: "failed" };
    } finally {
      clearTimeout(timer);
    }
  }
}

let instance: TextToSpeechProvider | null = null;

export function getTtsProvider(): TextToSpeechProvider {
  if (instance) return instance;
  const key = process.env.OPENAI_API_KEY;
  instance = key ? new OpenAiTts(key) : new UnconfiguredTts();
  return instance;
}

export function __setTtsProvider(next: TextToSpeechProvider | null) {
  instance = next;
}
