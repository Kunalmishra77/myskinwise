import { NextResponse } from "next/server";
import { z } from "zod";
import { respond, respondStream, shouldReplyEnglish, RIYA_GREETING, type ChatTurn } from "@/lib/ai/assistant";
import type { CustomerContext } from "@/lib/ai/assistant";
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
  // When true, stream the reply sentence-by-sentence (NDJSON) so the client can
  // start speaking the first sentence while the rest is still being generated.
  stream: z.boolean().optional(),
  // EITHER a transcript (browser Web Speech API — the primary path) …
  transcript: z.string().min(1).max(2000).optional(),
  // … OR audio for the server STT fallback (iOS Safari etc.).
  audioBase64: z.string().optional(),
  audioMimeType: z.string().max(60).optional(),
  // Customer-safe context, same model as the text assistant.
  reference: z.string().regex(/^SW-[A-HJ-NP-Z2-9]{8}$/).optional(),
  phone: z.string().optional(),
  analysisReference: z.string().regex(/^SW-[A-HJ-NP-Z2-9]{8}$/).optional(),
  // Customer-safe scan summary from the client (engine scans aren't in the
  // server's legacy analysis store), so the explain handoff is grounded in the
  // real findings. Only concern labels + certainty — never image data.
  analysis: z
    .object({
      imageQuality: z.string().max(40),
      features: z.array(z.object({ label: z.string().max(60), certainty: z.string().max(40) })).max(12),
      limitations: z.string().max(200),
    })
    .optional(),
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
  // True when the user explicitly picked a language (the picker). Then we honour
  // it; otherwise we follow whatever language the STT detects them speaking.
  langLocked: z.boolean().optional(),
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
              "Greet me warmly and PROFESSIONALLY as Dr. Vivek, my personal skincare expert. Start with a time-appropriate greeting, then ask in one or two short sentences what's going on with my skin. Warm but polished — no advice yet.",
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
    // Prefer the client's scan summary (engine scans aren't in the legacy store),
    // falling back to whatever the resolver found.
    const withConcern =
      body.concern && !context?.concern ? { ...(context ?? {}), concern: body.concern } : context;
    const ctx =
      body.analysis && !withConcern?.analysis
        ? { ...(withConcern ?? {}), analysis: body.analysis }
        : withConcern;
    const instruction =
      "The user has just completed a face scan. In a warm, natural voice, tell them the main things you could see in the photo, then offer to talk them through which ingredients would help and a suggested routine. Keep it to two short sentences, speak like a person (no number lists), and never give a diagnosis.";
    // The instruction here is synthetic English — don't let language auto-detect
    // flip a Hindi/Hinglish user's scan narration to English. Honour the picked
    // language; otherwise keep the Hinglish default.
    const outcome = await respond([{ role: "user", content: instruction }], ctx, {
      lang,
      brief: true,
      forceEnglish: false,
    });
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
  let detectedLang: string | undefined;
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
    detectedLang = result.language;
  }

  // The reply language: a language the user explicitly picked wins; otherwise
  // follow the language they were just detected speaking. This is what keeps
  // Riya in the user's own language across the whole session, including after
  // the face scan.
  const detected = isAiLang(detectedLang) ? detectedLang : isAiLang(detectedLang?.slice(0, 2)) ? (detectedLang!.slice(0, 2) as AiLang) : undefined;
  const replyLang: AiLang = body.langLocked && isAiLang(body.lang) ? lang : (detected ?? lang);
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
  const withConcern =
    body.concern && !resolved?.concern
      ? { ...(resolved ?? {}), concern: body.concern }
      : resolved;
  // Carry the client's completed-scan summary so EVERY post-scan turn knows the
  // scan is done (the engine scan isn't in the legacy resolver store). This is
  // what stops the AI re-asking the user to scan after they already have.
  const context =
    body.analysis && !withConcern?.analysis
      ? { ...(withConcern ?? {}), analysis: body.analysis }
      : withConcern;

  // 3. The SAME orchestrator as text: inbound safety -> grounded model ->
  // outbound safety -> CTA.
  const messages: ChatTurn[] = [...body.history, { role: "user", content: transcript }];
  void logEvent("voice_used");

  // The TTS language: when the reply is Hindi (voice generates Devanagari), speak
  // it with the Hindi voice so ElevenLabs uses Hindi phonetics — the fix for the
  // "reads Hinglish with English pronunciation" problem. English stays English;
  // an explicitly-picked language keeps its own voice.
  const speakLang: AiLang = shouldReplyEnglish(messages, replyLang)
    ? "en"
    : replyLang === "en"
      ? "hi"
      : replyLang;

  // Streaming path: sentence-by-sentence NDJSON so the client speaks the first
  // sentence while the rest generates. Same brief/safety pipeline.
  if (body.stream) {
    return streamVoice(messages, context, replyLang, transcript, body.wantAudio, speakLang);
  }

  const outcome = await respond(messages, context, { lang: replyLang, brief: true });

  // 4. TTS of the FINAL text (never raw model output). Best-effort: a TTS
  // failure still returns the text, and the client speaks it with the
  // browser as a fallback. The language nudges pronunciation.
  let audioBase64: string | undefined;
  let audioMimeType: string | undefined;
  if (body.wantAudio) {
    const speech = await getTtsProvider().speak(outcome.text, speakLang);
    if (speech.ok) {
      audioBase64 = speech.audioBase64;
      audioMimeType = speech.mimeType;
    }
  }

  return NextResponse.json({
    status: "ok",
    transcript,
    text: outcome.text,
    lang: replyLang,
    cta: "cta" in outcome ? outcome.cta : null,
    kind: outcome.kind,
    recommendConcern: "recommendConcern" in outcome ? outcome.recommendConcern : undefined,
    showScanCta: "showScanCta" in outcome ? outcome.showScanCta : undefined,
    audioBase64,
    audioMimeType,
  });
}

/**
 * Streams the reply as NDJSON: one `user` line, a `chunk` line per spoken
 * sentence (text + its own TTS audio), then a `done` line with the CTA. TTS
 * runs per sentence so the first audio is ready as soon as the model has
 * produced one sentence — that is the latency win.
 */
function streamVoice(
  messages: ChatTurn[],
  context: CustomerContext | undefined,
  lang: AiLang,
  transcript: string,
  wantAudio: boolean,
  speakLang: AiLang,
): Response {
  const encoder = new TextEncoder();
  const tts = getTtsProvider();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      send({ type: "user", transcript });
      try {
        const gen = respondStream(messages, context, { lang, brief: true });
        let res = await gen.next();
        while (!res.done) {
          const sentence = res.value;
          let audioBase64: string | undefined;
          let audioMimeType: string | undefined;
          if (wantAudio && sentence.trim()) {
            const speech = await tts.speak(sentence, speakLang);
            if (speech.ok) {
              audioBase64 = speech.audioBase64;
              audioMimeType = speech.mimeType;
            }
          }
          send({ type: "chunk", text: sentence, audioBase64, audioMimeType });
          res = await gen.next();
        }
        const meta = res.value;
        send({ type: "done", cta: meta.cta, recommendConcern: meta.recommendConcern, showScanCta: meta.showScanCta, kind: meta.kind, lang });
      } catch {
        send({ type: "error", message: "Something went wrong. Please try again." });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(readable, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  });
}
