import { randomBytes } from "node:crypto";
import { z } from "zod";

export const createConsultationSchema = z.object({
  assessmentId: z.string().uuid("Unknown assessment"),
  preferredTime: z.enum(["morning", "afternoon", "evening", "anytime"]),
  /**
   * Re-confirmed at the point of requesting a consultation rather than
   * inherited from the assessment: consenting to receive skin guidance is
   * not the same act as asking to be contacted about a consultation, and
   * DPDP wants consent tied to the purpose it was given for.
   */
  contactConsent: z.literal(true, {
    message: "We need your permission to contact you about the consultation",
  }),
  policyVersion: z.string().min(1).max(32),
});

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1

/**
 * Human-quotable consultation reference, e.g. `SW-K7M2QX9T`.
 *
 * Deliberately NOT the row's UUID and NOT time-derived. The assessment
 * fallback reference (`buildReference`) encodes a timestamp, which is fine
 * for a message the customer already holds, but a consultation reference
 * gets read aloud, pasted into WhatsApp and quoted back — anything
 * sequential or time-derived would let someone guess neighbouring
 * references and fish for other people's consultations.
 *
 * 8 characters from a 32-symbol alphabet is 2^40 possibilities, drawn from
 * a CSPRNG. The ambiguous glyphs I, O, 0 and 1 are excluded so a customer
 * reading it over the phone cannot produce a different valid-looking code.
 */
export function generateConsultationReference(): string {
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return `SW-${out}`;
}
