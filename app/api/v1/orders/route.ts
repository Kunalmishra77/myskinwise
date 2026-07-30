import { NextResponse } from "next/server";
import { z } from "zod";
import { PRODUCTS_BY_SLUG } from "@/content/products";
import { clientKey, MemoryRateLimiter } from "@/lib/rate-limit";
import { logEvent } from "@/lib/analytics";

export const runtime = "nodejs";

const orderLimiter = new MemoryRateLimiter(20, 10 * 60 * 1000);
const MAX_BODY_BYTES = 8 * 1024;

const bodySchema = z.object({
  items: z
    .array(z.object({ slug: z.string().max(80), qty: z.number().int().min(1).max(20) }))
    .min(1)
    .max(50),
});

/**
 * Records that a shop order was placed — for the team's funnel visibility only.
 *
 * Deliberately PII-FREE. The customer's name, phone and any note travel to the
 * team inside the WhatsApp message the browser opens, NEVER to this server, so
 * nothing here can leak contact details. All we persist is a non-PII analytics
 * event: how many lines, how many units, and the priced subtotal. The order
 * itself — the thing the business fulfils — is the WhatsApp handoff.
 *
 * Best-effort: analytics is fire-and-forget, so a storage hiccup never blocks
 * the customer's order. Always returns ok when the payload is valid.
 */
export async function POST(request: Request) {
  const limit = await orderLimiter.check(clientKey(request));
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

  // Only count real catalogue items; a bogus slug is ignored, never invented.
  const valid = parsed.data.items.filter((i) => PRODUCTS_BY_SLUG.has(i.slug as never));
  if (valid.length === 0) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const units = valid.reduce((n, i) => n + i.qty, 0);
  const subtotal = valid.reduce((sum, i) => {
    const p = PRODUCTS_BY_SLUG.get(i.slug as never);
    return sum + (p?.mrp ?? 0) * i.qty;
  }, 0);

  void logEvent("order_created", { lines: valid.length, units, subtotal });

  return NextResponse.json({ status: "ok" });
}
