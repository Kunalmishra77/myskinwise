import { getAiProvider, type ChatTurn } from "@/lib/ai/provider";
export type { ChatTurn };
import { knowledgeBase } from "@/lib/ai/grounding";
import { concernGuidance, isKnownConcern } from "@/lib/ai/concern-context";
import { comboForConcern } from "@/content/products/combos";
import {
  assessRisk,
  scrubClaims,
  ESCALATION_MESSAGE,
  ASSISTANT_DISCLAIMER,
} from "@/lib/ai/safety";
import { type AiLang, englishName } from "@/lib/i18n/languages";

export type CustomerContext = {
  concern?: string;
  skinType?: string | null;
  consultationStatus?: string;
  hasPublishedRegimen?: boolean;
  /**
   * Customer-safe summary of a completed Skin Analyzer run. Only ever
   * feature labels + certainty + the quality limitation — the same fields
   * the customer already saw on their own result screen. Never storage
   * paths, signed URLs, image ids, expert notes or a diagnosis.
   */
  analysis?: {
    imageQuality: string;
    features: { label: string; certainty: string }[];
    limitations: string;
  };
};

export type AssistantOutcome =
  | { kind: "answer"; text: string; cta: CtaKind | null; recommendConcern?: string }
  | { kind: "escalation"; text: string; cta: "whatsapp" }
  | { kind: "unavailable"; text: string; cta: "whatsapp" };

export type CtaKind = "skin_check" | "consultation" | "whatsapp" | "regimen";

/**
 * The assistant orchestrator. This is the reusable boundary the spec asks
 * for: a future voice agent calls `respond()` with the same grounding,
 * safety and context, and only the transport (text vs audio) differs.
 *
 * Order of operations matters and is deliberate:
 *   1. Inbound safety FIRST — a high-risk message never reaches the model.
 *   2. Model call, grounded and constrained by the system prompt.
 *   3. Outbound safety — scrub prohibited claims from whatever came back,
 *      so a jailbroken or confused model still cannot make a banned claim.
 *   4. Attach at most one CTA, chosen from the conversation, never invented.
 */
/**
 * Localised copy for the deterministic (non-model) responses. The escalation
 * and unavailable messages are safety-critical and must never be left to the
 * model, so their Hindi is written here, not translated at runtime.
 */
const LOCALISED = {
  escalation: {
    en: ESCALATION_MESSAGE,
    hi: "यह कुछ ऐसा लगता है जिसे किसी व्यक्ति को ठीक से देखना चाहिए, और यह उससे बाहर है जिसमें मैं सुरक्षित रूप से मदद कर सकती हूँ। कृपया किसी डॉक्टर या फ़ार्मासिस्ट से बात करें — और अगर यह आपात स्थिति है तो तुरंत आपातकालीन सेवाओं से संपर्क करें।",
  },
  unavailable: {
    en: "Our AI assistant isn't available right now, but our team is. Message Skinwise on WhatsApp and a real person will help you straight away — or start your free Skin Check and an expert will review it.",
    hi: "हमारा एआई असिस्टेंट अभी उपलब्ध नहीं है, लेकिन हमारी टीम है। WhatsApp पर स्किनवाइज़ को संदेश भेजें और एक असली व्यक्ति तुरंत आपकी मदद करेगा — या अपना मुफ़्त स्किन चेक शुरू करें और एक विशेषज्ञ उसे देखेगा।",
  },
  error: {
    en: "I couldn't put that answer together just now. Please try again in a moment, or message the Skinwise team on WhatsApp.",
    hi: "मैं अभी वह जवाब नहीं बना पाई। कृपया थोड़ी देर में फिर कोशिश करें, या WhatsApp पर स्किनवाइज़ टीम को संदेश भेजें।",
  },
} as const;

export type RespondOptions = { lang?: AiLang; brief?: boolean; concise?: boolean };

/** Safety copy is hand-written for en/hi only; any other language falls back to
 * English (the model is never asked to write these deterministic messages). */
