import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Lead management for the expert console.
 *
 * Built entirely on the tables that already exist — leads, assessments,
 * skin_analyses, consultations, expert_reviews, regimens, orders. No new
 * table, no duplicated state, and nothing written here: this is a read model
 * over the funnel that was already being recorded.
 *
 * It exists because of a gap the audit found in live data. The admin console
 * listed CONSULTATIONS only, but a consultation is created several steps into
 * the funnel. Production held 12 leads and 12 assessments against a single
 * consultation, so eleven of twelve people who handed over their name and
 * phone number were invisible to the team. They were stored correctly and
 * nobody could see them.
 *
 * The lifecycle below is derived, not stored. Deriving it means the stage can
 * never disagree with the underlying rows — there is no status column to fall
 * out of sync, and a lead that progresses shows the new stage immediately.
 */

/** Ordered: each stage implies every earlier one. */
export const LEAD_STAGES = [
  "new",
  "skin_check_completed",
  "skin_scan_completed",
  "consultation_requested",
  "expert_review",
  "regimen_published",
  "order_created",
  "order_shipped",
] as const;

export type LeadStage = (typeof LEAD_STAGES)[number];

export const STAGE_LABELS: Record<LeadStage, string> = {
  new: "New lead",
  skin_check_completed: "Skin Check completed",
  skin_scan_completed: "Skin Scan completed",
  consultation_requested: "Consultation requested",
  expert_review: "Expert review",
  regimen_published: "Regimen published",
  order_created: "Order created",
  order_shipped: "Order shipped",
};

/** How the person first reached us, derived from what they actually did. */
export type LeadSource = "skin_check" | "skin_scan" | "consultation";

export const SOURCE_LABELS: Record<LeadSource, string> = {
  skin_check: "Skin Check",
  skin_scan: "Skin Scanner",
  consultation: "Consultation",
};

export type LeadRow = {
  id: string;
  name: string;
  /** E.164. Shown to the team so they can act on the lead — this is a CRM. */
  phone: string;
  email: string | null;
  /** City/area the lead gave, if any. */
  location: string | null;
  createdAt: string;
  source: LeadSource;
  stage: LeadStage;
  concern: string | null;
  /** Consultation reference, once one exists. Null before that. */
  reference: string | null;
  consultationId: string | null;
  consultationStatus: string | null;
  hasPublishedRegimen: boolean;
  orderStatus: string | null;
  scanCount: number;
  /** True while nobody has acted on it: a lead with no consultation yet. */
  needsAction: boolean;
};

export interface LeadStore {
  listLeads(limit?: number): Promise<LeadRow[]>;
  /** Count of leads created since `since`, for the "new work" indicator. */
  countNewSince(since: Date): Promise<number>;
}

class SupabaseLeadStore implements LeadStore {
  private db: SupabaseClient;
  constructor(url: string, key: string) {
    this.db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async listLeads(limit = 200): Promise<LeadRow[]> {
    const { data: leads, error } = await this.db
      .from("leads")
      .select("id, name, phone_e164, email, location, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !leads) return [];

    const ids = leads.map((l) => l.id);
    if (ids.length === 0) return [];

    /*
     * Four batched queries rather than a query per lead. A per-lead fan-out
     * would be 200 round trips to render one page; these are four, and the
     * joining happens in memory where it is free.
     */
    const [assessments, analyses, consultations] = await Promise.all([
      this.db
        .from("assessments")
        .select("id, lead_id, concern_slug, submitted_at")
        .in("lead_id", ids),
      this.db.from("skin_analyses").select("id, lead_id, status").in("lead_id", ids),
      this.db
        .from("consultations")
        .select("id, lead_id, reference, status, requested_at")
        .in("lead_id", ids),
    ]);

    const consultationIds = (consultations.data ?? []).map((c) => c.id);
    const [reviews, orders] = await Promise.all([
      consultationIds.length
        ? this.db.from("expert_reviews").select("id, consultation_id").in("consultation_id", consultationIds)
        : Promise.resolve({ data: [] as { id: string; consultation_id: string }[] }),
      consultationIds.length
        ? this.db.from("orders").select("consultation_id, status").in("consultation_id", consultationIds)
        : Promise.resolve({ data: [] as { consultation_id: string; status: string }[] }),
    ]);

    const reviewIds = (reviews.data ?? []).map((r) => r.id);
    const { data: regimens } = reviewIds.length
      ? await this.db
          .from("regimens")
          .select("expert_review_id, status")
          .in("expert_review_id", reviewIds)
      : { data: [] as { expert_review_id: string; status: string }[] };

    const byLead = <T extends { lead_id: string | null }>(rows: T[] | null) => {
      const m = new Map<string, T[]>();
      for (const r of rows ?? []) {
        if (!r.lead_id) continue;
        const list = m.get(r.lead_id) ?? [];
        list.push(r);
        m.set(r.lead_id, list);
      }
      return m;
    };

    const aByLead = byLead(assessments.data);
    const sByLead = byLead(analyses.data);
    const cByLead = byLead(consultations.data);
    const reviewByConsultation = new Map((reviews.data ?? []).map((r) => [r.consultation_id, r.id]));
    const publishedByReview = new Set(
      (regimens ?? []).filter((r) => r.status === "published").map((r) => r.expert_review_id),
    );
    const orderByConsultation = new Map((orders.data ?? []).map((o) => [o.consultation_id, o.status]));

    return leads.map((lead) => {
      const a = aByLead.get(lead.id) ?? [];
      const scans = sByLead.get(lead.id) ?? [];
      const consults = cByLead.get(lead.id) ?? [];
      const consultation = consults[0] ?? null;

      const reviewId = consultation ? reviewByConsultation.get(consultation.id) : undefined;
      const published = reviewId ? publishedByReview.has(reviewId) : false;
      const orderStatus = consultation ? orderByConsultation.get(consultation.id) ?? null : null;

      // Latest stage reached wins, so the badge always shows how far along
      // the person actually is rather than the first thing they did.
      let stage: LeadStage = "new";
      if (a.length) stage = "skin_check_completed";
      if (scans.some((s) => s.status === "completed")) stage = "skin_scan_completed";
      if (consultation) stage = "consultation_requested";
      if (reviewId) stage = "expert_review";
      if (published) stage = "regimen_published";
      if (orderStatus) stage = "order_created";
      if (orderStatus === "shipped" || orderStatus === "fulfilled") stage = "order_shipped";

      // Source is where they entered, so it reads oldest-first.
      const source: LeadSource = a.length ? "skin_check" : scans.length ? "skin_scan" : "consultation";

      return {
        id: lead.id,
        name: lead.name,
        phone: lead.phone_e164,
        email: lead.email,
        location: lead.location ?? null,
        createdAt: lead.created_at,
        source,
        stage,
        concern: a[0]?.concern_slug ?? null,
        reference: consultation?.reference ?? null,
        consultationId: consultation?.id ?? null,
        consultationStatus: consultation?.status ?? null,
        hasPublishedRegimen: published,
        orderStatus,
        scanCount: scans.length,
        // A lead nobody has turned into a consultation is the whole point of
        // this screen: it is revenue sitting untouched.
        needsAction: !consultation,
      };
    });
  }

  async countNewSince(since: Date): Promise<number> {
    const { count } = await this.db
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since.toISOString());
    return count ?? 0;
  }
}

let store: LeadStore | null = null;

export function getLeadStore(): LeadStore | null {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  store = new SupabaseLeadStore(url, key);
  return store;
}

/** Test seam. */
export function __setLeadStore(next: LeadStore | null) {
  store = next;
}
