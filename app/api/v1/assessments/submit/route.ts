import { NextResponse } from "next/server";
import { submitAssessmentSchema } from "@/lib/assessment/schema";
import { getAssessmentStorage } from "@/lib/assessment/storage";
import { logEvent } from "@/lib/analytics";
import { buildRegimenOutline } from "@/lib/assessment/recommend";
import { clientKey, submitLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Submit a completed assessment.
 *
 * Validation runs here regardless of what the client already checked — the
 * client is a convenience, not a gate. The schema is derived from the real
 * question list, so unknown keys are rejected rather than stored.
 *
 * Response contract:
 *   201 { status: "stored",   assessmentId, outline }  persisted
 *   200 { status: "fallback", outline }                no database configured
 *   400 { status: "invalid",  errors }                 validation failed
 *
 * The 200 "fallback" is deliberate and is the important case today. There
 * is no database yet, and the live WordPress funnel is currently losing
 * every lead silently behind an HTTP 200. Rather than repeat that, this
 * endpoint tells the client plainly that nothing was persisted, and the UI
 * hands the user to WhatsApp with their answers summarised. The user is
 * never shown a success screen for a lead that reached nobody.
 */
/** Refuse bodies far larger than any real assessment before parsing them. */
const MAX_BODY_BYTES = 64 * 1024;

export async function POST(request: Request) {
  const limit = await submitLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { status: "rate_limited", retryAfter: limit.retryAfter },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ status: "invalid", errors: { _: ["Request too large"] } }, { status: 413 });
  }

  let payload: unknown;
  try {
    const raw = await request.text();
    // content-length is client-supplied, so check the real size too.
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ status: "invalid", errors: { _: ["Request too large"] } }, { status: 413 });
    }
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { status: "invalid", errors: { _: ["Malformed request body"] } },
      { status: 400 },
    );
  }

  const parsed = submitAssessmentSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "invalid", errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // Computed server-side so the result cannot be tampered with by the
  // client, and so future AI and expert-review stages consume the same
  // structured output rather than re-deriving it.
  const outline = buildRegimenOutline(parsed.data);

  const storage = getAssessmentStorage();
  const result = await storage.save(parsed.data);

  if (result.ok) {
    void logEvent("skin_check_completed", { concern: parsed.data.concern });
    void logEvent("skin_check_stored");
    return NextResponse.json(
      { status: "stored", assessmentId: result.assessment.id, outline },
      { status: 201 },
    );
  }

  void logEvent("skin_check_completed", { concern: parsed.data.concern });
  void logEvent("skin_check_fallback", { reason: result.reason });
  return NextResponse.json({ status: "fallback", reason: result.reason, outline }, { status: 200 });
}
