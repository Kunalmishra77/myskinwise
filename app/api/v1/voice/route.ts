import { NextResponse } from "next/server";
import { z } from "zod";
import { respond, RIYA_GREETING, type ChatTurn } from "@/lib/ai/assistant";
import { isAiLang, type AiLang } from "@/lib/i18n/languages";
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
  // When true, skip STT + the model entirely and just speak Riya's fixed
  // greeting — so she can introduce herself the instant the conversation opens.
  greeting: z.boolean().optional(),
  // When true, Riya explains the user's Skin Analyzer result out loud — the
  // scan → voice handoff. Needs analysisReference for the grounding.
  explain: z.boolean().optional(),
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
  concern: z
    .enum(["pigmentation", "acne", "other-issues", "dark-circles", "acne-scars", "oily-skin", "dry-skin"])
    .optional(),
  // Reply + speech language — any of Riya's supported Indian languages
  // (validated below; unknown values fall back to English).
  lang: z.string().max(8).optional(),
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
  const lang: AiLang = isAiLang(body.lang) ? body.lang : "en";

  // Greeting shortcut. In English/Hindi it speaks Riya's fixed, safety-approved
  // intro verbatim; in any other language the model writes an equivalent short
  // greeting in that language (still just an intro — no advice).
  if (body.greeting) {
    let text: string;
    if (lang === "en" || lang === "hi") {
      text = RIYA_GREETING[lang];
    } else {
      const outcome = await respond(
        [
          {
            role: "user",
            content:
              "Greet me warmly as Riya from Skinwise and ask, in one or two short sentences, what skin concern I would like help with. Only a greeting — no advice yet.",
          },
        ],
        undefined,
        { lang, brief: true },
      );
      text = outcome.text;
    }
    let audioBase64: string | undefined;
    let audioMimeType: string | undefined;
    if (body.wantAudio) {
      const speech = await getTtsProvider().speak(text, lang);
      if (speech.ok) {
        audioBase64 = speech.audioBase64;
        audioMimeType = speech.mimeType;
      }
    }
    return NextResponse.json({ status: "ok", transcript: "", text, cta: null, kind: "greeting", audioBase64, audioMimeType });
  }

  // Explain-the-scan handoff: Riya narrates the analyzer result. The instruction
  // is synthetic (the user never sees it); the reply is the SAME grounded,
  // safety-filtered respond() output, using the analysis as customer-safe
  // context — so she describes what was VISIBLE, never a diagnosis.
  if (body.explain) {
    const context = await resolveCustomerContext({
      reference: body.reference,
      phone: body.phone,
      analysisReference: body.analysisReference,
    });
    const ctx =
      body.concern && !context?.concern ? { ...(context ?? {}), concern: body.concern } : context;
    const instruction =
      "The user has just completed a face scan. Warmly and simply, explain what the analysis showed — the visible characteristics and roughly how noticeable each was — then say what they might do next and offer to help. Keep it short and natural. Do not read out numbers like a list; speak like a person. Never give a diagnosis.";
    const outcome = await respond([{ role: "user", content: instruction }], ctx, { lang, brief: true });
    let audioBase64: string | undefined;
    let audioMimeType: string | undefined;
    if (body.wantAudio) {
      const speech = await getTtsProvider().speak(outcome.text, lang);
      if (speech.ok) {
        audioBase64 = speech.audioBase64;
        audioMimeType = speech.mimeType;
      }
    }
    return NextResponse.json({
      status: "ok",
      transcript: "",
      text: outcome.text,
      cta: "cta" in outcome ? outcome.cta : null,
      kind: "explanation",
      recommendConcern: "recommendConcern" in outcome ? outcome.recommendConcern : (ctx?.concern ?? undefined),
      audioBase64,
      audioMimeType,
    });
  }

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
  const outcome = await respond(messages, context, { lang, brief: true });

  // 4. TTS of the FINAL text (never raw model output). Best-effort: a TTS
  // failure still returns the text, and the client speaks it with the
  // browser as a fallback. The language nudges pronunciation.
  let audioBase64: string | undefined;
  let audioMimeType: string | undefined;
  if (body.wantAudio) {
    const speech = await getTtsProvider().speak(outcome.text, lang);
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
    recommendConcern: "recommendConcern" in outcome ? outcome.recommendConcern : undefined,
    audioBase64,
    audioMimeType,
  });
}
