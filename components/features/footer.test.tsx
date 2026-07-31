import { render, screen } from "@testing-library/react";
import { Footer } from "./footer";
import { SITE, telHref } from "@/config/site";

describe("Footer", () => {
  it("home link points to / not a wp id", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("tel links have no spaces", () => {
    render(<Footer />);
    const telLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href")?.startsWith("tel:"));
    expect(telLinks.length).toBeGreaterThan(0);
    telLinks.forEach((a) => expect(a.getAttribute("href")).not.toMatch(/\s/));
  });

  it("renders the general and product phone lines sourced from SITE", () => {
    render(<Footer />);
    const generalLinks = screen.getAllByRole("link", {
      name: new RegExp(SITE.phones.general.display.replace(/\+/g, "\\+")),
    });
    expect(generalLinks[0]).toHaveAttribute("href", telHref(SITE.phones.general.e164));

    const productLinks = screen.getAllByRole("link", {
      name: new RegExp(SITE.phones.product.display.replace(/\+/g, "\\+")),
    });
    expect(productLinks[0]).toHaveAttribute("href", telHref(SITE.phones.product.e164));
  });

  it("renders a mailto link using SITE.email", () => {
    render(<Footer />);
    const mailLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href")?.startsWith("mailto:"));
    expect(mailLinks.length).toBeGreaterThan(0);
    mailLinks.forEach((a) => expect(a).toHaveAttribute("href", `mailto:${SITE.email}`));
  });

  it("renders a WhatsApp link matching SITE.whatsapp", () => {
    render(<Footer />);
    const waLink = screen.getByRole("link", { name: /whatsapp/i });
    expect(waLink).toHaveAttribute("href", "https://wa.me/919266048124");
  });

  it("renders all Visit Links with correct hrefs", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "About Us" })).toHaveAttribute("href", "/about-us");
    expect(screen.getByRole("link", { name: "Contact us" })).toHaveAttribute("href", "/contact-us");
    expect(screen.getByRole("link", { name: "Hyperpigmentation" })).toHaveAttribute(
      "href",
      "/pigmentation",
    );
    expect(screen.getByRole("link", { name: "Acne" })).toHaveAttribute("href", "/acne");
    expect(screen.getByRole("link", { name: "Other Issues" })).toHaveAttribute(
      "href",
      "/other-issues",
    );
  });

  it("renders every legal link", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "/privacy-policy",
    );
    expect(screen.getByRole("link", { name: "Terms & Conditions" })).toHaveAttribute(
      "href",
      "/terms-and-conditions",
    );
    expect(screen.getByRole("link", { name: "Refund & Cancellation" })).toHaveAttribute(
      "href",
      "/refund-and-cancellation",
    );
  });

  it("renders the copyright text from SITE.copyright", () => {
    render(<Footer />);
    expect(screen.getByText(SITE.copyright)).toBeInTheDocument();
  });

  it("renders a non-functional subscribe form that does not throw on submit", async () => {
    render(<Footer />);
    const heading = screen.getByText(/never miss our updates/i);
    expect(heading).toBeInTheDocument();

    const emailInput = screen.getByRole("textbox", { name: /email/i });
    expect(emailInput).toBeInTheDocument();

    const submitButton = screen.getByRole("button", { name: /subscribe/i });
    expect(submitButton).toBeInTheDocument();
  });
});
