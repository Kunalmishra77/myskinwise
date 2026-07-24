import { describe, expect, it } from "vitest";
import { getAiProvider, __setAiProvider } from "@/lib/ai/provider";
import { respond } from "@/lib/ai/assistant";
import { hasProhibitedClaim } from "@/lib/ai/safety";

/**
 * A DELIBERATELY TINY live check against the real OpenAI API, gated on the
 * key being present so it is skipped in CI and anywhere unfunded. It exists
 * to prove one thing the mocked tests cannot: that a real completion flows
 * through the whole pipeline (grounding -> OpenAI -> outbound safety -> CTA)
 * and comes back safe. Two short calls only, to respect credit.
 */
const hasKey = Boolean(process.env.OPENAI_API_KEY);

describe.runIf(hasKey)("OpenAI live (small, controlled)", () => {
  it("returns a grounded, claim-safe answer for a real question", async () => {
    __setAiProvider(null); // use the real environment-selected provider
    expect(getAiProvider().isConfigured()).toBe(true);

    const out = await respond([
      { role: "user", content: "In one sentence, what is niacinamide commonly used for?" },
    ]);

    expect(out.kind).toBe("answer");
    if (out.kind === "answer") {
      expect(out.text.length).toBeGreaterThan(0);
      // The outbound safety filter must have left nothing prohibited.
      expect(hasProhibitedClaim(out.text)).toBe(false);
    }
    __setAiProvider(null);
  }, 30_000);

  it("still escalates a high-risk message WITHOUT spending an OpenAI call", async () => {
    __setAiProvider(null);
    const out = await respond([
      { role: "user", content: "my face is badly swollen and I can't breathe properly" },
    ]);
    // Inbound safety returns before the provider is ever reached, so this
    // costs nothing even with a live key configured.
    expect(out.kind).toBe("escalation");
    __setAiProvider(null);
  });
});
