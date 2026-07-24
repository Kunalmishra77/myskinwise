import type { RegimenOutline } from "@/lib/assessment/recommend";
import type { ContactInput } from "@/lib/assessment/schema";
import { QUESTIONS } from "@/content/assessment/questions";

const LABELS = new Map(
  QUESTIONS.flatMap((q) => [
    [q.id, q.prompt] as const,
    ...(q.followUp ? [[q.followUp.id, q.followUp.prompt] as const] : []),
  ]),
);

const OPTION_LABELS = new Map(
  QUESTIONS.flatMap((q) => (q.options ?? []).map((o) => [`${q.id}:${o.value}`, o.label] as const)),
);

function readable(questionId: string, value: string): string {
  return OPTION_LABELS.get(`${questionId}:${value}`) ?? value;
}

/**
 * Builds the fallback hand-off message.
 *
 * This exists because there is currently no database: when the submit
 * endpoint reports `fallback`, this message is the ONLY way the lead
 * reaches the Skinwise team. It is therefore treated as a real conversion
 * path, not a courtesy — it carries everything an expert needs to open the
 * conversation properly.
 *
 * What is deliberately excluded: photos and any URL pointing at one. A
 * WhatsApp deep link ends up in browser history, OS share sheets and
 * clipboard managers, which is not somewhere a face photo belongs. Photos
 * stay in secure storage and are referenced by the assessment id alone.
 */
export function buildFallbackMessage({
  contact,
  answers,
  outline,
  reference,
}: {
  contact: ContactInput;
  answers: Record<string, string | string[]>;
  outline: RegimenOutline;
  reference: string;
}): string {
  const lines: string[] = [];

  lines.push("*Skinwise Skin Check*");
  lines.push(`Reference: ${reference}`);
  lines.push("");
  lines.push(`*Name:* ${contact.name}`);
  lines.push(`*Phone:* ${contact.phone}`);
  if (contact.email) lines.push(`*Email:* ${contact.email}`);
  lines.push("");
  lines.push(`*Main concern:* ${outline.concernLabel}`);
  if (outline.skinTypeLabel) lines.push(`*Skin type:* ${outline.skinTypeLabel}`);

  // Safety-relevant answers are pulled to the top so an expert sees them
  // before anything else, rather than hunting for them in a long list.
  const safetyIds = ["pregnancy", "seen_dermatologist"];
  const safety = safetyIds
    .filter((id) => answers[id])
    .map((id) => `- ${LABELS.get(id) ?? id} ${readable(id, String(answers[id]))}`);
  if (safety.length) {
    lines.push("");
    lines.push("*Please note:*");
    lines.push(...safety);
  }

  if (outline.recommendProfessional && outline.professionalReason) {
    lines.push("");
    lines.push(`*Flagged:* ${outline.professionalReason}`);
  }

  lines.push("");
  lines.push("*Answers:*");
  for (const q of QUESTIONS) {
    const value = answers[q.id];
    if (!value || safetyIds.includes(q.id)) continue;
    const text = Array.isArray(value)
      ? value.map((v) => readable(q.id, v)).join(", ")
      : readable(q.id, value);
    if (!text) continue;
    lines.push(`- ${q.prompt} ${text}`);
    const follow = q.followUp && answers[q.followUp.id];
    if (follow) lines.push(`  (${String(follow)})`);
  }

  if (outline.ingredients.length) {
    lines.push("");
    lines.push(`*Suggested starting point:* ${outline.ingredients.map((i) => i.name).join(", ")}`);
  }
  if (outline.excluded.length) {
    lines.push(`*Held back:* ${outline.excluded.map((e) => e.name).join(", ")}`);
  }

  lines.push("");
  lines.push("_Sent from the Skinwise website because the assessment could not be saved automatically._");

  return lines.join("\n");
}

/** A short, human-readable reference the customer and team can both quote. */
export function buildReference(now: Date): string {
  const stamp = now.toISOString().slice(2, 16).replace(/[-:T]/g, "");
  return `SW-${stamp}`;
}
