import "server-only";
import { createClient } from "@supabase/supabase-js";
import { generateConsultationReference } from "@/lib/consultation/schema";
import type { ScanResult } from "@/lib/skin/types";

/**
 * Persists a completed engine scan into the SAME `skin_analyses` table the rest
 * of the funnel uses, tied to the lead — so a person who scans shows up in the
 * admin Leads console as "Skin Scan completed", exactly like the old scan. The
 * full ScanResult is stored in the `engine_result` JSONB column (kept separate
 * from the old Observation table so nothing there is disturbed).
 *
 * Best-effort: a persistence failure never fails the scan itself.
 */
const BUCKET = "skin-photos";
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function persistScan(
  result: ScanResult,
  leadId?: string,
  image?: { base64: string; contentType: string },
): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const reference = generateConsultationReference();
  try {
    const { data, error } = await db
      .from("skin_analyses")
      .insert({
        reference,
        status: "completed",
        consent_image_analysis: true,
        policy_version: "engine-v1",
        consented_at: new Date().toISOString(),
        lead_id: leadId ?? null,
        model_version: result.pipeline_version,
        engine_result: result,
      })
      .select("id")
      .single();
    if (error || !data) return null;

    // Save the photo to the PRIVATE bucket for the dermatologist review
    // (face-validity, Phase 9). Best-effort — the scan is already stored.
    if (image?.base64) {
      const path = `engine/${data.id}.${EXT[image.contentType] ?? "jpg"}`;
      const bytes = Buffer.from(image.base64, "base64");
      const up = await db.storage.from(BUCKET).upload(path, bytes, { contentType: image.contentType, upsert: true });
      if (!up.error) await db.from("skin_analyses").update({ image_path: path }).eq("id", data.id);
    }
    return reference;
  } catch {
    return null;
  }
}
