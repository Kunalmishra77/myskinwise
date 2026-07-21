import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Accordion } from "./accordion";

const items = [
  { id: "a", q: "Q1", a: "A1" },
  { id: "b", q: "Q2", a: "A2" },
];

it("expands a panel on click and sets aria-expanded", async () => {
  render(<Accordion items={items} />);
  const btn = screen.getByRole("button", { name: "Q1" });
  expect(btn).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(btn);
  expect(btn).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("A1")).toBeVisible();
});

it("only allows a single panel open at a time", async () => {
  render(<Accordion items={items} />);
  const btnA = screen.getByRole("button", { name: "Q1" });
  const btnB = screen.getByRole("button", { name: "Q2" });

  await userEvent.click(btnA);
  expect(btnA).toHaveAttribute("aria-expanded", "true");

  await userEvent.click(btnB);
  expect(btnA).toHaveAttribute("aria-expanded", "false");
  expect(btnB).toHaveAttribute("aria-expanded", "true");
});

it("clicking an already-open panel's header collapses it", async () => {
  render(<Accordion items={items} />);
  const btnA = screen.getByRole("button", { name: "Q1" });

  await userEvent.click(btnA);
  expect(btnA).toHaveAttribute("aria-expanded", "true");

  await userEvent.click(btnA);
  expect(btnA).toHaveAttribute("aria-expanded", "false");
});

it("keeps every DOM id unique across multiple Accordion instances sharing item ids", () => {
  const shared = [{ id: "1", q: "Shared Q1", a: "Shared A1" }];
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

it("hides the collapsed panel from assistive tech via aria-hidden + inert", () => {
  render(<Accordion items={items} />);
  const panel = screen.getByText("A1").closest('[role="region"]');
  expect(panel).toHaveAttribute("aria-hidden", "true");
  // The `inert` boolean attribute (not a jest-dom-recognised ARIA/property
  // helper) reflects React's `inert={true}` prop straight onto the DOM node.
  expect(panel).toHaveAttribute("inert");
});
