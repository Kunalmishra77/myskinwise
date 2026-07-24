import type { ConsultationContext } from "@/lib/consultation/storage";
import { QUESTIONS } from "@/content/assessment/questions";

const PROMPTS = new Map(QUESTIONS.map((q) => [q.id, q.prompt] as const));
const OPTION_LABELS = new Map(
  QUESTIONS.flatMap((q) => (q.options ?? []).map((o) => [`${q.id}:${o.value}`, o.label] as const)),
);

/** Surfaced first so an expert sees them before anything else. */
const SAFETY_QUESTIONS = ["pregnancy", "seen_dermatologist", "acne_type"];

const TIME_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  anytime: "Any time",
};

/**
 * Consultation handoff message.
 *
 * Mirrors `lib/assessment/whatsapp.ts` rather than replacing it — the two
 * carry different payloads (an assessment result vs a consultation
 * request), but share the same rules: safety answers first, and nothing in
 * the message that should not survive being pasted into a group chat.
 *
 * Deliberately absent: photo URLs, Supabase hostnames, the assessment's
 * database UUID, and any key material. The consultation reference is the
 * only identifier here — it is random rather than sequential, so quoting it
 * publicly reveals nothing and cannot be walked to find other customers.
 */
export function buildConsultationHandoff(
  consultation: ConsultationContext,
  preferredTime: string,
): string {
  const label = (questionId: string, value: string) =>
    OPTION_LABELS.get(`${questionId}:${value}`) ?? value;

  const lines: string[] = [];

  lines.push("*Skinwise consultation request*");
  lines.push(`Reference: ${consultation.reference}`);
  lines.push("");
  lines.push(`*Name:* ${consultation.leadName}`);
  lines.push(`*Phone:* ${consultation.leadPhone}`);
  lines.push(`*Prefers:* ${TIME_LABELS[preferredTime] ?? preferredTime}`);
  lines.push("");
  lines.push(`*Concern:* ${consultation.concernSlug}`);
  if (consultation.skinType) lines.push(`*Skin type:* ${consultation.skinType}`);

  const safety = SAFETY_QUESTIONS.filter((id) => consultation.answers[id]?.length).map(
    (id) => `- ${PROMPTS.get(id) ?? id} ${consultation.answers[id]!.map((v) => label(id, v)).join(", ")}`,
  );
  if (safety.length) {
    lines.push("");
    lines.push("*Please note:*");
    lines.push(...safety);
  }

  const rest = QUESTIONS.filter(
    (q) => !SAFETY_QUESTIONS.includes(q.id) && consultation.answers[q.id]?.length,
  );
  if (rest.length) {
    lines.push("");
    lines.push("*Their answers:*");
    for (const q of rest) {
      lines.push(`- ${q.prompt} ${consultation.answers[q.id]!.map((v) => label(q.id, v)).join(", ")}`);
    }
  }

  lines.push("");
  lines.push("_Time not yet confirmed — please reply to arrange it._");

  return lines.join("\n");
}
