import { afterEach, describe, expect, it } from "vitest";
import { respond } from "@/lib/ai/assistant";
import { __setAiProvider, type AiProvider } from "@/lib/ai/provider";

/*
 * Part B: the assistant receives a customer-safe analysis summary and must
 * treat it as observation, never diagnosis. These tests pin the CONTRACT of
 * what the assistant is handed — the deterministic safety around the model
 * is covered elsewhere and still applies.
 */

afterEach(() => __setAiProvider(null));

// Captures the system prompt the provider is given, so we can assert exactly
// what the model can and cannot see.
function capturingProvider(): { provider: AiProvider; lastSystem: () => string } {
  let system = "";
  return {
    lastSystem: () => system,
    provider: {
      isConfigured: () => true,
      complete: async (sys) => {
        system = sys;
        return { ok: true, text: "Here's what stood out in your photo." };
      },
    },
  };
}

describe("assistant analysis context", () => {
  it("passes the customer-safe observation into the model context", async () => {
    const cap = capturingProvider();
    __setAiProvider(cap.provider);

    await respond([{ role: "user", content: "what did the AI notice about my skin?" }], {
      analysis: {
        imageQuality: "good",
        features: [
          { label: "Redness", certainty: "observed" },
          { label: "Shine or oiliness", certainty: "possible" },
        ],
        limitations: "Only the central face is visible.",
      },
    });

    const sys = cap.lastSystem();
    expect(sys).toContain("Redness");
    expect(sys).toContain("Shine or oiliness");
    // It is framed as visible characteristics, and the model is told not to
    // name a condition.
    expect(sys).toMatch(/VISIBLE characteristics only/i);
    expect(sys).toMatch(/never say acne\/rosacea\/eczema\/melasma/i);
  });

  it("never places a storage path, signed URL or image id into the context", async () => {
    const cap = capturingProvider();
    __setAiProvider(cap.provider);

    await respond([{ role: "user", content: "my analysis?" }], {
      analysis: {
        imageQuality: "good",
        features: [{ label: "Uneven tone", certainty: "observed" }],
        limitations: "x",
      },
    });

    const sys = cap.lastSystem();
    expect(sys).not.toMatch(/skin-photos|supabase|storage\/v1|https?:\/\//i);
    expect(sys).not.toMatch(/signedURL|storage_path/i);
    // No uuid-shaped id.
    expect(sys).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  });

  it("works normally with no analysis context at all", async () => {
    __setAiProvider(capturingProvider().provider);
    const out = await respond([{ role: "user", content: "what does niacinamide do" }]);
    expect(out.kind).toBe("answer");
  });

  it("still escalates a high-risk message even with analysis context present", async () => {
    let called = false;
    __setAiProvider({
      isConfigured: () => true,
      complete: async () => {
        called = true;
        return { ok: true, text: "..." };
      },
    });
    const out = await respond([{ role: "user", content: "my face is swollen and I can't breathe" }], {
      analysis: { imageQuality: "good", features: [], limitations: "x" },
    });
    expect(out.kind).toBe("escalation");
    expect(called).toBe(false);
  });
});
