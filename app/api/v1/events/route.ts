import { NextResponse } from "next/server";
import { z } from "zod";
import { logEvent, CLIENT_EVENTS, type AnalyticsEvent } from "@/lib/analytics";
import { clientKey, MemoryRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Generous but bounded — analytics beacons are cheap but shouldn't be a
// spam vector.
const eventLimiter = new MemoryRateLimiter(60, 5 * 60 * 1000);

const bodySchema = z.object({
  name: z.string().max(40),
  // Only primitive, non-PII metadata. Strings are length-capped so nothing
  // large or free-text sneaks through.
  meta: z.record(z.string().max(40), z.union([z.string().max(60), z.number(), z.boolean()])).optional(),
});

/**
 * Client analytics beacon. Only events on the CLIENT_EVENTS allowlist are
 * accepted — the browser cannot log arbitrary or server-only events, and the
 * name is validated against the allowlist so it cannot carry PII. Always
 * returns 204 so the caller never blocks on it.
 */
export async function POST(request: Request) {
  const limit = await eventLimiter.check(clientKey(request));
  if (!limit.allowed) return new NextResponse(null, { status: 204 });

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (parsed.success && CLIENT_EVENTS.has(parsed.data.name as AnalyticsEvent)) {
      await logEvent(parsed.data.name as AnalyticsEvent, parsed.data.meta);
    }
  } catch {
    // ignore — analytics must never surface an error to the client
  }
  return new NextResponse(null, { status: 204 });
}
