import { describe, it, expect } from "vitest";
import { IMAGES } from "./assets";

describe("IMAGES", () => {
  it("every asset has meaningful alt text", () => {
    for (const [key, a] of Object.entries(IMAGES)) {
      expect(a.alt.trim().length, key).toBeGreaterThan(2);
      expect(a.alt, key).not.toMatch(/\.(png|jpe?g|svg|webp|gif)$/i);
      expect(a.width, key).toBeGreaterThan(0);
      expect(a.height, key).toBeGreaterThan(0);
    }
  });
});
