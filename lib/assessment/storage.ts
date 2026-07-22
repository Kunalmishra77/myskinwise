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

  // When credentials arrive, construct the Supabase adapter here. Kept as
  // an explicit branch so the absence of a database is visible in code
  // review rather than buried in a try/catch.
  if (hasSupabase) {
    // TODO(client-credentials): implement SupabaseAssessmentStorage once
    // real project credentials exist. Deliberately not stubbed with a
    // fake client — a storage layer that appears to work but does not is
    // the exact bug this file exists to prevent.
  }

  instance = new UnconfiguredStorage();
  return instance;
}

/** Test seam. */
export function __setAssessmentStorage(next: AssessmentStorage | null) {
  instance = next;
}
