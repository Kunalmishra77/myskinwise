import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Phase 9 — dermatologist face-validity review (blueprint §11.3).
 *
 * A read/write model over engine scans (skin_analyses rows with an
 * engine_result + a stored photo). The reviewer sees the photo + the engine's
 * scores and records a per-concern verdict (accurate / partial / wrong). Purely
 * service-role; the page it backs sits behind the admin session.
 */

const BUCKET = "skin-photos";

export type ReviewConcern = { id: string; score: number | null; severity: string | null };
export type ReviewScan = {
  id: string;
  reference: string;
  createdAt: string;
  photoUrl: string | null;
  scanId: string | null; // engine scan_id, to fetch evidence masks if needed
  concerns: ReviewConcern[];
  verdict: Record<string, string> | null;
};

function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function listScansToReview(limit = 40): Promise<ReviewScan[]> {
  const client = db();
  if (!client) return [];
  const { data } = await client
    .from("skin_analyses")
    .select("id, reference, created_at, engine_result, image_path, review_verdict")
    .not("engine_result", "is", null)
    .not("image_path", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!data) return [];

  const out: ReviewScan[] = [];
  for (const row of data) {
    let photoUrl: string | null = null;
    if (row.image_path) {
      const { data: signed } = await client.storage.from(BUCKET).createSignedUrl(row.image_path, 3600);
      photoUrl = signed?.signedUrl ?? null;
    }
    const er = row.engine_result ?? {};
    out.push({
      id: row.id,
      reference: row.reference,
      createdAt: row.created_at,
      photoUrl,
      scanId: er.scan_id ?? null,
      concerns: (er.concerns ?? [])
        .filter((c: ReviewConcern) => c.score !== null)
        .map((c: ReviewConcern) => ({ id: c.id, score: c.score, severity: c.severity })),
      verdict: row.review_verdict ?? null,
    });
  }
  return out;
}

export async function saveVerdict(id: string, verdict: Record<string, string>): Promise<boolean> {
  const client = db();
  if (!client) return false;
  const { error } = await client
    .from("skin_analyses")
    .update({ review_verdict: verdict, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export async function reviewSummary(): Promise<{ reviewed: number; accurate: number; partial: number; wrong: number }> {
  const client = db();
  if (!client) return { reviewed: 0, accurate: 0, partial: 0, wrong: 0 };
  const { data } = await client
    .from("skin_analyses")
    .select("review_verdict")
    .not("review_verdict", "is", null)
    .limit(5000);
  let accurate = 0;
  let partial = 0;
  let wrong = 0;
  for (const row of data ?? []) {
    for (const v of Object.values(row.review_verdict ?? {})) {
      if (v === "accurate") accurate++;
      else if (v === "partial") partial++;
      else if (v === "wrong") wrong++;
    }
  }
  return { reviewed: data?.length ?? 0, accurate, partial, wrong };
}
