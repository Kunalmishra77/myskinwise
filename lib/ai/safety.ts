/**
 * Deterministic safety layer for the Skinwise assistant.
 *
 * This is not the model's job — it is a hard, testable boundary that runs
 * around the model. Two directions:
 *
 *  - INBOUND (`assessRisk`): scan the user's message for signs of a
 *    situation that a chatbot must not try to handle, and force an
 *    escalation response instead of asking the model.
 *  - OUTBOUND (`scrubClaims`): scan the model's reply for prohibited
 *    marketing/medical claims and neutralise them before the customer sees
 *    them, regardless of what the model was told.
 *
 * The claim list mirrors the rules enforced elsewhere in the codebase
 * (content tests, the rules engine) so the assistant cannot say something
 * the rest of the product is forbidden from saying. See the platform
 * architecture spec §8.2.
 */

/** Claims a cosmetic assistant must never make. */
const PROHIBITED = [
  /\bcures?\b/gi,
  /\bcured\b/gi,
  /\bheals?\b/gi,
  /\bhealed\b/gi,
  /\btreats?\b/gi,
  /\btreated\b/gi,
  /\bpermanent(ly)?\b/gi,
  /\bguarantee[ds]?\b/gi,
  /\bclinically proven\b/gi,
  /\bmiracle\b/gi,
];

/** Softenings applied when a prohibited word slips through. */
const SOFTENERS: [RegExp, string][] = [
  [/\bclinically proven\b/gi, "often used"],
  [/\bcures?\b/gi, "may help with"],
  [/\bcured\b/gi, "improved"],
  [/\bheals?\b/gi, "may soothe"],
  [/\bhealed\b/gi, "soothed"],
  [/\btreats?\b/gi, "may help with"],
  [/\btreated\b/gi, "cared for"],
  [/\bpermanently\b/gi, "over time"],
  [/\bpermanent\b/gi, "lasting"],
  [/\bguaranteed\b/gi, "designed"],
  [/\bguarantees?\b/gi, "aims"],
  [/\bmiracle\b/gi, "effective"],
];

export function hasProhibitedClaim(text: string): boolean {
  return PROHIBITED.some((re) => {
    re.lastIndex = 0;
    return re.test(text);
  });
}

/** Rewrites prohibited claims to safe language. Idempotent. */
export function scrubClaims(text: string): string {
  let out = text;
  for (const [re, replacement] of SOFTENERS) out = out.replace(re, replacement);
  return out;
}

export type RiskLevel = "none" | "escalate";

/**
 * Signs that the conversation is beyond a cosmetic assistant's remit and
 * should be handed to a person or a doctor. Kept conservative: it is far
 * better to over-escalate a worried customer than to have a chatbot
 * reassure someone with a real problem.
 */
const ESCALATION_PATTERNS: RegExp[] = [
  /\b(severe|extreme|unbearable|worst)\b.{0,20}\b(pain|painful|acne|swelling|reaction)\b/i,
  /\b(infected|infection|pus|oozing|bleeding|abscess|boil)\b/i,
  /\b(allergic reaction|anaphyla|hives all over|face swelling|swollen (lips|eyes|throat)|difficulty breathing)\b/i,
  /\b(rapidly|suddenly) (worse|worsening|spreading)\b/i,
  /\b(burn(ing|t)?|chemical burn|blister)\b/i,
  /\bfever\b.{0,20}\b(rash|skin)\b/i,
  /\b(suicid|self.?harm|kill myself)\b/i,
];

/** Pregnancy/medication contexts where the assistant must defer, not advise. */
const CAUTION_PATTERNS: RegExp[] = [
  // Prefix matches, no trailing \b: "pregnan" must still catch "pregnant"
  // and "pregnancy", where a trailing boundary would not.
  /\b(pregnan|breastfeed|nursing|expecting)/i,
  /\b(accutane|isotretinoin|tretinoin|prescription|antibiotic|steroid)/i,
];

export function assessRisk(message: string): RiskLevel {
  return ESCALATION_PATTERNS.some((re) => re.test(message)) ? "escalate" : "none";
}

export function needsCaution(message: string): boolean {
  return CAUTION_PATTERNS.some((re) => re.test(message));
}

/** The message shown instead of a model reply when risk is detected. */
export const ESCALATION_MESSAGE =
  "That sounds like something a person should look at properly, and it's beyond what I can safely help with. " +
  "Please speak to a doctor or a pharmacist — and if it's severe, sudden, or you're worried, seek medical care right away. " +
  "You can also message the Skinwise team on WhatsApp and they'll help you find the right next step.";

/** Appended to every substantive answer. */
export const ASSISTANT_DISCLAIMER =
  "I'm Skinwise's AI assistant — here for guidance, not medical diagnosis. A Skinwise expert makes the real decisions about your routine.";
