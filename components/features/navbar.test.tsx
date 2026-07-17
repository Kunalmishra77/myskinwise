import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navbar } from "./navbar";

describe("Navbar", () => {
  it("renders all top-level nav labels as links", () => {
    render(<Navbar />);

    const home = screen.getAllByRole("link", { name: "Home" })[0];
    const expertise = screen.getAllByRole("link", { name: "Our Expertise" })[0];
    const contact = screen.getAllByRole("link", { name: "Contact" })[0];

    expect(home).toHaveAttribute("href", "/");
    expect(expertise).toHaveAttribute("href", "/about-us");
    expect(contact).toHaveAttribute("href", "/contact-us");
  });

  it("shows a hamburger button with an accessible name and aria-expanded starting false", () => {
    render(<Navbar />);

    const hamburger = screen.getByRole("button", { name: /open menu/i });
    expect(hamburger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens a dialog with the concern links on hamburger click and sets aria-expanded true", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const hamburger = screen.getByRole("button", { name: /open menu/i });
    await user.click(hamburger);

    expect(hamburger).toHaveAttribute("aria-expanded", "true");
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    expect(within(dialog).getByRole("link", { name: "Hyperpigmentation" })).toHaveAttribute(
      "href",
      "/pigmentation",
    );
    expect(within(dialog).getByRole("link", { name: "Acne" })).toHaveAttribute("href", "/acne");
    expect(within(dialog).getByRole("link", { name: "Other Issues" })).toHaveAttribute(
      "href",
      "/other-issues",
    );
  });

  it("closes the dialog on Escape", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const hamburger = screen.getByRole("button", { name: /open menu/i });
    await user.click(hamburger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(hamburger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the dialog via the close button and restores focus to the hamburger", async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    const hamburger = screen.getByRole("button", { name: /open menu/i });
    await user.click(hamburger);

    const closeBtn = screen.getByRole("button", { name: /close menu/i });
    await user.click(closeBtn);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(hamburger).toHaveFocus();
  });

  it("renders the desktop 'Skin Problem' dropdown trigger with correct aria attributes", () => {
    render(<Navbar />);

    const trigger = screen.getByRole("button", { name: "Skin Problem" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("renders the header CTA linking to /pigmentation", () => {
    render(<Navbar />);

    const cta = screen.getAllByRole("link", { name: /analyse your skin/i })[0];
    expect(cta).toHaveAttribute("href", "/pigmentation");
  });
});
