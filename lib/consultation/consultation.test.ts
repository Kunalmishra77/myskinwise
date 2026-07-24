import { generateConsultationReference, createConsultationSchema } from "@/lib/consultation/schema";
import { buildConsultationHandoff } from "@/lib/consultation/whatsapp";
import type { ConsultationContext } from "@/lib/consultation/storage";

const ctx: ConsultationContext = {
  consultationId: "6f1c2e2a-0000-4000-8000-000000000001",
  reference: "SW-K7M2QX9T",
  leadName: "Test Person",
  leadPhone: "9876500011",
  concernSlug: "acne",
  skinType: "oily",
  answers: {
    concern: ["acne"],
    skin_type: ["oily"],
    pregnancy: ["pregnant"],
    acne_type: ["nodules", "papules"],
    severity: ["moderate"],
  },
};

describe("consultation reference", () => {
  it("is not sequential or time-derived", () => {
    // Generated back-to-back; a timestamp-based scheme would collide or
    // produce visibly adjacent values.
    const refs = Array.from({ length: 200 }, () => generateConsultationReference());
    expect(new Set(refs).size).toBe(200);
  });

  it("excludes glyphs that are ambiguous when read aloud", () => {
    const joined = Array.from({ length: 300 }, () => generateConsultationReference()).join("");
    expect(joined.replace(/^SW-|SW-/g, "")).not.toMatch(/[IO01]/);
  });

  it("has the expected shape", () => {
    expect(generateConsultationReference()).toMatch(/^SW-[A-HJ-NP-Z2-9]{8}$/);
  });
});

describe("request validation", () => {
  const valid = {
    assessmentId: "467f004b-8f13-4d73-a533-faf708efe56f",
    preferredTime: "morning",
    contactConsent: true,
    policyVersion: "2026-07-21",
  };

  it("accepts a well-formed request", () => {
    expect(createConsultationSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a non-uuid assessment id", () => {
    expect(createConsultationSchema.safeParse({ ...valid, assessmentId: "nope" }).success).toBe(false);
  });

  it("rejects an unsupported preferred time", () => {
    expect(createConsultationSchema.safeParse({ ...valid, preferredTime: "midnight" }).success).toBe(false);
  });

  it("rejects refused consent — it must be an explicit true", () => {
    expect(createConsultationSchema.safeParse({ ...valid, contactConsent: false }).success).toBe(false);
    expect(createConsultationSchema.safeParse({ ...valid, contactConsent: undefined }).success).toBe(false);
  });
});

describe("handoff message", () => {
  const message = buildConsultationHandoff(ctx, "morning");

  it("carries what the team needs to act", () => {
    expect(message).toContain("SW-K7M2QX9T");
    expect(message).toContain("Test Person");
    expect(message).toContain("9876500011");
    expect(message).toContain("Morning");
  });

  it("surfaces safety-relevant answers before the rest", () => {
    const noteIndex = message.indexOf("Please note");
    const answersIndex = message.indexOf("Their answers");
    expect(noteIndex).toBeGreaterThan(-1);
    expect(answersIndex).toBeGreaterThan(noteIndex);
    expect(message.slice(noteIndex, answersIndex)).toMatch(/Pregnant/i);
  });

  it("never states that a time is confirmed", () => {
    expect(message).toMatch(/not yet confirmed/i);
    expect(message).not.toMatch(/\bconfirmed for\b|\bbooked\b|\bscheduled for\b/i);
  });

  it("leaks no photo URL, storage host, database id or key material", () => {
    expect(message).not.toMatch(/\.(jpg|jpeg|png|webp)/i);
    expect(message).not.toMatch(/supabase|amazonaws|blob\.core|https?:\/\//i);
    // The consultation's own database UUID must not travel in the message.
    expect(message).not.toContain(ctx.consultationId);
    expect(message).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}|service_role|sbp_/);
  });
});
