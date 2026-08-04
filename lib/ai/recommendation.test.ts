import { recommendationConcern } from "@/lib/ai/assistant";
import type { ChatTurn } from "@/lib/ai/provider";
import type { CustomerContext } from "@/lib/ai/assistant";

const user = (content: string): ChatTurn => ({ role: "user", content });
const bot = (content: string): ChatTurn => ({ role: "assistant", content });

// A context standing in for "a face scan happened", which is what unlocks the
// product recommendation (see the ask-first-recommend-later gating).
const scanned: CustomerContext = {
  analysis: { imageQuality: "good", features: [], limitations: "" },
};

// Pads a short conversation to enough turns that the combo is allowed even
// without a scan (>= 5 user messages).
function deep(...tail: ChatTurn[]): ChatTurn[] {
  return [
    user("hi"), bot("hi"), user("ok"), bot("ok"), user("sure"), bot("sure"), user("more"), bot("more"),
    ...tail,
  ];
}

describe("recommendationConcern gating (ask first, recommend later)", () => {
  it("returns nothing on the opening message", () => {
    expect(recommendationConcern([user("I keep getting acne")])).toBeUndefined();
  });

  it("does NOT recommend right after a concern, before a scan or real Q&A", () => {
    const convo = [user("hi"), bot("Hi! How can I help?"), user("I keep getting pimples")];
    expect(recommendationConcern(convo)).toBeUndefined();
  });

  it("recommends once a face scan has happened", () => {
    const convo = [user("hi"), bot("Hi!"), user("I keep getting pimples and breakouts")];
    expect(recommendationConcern(convo, scanned)).toBe("acne");
  });

  it("recommends after enough conversation even without a scan", () => {
    expect(recommendationConcern(deep(user("I keep getting pimples and breakouts")))).toBe("acne");
  });
});

describe("recommendationConcern inference (once gating is satisfied)", () => {
  it("infers pigmentation from dark-spot language", () => {
    expect(recommendationConcern([user("I have dark spots and uneven tone")], scanned)).toBe(
      "pigmentation",
    );
  });

  it("maps wrinkles / fine lines to other-issues", () => {
    expect(recommendationConcern([user("fine lines and dullness bother me")], scanned)).toBe(
      "other-issues",
    );
  });

  it("maps the newer first-class concerns from the customer's words", () => {
    expect(recommendationConcern([user("I have acne scars and marks")], scanned)).toBe("acne-scars");
    expect(recommendationConcern([user("dark circles under my eyes")], scanned)).toBe("dark-circles");
    expect(recommendationConcern([user("my skin gets so oily and shiny")], scanned)).toBe("oily-skin");
    expect(recommendationConcern([user("my skin is really dry and flaky")], scanned)).toBe("dry-skin");
  });

  it("prefers an explicitly chosen concern over inference", () => {
    expect(
      recommendationConcern([user("what about oily skin?")], { ...scanned, concern: "pigmentation" }),
    ).toBe("pigmentation");
  });

  it("follows the most recent concern the customer raises", () => {
    const convo = [user("I have acne"), bot("Tell me more"), user("actually my worry now is dark spots")];
    expect(recommendationConcern(convo, scanned)).toBe("pigmentation");
  });

  it("returns nothing when no concern is expressed", () => {
    expect(recommendationConcern([user("what is niacinamide?")], scanned)).toBeUndefined();
  });
});
