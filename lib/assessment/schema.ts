import { z } from "zod";
import { QUESTIONS } from "@/content/assessment/questions";

const QUESTION_IDS = new Set(QUESTIONS.map((q) => q.id));
const FOLLOW_UP_IDS = new Set(
  QUESTIONS.flatMap((q) => (q.followUp ? [q.followUp.id] : [])),
);

/**
 * Answers arrive as a flat map of questionId -> answer. Validated against
 * the real question list rather than a loose `Record<string, unknown>`, so
 * a client cannot inflate a submission with arbitrary keys.
 */
export const answersSchema = z
  .record(z.string(), z.union([z.string().max(2000), z.array(z.string().max(200)).max(20)]))
  .refine(
    (answers) => Object.keys(answers).every((k) => QUESTION_IDS.has(k) || FOLLOW_UP_IDS.has(k)),
    { message: "Unknown question id in answers" },
  );

/**
 * Indian mobile numbers, with or without the +91 country code. Deliberately
 * permissive about spacing and dashes — rejecting a real customer's number
 * because they typed a space is a worse failure than accepting a slightly
 * odd format and letting a human read it.
 */
const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-()]/g, ""))
  .pipe(
    z
      .string()
      .regex(/^(\+?91)?[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
  );

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: phoneSchema,
  email: z.string().trim().email("Enter a valid email").max(160).optional().or(z.literal("")),
  ageBand: z.enum(["12-18", "18-25", "26-35", "36-45", "46-55", "55+"]).optional(),
});

/**
 * Consent is explicit and unbundled. DPDP requires the notice to itemise
 * what is collected, so the UI names "your answers" and "your photographs"
 * separately and this schema records each decision separately — a single
 * blanket "I agree" checkbox would not satisfy that.
 */
export const consentSchema = z.object({
  contactConsent: z.literal(true, {
    message: "We need your permission to contact you about your results",
  }),
  photoConsent: z.boolean().optional(),
  policyVersion: z.string().min(1),
});

export const submitAssessmentSchema = z.object({
  concern: z.enum(["pigmentation", "acne", "other-issues"]),
  answers: answersSchema,
  contact: contactSchema,
  consent: consentSchema,
  /** Opaque client session id, used to correlate progress saves. */
  sessionId: z.string().uuid().optional(),
  /**
   * If the customer ran the Skin Analyzer first, its reference links that
   * analysis to this assessment, so an expert opening the resulting
   * consultation sees the photo and observations alongside the answers.
   */
  analysisReference: z.string().regex(/^SW-[A-HJ-NP-Z2-9]{8}$/).optional(),
});

export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;
export type ContactInput = z.infer<typeof contactSchema>;

/** Photo upload constraints, enforced server-side as well as in the UI. */
export const PHOTO_RULES = {
  maxBytes: 8 * 1024 * 1024,
  accept: ["image/jpeg", "image/png", "image/webp"] as const,
  maxCount: 3,
};

export const photoMetaSchema = z.object({
  contentType: z.enum(PHOTO_RULES.accept),
  bytes: z.number().int().positive().max(PHOTO_RULES.maxBytes),
  angle: z.enum(["front", "left", "right"]),
});