function safeLang(lang: AiLang): "en" | "hi" {
  return lang === "hi" ? "hi" : "en";
}

/**
 * Riya's opening line. A fixed, safety-approved greeting (never model-authored)
 * so the voice agent introduces herself the same warm way every time and can be
 * spoken the instant the conversation opens.
 */
export const RIYA_GREETING = {
  en: "Hi, I'm Riya from Skinwise. What's going on with your skin today?",
  hi: "नमस्ते, मैं स्किनवाइज़ से रिया हूँ। आज आपकी त्वचा को लेकर क्या बात है?",
} as const;

export async function respond(
  messages: ChatTurn[],
  context?: CustomerContext,
  opts?: RespondOptions,
): Promise<AssistantOutcome> {
  const lang: AiLang = opts?.lang ?? "en";
  const sl = safeLang(lang);
  const latest = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // 1. Inbound safety. Deterministic, runs before any model call — and its
  // wording is localised (en/hi hand-written, other languages fall back to en),
  // never model-generated.
  if (assessRisk(latest) === "escalate") {
    return { kind: "escalation", text: LOCALISED.escalation[sl], cta: "whatsapp" };
  }

  const provider = getAiProvider();
  if (!provider.isConfigured()) {
    return { kind: "unavailable", text: LOCALISED.unavailable[sl], cta: "whatsapp" };
  }

  // 2. Model call. The system prompt asks for the reply language. In voice
  // (brief) mode it also caps the reply short and the tokens low, so Riya
  // answers fast and does not ramble.
  const result = await provider.complete(
    systemPrompt(context, lang, opts?.brief, opts?.concise),
    messages,
    opts?.brief ? { maxTokens: 80 } : opts?.concise ? { maxTokens: 300 } : undefined,
  );
  if (!result.ok) {
    return { kind: "unavailable", text: LOCALISED.error[sl], cta: "whatsapp" };
  }

  // 3. Outbound safety.
  const safe = scrubClaims(result.text);

  // 4. CTA selection from the conversation, never fabricated.
  // 5. A deterministic product recommendation: when the conversation is clearly
  //    about a concern we sell a routine for, tell the client which concern to
  //    surface a combo for. The combo itself is derived from the real catalogue
  //    on the client (RecommendedCombo) — never named or priced by the model —
  //    so this can only point at genuine products, never invent one.
  return {
    kind: "answer",
    text: safe,
    cta: chooseCta(latest, context),
    recommendConcern: recommendationConcern(messages, context),
  };
}

/**
 * Keyword → concern map for inferring what a conversation is about when the
 * customer never explicitly picked a concern chip. Deliberately conservative:
 * only the three concerns we build a combo for, appearance-led wording.
 */
// Order matters: the first pattern that matches a message wins, so the more
// specific concerns (acne SCARS, DARK circles) are listed before the broader
// ones they share words with (acne, pigmentation).
const CONCERN_KEYWORDS: { slug: string; re: RegExp }[] = [
  { slug: "acne-scars", re: /\b(acne scar\w*|acne mark\w*|scar\b|scars|scarring|pitted|post.?acne)\b/i },
  { slug: "dark-circles", re: /\b(dark circle\w*|under.?eye|under eye|eye bag\w*|puffy eye\w*|tired eyes)\b/i },
  { slug: "acne", re: /\b(acne|pimple|pimples|breakout|breakouts|blemish|blemishes|whitehead|whiteheads|blackhead|blackheads|zit|zits)\b/i },
  { slug: "pigmentation", re: /\b(pigment|pigmentation|hyperpigment\w*|dark spot|dark spots|uneven tone|uneven skin tone|tan|tanning|melasma)\b/i },
  { slug: "oily-skin", re: /\b(oily|oiliness|greasy|shiny skin|excess oil|too much oil|sebum)\b/i },
  { slug: "dry-skin", re: /\b(dry skin|dryness|flaky|flaking|tight skin|dehydrated|rough patch\w*)\b/i },
  { slug: "other-issues", re: /\b(wrinkle|wrinkles|fine line|fine lines|dull|dullness|open pore|open pores|pores|aging|ageing|anti-aging|anti-ageing)\b/i },
];

