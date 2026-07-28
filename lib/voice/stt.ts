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

/**
 * Filename extension to send with the upload, derived from the browser's
 * MIME type.
 *
 * This matters more than it looks. The OpenAI transcription endpoint infers
 * the container from the uploaded filename, so an extension that disagrees
 * with the bytes is rejected outright.
 *
 * The previous version mapped only webm and mp4 and defaulted everything
 * else to "wav", which meant an mp3 or ogg clip was uploaded as `clip.wav`
 * and failed every time. That default was exactly backwards: this provider
 * exists as the fallback for browsers whose recording format is unusual, so
 * unusual formats are the ones it most needs to get right. Caught by sending
 * real audio/mpeg through the deployed endpoint.
 *
 * Every extension below is one the API accepts. An unrecognised type falls
 * back to webm, the format the overwhelming majority of MediaRecorder
 * implementations actually produce.
 */
function extensionFor(mimeType: string): string {
  const type = mimeType.toLowerCase();
  // Order matters: check "mpeg" before "mp4" would misfire on neither, but
  // "mp4" must be checked before the generic "mp" families to stay readable.
  if (type.includes("webm")) return "webm";
  if (type.includes("ogg") || type.includes("oga")) return "ogg";
  if (type.includes("wav")) return "wav";
  if (type.includes("flac")) return "flac";
  if (type.includes("m4a")) return "m4a";
  if (type.includes("mp4")) return "mp4";
  if (type.includes("mpeg") || type.includes("mp3") || type.includes("mpga")) return "mp3";
  return "webm";
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
      const ext = extensionFor(mimeType);
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

/**
 * ElevenLabs Scribe — the preferred transcription when configured.
 *
 * The voice agent no longer leans on the browser's Web Speech API, which is
 * effectively Chrome-only and unreliable. Every clip is now recorded with
 * MediaRecorder and transcribed here, so Scribe is on the primary path, not a
 * fallback. It handles Indian-accented English and Hindi well, which matters
 * for this audience.
 */
class ElevenLabsStt implements SpeechToTextProvider {
  private readonly model = process.env.ELEVENLABS_STT_MODEL || "scribe_v1";
  constructor(private readonly apiKey: string) {}

  isConfigured() {
    return true;
  }

  async transcribe(audio: Buffer, mimeType: string): Promise<TranscriptionResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    try {
      const ext = extensionFor(mimeType);
      const form = new FormData();
      form.append("model_id", this.model);
      form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType }), `clip.${ext}`);

      const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: { "xi-api-key": this.apiKey },
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
  // ElevenLabs first, OpenAI Whisper as the fallback so transcription never
  // silently breaks if the ElevenLabs key is absent on an environment.
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (elevenKey) {
    instance = new ElevenLabsStt(elevenKey);
    return instance;
  }
  const key = process.env.OPENAI_API_KEY;
  instance = key ? new OpenAiStt(key) : new UnconfiguredStt();
  return instance;
}

/** Test seam for the extension mapping. */
export const __extensionForTest = extensionFor;

export function __setSttProvider(next: SpeechToTextProvider | null) {
  instance = next;
}
