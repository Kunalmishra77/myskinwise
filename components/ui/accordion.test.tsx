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
