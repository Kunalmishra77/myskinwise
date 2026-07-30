import { recommendationConcern } from "@/lib/ai/assistant";
import type { ChatTurn } from "@/lib/ai/provider";

const user = (content: string): ChatTurn => ({ role: "user", content });
const bot = (content: string): ChatTurn => ({ role: "assistant", content });

describe("recommendationConcern", () => {
  it("returns nothing on the opening message (too early for a combo)", () => {
    expect(recommendationConcern([user("I keep getting acne")])).toBeUndefined();
  });

  it("infers acne from the customer's words after a couple of turns", () => {
    const convo = [user("hi"), bot("Hi! How can I help?"), user("I keep getting pimples and breakouts")];
    expect(recommendationConcern(convo)).toBe("acne");
  });

  it("infers pigmentation from dark-spot language", () => {
    const convo = [user("hello"), bot("Hi!"), user("I have dark spots and uneven tone")];
    expect(recommendationConcern(convo)).toBe("pigmentation");
  });

  it("maps wrinkles / dark circles to other-issues", () => {
    const convo = [user("hi"), bot("Hi!"), user("fine lines and dark circles are bothering me")];
    expect(recommendationConcern(convo)).toBe("other-issues");
  });

  it("prefers an explicitly chosen concern over inference", () => {
    const convo = [user("hi"), bot("Hi!"), user("what should I do about oily skin?")];
    expect(recommendationConcern(convo, { concern: "pigmentation" })).toBe("pigmentation");
  });

  it("follows the most recent concern the customer raises", () => {
    const convo = [
      user("I have acne"),
      bot("Tell me more"),
      user("actually my main worry now is dark spots"),
    ];
    expect(recommendationConcern(convo)).toBe("pigmentation");
  });

  it("returns nothing when no concern is expressed", () => {
    const convo = [user("what is niacinamide?"), bot("It's a vitamin B3..."), user("interesting, thanks")];
    expect(recommendationConcern(convo)).toBeUndefined();
  });
});
