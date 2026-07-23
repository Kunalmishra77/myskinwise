import { NextResponse } from "next/server";
import { z } from "zod";
import { respond, type ChatTurn } from "@/lib/ai/assistant";
import { resolveCustomerContext } from "@/lib/ai/context";
import { clientKey, MemoryRateLimiter } from "@/lib/rate-limit";
import { logEvent } from "@/lib/analytics";

export const runtime = "nodejs";

// Chattier than form submission, so a slightly higher ceiling — but still
// low enough to stop a script running up an AI bill.
const chatLimiter = new MemoryRateLimiter(20, 5 * 60 * 1000);
const MAX_BODY_BYTES = 32 * 1024;

const turnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const bodySchema = z.object({
  // Full short history so the model has conversational context; capped so a
  // caller cannot stuff the prompt.
  messages: z.array(turnSchema).min(1).max(20),
  // Optional: to personalise, the customer proves ownership the same way as
  // everywhere else — reference + phone. Absent = a general, un-personalised
  // conversation.
  reference: z.string().regex(/^SW-[A-HJ-NP-Z2-9]{8}$/).optional(),
  phone: z.string().optional(),
  // Optional Skin Analyzer reference. The analyzer runs without an account,
  // so its reference is the bearer token for its own (already customer-safe)
  // observation — the same model the customer used to view their result.
  analysisReference: z.string().regex(/^SW-[A-HJ-NP-Z2-9]{8}$/).optional(),
});

export async function POST(request: Request) {
  const limit = await chatLimiter.check(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json({ status: "rate_limited", retryAfter: limit.retryAfter }, { status: 429 });
  }

  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ status: "invalid" }, { status: 413 });
    }
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ status: "invalid", errors: parsed.error.flatten() }, { status: 400 });
  }

  // Customer-safe context via the shared resolver — the SAME privacy
  // boundary the voice agent uses. A guessed reference or wrong phone yields
  // nothing; nothing internal (notes, verdict, storage paths, ids) can reach
  // the model.
  const context = await resolveCustomerContext({
    reference: parsed.data.reference,
    phone: parsed.data.phone,
    analysisReference: parsed.data.analysisReference,
  });

  void logEvent("assistant_used");
  const outcome = await respond(parsed.data.messages as ChatTurn[], context);
  return NextResponse.json({ status: "ok", ...outcome });
}
