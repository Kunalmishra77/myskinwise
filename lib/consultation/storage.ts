import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { generateConsultationReference } from "@/lib/consultation/schema";

export type ConsultationContext = {
  consultationId: string;
  reference: string;
  leadName: string;
  leadPhone: string;
  concernSlug: string;
  skinType: string | null;
  answers: Record<string, string[]>;
};

export type CreateConsultationResult =
  | { ok: true; consultation: ConsultationContext }
  | { ok: false; reason: "not-configured" | "not-found" | "failed" };

export interface ConsultationStorage {
  /**
   * @param assessmentId the assessment this consultation is for
   * @param leadPhone the phone the caller claims owns that assessment
   */
  create(
    assessmentId: string,
    leadPhone: string,
    preferredTime: string,
  ): Promise<CreateConsultationResult>;
}

class UnconfiguredConsultationStorage implements ConsultationStorage {
  async create(): Promise<CreateConsultationResult> {
    return { ok: false, reason: "not-configured" };
  }
}

class SupabaseConsultationStorage implements ConsultationStorage {
  private client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async create(
    assessmentId: string,
    leadPhone: string,
    preferredTime: string,
  ): Promise<CreateConsultationResult> {
    try {
      // Ownership check. There are no user accounts, so the phone number
      // supplied with the request is the only claim of identity available —
      // and it is checked against the assessment's own lead rather than
      // trusted. Without this, anyone holding a guessed assessment UUID
      // could open a consultation against a stranger's skin assessment and
      // receive their answers in the handoff message.
      const { data: assessment, error } = await this.client
        .from("assessments")
        .select("id, concern_slug, skin_type, lead_id, leads!inner(id, name, phone_e164)")
        .eq("id", assessmentId)
        .maybeSingle();

      if (error) return { ok: false, reason: "failed" };
      if (!assessment) return { ok: false, reason: "not-found" };

      const lead = assessment.leads as unknown as {
        id: string;
        name: string;
        phone_e164: string;
      };

      // Same "not-found" for a wrong owner as for a missing row: telling a
      // caller "that assessment exists but is not yours" confirms the id is
      // real, which is exactly what an enumeration attempt is looking for.
      if (lead.phone_e164 !== leadPhone) return { ok: false, reason: "not-found" };

      const { data: answerRows } = await this.client
        .from("assessment_answers")
        .select("question_id, value")
        .eq("assessment_id", assessmentId);

      const answers: Record<string, string[]> = {};
      for (const row of answerRows ?? []) {
        (answers[row.question_id] ??= []).push(row.value);
      }

      const reference = generateConsultationReference();

      const { data: consultation, error: insertError } = await this.client
        .from("consultations")
        .insert({
          assessment_id: assessmentId,
          lead_id: lead.id,
          reference,
          status: "requested",
          preferred_time: preferredTime,
          payment_status: "not_required",
        })
        .select("id, reference")
        .single();

      if (insertError || !consultation) return { ok: false, reason: "failed" };

      // Best-effort audit. A failed audit write must not fail the customer's
      // request — the consultation itself is the record that matters.
      await this.client.from("audit_log").insert({
        actor_type: "customer",
        action: "consultation.created",
        subject_type: "consultation",
        subject_id: consultation.id,
        meta: { preferred_time: preferredTime },
      });

      return {
        ok: true,
        consultation: {
          consultationId: consultation.id,
          reference: consultation.reference,
          leadName: lead.name,
          leadPhone: lead.phone_e164,
          concernSlug: assessment.concern_slug,
          skinType: assessment.skin_type,
          answers,
        },
      };
    } catch {
      return { ok: false, reason: "failed" };
    }
  }
}

let instance: ConsultationStorage | null = null;

export function getConsultationStorage(): ConsultationStorage {
  if (instance) return instance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  instance =
    url && key
      ? new SupabaseConsultationStorage(url, key)
      : new UnconfiguredConsultationStorage();
  return instance;
}

/** Test seam. */
export function __setConsultationStorage(next: ConsultationStorage | null) {
  instance = next;
}
