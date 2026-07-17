import { describe, it, expect } from "vitest";
import { SITE, telHref, waHref } from "./site";
describe("SITE contact config", () => {
  it("tel hrefs have no spaces and are e164", () => {
    for (const p of Object.values(SITE.phones)) expect(telHref(p.e164)).toMatch(/^tel:\+\d{8,15}$/);
  });
  it("whatsapp link is a valid wa.me url", () => {
    expect(waHref(SITE.whatsapp.e164)).toMatch(/^https:\/\/wa\.me\/\d{8,15}$/);
  });
  it("email is the canonical support address", () => {
    expect(SITE.email).toBe("support@myskinwise.com");
  });
});