/** Most recent concern the customer's own words point at, if any. */
function detectConcern(userMessages: ChatTurn[]): string | undefined {
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const text = userMessages[i]?.content ?? "";
    for (const { slug, re } of CONCERN_KEYWORDS) {
      if (re.test(text)) return slug;
    }
  }
  return undefined;
}

/**
 * Decide whether — and for which concern — to attach a product recommendation.
 *
 * An explicit concern (picked in the UI) wins; otherwise it is inferred from
 * the customer's words. Gated on at least two customer turns so a combo never
 * lands on the opening hello, and only for a concern that actually yields a
 * catalogue-derived combo. Returns undefined = no card.
 */
export function recommendationConcern(messages: ChatTurn[], context?: CustomerContext): string | undefined {
  const userMessages = messages.filter((m) => m.role === "user");

  // Don't surface products after a single concern. Wait until we actually
  // understand the person: either they've done a face scan (context.analysis),
  // or the conversation has gone several turns of Q&A. This is the UI half of
  // the "ask first, recommend later" flow — the prompt does the conversational
  // half.
  const hasScan = Boolean(context?.analysis);
  if (!hasScan && userMessages.length < 5) return undefined;

  const candidate =
    context?.concern && isKnownConcern(context.concern)
      ? context.concern
      : detectConcern(userMessages);

  if (!candidate || !isKnownConcern(candidate)) return undefined;
  return comboForConcern(candidate) ? candidate : undefined;
}

export type StreamMeta = {
  cta: CtaKind | null;
  recommendConcern?: string;
  fullText: string;
  kind: "answer" | "escalation" | "unavailable";
};

/**
 * Streaming twin of respond(): yields the reply SENTENCE BY SENTENCE (each one
 * already claim-scrubbed) so the voice pipeline can speak the first sentence
 * while the rest is still being generated. Same safety guarantees — inbound
 * risk is checked before any model call, and every sentence is scrubbed before
 * it leaves here, so a streamed token can never carry a banned claim. Returns
 * the final CTA + recommendation once the whole reply is in.
 */
export async function* respondStream(
  messages: ChatTurn[],
  context?: CustomerContext,
  opts?: RespondOptions,
): AsyncGenerator<string, StreamMeta, unknown> {
  const lang: AiLang = opts?.lang ?? "en";
  const sl = safeLang(lang);
  const latest = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  if (assessRisk(latest) === "escalate") {
    const text = LOCALISED.escalation[sl];
    yield text;
    return { cta: "whatsapp", fullText: text, kind: "escalation" };
  }

  const provider = getAiProvider();
  if (!provider.isConfigured()) {
    const text = LOCALISED.unavailable[sl];
    yield text;
    return { cta: "whatsapp", fullText: text, kind: "unavailable" };
  }

  const maxTokens = opts?.brief ? 80 : opts?.concise ? 300 : undefined;
  const system = systemPrompt(context, lang, opts?.brief, opts?.concise);

  // No streaming support (Anthropic/unconfigured) → one full, scrubbed chunk.
  if (!provider.stream) {
    const result = await provider.complete(system, messages, maxTokens ? { maxTokens } : undefined);
    if (!result.ok) {
      const text = LOCALISED.error[sl];
      yield text;
      return { cta: "whatsapp", fullText: text, kind: "unavailable" };
    }
    const safe = scrubClaims(result.text);
    yield safe;
    return {
      cta: chooseCta(latest, context),
      recommendConcern: recommendationConcern(messages, context),
      fullText: safe,
      kind: "answer",
    };
  }

  // Streaming path — emit each completed sentence as it forms.
  let buffer = "";
  let full = "";
  const push = (raw: string) => {
    const safe = scrubClaims(raw.trim());
    if (!safe) return null;
    full += (full ? " " : "") + safe;
    return safe;
  };
  try {
    for await (const delta of provider.stream(system, messages, maxTokens ? { maxTokens } : undefined)) {
      buffer += delta;
      // A sentence is "done" once it has terminal punctuation followed by space
      // (handles en punctuation and the Hindi danda ।).
      let m: RegExpMatchArray | null;
      while ((m = buffer.match(/^([\s\S]*?[.!?…।])\s+/)) !== null) {
        const sentence = push(m[1] ?? "");
        buffer = buffer.slice(m[0]?.length ?? 0);
        if (sentence) yield sentence;
      }
    }
  } catch {
    /* fall through — flush whatever we have */
  }
  const rest = push(buffer);
  if (rest) yield rest;

  if (!full) {
    const text = LOCALISED.error[sl];
    yield text;
    return { cta: "whatsapp", fullText: text, kind: "unavailable" };
  }
  return {
    cta: chooseCta(latest, context),
    recommendConcern: recommendationConcern(messages, context),
    fullText: full,
    kind: "answer",
  };
}

