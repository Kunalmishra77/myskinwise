import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactForm } from "./contact-form";

describe("ContactForm", () => {
  it("shows validation errors when submitted empty", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findAllByRole("alert")).not.toHaveLength(0);
    expect(screen.getByText(/please enter your name/i)).toBeInTheDocument();
    expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/please enter at least 10 characters/i)).toBeInTheDocument();
  });

  it("shows a success message after submitting valid input", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText(/name/i), "Jordan Lee");
    await user.type(screen.getByLabelText(/email/i), "jordan@example.com");
    await user.type(
      screen.getByLabelText(/message/i),
      "I would like to know more about your skincare program.",
    );

    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(
      await screen.findByText(/thanks.*we.?ll be in touch soon/i),
    ).toBeInTheDocument();
  });

  it("includes a mailto fallback link using SITE.email", () => {
    render(<ContactForm />);
    const link = screen.getByRole("link", { name: /email us directly|mailto|email/i });
    expect(link).toHaveAttribute("href", expect.stringMatching(/^mailto:/));
  });
});
