import { observationSchema, OBSERVATION_JSON_SCHEMA, type Observation } from "@/lib/ai/vision-schema";
import { scrubClaims } from "@/lib/ai/safety";

export type VisionResult =
  | { ok: true; observation: Observation; modelVersion: string }
  | { ok: false; reason: "not-configured" | "timeout" | "failed" | "invalid-output" };

/**
 * Abstracted separately from the text AiProvider (requirement §6) so the
 * image model can change without touching the assistant, and vice versa. A
 * future provider swap is one class here.
 */
export interface ImageAnalysisProvider {
  isConfigured(): boolean;
  analyze(imageDataUrls: string[]): Promise<VisionResult>;
}

class UnconfiguredVisionProvider implements ImageAnalysisProvider {
  isConfigured() {
    return false;
  }
  async analyze(): Promise<VisionResult> {
    return { ok: false, reason: "not-configured" };
  }
}

/**
 * The strict, observation-only system instruction. This is the safety
 * boundary at the prompt level; the deterministic schema and the claim
 * scrub are the boundaries that do not trust the prompt.
 */
const SYSTEM = `You are an image-quality and visible-skin-observation tool for Skinwise. You look at a face photo and report ONLY what is visibly present on the skin.

HARD RULES:
- You are NOT a doctor and this is NOT a diagnosis. Never name or imply a medical condition (never say acne, rosacea, eczema, melasma, dermatitis, infection, etc.).
- Report only VISIBLE characteristics using the given feature list. Mark how sure you are with "observed" (clearly visible), "possible" (might be there), or "unclear" (can't tell from this photo).
- Be conservative. If the image is blurry, dark, or the face is small/absent, say so in image_quality and face_visible, and return few or no features.
- Never claim to cure, treat, heal, or guarantee anything.
- Set recommend_professional = true ONLY if something visible looks like it genuinely warrants a person looking at it (e.g. widespread inflammation, something that looks painful or infected). You still must not name what it is.
- notes must describe appearance only, e.g. "some shine across the forehead", never "this is oily skin caused by...".
- face_box: give the face's bounding box in the image as fractions 0..1 (x,y = top-left corner, width,height = size). If the whole frame is the face, use x:0,y:0,width:1,height:1. Be approximate; this only positions a marker.
- For each feature, set region to the coarse area it is MAINLY visible in, using image-relative sides (left = the left of the picture): forehead, left_cheek, right_cheek, nose, chin, under_eye_left, under_eye_right, jaw, or overall if it is spread across the face.`;

class OpenAiVisionProvider implements ImageAnalysisProvider {
  private readonly model = process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini";
  constructor(private readonly apiKey: string) {}

  isConfigured() {
    return true;
  }

  async analyze(imageDataUrls: string[]): Promise<VisionResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 600,
          response_format: {
            type: "json_schema",
            json_schema: { name: "skin_observation", strict: true, schema: OBSERVATION_JSON_SCHEMA },
          },
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "user",
              content: [
                { type: "text", text: "Report the visible skin characteristics in this photo." },
                ...imageDataUrls.map((url) => ({ type: "image_url" as const, image_url: { url } })),
              ],
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!res.ok) return { ok: false, reason: "failed" };
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const raw = data.choices?.[0]?.message?.content;
      if (!raw) return { ok: false, reason: "failed" };

      // Structured output is validated, never trusted blind (requirement §7).
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return { ok: false, reason: "invalid-output" };
      }
      const check = observationSchema.safeParse(parsed);
      if (!check.success) return { ok: false, reason: "invalid-output" };

      // Belt and braces: scrub any claim language out of the free-text notes,
      // even though the schema and prompt already forbid it.
      const observation: Observation = {
        ...check.data,
        limitations: scrubClaims(check.data.limitations),
        features: check.data.features.map((f) => ({ ...f, note: scrubClaims(f.note) })),
      };

      return { ok: true, observation, modelVersion: this.model };
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return { ok: false, reason: "timeout" };
      return { ok: false, reason: "failed" };
    } finally {
      clearTimeout(timeout);
    }
  }
}

let instance: ImageAnalysisProvider | null = null;

export function getImageAnalysisProvider(): ImageAnalysisProvider {
  if (instance) return instance;
  const key = process.env.OPENAI_API_KEY;
  instance = key ? new OpenAiVisionProvider(key) : new UnconfiguredVisionProvider();
  return instance;
}

export function __setImageAnalysisProvider(next: ImageAnalysisProvider | null) {
  instance = next;
}
