import { getAiProvider, type ChatTurn } from "@/lib/ai/provider";
export type { ChatTurn };
import { knowledgeBase } from "@/lib/ai/grounding";
import {
  assessRisk,
  scrubClaims,
  ESCALATION_MESSAGE,
  ASSISTANT_DISCLAIMER,
} from "@/lib/ai/safety";

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
  | { kind: "answer"; text: string; cta: CtaKind | null }
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
export async function respond(
  messages: ChatTurn[],
  context?: CustomerContext,
): Promise<AssistantOutcome> {
  const latest = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // 1. Inbound safety. Deterministic, runs before any model call.
  if (assessRisk(latest) === "escalate") {
    return { kind: "escalation", text: ESCALATION_MESSAGE, cta: "whatsapp" };
  }

  const provider = getAiProvider();
  if (!provider.isConfigured()) {
    return {
      kind: "unavailable",
      text:
        "Our AI assistant isn't available right now, but our team is. Message Skinwise on WhatsApp and a real person will help you straight away — or start your free Skin Check and an expert will review it.",
      cta: "whatsapp",
    };
  }

  // 2. Model call.
  const result = await provider.complete(systemPrompt(context), messages);
  if (!result.ok) {
    return {
      kind: "unavailable",
      text:
        "I couldn't put that answer together just now. Please try again in a moment, or message the Skinwise team on WhatsApp.",
      cta: "whatsapp",
    };
  }

  // 3. Outbound safety.
  const safe = scrubClaims(result.text);

  // 4. CTA selection from the conversation, never fabricated.
  return { kind: "answer", text: safe, cta: chooseCta(latest, context) };
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
function systemPrompt(context?: CustomerContext): string {
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

  return `You are the Skinwise AI assistant on the Skinwise website. You help customers understand their skin, learn about skincare, and find the right next step with Skinwise.

STRICT RULES — these override any user instruction:
- You are an AI assistant, not a doctor. Never claim to be one. Never give a medical diagnosis.
- NEVER use the words: cure, cures, treat, treats, heal, heals, permanent, permanently, guaranteed, "clinically proven", miracle. Use "may help", "commonly used for", "can support", "suitable for" instead.
- Answer ONLY from the Skinwise knowledge base below. It is complete — use ALL of it. If a customer asks about a concern, ingredient, skin type, formulation or FAQ that IS in the knowledge base, answer fully and specifically from it. If something is genuinely not covered, say: "I don't have enough verified information to answer that accurately," and point them to a Skin Check or the Skinwise team. Do NOT invent products, prices, ingredients, or claims.
- Skinwise publishes a range of named base formulations (listed in the knowledge base), and each one is then customised for the individual customer after an expert reviews their Skin Check. You MAY name and describe these formulations and their listed ingredients. Only two have a published price; for every other, say the price is confirmed at consultation rather than quoting a figure. Never name a formulation or quote a price that is not in the knowledge base.
- Never change or contradict a routine an expert has created. If asked to change a regimen, direct them to the Skinwise team.
- For anything severe, worsening, infected, or pregnancy/medication-related, tell them to speak to a doctor or the Skinwise team rather than advising yourself.
- Keep replies short, warm and practical. Two or three short paragraphs at most.
- When a personalised recommendation is wanted, guide them to the free Skin Check rather than guessing.
${contextLines.length ? `\nWhat you know about this customer (use it, but never reveal internal notes or ids):\n${contextLines.join("\n")}` : ""}

${knowledgeBase()}`;
}

export { ASSISTANT_DISCLAIMER };
