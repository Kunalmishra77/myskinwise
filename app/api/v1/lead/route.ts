import { NextResponse } from "next/server";
import { z } from "zod";
import { getLeadCaptureStore, normaliseIndianMobile } from "@/lib/leads/capture";
import { clientKey, MemoryRateLimiter } from "@/lib/rate-limit";
import { logEvent } from "@/lib/analytics";

export const runtime = "nodejs";

// A lead is cheap to store but we don't want a script filling the table:
// 10 captures per IP per 10 minutes.
const leadLimiter = new MemoryRateLimiter(10, 10 * 60 * 1000);

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email().max(120).optional(),
});

/**
 * Captures the name + mobile a user gives before their face scan. Stores it in
 * the shared `leads` table and returns the id so the client can tie the scan to
 * it (and skip the form on a repeat scan). Never returns anything about other
 * leads — write-only from the browser's point of view.
 */
export async function POST(request: Request) {
  const limit = await leadLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json({ status: "rate_limited", retryAfter: limit.retryAfter }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ status: "invalid", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const phone = normaliseIndianMobile(parsed.data.phone);
  if (!phone) {
    return NextResponse.json(
      { status: "invalid", message: "Please enter a valid 10-digit mobile number." },
      { status: 400 },
    );
  }

  const result = await getLeadCaptureStore().capture({
    name: parsed.data.name,
    phone,
    email: parsed.data.email ?? null,
  });
  if (!result.ok) {
    return NextResponse.json(
      { status: "unavailable", message: "We couldn't save your details just now. Please try again." },
      { status: 200 },
    );
  }

  void logEvent("lead_captured", { source: "skin_scan" });
  return NextResponse.json({ status: "ok", leadId: result.leadId }, { status: 201 });
}
