import { describe, it, expect } from "vitest";
import { contactSchema } from "./contact";

describe("contactSchema", () => {
  it("rejects a name shorter than 2 characters", () => {
    const result = contactSchema.safeParse({
      name: "A",
      email: "person@example.com",
      message: "This is a long enough message.",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("name"))).toBe(true);
    }
  });

  it("rejects an invalid email", () => {
    const result = contactSchema.safeParse({
      name: "Jordan",
      email: "not-an-email",
      message: "This is a long enough message.",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("email"))).toBe(true);
    }
  });

  it("rejects a message shorter than 10 characters", () => {
    const result = contactSchema.safeParse({
      name: "Jordan",
      email: "person@example.com",
      message: "too short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("message"))).toBe(true);
    }
  });

  it("accepts valid input", () => {
    const result = contactSchema.safeParse({
      name: "Jordan",
      email: "person@example.com",
      message: "This is a long enough message.",
    });
    expect(result.success).toBe(true);
  });
});
