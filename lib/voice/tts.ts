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
  /** @param lang optional language hint ("hi" nudges Hindi pronunciation). */
  speak(text: string, lang?: "en" | "hi"): Promise<SpeechResult>;
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
    // OpenAI TTS is English-centric; the lang hint is accepted by the
    // interface but only ElevenLabs acts on it.
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

/**
 * ElevenLabs TTS — the preferred voice when configured.
 *
 * Chosen over OpenAI for the voice agent because the voice quality is
 * markedly more natural, and the same multilingual voice can later speak
 * Hindi with no second voice to manage. The brain is unchanged: this only
 * speaks the FINAL, safety-checked text that respond() produced — it never
 * generates content, so swapping the voice vendor cannot affect what is said.
 */
class ElevenLabsTts implements TextToSpeechProvider {
  private readonly model = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
  constructor(
    private readonly apiKey: string,
    private readonly voiceId: string,
  ) {}

  isConfigured() {
    return true;
  }

  async speak(text: string, lang?: "en" | "hi"): Promise<SpeechResult> {
    // Same hard cap as OpenAI: voice replies stay short, which also bounds
    // ElevenLabs cost per turn regardless of what the model returned.
    const input = text.slice(0, 700);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: { "xi-api-key": this.apiKey, "content-type": "application/json" },
          body: JSON.stringify({
            text: input,
            model_id: this.model,
            // language_code nudges pronunciation for the multilingual model,
            // so Hindi is read as Hindi rather than transliterated English.
            ...(lang ? { language_code: lang } : {}),
            // Slightly higher stability + similarity than the defaults: a
            // skincare assistant should sound calm and consistent, not
            // theatrical.
            voice_settings: { stability: 0.5, similarity_boost: 0.8 },
          }),
          signal: controller.signal,
        },
      );
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
  // ElevenLabs first when it has both a key and a voice; OpenAI is the
  // fallback so voice never silently breaks if the ElevenLabs vars are
  // missing on a given environment.
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (elevenKey && voiceId) {
    instance = new ElevenLabsTts(elevenKey, voiceId);
    return instance;
  }
  const key = process.env.OPENAI_API_KEY;
  instance = key ? new OpenAiTts(key) : new UnconfiguredTts();
  return instance;
}

export function __setTtsProvider(next: TextToSpeechProvider | null) {
  instance = next;
}
