import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SubmitAssessmentInput } from "@/lib/assessment/schema";
import type { AssessmentStorage, StorageResult } from "@/lib/assessment/storage";
import { buildRegimenOutline } from "@/lib/assessment/recommend";

export const ENGINE_VERSION = "rules-1";

/**
 * Persists a submitted assessment to Supabase.
 *
 * Uses the SERVICE ROLE key, so this module must never be imported from a
 * client component — the submit route is `runtime: "nodejs"` and is the
 * only caller. The key bypasses RLS, which is deliberate: the tables have
 * RLS enabled with no policies, so the anon key can read and write nothing
 * while the server can still write. There are no user accounts yet, so
 * there is no legitimate direct-from-browser access to grant.
 *
 * Failure behaviour is the whole point of this class. Any error resolves
 * to `{ ok: false }`, never a throw that a caller might mistake for
 * success, and never a partial success reported as complete. The route
 * then returns its documented fallback and the UI tells the user their
 * assessment was not saved.
 */
export class SupabaseAssessmentStorage implements AssessmentStorage {
  private client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  isConfigured() {
    return true;
  }

  async save(input: SubmitAssessmentInput): Promise<StorageResult> {
    try {
      const { data: lead, error: leadError } = await this.client
        .from("leads")
        .insert({
          name: input.contact.name,
          phone_e164: input.contact.phone,
          email: input.contact.email || null,
        })
        .select("id")
        .single();

      if (leadError || !lead) return { ok: false, reason: "failed" };

      const skinType = typeof input.answers.skin_type === "string" ? input.answers.skin_type : null;

      const { data: assessment, error: assessmentError } = await this.client
        .from("assessments")
        .insert({
          lead_id: lead.id,
          concern_slug: input.concern,
          skin_type: skinType,
          contact_consent: input.consent.contactConsent,
          photo_consent: input.consent.photoConsent ?? null,
          policy_version: input.consent.policyVersion,
        })
        .select("id, submitted_at")
        .single();

      if (assessmentError || !assessment) return { ok: false, reason: "failed" };

      // One row per value: a multi-select answer becomes several rows so
      // the expert view can filter on a single value without parsing.
      const answerRows = Object.entries(input.answers).flatMap(([questionId, value]) =>
        (Array.isArray(value) ? value : [value])
          .filter((v) => v !== "")
          .map((v) => ({ assessment_id: assessment.id, question_id: questionId, value: v })),
      );

      if (answerRows.length) {
        const { error } = await this.client.from("assessment_answers").insert(answerRows);
        // The assessment exists but is incomplete without its answers, so
        // this is a failure — reporting success here would hand the expert
        // a case they cannot act on.
        if (error) return { ok: false, reason: "failed" };
      }

      // Link a prior Skin Analyzer run to this assessment, if one was
      // referenced. Best-effort: a failed link must not fail the whole
      // submission — the analysis is supplementary to the answers. Only
      // links an as-yet-unlinked analysis, so a reference cannot be used to
      // steal an analysis already attached elsewhere.
      if (input.analysisReference) {
        await this.client
          .from("skin_analyses")
          .update({ assessment_id: assessment.id, lead_id: lead.id })
          .eq("reference", input.analysisReference)
          .is("assessment_id", null);
      }

      const { error: outlineError } = await this.client
        .from("regimen_recommendations")
        .insert({
          assessment_id: assessment.id,
          engine_version: ENGINE_VERSION,
          outline: buildRegimenOutline(input),
        });

      if (outlineError) return { ok: false, reason: "failed" };

      return {
        ok: true,
        assessment: { id: assessment.id, createdAt: assessment.submitted_at },
      };
    } catch {
      return { ok: false, reason: "failed" };
    }
  }
}
