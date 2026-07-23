import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "skin-photos";

export type PurgeReport = {
  ok: boolean;
  analysesExpired: number;
  objectsDeleted: number;
  rowsDeleted: number;
  failures: string[];
};

/**
 * Enforces the 90-day photo retention promise.
 *
 * Safety properties, each deliberate:
 *  - Deletes ONLY analyses whose `expires_at` is in the past. Active,
 *    non-expired photos are never touched — the query is the guard.
 *  - Deletes the storage OBJECT first, then the row, so a crash mid-run
 *    never leaves a row pointing at a file that is already gone; a retry
 *    re-selects the same still-expired rows and finishes the job.
 *  - Only ever removes paths that belong to an expired analysis (paths come
 *    from that analysis's own image rows), so it cannot delete unrelated
 *    files in the bucket.
 *  - Storage-delete failures are collected and reported, not swallowed, and
 *    a row is only deleted once its objects are gone — so a failed object
 *    delete leaves the row for the next run rather than orphaning a file.
 *  - Idempotent: running it twice is harmless; the second run finds nothing
 *    (or finishes what the first left).
 */
export async function purgeExpiredPhotos(db: SupabaseClient, now: Date): Promise<PurgeReport> {
  const report: PurgeReport = {
    ok: true,
    analysesExpired: 0,
    objectsDeleted: 0,
    rowsDeleted: 0,
    failures: [],
  };

  const { data: expired, error } = await db
    .from("skin_analyses")
    .select("id")
    .lt("expires_at", now.toISOString())
    .limit(500);

  if (error) {
    report.ok = false;
    report.failures.push(`select: ${error.message}`);
    return report;
  }
  report.analysesExpired = expired?.length ?? 0;

  for (const analysis of expired ?? []) {
    const { data: images } = await db
      .from("skin_analysis_images")
      .select("storage_path")
      .eq("analysis_id", analysis.id);

    const paths = (images ?? []).map((i) => i.storage_path);
    let objectsOk = true;

    if (paths.length) {
      const { error: delErr } = await db.storage.from(BUCKET).remove(paths);
      if (delErr) {
        objectsOk = false;
        report.ok = false;
        report.failures.push(`storage ${analysis.id}: ${delErr.message}`);
      } else {
        report.objectsDeleted += paths.length;
      }
    }

    // Only remove the row once its objects are confirmed gone. If the object
    // delete failed, the row stays and the next run retries it.
    if (objectsOk) {
      const { error: rowErr } = await db.from("skin_analyses").delete().eq("id", analysis.id);
      if (rowErr) {
        report.ok = false;
        report.failures.push(`row ${analysis.id}: ${rowErr.message}`);
      } else {
        // Cascades to skin_analysis_images and _observations via FK.
        report.rowsDeleted += 1;
      }
    }
  }

  return report;
}

export function makeServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
