import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { QUESTIONS } from "@/content/assessment/questions";

/**
 * All internal (expert/admin) data operations, service-role only.
 *
 * Never import this from a client component — every method uses the service
 * role key, which bypasses RLS. That is the intended posture: the tables
 * have RLS on with no policies, so nothing reaches this data except through
 * this server-side layer, and the middleware has already authenticated the
 * caller as internal staff before any method here runs.
 */

const OPTION_LABELS = new Map(
  QUESTIONS.flatMap((q) => (q.options ?? []).map((o) => [`${q.id}:${o.value}`, o.label] as const)),
);
const SAFETY_IDS = new Set(["pregnancy", "seen_dermatologist", "acne_type", "cycle_changes", "hormonal_treatment"]);

export type ConsultationRow = {
  id: string;
  reference: string;
  status: string;
  preferred_time: string | null;
  requested_at: string;
  assigned_expert: string | null;
  lead_name: string;
  concern: string;
};

export type ConsultationDetail = ConsultationRow & {
  assessmentId: string;
  leadPhone: string;
  leadEmail: string | null;
  skinType: string | null;
  answers: { questionId: string; prompt: string; values: string[]; safety: boolean }[];
  review: { notes: string | null; verdict: string | null; agreedWithOutline: boolean | null; expertId: string } | null;
  regimen: RegimenDetail | null;
  order: { id: string; status: string } | null;
  /**
   * The linked Skin Analyzer run, if any. AI observations are shown to the
   * expert as INPUT to their review, never as a verdict. Image ids are
   * opaque — the workspace fetches each photo through an authorised admin
   * endpoint that mints a short-lived signed URL, so no storage path or URL
   * is ever embedded here.
   */
  analysis: {
    reference: string;
    status: string;
    modelVersion: string | null;
    createdAt: string;
    imageIds: string[];
    observation: import("@/lib/ai/vision-schema").Observation | null;
  } | null;
};

export type RegimenItemInput = {
  timeOfDay: "am" | "pm" | "both";
  formulationRef: string;
  instructions?: string;
  frequency?: string;
};

export type RegimenDetail = {
  id: string;
  status: string;
  durationDays: number | null;
  customerSummary: string | null;
  followUp: string | null;
  publishedAt: string | null;
  items: {
    stepOrder: number;
    timeOfDay: string;
    formulationRef: string;
    instructions: string | null;
    frequency: string | null;
  }[];
};

function label(questionId: string, value: string): string {
  return OPTION_LABELS.get(`${questionId}:${value}`) ?? value;
}

export class ExpertStore {
  private db: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.db = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private async audit(action: string, subjectId: string, expertId?: string, meta?: object) {
    await this.db.from("audit_log").insert({
      actor_type: "expert",
      actor_id: expertId ?? null,
      action,
      subject_type: "consultation",
      subject_id: subjectId,
      meta: meta ?? null,
    });
  }

  async listConsultations(status?: string): Promise<ConsultationRow[]> {
    let query = this.db
      .from("consultations")
      .select("id, reference, status, preferred_time, requested_at, expert_id, assessments!inner(concern_slug), leads!inner(name)")
      .order("requested_at", { ascending: false })
      .limit(200);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((r) => {
      const a = r.assessments as unknown as { concern_slug: string };
      const l = r.leads as unknown as { name: string };
      return {
        id: r.id,
        reference: r.reference,
        status: r.status,
        preferred_time: r.preferred_time,
        requested_at: r.requested_at,
        assigned_expert: r.expert_id,
        lead_name: l.name,
        concern: a.concern_slug,
      };
    });
  }

