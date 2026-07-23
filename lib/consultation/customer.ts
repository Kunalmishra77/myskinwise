import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Customer-facing consultation + regimen lookup.
 *
 * Deliberately narrow: it returns only what a customer is allowed to see —
 * status, their preferred time, and a PUBLISHED regimen's customer-facing
 * fields. It never returns the expert's internal notes (`expert_reviews.notes`),
 * the verdict text, audit events, expert ids, or any database uuid the
 * customer did not already hold.
 *
 * Access is by reference + phone, the same no-accounts ownership model the
 * rest of the funnel uses. A reference alone is not enough; the phone must
 * match the consultation's lead.
 */

export type CustomerRegimen = {
  durationDays: number | null;
  summary: string | null;
  followUp: string | null;
  items: { timeOfDay: string; formulationRef: string; instructions: string | null; frequency: string | null }[];
};

export type CustomerConsultationView = {
  reference: string;
  status: string;
  preferredTime: string | null;
  // Only ever set when the regimen is published. A draft is invisible.
  regimen: CustomerRegimen | null;
};

export interface CustomerConsultationStore {
  lookup(reference: string, phone: string): Promise<CustomerConsultationView | null>;
}

class SupabaseCustomerStore implements CustomerConsultationStore {
  private db: SupabaseClient;
  constructor(url: string, key: string) {
    this.db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async lookup(reference: string, phone: string): Promise<CustomerConsultationView | null> {
    const { data: c } = await this.db
      .from("consultations")
      .select("id, reference, status, preferred_time, assessment_id, leads!inner(phone_e164)")
      .eq("reference", reference)
      .maybeSingle();
    if (!c) return null;

    const lead = c.leads as unknown as { phone_e164: string };
    // Reference + phone must both match. A guessed reference is useless
    // without the phone that owns it.
    if (lead.phone_e164 !== phone) return null;

    let regimen: CustomerRegimen | null = null;

    // Only a PUBLISHED regimen is ever visible. Drafts stay internal.
    const { data: review } = await this.db
      .from("expert_reviews")
      .select("id")
      .eq("consultation_id", c.id)
      .maybeSingle();

    if (review) {
      const { data: reg } = await this.db
        .from("regimens")
        .select("id, duration_days, notes, follow_up, status")
        .eq("expert_review_id", review.id)
        .eq("status", "published")
        .maybeSingle();

      if (reg) {
        const { data: items } = await this.db
          .from("regimen_items")
          .select("time_of_day, formulation_ref, instructions, frequency")
          .eq("regimen_id", reg.id)
          .order("step_order");
        regimen = {
          durationDays: reg.duration_days,
          summary: reg.notes,
          followUp: reg.follow_up,
          items: (items ?? []).map((it) => ({
            timeOfDay: it.time_of_day,
            formulationRef: it.formulation_ref,
            instructions: it.instructions,
            frequency: it.frequency,
          })),
        };
      }
    }

    return {
      reference: c.reference,
      status: c.status,
      preferredTime: c.preferred_time,
      regimen,
    };
  }
}

let store: CustomerConsultationStore | null = null;

export function getCustomerStore(): CustomerConsultationStore | null {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  store = new SupabaseCustomerStore(url, key);
  return store;
}

/** Test seam. */
export function __setCustomerStore(next: CustomerConsultationStore | null) {
  store = next;
}
