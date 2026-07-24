import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ContactUsPage from "./page";
import { SITE, telHref, waHref } from "@/config/site";

describe("ContactUsPage", () => {
  it("surfaces all 3 department phone numbers, sourced from SITE.phones (never hardcoded)", () => {
    render(<ContactUsPage />);

    // SITE.whatsapp shares the same display text as SITE.phones.general
    // (both "+91 93191 35065"), so a link's accessible name alone doesn't
    // uniquely identify it — assert that a tel: link with the expected
    // href exists among the links sharing that display text.
    for (const phone of [SITE.phones.general, SITE.phones.product, SITE.phones.shipment]) {
      const links = screen.getAllByRole("link", { name: phone.display });
      expect(links.some((link) => link.getAttribute("href") === telHref(phone.e164))).toBe(true);
    }
  });

  it("links the support email as a mailto: using SITE.email", () => {
    render(<ContactUsPage />);

    const link = screen.getByRole("link", { name: SITE.email });
    expect(link).toHaveAttribute("href", `mailto:${SITE.email}`);
  });

  it("links WhatsApp using SITE.whatsapp and waHref", () => {
    render(<ContactUsPage />);

    const links = screen.getAllByRole("link", { name: SITE.whatsapp.display });
    expect(links.some((link) => link.getAttribute("href") === waHref(SITE.whatsapp.e164))).toBe(
      true,
    );
  });

  it("renders the ContactForm and the contact FAQ section", () => {
    render(<ContactUsPage />);

    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /frequently asked questions/i }),
    ).toBeInTheDocument();
  });
});
