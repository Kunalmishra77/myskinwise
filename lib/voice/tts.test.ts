import { normalizeForSpeech } from "@/lib/voice/tts";

describe("normalizeForSpeech", () => {
  it("strips markdown so it is not voiced", () => {
    expect(normalizeForSpeech("Try **Vitamin C** for #glow")).toBe("Try Vitamin C for glow");
  });

  it("speaks the rupee sign as a word, localised", () => {
    expect(normalizeForSpeech("It is ₹899 today")).toBe("It is 899 rupees today");
    expect(normalizeForSpeech("यह ₹899 है", "hi")).toBe("यह 899 रुपये है");
  });

  it("turns an ampersand and dashes into spoken pauses/words", () => {
    expect(normalizeForSpeech("acne & marks — gone")).toBe("acne and marks, gone");
    expect(normalizeForSpeech("wait…")).toBe("wait,");
  });

  it("collapses extra whitespace", () => {
    expect(normalizeForSpeech("too    many   spaces")).toBe("too many spaces");
  });
});
