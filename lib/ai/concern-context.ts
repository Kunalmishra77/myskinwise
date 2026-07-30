import { CONCERNS } from "@/content/concerns";
import { INGREDIENT_LIST } from "@/content/ingredients";
import { FAQS } from "@/content/faqs";
import { questionsForConcern } from "@/content/assessment/questions";
import type { FaqItem } from "@/content/faqs";

/**
 * Turns a chosen concern into a focused, concern-specific conversation for the
 * assistant.
 *
 * This is what makes the chatbot stop giving the same generic answers to
 * everyone: when the customer says "acne", the model is handed the acne
 * concern's own explanation, its contributing factors, the ingredients
 * Skinwise uses for it, its FAQs, and — crucially — the exact follow-up
 * questions the Skin Check asks for acne. It is told to explore those
 * conversationally, so the questions and guidance genuinely differ by concern.
 *
 * Everything here is REUSED content, not new copy: the same concern pages,
 * ingredient list, FAQs and assessment questions the rest of the site is built
 * from. The assistant cannot drift from them, and adding a concern-specific
 * question to the Skin Check adds it to this conversation automatically.
 *
 * It steers the ONE shared brain — it does not become a second one. Safety,
 * claim-scrubbing and the no-diagnosis rules in the main system prompt still
 * apply on top of this.
 */

const CONCERN_FAQS: Record<string, FaqItem[]> = {
  acne: FAQS.acneObjections,
  pigmentation: FAQS.pigmentationObjections,
  "other-issues": FAQS.otherIssuesObjections,
};

/** True for a slug we have a concern context for. */
export function isKnownConcern(slug: string | undefined): slug is "pigmentation" | "acne" | "other-issues" {
  return slug === "pigmentation" || slug === "acne" || slug === "other-issues";
}

export function concernGuidance(slug: string): string | null {
  if (!isKnownConcern(slug)) return null;
  const concern = CONCERNS[slug];

  // The concern-specific follow-ups, straight from the Skin Check. Drop the
  // "which concern" picker (already answered) and the free-text "anything
  // else" catch-all.
  const questions = questionsForConcern(slug)
    .filter((q) => q.id !== "concern" && q.id !== "extra")
    .map((q) => q.prompt);

  const ingredients = INGREDIENT_LIST.filter((i) => (i.concerns as string[]).includes(slug)).map(
    (i) => i.name,
  );

  const faqs = CONCERN_FAQS[slug] ?? [];

  const parts: string[] = [];
  parts.push(`## Focused help: ${concern.label}`);
  parts.push(
    `The customer wants help specifically with ${concern.label.toLowerCase()}. Keep this conversation focused on that — do not switch to other concerns unless they ask.`,
  );
  parts.push(`What this is: ${concern.whatIs.body}`);
  if (concern.causes.length) {
    parts.push(`Common contributing factors: ${concern.causes.map((c) => c.title).join(", ")}.`);
  }
  if (ingredients.length) {
    parts.push(`Ingredients Skinwise commonly builds ${concern.label.toLowerCase()} routines around: ${ingredients.join(", ")}.`);
  }
  parts.push(
    `To give useful, personal guidance, gently explore the points below — ask ONE, or at most TWO, at a time, in your own warm words (never as a checklist or a form), and adapt to what they have already told you:`,
  );
  parts.push(questions.map((q) => `- ${q}`).join("\n"));
  if (faqs.length) {
    parts.push(`\nCommon ${concern.label.toLowerCase()} questions and how to answer them:`);
    parts.push(faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n"));
  }
  parts.push(
    `\nAfter a few exchanges, recommend the free Skin Check to capture the full picture for a Skinwise expert, and offer a consultation. Keep every other rule (no diagnosis, no invented products or prices, escalate anything severe).`,
  );

  return parts.join("\n");
}