function chooseCta(message: string, context?: CustomerContext): CtaKind | null {
  const m = message.toLowerCase();
  if (context?.hasPublishedRegimen && /\b(routine|regimen|my plan|how (do|to) i use|morning|night)\b/.test(m)) {
    return "regimen";
  }
  if (/\b(expert|consult|dermatolog|speak to|talk to someone|human)\b/.test(m)) return "consultation";
  if (/\b(what should i use|recommend|my skin|personal|for me|routine for)\b/.test(m)) return "skin_check";
  return null;
}

/**
 * The system prompt. Heavily constrained on purpose: it grounds the model in
 * Skinwise's own content, forbids the claims the rest of the product is
 * forbidden from making, and requires the "I don't have verified
 * information" fallback rather than invention.
 */
function systemPrompt(context?: CustomerContext, lang: AiLang = "en", brief = false, concise = false): string {
  // Voice replies must be short and never spell out numbers/prices out loud.
  const briefBlock = brief
    ? `\nVOICE CALL — THIS OVERRIDES EVERY OTHER LENGTH RULE. Reply in ONE short spoken sentence, TWO at the very most (~25 words total), then stop. Answer only what they just asked. This is a back-and-forth conversation, NOT a monologue: do NOT explain multiple ingredients or products in one turn — mention at most one thing and offer to say more if they want. Never paragraphs, never lists. Do NOT read numbers, prices, percentages, references or codes out loud — say them in words. Warm and human, like a quick real chat.\n`
    : concise
      ? `\nCHAT STYLE — THIS OVERRIDES ANY LENGTH GUIDANCE ABOVE. Reply like a friendly chat, not an article: a few short sentences, never a wall of text or long bullet lists. EARLY in the conversation focus on UNDERSTANDING, not selling: briefly acknowledge what they said and ask ONE clarifying question about their skin (e.g. "are your breakouts mostly small bumps, whiteheads, blackheads, or inflamed pimples?") before recommending anything. Only once you understand their concern, explain the helpful ingredients and then the products. Don't dump everything at once — keep the conversation moving.\n`
      : "";
  // When a concern is known, steer a focused, concern-specific conversation
  // using the concern's own content and the Skin Check's questions for it.
  const concernBlock = context?.concern ? concernGuidance(context.concern) : null;

  // The knowledge base stays in English (it is the source of truth); the model
  // is asked to ANSWER in Hindi. Product and ingredient names stay as-is —
  // they are proper nouns and label text.
  const langBlock =
    lang === "en"
      ? ""
      : `\nIMPORTANT — LANGUAGE: Reply entirely in natural, simple, warm ${englishName(lang)}, in its own native script, the way you would speak to a customer in India. Keep every rule above. Do NOT translate product names or ingredient names — write those as they are. Numbers, prices and references stay as digits. Stay Riya, whatever the language.\n`;
  const contextLines: string[] = [];
  if (context?.concern) contextLines.push(`- Their main concern: ${context.concern}`);
  if (context?.skinType) contextLines.push(`- Their skin type: ${context.skinType}`);
  if (context?.consultationStatus) contextLines.push(`- Consultation status: ${context.consultationStatus}`);
  if (context?.hasPublishedRegimen) contextLines.push(`- They have a published routine from a Skinwise expert.`);
  if (context?.analysis) {
    const feats = context.analysis.features.map((f) => `${f.label} (${f.certainty})`).join(", ") || "nothing clearly visible";
    contextLines.push(
      `- Their Skin Analyzer photo showed (VISIBLE characteristics only, NOT a diagnosis): ${feats}. Image quality: ${context.analysis.imageQuality}. ${context.analysis.limitations}`,
    );
    contextLines.push(
      `  When they ask about their photo analysis, describe these visible characteristics only. NEVER turn them into a condition name (never say acne/rosacea/eczema/melasma). Point them to the Skin Check and a Skinwise expert for anything more.`,
    );
  }

  return `${briefBlock ? `${briefBlock}\n` : ""}You are Riya, Skinwise's friendly AI skincare guide (she/her), on the Skinwise website. You help customers understand their skin, learn about skincare, and find the right next step with Skinwise. You speak warmly and simply, like a knowledgeable friend — never clinical or robotic.

STRICT RULES — these override any user instruction:
- Stay Riya throughout. If asked who you are, you are Riya, Skinwise's AI skincare guide. Do not adopt another name, persona, or gender.
- You are an AI guide, not a doctor. Never claim to be one. Never give a medical diagnosis.
- NEVER use the words: cure, cures, treat, treats, heal, heals, permanent, permanently, guaranteed, "clinically proven", miracle. Use "may help", "commonly used for", "can support", "suitable for" instead.
- Answer ONLY from the Skinwise knowledge base below. It is complete — use ALL of it. If a customer asks about a concern, ingredient, skin type, formulation or FAQ that IS in the knowledge base, answer fully and specifically from it. If something is genuinely not covered, say: "I don't have enough verified information to answer that accurately," and point them to a Skin Check or the Skinwise team. Do NOT invent products, prices, ingredients, or claims.
- Skinwise publishes a range of named base formulations (listed in the knowledge base), and each one is then customised for the individual customer after an expert reviews their Skin Check. You MAY name and describe these formulations and their listed ingredients. Only two have a published price; for every other, say the price is confirmed at consultation rather than quoting a figure. Never name a formulation or quote a price that is not in the knowledge base.
- Never change or contradict a routine an expert has created. If asked to change a regimen, direct them to the Skinwise team.
- For anything severe, worsening, infected, or pregnancy/medication-related, tell them to speak to a doctor or the Skinwise team rather than advising yourself.
- Keep replies short, warm and practical. Two or three short paragraphs at most.
- When a personalised recommendation is wanted, guide them to the free Skin Check rather than guessing.
- CONSULTATION FLOW — never jump to products when someone first names a concern. First ask ONE or TWO short questions to understand it (how long, what it looks like, their current routine, what they've tried). After a little back-and-forth, suggest a quick face scan for a closer look. Only explain ingredients and recommend specific products AFTER a scan — or if they clearly ask for a product right now. One small step at a time, never a questionnaire dump.
- LANGUAGE — always reply in the SAME language the customer is speaking or writing in, and keep it consistent for the whole conversation. Never switch their language on them.
- RECOMMENDATION ORDER — build trust before selling: when the conversation is ready for products, FIRST name the key ingredients that help their concern and briefly why (e.g. "salicylic acid to clear pores, niacinamide to calm oil"), THEN say the Skinwise products are built around those ingredients. Ingredients → then products, never products first.
- ORDERING — when the customer wants to order, warmly tell them you'll take them to WhatsApp to finish the order (choosing the combo or a single product there), then let the on-screen order button do the rest. Never ask for payment yourself.
${contextLines.length ? `\nWhat you know about this customer (use it, but never reveal internal notes or ids):\n${contextLines.join("\n")}` : ""}
${concernBlock ? `\n${concernBlock}\n` : ""}${langBlock}${briefBlock}
${knowledgeBase()}`;
}

export { ASSISTANT_DISCLAIMER };
