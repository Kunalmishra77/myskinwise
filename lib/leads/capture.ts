import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Captures a lead (name + mobile) into the SAME `leads` table the rest of the
 * funnel already uses — so a person who scans their skin shows up in the expert
 * console exactly like one who did the Skin Check, and the scan can be tied back
 * to them. Written with the service role only; never reached from the browser.
 */

export type LeadInput = { name: string; phone: string; email?: string | null; location?: string | null };

export interface LeadCaptureStore {
  capture(input: LeadInput): Promise<{ ok: true; leadId: string } | { ok: false }>;
}

class UnconfiguredLeadCaptureStore implements LeadCaptureStore {
  async capture() {
    return { ok: false as const };
  }
}

class SupabaseLeadCaptureStore implements LeadCaptureStore {
  private db: SupabaseClient;
  constructor(url: string, key: string) {
    this.db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async capture({ name, phone, email, location }: LeadInput) {
    const { data, error } = await this.db
      .from("leads")
      .insert({ name, phone_e164: phone, email: email ?? null, location: location ?? null })
      .select("id")
      .single();
    if (error || !data) return { ok: false as const };
    return { ok: true as const, leadId: data.id as string };
  }
}

let store: LeadCaptureStore | null = null;

export function getLeadCaptureStore(): LeadCaptureStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  store = url && key ? new SupabaseLeadCaptureStore(url, key) : new UnconfiguredLeadCaptureStore();
  return store;
}

/** Test seam. */
export function __setLeadCaptureStore(next: LeadCaptureStore | null) {
  store = next;
}

/**
 * Normalises an Indian mobile number to E.164 (+91XXXXXXXXXX). Accepts a bare
 * 10-digit number, a 0-prefixed one, or an already-+91 number; returns null if
 * it isn't a plausible Indian mobile so the caller can reject it.
 */
export function normaliseIndianMobile(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  // Strip a leading country code or trunk 0.
  let local = digits;
  if (local.length === 12 && local.startsWith("91")) local = local.slice(2);
  else if (local.length === 11 && local.startsWith("0")) local = local.slice(1);
  // Indian mobile numbers are 10 digits and start 6–9.
  if (!/^[6-9]\d{9}$/.test(local)) return null;
  return `+91${local}`;
}
