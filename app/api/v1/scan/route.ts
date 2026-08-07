import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeScan } from "@/lib/skin/client";
import { persistScan } from "@/lib/skin/persist";
import { clientKey, MemoryRateLimiter } from "@/lib/rate-limit";
import { logEvent } from "@/lib/analytics";

export const runtime = "nodejs";

// The deterministic engine is CPU-bound; keep the ceiling modest per IP.
const scanLimiter = new MemoryRateLimiter(8, 15 * 60 * 1000);
const MAX_BODY_BYTES = 16 * 1024 * 1024;

const bodySchema = z.object({
  imageBase64: z.string().min(1),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  // Explicit consent to AI image analysis — same gate as the existing scan.
  consentImageAnalysis: z.literal(true),
  leadId: z.string().uuid().optional(),
});

/**
 * Proxies a face photo to the deterministic skin engine on the VPS and returns
 * its ScanResult. The browser calls THIS, never the engine directly, so the
 * engine token stays server-side. A 422 from the engine (bad photo) is passed
 * through with its reason so the UI can guide the user.
 */
export async function POST(request: Request) {
  const limit = await scanLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json({ status: "rate_limited", retryAfter: limit.retryAfter }, { status: 429 });
  }

  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ status: "invalid" }, { status: 413 });
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const outcome = await analyzeScan(parsed.data.imageBase64, parsed.data.contentType);
  if (outcome.ok) {
    // Save against the lead so the scan shows in the admin Leads funnel
    // ("Skin Scan completed"). Best-effort — never fails the scan.
    const reference = await persistScan(outcome.result, parsed.data.leadId);
    void logEvent("analyzer_completed", { engine: "deterministic" });
    return NextResponse.json({ status: "completed", result: outcome.result, reference }, { status: 201 });
  }

  void logEvent("analyzer_failed", { engine: "deterministic", reason: outcome.failure.reason_code ?? outcome.failure.error });
  // 422 = capture-quality rejection: surface the reason so the user can retry well.
  const status = outcome.status === 422 ? 422 : 200;
  return NextResponse.json({ status: outcome.status === 422 ? "quality_failed" : "unavailable", failure: outcome.failure }, { status });
}
