import { NextResponse } from "next/server";
import { createConsultationSchema } from "@/lib/consultation/schema";
import { getConsultationStorage } from "@/lib/consultation/storage";
import { buildConsultationHandoff } from "@/lib/consultation/whatsapp";
import { contactSchema } from "@/lib/assessment/schema";
import { clientKey, submitLimiter } from "@/lib/rate-limit";
import { logEvent } from "@/lib/analytics";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;

/**
 * Request a consultation against a completed Skin Check.
 *
 *   201 { status: "created",  reference, handoff }  persisted
 *   200 { status: "fallback", reason, handoff? }    not persisted — said so
 *   400 { status: "invalid",  errors }              validation failed
 *   404 { status: "not_found" }                     unknown assessment, or
 *                                                   not owned by this caller
 *   429 { status: "rate_limited" }
 *
 * The 200 fallback carries the same no-silent-loss guarantee as the
 * assessment submit route: the customer is never shown a confirmed
 * consultation for a request that reached nobody.
 *
 * Note what 201 does NOT mean. It means the request was recorded, not that
 * a time is booked — there is no calendar. The response deliberately has no
 * appointment field for a caller to mistake for one.
 */
export async function POST(request: Request) {
  const limit = await submitLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { status: "rate_limited", retryAfter: limit.retryAfter },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let payload: unknown;
  try {
    const raw = await request.text();
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

  const parsed = createConsultationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "invalid", errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // The phone is the caller's only claim of identity (there are no accounts),
  // so it is normalised through the same schema the assessment used before
  // being compared server-side against the assessment's real owner.
  const phone = contactSchema.shape.phone.safeParse((payload as { phone?: unknown }).phone);
  if (!phone.success) {
    return NextResponse.json(
      { status: "invalid", errors: { phone: ["Enter the mobile number you used for your Skin Check"] } },
      { status: 400 },
    );
  }

  const result = await getConsultationStorage().create(
    parsed.data.assessmentId,
    phone.data,
    parsed.data.preferredTime,
  );

  if (result.ok) {
    void logEvent("consultation_requested");
    void logEvent("whatsapp_handoff", { surface: "consultation" });
    return NextResponse.json(
      {
        status: "created",
        reference: result.consultation.reference,
        handoff: buildConsultationHandoff(result.consultation, parsed.data.preferredTime),
      },
      { status: 201 },
    );
  }

  if (result.reason === "not-found") {
    // Same response for "no such assessment" and "not yours", so the
    // endpoint cannot be used to confirm which assessment ids exist.
    return NextResponse.json(
      { status: "not_found", message: "We couldn't find that Skin Check for this number." },
      { status: 404 },
    );
  }

  return NextResponse.json({ status: "fallback", reason: result.reason }, { status: 200 });
}
