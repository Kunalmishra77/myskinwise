import "server-only";
import { getAiProvider } from "@/lib/ai/provider";
import { scrubClaims } from "@/lib/ai/safety";
import { CONCERN_META } from "@/lib/skin/concern-content";

/**
 * Phase 8 — the narrative report. Turns the ALREADY-COMPUTED scores into a
 * warm, plain-language summary. Non-deterministic by design and completely
 * separate from measurement: the image is NEVER sent, only the numbers, and the
 * prompt forbids inventing anything not in the scores or using diagnostic /
 * treatment language. A model failure degrades to a deterministic fallback.
 */

export type ReportConcern = { id: string; score: number | null; severity: string | null };

// Engine concern -> a Skinwise concern slug that has a product routine.
const CONCERN_TO_SLUG: Record<string, string> = {
  pigmentation: "pigmentation",
  dark_circles: "dark-circles",
  oiliness: "oily-skin",
  pores: "oily-skin",
  acne: "acne",
  redness: "other-issues",
  wrinkles: "other-issues",
  texture: "other-issues",
};

function pickConcern(ranked: ReportConcern[]): string {
  const worst = ranked[0];
  return (worst && CONCERN_TO_SLUG[worst.id]) || "other-issues";
}

function fallbackNarrative(top: ReportConcern[]): string {
  const names = top.slice(0, 2).map((c) => (CONCERN_META[c.id]?.label ?? c.id).toLowerCase());
  const focus = names.length ? names.join(" and ") : "a few areas";
  return `Your skin looks largely healthy in this photo, with ${focus} the main areas to give a little extra care. A simple, consistent routine focused on those will help the most — a Skinwise expert can tailor it to you.`;
}

export async function generateReport(concerns: ReportConcern[], skinType?: string | null) {
  const ranked = concerns
    .filter((c) => typeof c.score === "number")
    .sort((a, b) => (a.score as number) - (b.score as number));
  const top = ranked.slice(0, 3);
  const recommendConcern = pickConcern(ranked);

  const provider = getAiProvider();
  if (!provider.isConfigured() || top.length === 0) {
    return { narrative: fallbackNarrative(top), recommendConcern };
  }

  const lines = ranked
    .map((c) => `- ${CONCERN_META[c.id]?.label ?? c.id}: ${c.score}/100 (${c.severity ?? "n/a"})`)
    .join("\n");

  const system = [
    "You are Dr. Vivek, the user's warm, professional personal skincare expert. You are given a customer's MEASURED skin scores from a photo analysis.",
    "Scores are 0-100 where HIGHER = CLEARER (fewer of that concern). Write a short, encouraging, plain-language summary.",
    "STRICT RULES:",
    "- 3 to 4 short sentences, warm and PROFESSIONAL (an approachable expert), in clean Hinglish with respectful 'aap' by default; simple English if the input reads as English. No lists, no headings.",
    "- Mention the 1-2 areas with the LOWEST scores as where to focus, and one genuinely encouraging note about what looks good.",
    "- One sentence on the KIND of ingredients commonly used for the top concern (e.g. 'niacinamide to even tone') — general, not a prescription.",
    "- NEVER invent an observation not present in the scores. NEVER give a medical diagnosis.",
    "- NEVER use: cure, treat, heal, permanent, guaranteed, clinically proven. Use 'may help', 'commonly used for', 'can support'.",
    "- Do NOT name specific products or prices — the on-screen routine handles that.",
    skinType ? `- Their derived skin type is: ${skinType}.` : "",
  ].join("\n");

  const user = `Measured scores (higher = clearer):\n${lines}`;

  const result = await provider.complete(system, [{ role: "user", content: user }], { maxTokens: 240 });
  if (!result.ok || !result.text.trim()) {
    return { narrative: fallbackNarrative(top), recommendConcern };
  }
  return { narrative: scrubClaims(result.text.trim()), recommendConcern };
}
