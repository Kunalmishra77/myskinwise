import { createClient } from "@supabase/supabase-js";

/**
 * First-party funnel analytics — server-side, fire-and-forget.
 *
 * Privacy is the design constraint: only an event NAME and a small map of
 * NON-PII metadata are stored. Never a name, phone, email, transcript,
 * photo, photo URL, or anything free-text the customer typed. The allowed
 * event names are a fixed list, so a caller cannot invent an event that
 * smuggles PII in the name.
 *
 * Fire-and-forget: a failed analytics write must never affect the customer
 * request, so `logEvent` swallows errors and never throws.
 */
export type AnalyticsEvent =
  | "landing_viewed"
  | "skin_check_started"
  | "skin_check_completed"
  | "skin_check_stored"
  | "skin_check_fallback"
  | "analyzer_started"
  | "analyzer_completed"
  | "analyzer_failed"
  | "lead_captured"
  | "assistant_used"
  | "voice_used"
  | "consultation_requested"
  | "whatsapp_handoff"
  | "regimen_viewed"
  | "order_created";

/** Small, explicitly non-PII metadata. */
type Meta = Record<string, string | number | boolean>;

export async function logEvent(name: AnalyticsEvent, meta?: Meta): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    await db.from("analytics_events").insert({ name, meta: meta ?? null });
  } catch {
    // Never let analytics affect the request.
  }
}

/** The client-beacon allowlist — only these can be logged from the browser. */
export const CLIENT_EVENTS = new Set<AnalyticsEvent>([
  "landing_viewed",
  "skin_check_started",
  "analyzer_started",
  "assistant_used",
  "voice_used",
  "regimen_viewed",
]);
