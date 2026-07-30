import { NextResponse } from "next/server";
import { z } from "zod";
import { respond, type ChatTurn } from "@/lib/ai/assistant";
import { resolveCustomerContext } from "@/lib/ai/context";
import { getSttProvider } from "@/lib/voice/stt";
import { getTtsProvider } from "@/lib/voice/tts";
import { clientKey, MemoryRateLimiter } from "@/lib/rate-limit";
import { logEvent } from "@/lib/analytics";

export const runtime = "nodejs";

// Voice turns cost STT + LLM + TTS, so the ceiling is tighter than text
// chat: 15 turns per IP per 5 minutes.
const voiceLimiter = new MemoryRateLimiter(15, 5 * 60 * 1000);
// Generous enough for a ~30s webm clip (server-STT fallback), capped so a
// script cannot upload arbitrary audio.
const MAX_BODY_BYTES = 6 * 1024 * 1024;

const turnSchema = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) });

const bodySchema = z.object({
  // Prior turns for conversational context (stateless — the client holds the
  // history, nothing is persisted server-side).
  // Match the text assistant's window (20) so voice is no more
  // forgetful than chat — the same brain, the same memory.
  history: z.array(turnSchema).max(20).default([]),
  // EITHER a transcript (browser Web Speech API — the primary path) …
  transcript: z.string().min(1).max(2000).optional(),
  // … OR audio for the server STT fallback (iOS Safari etc.).
  audioBase64: z.string().optional(),
  audioMimeType: z.string().max(60).optional(),
  // Customer-safe context, same model as the text assistant.
  reference: z.string().regex(/^SW-[A-HJ-NP-Z2-9]{8}$/).optional(),
  phone: z.string().optional(),
  analysisReference: z.string().regex(/^SW-[A-HJ-NP-Z2-9]{8}$/).optional(),
  // The client may decline audio (e.g. it will use browser TTS itself).
  wantAudio: z.boolean().default(true),
  // Optional chosen concern, so voice runs a focused, concern-specific
  // conversation — the SAME steering the text assistant already gets. Anonymous
  // and safe: it only picks which questions/content the assistant draws on.
  concern: z.enum(["pigmentation", "acne", "other-issues"]).optional(),
  // Reply + speech language.
  lang: z.enum(["en", "hi"]).optional(),
});

/**
 * The voice transport around the SHARED Skinwise AI.
 *
 *   Audio/transcript in
 *     -> STT (only if audio, and only via the fallback provider)
 *     -> resolveCustomerContext (identical privacy boundary to text)
 *     -> respond()  (identical grounding + inbound/outbound safety)
 *     -> TTS of the FINAL safety-filtered text
 *   -> { transcript, text, cta, kind, audioBase64 }
 *
 * There is NO voice-specific AI logic. The reply that is spoken is exactly
 * the reply the text assistant would give, after the same safety filter —
 * TTS never receives raw model output. If TTS fails, text is still returned
 * and the client falls back to browser speech, so the user is never left
 * without a reply.
 */
export async function POST(request: Request) {
  const limit = await voiceLimiter.check(clientKey(request));
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
    return NextResponse.json({ status: "invalid", errors: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  // 1. STT (fallback path only). Browser STT sends `transcript` directly.
  let transcript = body.transcript?.trim() ?? "";
  if (!transcript && body.audioBase64) {
    const stt = getSttProvider();
    const result = await stt.transcribe(
      Buffer.from(body.audioBase64, "base64"),
      body.audioMimeType || "audio/webm",
    );
    if (!result.ok) {
      return NextResponse.json(
        { status: "stt_failed", reason: result.reason, message: "I couldn't catch that — please try again, or type instead." },
        { status: 200 },
      );
    }
    transcript = result.text;
  }
  if (!transcript) {
    return NextResponse.json({ status: "invalid", message: "No speech provided." }, { status: 400 });
  }

  // 2. Context — the shared customer-safe resolver.
  const resolved = await resolveCustomerContext({
    reference: body.reference,
    phone: body.phone,
    analysisReference: body.analysisReference,
  });
  // A concern chosen in the voice UI steers the conversation, unless the
  // customer's own resolved data already carries one (their real concern wins)
  // — identical to the text assistant.
  const context =
    body.concern && !resolved?.concern
      ? { ...(resolved ?? {}), concern: body.concern }
      : resolved;

  // 3. The SAME orchestrator as text: inbound safety -> grounded model ->
  // outbound safety -> CTA.
  const messages: ChatTurn[] = [...body.history, { role: "user", content: transcript }];
  void logEvent("voice_used");
  const outcome = await respond(messages, context, { lang: body.lang });

  // 4. TTS of the FINAL text (never raw model output). Best-effort: a TTS
  // failure still returns the text, and the client speaks it with the
  // browser as a fallback. The language nudges pronunciation.
  let audioBase64: string | undefined;
  let audioMimeType: string | undefined;
  if (body.wantAudio) {
    const speech = await getTtsProvider().speak(outcome.text, body.lang);
    if (speech.ok) {
      audioBase64 = speech.audioBase64;
      audioMimeType = speech.mimeType;
    }
  }

  return NextResponse.json({
    status: "ok",
    transcript,
    text: outcome.text,
    cta: "cta" in outcome ? outcome.cta : null,
    kind: outcome.kind,
    audioBase64,
    audioMimeType,
  });
}
