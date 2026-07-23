import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getImageAnalysisProvider } from "@/lib/ai/vision-provider";
import { generateConsultationReference } from "@/lib/consultation/schema";
import type { Observation } from "@/lib/ai/vision-schema";

const BUCKET = "skin-photos";
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ImageInput = {
  base64: string; // raw base64, no data: prefix
  contentType: "image/jpeg" | "image/png" | "image/webp";
  bytes: number;
  angle?: "front" | "left" | "right";
};

export type AnalyzeResult =
  | { ok: true; reference: string; observation: Observation }
  | {
      ok: false;
      reason: "not-configured" | "quality_failed" | "failed" | "invalid-output" | "timeout";
      reference?: string;
    };

export interface AnalysisStore {
  analyze(input: { images: ImageInput[]; policyVersion: string }): Promise<AnalyzeResult>;
  /** Customer re-fetch by reference (the reference is the bearer token). */
  getByReference(reference: string): Promise<{ status: string; observation: Observation | null } | null>;
}

class UnconfiguredAnalysisStore implements AnalysisStore {
  async analyze(): Promise<AnalyzeResult> {
    return { ok: false, reason: "not-configured" };
  }
  async getByReference() {
    return null;
  }
}

class SupabaseAnalysisStore implements AnalysisStore {
  private db: SupabaseClient;
  constructor(url: string, key: string) {
    this.db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async analyze({ images, policyVersion }: { images: ImageInput[]; policyVersion: string }): Promise<AnalyzeResult> {
    const reference = generateConsultationReference();
    try {
      // Consent is a hard precondition of this whole path — the caller only
      // reaches here after the user has explicitly agreed to AI image
      // analysis, and that agreement is recorded on the row.
      const { data: analysis, error } = await this.db
        .from("skin_analyses")
        .insert({
          reference,
          status: "analyzing",
          consent_image_analysis: true,
          policy_version: policyVersion,
          consented_at: new Date(0).toISOString(),
        })
        .select("id")
        .single();
      if (error || !analysis) return { ok: false, reason: "failed" };

      // Upload each photo to the PRIVATE bucket via the service role. The
      // storage path is derived server-side and never returned to the
      // client — the client only ever learns the analysis reference.
      const dataUrls: string[] = [];
      for (const img of images) {
        const path = `${analysis.id}/${crypto.randomUUID()}.${EXT[img.contentType]}`;
        const bytes = Buffer.from(img.base64, "base64");
        const { error: upErr } = await this.db.storage
          .from(BUCKET)
          .upload(path, bytes, { contentType: img.contentType, upsert: false });
        if (upErr) {
          await this.db.from("skin_analyses").update({ status: "failed", error_reason: "upload" }).eq("id", analysis.id);
          return { ok: false, reason: "failed", reference };
        }
        await this.db.from("skin_analysis_images").insert({
          analysis_id: analysis.id,
          storage_path: path,
          content_type: img.contentType,
          bytes: img.bytes,
          angle: img.angle ?? "front",
        });
        dataUrls.push(`data:${img.contentType};base64,${img.base64}`);
      }

      const provider = getImageAnalysisProvider();
      const result = await provider.analyze(dataUrls);

      if (!result.ok) {
        // Never a false "completed". A failed or malformed model call lands
        // on "failed" with the reason recorded.
        await this.db
          .from("skin_analyses")
          .update({ status: "failed", error_reason: result.reason })
          .eq("id", analysis.id);
        return { ok: false, reason: result.reason, reference };
      }

      // An unusable image is a quality failure, not a completed analysis.
      if (result.observation.image_quality === "unusable" || !result.observation.face_visible) {
        await this.db
          .from("skin_analyses")
          .update({ status: "quality_failed", model_version: result.modelVersion })
          .eq("id", analysis.id);
        await this.db
          .from("skin_analysis_observations")
          .insert({ analysis_id: analysis.id, observations: result.observation });
        return { ok: false, reason: "quality_failed", reference };
      }

      await this.db
        .from("skin_analyses")
        .update({ status: "completed", model_version: result.modelVersion })
        .eq("id", analysis.id);
      await this.db
        .from("skin_analysis_observations")
        .insert({ analysis_id: analysis.id, observations: result.observation });

      return { ok: true, reference, observation: result.observation };
    } catch {
      return { ok: false, reason: "failed", reference };
    }
  }

  async getByReference(reference: string) {
    const { data: analysis } = await this.db
      .from("skin_analyses")
      .select("id, status")
      .eq("reference", reference)
      .maybeSingle();
    if (!analysis) return null;

    const { data: obs } = await this.db
      .from("skin_analysis_observations")
      .select("observations")
      .eq("analysis_id", analysis.id)
      .maybeSingle();

    return {
      status: analysis.status,
      observation: (obs?.observations as Observation | undefined) ?? null,
    };
  }
}

let store: AnalysisStore | null = null;

export function getAnalysisStore(): AnalysisStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  store = url && key ? new SupabaseAnalysisStore(url, key) : new UnconfiguredAnalysisStore();
  return store;
}

export function __setAnalysisStore(next: AnalysisStore | null) {
  store = next;
}