  async getConsultation(id: string): Promise<ConsultationDetail | null> {
    const { data: c, error } = await this.db
      .from("consultations")
      .select("id, reference, status, preferred_time, requested_at, expert_id, assessment_id, assessments!inner(concern_slug, skin_type, lead_id), leads!inner(name, phone_e164, email)")
      .eq("id", id)
      .maybeSingle();
    if (error || !c) return null;

    const a = c.assessments as unknown as { concern_slug: string; skin_type: string | null };
    const l = c.leads as unknown as { name: string; phone_e164: string; email: string | null };

    const { data: answerRows } = await this.db
      .from("assessment_answers")
      .select("question_id, value")
      .eq("assessment_id", c.assessment_id);

    const grouped = new Map<string, string[]>();
    for (const row of answerRows ?? []) {
      const arr = grouped.get(row.question_id) ?? [];
      arr.push(label(row.question_id, row.value));
      grouped.set(row.question_id, arr);
    }
    // Preserve question order, safety first.
    const answers = QUESTIONS.filter((q) => grouped.has(q.id))
      .map((q) => ({ questionId: q.id, prompt: q.prompt, values: grouped.get(q.id)!, safety: SAFETY_IDS.has(q.id) }))
      .sort((x, y) => Number(y.safety) - Number(x.safety));

    const { data: reviewRow } = await this.db
      .from("expert_reviews")
      .select("notes, verdict, agreed_with_outline, expert_id")
      .eq("consultation_id", id)
      .maybeSingle();

    const regimen = await this.getRegimenByConsultation(id);

    const { data: orderRow } = await this.db
      .from("orders")
      .select("id, status")
      .eq("consultation_id", id)
      .maybeSingle();

    // Linked Skin Analyzer run, joined via the consultation's assessment.
    let analysis: ConsultationDetail["analysis"] = null;
    const { data: analysisRow } = await this.db
      .from("skin_analyses")
      .select("id, reference, status, model_version, created_at")
      .eq("assessment_id", c.assessment_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (analysisRow) {
      const { data: images } = await this.db
        .from("skin_analysis_images")
        .select("id")
        .eq("analysis_id", analysisRow.id);
      const { data: obs } = await this.db
        .from("skin_analysis_observations")
        .select("observations")
        .eq("analysis_id", analysisRow.id)
        .maybeSingle();
      analysis = {
        reference: analysisRow.reference,
        status: analysisRow.status,
        modelVersion: analysisRow.model_version,
        createdAt: analysisRow.created_at,
        imageIds: (images ?? []).map((i) => i.id),
        observation:
          (obs?.observations as import("@/lib/ai/vision-schema").Observation | undefined) ?? null,
      };
    }

    return {
      id: c.id,
      reference: c.reference,
      status: c.status,
      preferred_time: c.preferred_time,
      requested_at: c.requested_at,
      assigned_expert: c.expert_id,
      lead_name: l.name,
      leadPhone: l.phone_e164,
      leadEmail: l.email,
      concern: a.concern_slug,
      assessmentId: c.assessment_id,
      skinType: a.skin_type,
      answers,
      review: reviewRow
        ? {
            notes: reviewRow.notes,
            verdict: reviewRow.verdict,
            agreedWithOutline: reviewRow.agreed_with_outline,
            expertId: reviewRow.expert_id,
          }
        : null,
      regimen,
      order: orderRow ? { id: orderRow.id, status: orderRow.status } : null,
      analysis,
    };
  }

  /**
   * Mints a short-lived signed URL for one analysis image — the expert photo
   * view's only way to see a photo. The caller (an admin route) is already
   * behind the auth middleware, so this trusts that gate; it still verifies
   * the image id resolves to a real stored object, and the URL it returns
   * expires in two minutes and is never persisted.
   */
  async signImageUrl(imageId: string, expiresInSeconds = 120): Promise<string | null> {
    const { data: image } = await this.db
      .from("skin_analysis_images")
      .select("storage_path")
      .eq("id", imageId)
      .maybeSingle();
    if (!image) return null;
    const { data } = await this.db.storage
      .from("skin-photos")
      .createSignedUrl(image.storage_path, expiresInSeconds);
    return data?.signedUrl ?? null;
  }

  async assignExpert(consultationId: string, expertId: string): Promise<boolean> {
    // Same two faults as publishRegimen: an epoch timestamp, and a status
    // guard whose non-match was reported as success. Assigning an already
    // in-review consultation used to return true having changed nothing.
    const { data, error } = await this.db
      .from("consultations")
      .update({ expert_id: expertId, status: "in_review", assigned_at: new Date().toISOString() })
      .eq("id", consultationId)
      .in("status", ["requested", "scheduled"])
      .select("id");
    if (error || !data || data.length === 0) return false;
    await this.audit("expert.assigned", consultationId, expertId);
    return true;
  }

  /** Records the human verdict. AI output can never write this row. */
  async saveReview(
    consultationId: string,
    assessmentId: string,
    expertId: string,
    input: { notes?: string; verdict: string; agreedWithOutline?: boolean },
  ): Promise<boolean> {
    const { error } = await this.db
      .from("expert_reviews")
      .upsert(
        {
          consultation_id: consultationId,
          assessment_id: assessmentId,
          expert_id: expertId,
          notes: input.notes ?? null,
          verdict: input.verdict,
          agreed_with_outline: input.agreedWithOutline ?? null,
        },
        { onConflict: "consultation_id" },
      );
    if (error) return false;
    await this.db.from("consultations").update({ status: "reviewed" }).eq("id", consultationId);
    await this.audit("expert.review_completed", consultationId, expertId);
    return true;
  }

  async createRegimen(
    consultationId: string,
    assessmentId: string,
    expertId: string,
    input: {
      durationDays?: number;
      customerSummary?: string;
      followUp?: string;
      items: RegimenItemInput[];
    },
  ): Promise<string | null> {
    const { data: review } = await this.db
      .from("expert_reviews")
      .select("id")
      .eq("consultation_id", consultationId)
      .maybeSingle();
    if (!review) return null; // a regimen requires a completed review first

    const { data: regimen, error } = await this.db
      .from("regimens")
      .insert({
        assessment_id: assessmentId,
        expert_review_id: review.id,
        duration_days: input.durationDays ?? null,
        notes: input.customerSummary ?? null,
        follow_up: input.followUp ?? null,
        status: "draft",
      })
      .select("id")
      .single();
    if (error || !regimen) return null;

    if (input.items.length) {
      const rows = input.items.map((it, i) => ({
        regimen_id: regimen.id,
        step_order: i + 1,
        time_of_day: it.timeOfDay,
        formulation_ref: it.formulationRef,
        instructions: it.instructions ?? null,
        frequency: it.frequency ?? null,
      }));
      const { error: itemsError } = await this.db.from("regimen_items").insert(rows);
      if (itemsError) return null;
    }
    await this.audit("regimen.created", consultationId, expertId, { regimen_id: regimen.id });
    return regimen.id;
  }

  async publishRegimen(regimenId: string, consultationId: string, expertId: string): Promise<boolean> {
    /*
     * Two bugs lived in this update, both found by publishing a real regimen
     * against production during the audit.
     *
     * `published_at` was being set to `new Date(0)` — the Unix epoch — so
     * every published regimen recorded as published on 1 January 1970. It is
     * the field an expert would sort a queue by and the one that answers
     * "when did this customer actually get their routine".
     *
     * More seriously, the `status = draft` guard is what makes publishing
     * idempotent, but without checking how many rows it matched, a publish
     * that changed nothing still returned true. Publishing an already
     * published regimen — or one in any other state — reported success to
     * the expert while doing nothing at all. `.select()` makes the update
     * report the rows it actually touched, so "published" now means it.
     */
    const { data, error } = await this.db
      .from("regimens")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", regimenId)
      .eq("status", "draft")
      .select("id");
    if (error || !data || data.length === 0) return false;
    await this.db.from("consultations").update({ status: "regimen_created" }).eq("id", consultationId);
    await this.audit("regimen.published", consultationId, expertId, { regimen_id: regimenId });
    return true;
  }

  private async getRegimenByConsultation(consultationId: string): Promise<RegimenDetail | null> {
    // A consultation's regimen is joined via its expert_review.
    const { data: review } = await this.db
      .from("expert_reviews")
      .select("id")
      .eq("consultation_id", consultationId)
      .maybeSingle();
    if (!review) return null;
    return this.getRegimenByReview(review.id);
  }

  async getRegimenByReview(reviewId: string): Promise<RegimenDetail | null> {
    const { data: regimen } = await this.db
      .from("regimens")
      .select("id, status, duration_days, notes, follow_up, published_at")
      .eq("expert_review_id", reviewId)
      .maybeSingle();
    if (!regimen) return null;

    const { data: items } = await this.db
      .from("regimen_items")
      .select("step_order, time_of_day, formulation_ref, instructions, frequency")
      .eq("regimen_id", regimen.id)
      .order("step_order");

    return {
      id: regimen.id,
      status: regimen.status,
      durationDays: regimen.duration_days,
      customerSummary: regimen.notes,
      followUp: regimen.follow_up,
      publishedAt: regimen.published_at,
      items: (items ?? []).map((it) => ({
        stepOrder: it.step_order,
        timeOfDay: it.time_of_day,
        formulationRef: it.formulation_ref,
        instructions: it.instructions,
        frequency: it.frequency,
      })),
    };
  }

  async createOrder(consultationId: string, regimenId: string, expertId: string): Promise<string | null> {
    const { data: consultation } = await this.db
      .from("consultations")
      .select("lead_id")
      .eq("id", consultationId)
      .maybeSingle();
    if (!consultation) return null;

    const { data: order, error } = await this.db
      .from("orders")
      .insert({
        lead_id: consultation.lead_id,
        consultation_id: consultationId,
        regimen_id: regimenId,
        status: "pending",
      })
      .select("id")
      .single();
    if (error || !order) return null;
    await this.audit("order.created", consultationId, expertId, { order_id: order.id });
    return order.id;
  }

  async listOrders(): Promise<{ id: string; status: string; reference: string; leadName: string; createdAt: string }[]> {
    const { data } = await this.db
      .from("orders")
      .select("id, status, created_at, consultations!inner(reference), leads!inner(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!data) return [];
    return data.map((o) => {
      const c = o.consultations as unknown as { reference: string };
      const l = o.leads as unknown as { name: string };
      return { id: o.id, status: o.status, reference: c.reference, leadName: l.name, createdAt: o.created_at };
    });
  }

  async updateOrderStatus(orderId: string, status: string, expertId: string): Promise<boolean> {
    const allowed = ["pending", "confirmed", "fulfilled", "shipped", "cancelled"];
    if (!allowed.includes(status)) return false;
    const { data, error } = await this.db
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select("consultation_id")
      .single();
    if (error || !data) return false;
    await this.audit("order.status_changed", data.consultation_id, expertId, { order_id: orderId, status });
    return true;
  }
}

let store: ExpertStore | null = null;

export function getExpertStore(): ExpertStore | null {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  store = new ExpertStore(url, key);
  return store;
}
