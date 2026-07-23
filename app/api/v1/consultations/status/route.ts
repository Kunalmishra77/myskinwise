import { NextResponse } from "next/server";
import { z } from "zod";
import { getCustomerStore } from "@/lib/consultation/customer";
import { contactSchema } from "@/lib/assessment/schema";
import { clientKey, submitLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

const lookupSchema = z.object({
  reference: z.string().regex(/^SW-[A-HJ-NP-Z2-9]{8}$/, "That doesn't look like a Skinwise reference"),
});

/**
 * Customer consultation status + published regimen lookup.
 *
 * Reference + phone, both required — the same no-accounts ownership model as
 * everywhere else. Returns only customer-safe fields (see customer.ts); a
 * wrong phone gets the same 404 as an unknown reference, so the endpoint
 * cannot confirm which references exist.
 */
export async function POST(request: Request) {
  const limit = await submitLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json({ status: "rate_limited", retryAfter: limit.retryAfter }, { status: 429 });
  }

  const store = getCustomerStore();
  if (!store) return NextResponse.json({ status: "not_configured" }, { status: 503 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const parsed = lookupSchema.safeParse(payload);
  const phone = contactSchema.shape.phone.safeParse((payload as { phone?: unknown }).phone);
  if (!parsed.success || !phone.success) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const view = await store.lookup(parsed.data.reference, phone.data);
  if (!view) {
    return NextResponse.json(
      { status: "not_found", message: "We couldn't find that reference for this number." },
      { status: 404 },
    );
  }

  return NextResponse.json({ status: "ok", consultation: view });
}
