import { NextResponse } from "next/server";
import { z } from "zod";
import { generateReport } from "@/lib/skin/report";
import { clientKey, MemoryRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

const limiter = new MemoryRateLimiter(12, 10 * 60 * 1000);

const bodySchema = z.object({
  concerns: z
    .array(
      z.object({
        id: z.string().max(40),
        score: z.number().nullable(),
        severity: z.string().max(40).nullable(),
      }),
    )
    .max(12),
  skinType: z.string().max(40).nullable().optional(),
});

/**
 * Phase 8 — narrative report from the scores. Non-deterministic and separate
 * from measurement: only numbers go to the model, never the image. Returns the
 * prose plus the concern slug the on-screen routine should surface.
 */
export async function POST(request: Request) {
  const limit = await limiter.check(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json({ status: "rate_limited" }, { status: 429 });
  }

  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const { narrative, recommendConcern } = await generateReport(parsed.data.concerns, parsed.data.skinType ?? null);
  return NextResponse.json({ status: "ok", narrative, recommendConcern }, { status: 200 });
}
