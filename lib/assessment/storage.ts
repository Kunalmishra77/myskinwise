import type { SubmitAssessmentInput } from "@/lib/assessment/schema";

export type StoredAssessment = {
  id: string;
  createdAt: string;
};

export type StorageResult =
  | { ok: true; assessment: StoredAssessment }
  | { ok: false; reason: "not-configured" | "failed" };

/**
 * Where a submitted assessment goes.
 *
 * This indirection exists because of a specific, observed failure: the
 * live WordPress funnel returns HTTP 200 on a page that captures nothing,
 * so leads have been disappearing silently with no error anywhere. The
 * worst possible outcome for this rebuild is to reproduce that.
 *
 * So there is no silent fallback. If no database is configured, `save`
 * reports `not-configured` and the caller is expected to route the user to
 * a channel that demonstrably works (WhatsApp) rather than showing a
 * success screen for a lead nobody received. A submission either lands
 * somewhere real or the user is told, every time.
 */
export interface AssessmentStorage {
  save(input: SubmitAssessmentInput): Promise<StorageResult>;
  isConfigured(): boolean;
}

/**
 * Reports "not configured" rather than pretending to store anything.
 *
 * Supabase credentials are not in this repository and must not be invented
 * — see .env.example and PROJECT_BLUEPRINT.md §23. When the client provides
 * NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, replace this with
 * a Supabase-backed implementation; nothing above this interface changes.
 */
class UnconfiguredStorage implements AssessmentStorage {
  isConfigured() {
    return false;
  }

  async save(): Promise<StorageResult> {
    return { ok: false, reason: "not-configured" };
  }
}

let instance: AssessmentStorage | null = null;

export function getAssessmentStorage(): AssessmentStorage {
  if (instance) return instance;

  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (hasSupabase) {
    // Required lazily so @supabase/supabase-js — and, more importantly,
    // the service role key path — is never pulled into a bundle that has
    // no database configured.
    //
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SupabaseAssessmentStorage } = require("@/lib/assessment/supabase-storage");
    const supabase: AssessmentStorage = new SupabaseAssessmentStorage(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    instance = supabase;
    return supabase;
  }

  instance = new UnconfiguredStorage();
  return instance;
}

/** Test seam. */
export function __setAssessmentStorage(next: AssessmentStorage | null) {
  instance = next;
}
