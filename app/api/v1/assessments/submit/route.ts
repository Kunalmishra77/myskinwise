import { NextResponse } from "next/server";
import { submitAssessmentSchema } from "@/lib/assessment/schema";
import { getAssessmentStorage } from "@/lib/assessment/storage";
import { buildRegimenOutline } from "@/lib/assessment/recommend";

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
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
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
    return NextResponse.json(
      { status: "stored", assessmentId: result.assessment.id, outline },
      { status: 201 },
    );
  }

  return NextResponse.json({ status: "fallback", reason: result.reason, outline }, { status: 200 });
}
