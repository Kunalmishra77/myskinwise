import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Accordion } from "./accordion";
const items = [{ id: "a", question: "Q1", answer: "A1" }, { id: "b", question: "Q2", answer: "A2" }];
it("expands a panel on click and sets aria-expanded", async () => {
  render(<Accordion items={items} />);
  const btn = screen.getByRole("button", { name: "Q1" });
  expect(btn).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(btn);
  expect(btn).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("A1")).toBeVisible();
});

it("keeps every DOM id unique across multiple Accordion instances sharing item ids", () => {
  const shared = [{ id: "1", question: "Shared Q1", answer: "Shared A1" }];
  render(
    <>
      <Accordion items={shared} />
      <Accordion items={shared} />
    </>,
  );
  const ids = Array.from(document.querySelectorAll("[id]")).map((el) => el.id);
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
});

it("only allows a single panel open at a time by default", async () => {
  render(<Accordion items={items} />);
  const btnA = screen.getByRole("button", { name: "Q1" });
  const btnB = screen.getByRole("button", { name: "Q2" });

  await userEvent.click(btnA);
  expect(btnA).toHaveAttribute("aria-expanded", "true");

  await userEvent.click(btnB);
  expect(btnA).toHaveAttribute("aria-expanded", "false");
  expect(btnB).toHaveAttribute("aria-expanded", "true");
});

it("allows multiple panels open at once when allowMultiple is set", async () => {
  render(<Accordion items={items} allowMultiple />);
  const btnA = screen.getByRole("button", { name: "Q1" });
  const btnB = screen.getByRole("button", { name: "Q2" });

  await userEvent.click(btnA);
  await userEvent.click(btnB);

  expect(btnA).toHaveAttribute("aria-expanded", "true");
  expect(btnB).toHaveAttribute("aria-expanded", "true");
});
