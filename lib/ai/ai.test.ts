import { afterEach, describe, expect, it } from "vitest";
import { assessRisk, needsCaution, hasProhibitedClaim, scrubClaims } from "@/lib/ai/safety";
import { knowledgeBase, knowledgeBaseApproxTokens } from "@/lib/ai/grounding";
import { respond } from "@/lib/ai/assistant";
import { __setAiProvider, type AiProvider } from "@/lib/ai/provider";

afterEach(() => __setAiProvider(null));

describe("safety — inbound risk", () => {
  it("escalates severe / infected / emergency messages", () => {
    for (const m of [
      "I have severe painful acne that's getting worse",
      "my skin is infected and oozing pus",
      "my lips are swollen and I have difficulty breathing",
      "the spot is bleeding and spreading rapidly",
      // Emergency phrasings that an earlier pattern set missed:
      "my face is badly swollen and I can't breathe properly",
      "my throat feels swollen",
      "I'm struggling to breathe after using it",
    ]) {
      expect(assessRisk(m), m).toBe("escalate");
    }
  });

  it("does not escalate ordinary questions", () => {
    for (const m of ["what does vitamin c do", "I have some blackheads on my nose", "which cleanser suits oily skin"]) {
      expect(assessRisk(m), m).toBe("none");
    }
  });

  it("flags pregnancy and medication contexts for caution", () => {
    expect(needsCaution("I'm pregnant, is retinol okay?")).toBe(true);
    expect(needsCaution("I'm on isotretinoin")).toBe(true);
    expect(needsCaution("what is niacinamide")).toBe(false);
  });
});

describe("safety — outbound claim scrubbing", () => {
  it("detects prohibited claims", () => {
    expect(hasProhibitedClaim("this cures acne permanently")).toBe(true);
    expect(hasProhibitedClaim("this is clinically proven to heal skin")).toBe(true);
    expect(hasProhibitedClaim("this may help with breakouts")).toBe(false);
  });

  it("rewrites prohibited claims to safe language", () => {
    const scrubbed = scrubClaims("This cream cures acne permanently and is clinically proven to heal your skin.");
    expect(hasProhibitedClaim(scrubbed)).toBe(false);
    expect(scrubbed).not.toMatch(/\bcures?\b/i);
    expect(scrubbed).not.toMatch(/\bpermanently\b/i);
  });

  it("is idempotent", () => {
    const once = scrubClaims("cures permanently");
    expect(scrubClaims(once)).toBe(once);
  });
});

describe("grounding", () => {
  it("includes real ingredient, concern and skin-type content", () => {
    const kb = knowledgeBase();
    expect(kb).toContain("Niacinamide");
    expect(kb).toContain("Acne");
    expect(kb).toContain("Oily skin");
    // Grounded in the real business model — no catalogue.
    expect(kb).toMatch(/no fixed product catalogue|custom-compounded/i);
  });

  it("fits comfortably in a single prompt (well under a RAG threshold)", () => {
    // The architecture chose prompt-stuffing over RAG on the basis that the
    // base is small. If it ever grows past this, revisit that decision.
    expect(knowledgeBaseApproxTokens()).toBeLessThan(15_000);
  });
});

describe("orchestrator", () => {
  const okProvider: AiProvider = {
    isConfigured: () => true,
    complete: async () => ({ ok: true, text: "Niacinamide may help with oil control." }),
  };

  it("escalates high-risk messages WITHOUT calling the model", async () => {
    let called = false;
    __setAiProvider({
      isConfigured: () => true,
      complete: async () => {
        called = true;
        return { ok: true, text: "..." };
      },
    });
    const out = await respond([{ role: "user", content: "severe painful swelling and infection" }]);
    expect(out.kind).toBe("escalation");
    expect(out.cta).toBe("whatsapp");
    expect(called, "the model must not be called for a high-risk message").toBe(false);
  });

  it("degrades to a WhatsApp handoff when no provider is configured", async () => {
    __setAiProvider({ isConfigured: () => false, complete: async () => ({ ok: false, reason: "not-configured" }) });
    const out = await respond([{ role: "user", content: "what does vitamin c do" }]);
    expect(out.kind).toBe("unavailable");
    expect(out.cta).toBe("whatsapp");
    expect(out.text).toMatch(/team|whatsapp|skin check/i);
  });

  it("scrubs prohibited claims from the model's reply", async () => {
    __setAiProvider({
      isConfigured: () => true,
      complete: async () => ({ ok: true, text: "This cures your acne permanently, guaranteed." }),
    });
    const out = await respond([{ role: "user", content: "will this work" }]);
    expect(out.kind).toBe("answer");
    if (out.kind === "answer") {
      expect(hasProhibitedClaim(out.text)).toBe(false);
    }
  });

  it("offers a Skin Check CTA for personalised questions", async () => {
    __setAiProvider(okProvider);
    const out = await respond([{ role: "user", content: "what should I use for my skin?" }]);
    expect(out.kind).toBe("answer");
    if (out.kind === "answer") expect(out.cta).toBe("skin_check");
  });

  it("offers a regimen CTA only when the customer has a published regimen", async () => {
    __setAiProvider(okProvider);
    const withRegimen = await respond([{ role: "user", content: "how do I use my routine?" }], {
      hasPublishedRegimen: true,
    });
    expect(withRegimen.kind === "answer" && withRegimen.cta).toBe("regimen");

    const without = await respond([{ role: "user", content: "how do I use my routine?" }], {
      hasPublishedRegimen: false,
    });
    // No regimen → not a regimen CTA.
    expect(without.kind === "answer" && without.cta).not.toBe("regimen");
  });

  it("degrades gracefully on a model failure", async () => {
    __setAiProvider({ isConfigured: () => true, complete: async () => ({ ok: false, reason: "timeout" }) });
    const out = await respond([{ role: "user", content: "hello" }]);
    expect(out.kind).toBe("unavailable");
  });
});
