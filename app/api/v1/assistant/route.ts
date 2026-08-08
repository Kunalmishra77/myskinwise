import { NextResponse } from "next/server";
import { z } from "zod";
import { respond, respondStream, type ChatTurn, type CustomerContext } from "@/lib/ai/assistant";
import { resolveCustomerContext } from "@/lib/ai/context";
import { isAiLang, type AiLang } from "@/lib/i18n/languages";
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
  // Customer-safe completed-scan summary from the shared session (engine scans
  // aren't in the legacy resolver store), so Chat knows the scan is done — the
  // SAME state Voice uses. This is what makes Voice + Chat share continuity.
  analysis: z
    .object({
      imageQuality: z.string().max(40),
      features: z.array(z.object({ label: z.string().max(60), certainty: z.string().max(40) })).max(12),
      limitations: z.string().max(200),
    })
    .optional(),
  // Optional chosen concern, so the chat can run a focused, concern-specific
  // conversation. Anonymous and safe — it only steers which questions and
  // content the assistant draws on, never anything private.
  concern: z
    .enum(["pigmentation", "acne", "other-issues", "dark-circles", "acne-scars", "oily-skin", "dry-skin"])
    .optional(),
  // Reply language — any of Riya's supported languages; unknown falls back to en.
  lang: z.string().max(8).optional(),
  // When true, stream the reply as NDJSON (sentence-by-sentence) so it appears
  // progressively in the chat instead of arriving all at once after a wait.
  stream: z.boolean().optional(),
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
  const withConcern =
    parsed.data.concern && !resolved?.concern
      ? { ...(resolved ?? {}), concern: parsed.data.concern }
      : resolved;
  // Carry the completed-scan summary so Chat knows the scan is done (shared with
  // Voice), and follows the post-scan flow instead of re-asking for a scan.
  const context =
    parsed.data.analysis && !withConcern?.analysis
      ? { ...(withConcern ?? {}), analysis: parsed.data.analysis }
      : withConcern;

  void logEvent("assistant_used");
  const lang: AiLang = isAiLang(parsed.data.lang) ? parsed.data.lang : "en";
  const messages = parsed.data.messages as ChatTurn[];

  // Streaming path: sentence-by-sentence NDJSON so the reply types itself into
  // the chat in real time instead of the user waiting several seconds for the
  // whole thing. Same grounding + per-sentence claim scrub as the blocking path.
  if (parsed.data.stream) {
    return streamAssistant(messages, context, lang);
  }

  const outcome = await respond(messages, context, { lang, concise: true });
  return NextResponse.json({ status: "ok", ...outcome });
}

/**
 * Streams the reply as NDJSON: a `chunk` line per sentence as it forms, then a
 * `done` line carrying the CTA and any product recommendation. Each sentence is
 * already claim-scrubbed inside respondStream, so streaming never leaks a banned
 * claim mid-generation.
 */
function streamAssistant(
  messages: ChatTurn[],
  context: CustomerContext | undefined,
  lang: AiLang,
): Response {
  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        const gen = respondStream(messages, context, { lang, concise: true });
        let res = await gen.next();
        while (!res.done) {
          send({ type: "chunk", text: res.value });
          res = await gen.next();
        }
        const meta = res.value;
        send({ type: "done", cta: meta.cta, recommendConcern: meta.recommendConcern, showScanCta: meta.showScanCta, kind: meta.kind });
      } catch {
        send({ type: "error" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(readable, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  });
}
