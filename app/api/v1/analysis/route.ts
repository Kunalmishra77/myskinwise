import { NextResponse } from "next/server";
import { z } from "zod";
import { getAnalysisStore, type ImageInput } from "@/lib/analysis/storage";
import { clientKey, MemoryRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Photo analysis is far more expensive than text, so the ceiling is low:
// 6 analyses per IP per 15 minutes.
const analysisLimiter = new MemoryRateLimiter(6, 15 * 60 * 1000);

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // matches the bucket + Stage-2 rule
const MAX_IMAGES = 3;
// A base64 payload is ~4/3 the byte size; cap the whole body generously
// above 3 x 8MB so a legitimate 3-photo request fits and nothing larger does.
const MAX_BODY_BYTES = 36 * 1024 * 1024;

const imageSchema = z.object({
  base64: z.string().min(1),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  bytes: z.number().int().positive().max(MAX_IMAGE_BYTES),
  angle: z.enum(["front", "left", "right"]).optional(),
});

const bodySchema = z.object({
  images: z.array(imageSchema).min(1).max(MAX_IMAGES),
  // Explicit consent to AI image analysis. Must be true — the flow cannot be
  // reached without it, and the server refuses to proceed otherwise.
  consentImageAnalysis: z.literal(true, {
    message: "Image analysis needs your explicit consent",
  }),
  policyVersion: z.string().min(1).max(32),
});

const REASON_MESSAGE: Record<string, string> = {
  "not-configured":
    "Photo analysis isn't available right now. You can still start your free Skin Check and an expert will review it.",
  quality_failed:
    "We couldn't get a clear enough read from that photo. Try again in good, even light with your face centred and in focus — or skip the photo and do the Skin Check.",
  "invalid-output":
    "We couldn't complete the analysis just now. Please try again, or continue with the Skin Check.",
  timeout: "The analysis took too long. Please try again in a moment.",
  failed: "Something went wrong analysing that photo. Please try again, or continue with the Skin Check.",
};

/**
 * Analyze one or more face photos.
 *
 *   201 { status: "completed", reference, observation }  real result
 *   422 { status: "quality_failed", reference, message } usable image needed
 *   200 { status: "unavailable", message }               provider/other failure
 *   400 / 413 / 429                                       validation / size / rate
 *
 * No-silent-loss (requirement §15/§16): "completed" is returned ONLY when a
 * validated structured observation exists. Every other outcome is an honest
 * non-success with a clear message and no fabricated result. Raw provider
 * errors are never surfaced.
 */
export async function POST(request: Request) {
  const limit = await analysisLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json({ status: "rate_limited", retryAfter: limit.retryAfter }, { status: 429 });
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ status: "invalid", message: "Photos are too large." }, { status: 413 });
  }

  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ status: "invalid", message: "Photos are too large." }, { status: 413 });
    }
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ status: "invalid", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await getAnalysisStore().analyze({
    images: parsed.data.images as ImageInput[],
    policyVersion: parsed.data.policyVersion,
  });

  if (result.ok) {
    return NextResponse.json(
      { status: "completed", reference: result.reference, observation: result.observation },
      { status: 201 },
    );
  }

  if (result.reason === "quality_failed") {
    return NextResponse.json(
      { status: "quality_failed", reference: result.reference, message: REASON_MESSAGE.quality_failed },
      { status: 422 },
    );
  }

  return NextResponse.json(
    { status: "unavailable", reason: result.reason, message: REASON_MESSAGE[result.reason] ?? REASON_MESSAGE.failed },
    { status: 200 },
  );
}
