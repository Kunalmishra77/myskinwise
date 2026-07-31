import { NextResponse } from "next/server";
import { z } from "zod";
import { respond, type ChatTurn } from "@/lib/ai/assistant";
import { resolveCustomerContext } from "@/lib/ai/context";
import { isAiLang } from "@/lib/i18n/languages";
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
  // Optional chosen concern, so the chat can run a focused, concern-specific
  // conversation. Anonymous and safe — it only steers which questions and
  // content the assistant draws on, never anything private.
  concern: z
    .enum(["pigmentation", "acne", "other-issues", "dark-circles", "acne-scars", "oily-skin", "dry-skin"])
    .optional(),
  // Reply language — any of Riya's supported languages; unknown falls back to en.
  lang: z.string().max(8).optional(),
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
  const resolved = await resolveCustomerContext({
    reference: parsed.data.reference,
    phone: parsed.data.phone,
    analysisReference: parsed.data.analysisReference,
  });

  // A concern chosen in the chat steers the conversation, unless the customer's
  // own resolved data already carries one (their real concern wins).
  const context =
    parsed.data.concern && !resolved?.concern
      ? { ...(resolved ?? {}), concern: parsed.data.concern }
      : resolved;

  void logEvent("assistant_used");
  const outcome = await respond(parsed.data.messages as ChatTurn[], context, {
    lang: isAiLang(parsed.data.lang) ? parsed.data.lang : "en",
  });
  return NextResponse.json({ status: "ok", ...outcome });
}
