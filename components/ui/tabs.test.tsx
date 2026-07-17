import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "./tabs";

const tabs = [
  { id: "a", label: "Tab A", content: "Panel A" },
  { id: "b", label: "Tab B", content: "Panel B" },
  { id: "c", label: "Tab C", content: "Panel C" },
];

it("clicking a tab shows its panel and sets aria-selected", async () => {
  render(<Tabs tabs={tabs} />);

  const tabA = screen.getByRole("tab", { name: "Tab A" });
  const tabB = screen.getByRole("tab", { name: "Tab B" });
  expect(tabA).toHaveAttribute("aria-selected", "true");
  expect(screen.getByText("Panel A")).toBeVisible();

  await userEvent.click(tabB);

  expect(tabB).toHaveAttribute("aria-selected", "true");
  expect(tabA).toHaveAttribute("aria-selected", "false");
  expect(screen.getByText("Panel B")).toBeVisible();
});

it("keeps every DOM id unique across multiple Tabs instances sharing tab ids", () => {
  render(
    <>
      <Tabs tabs={tabs} />
      <Tabs tabs={tabs} />
    </>,
  );
  const ids = Array.from(document.querySelectorAll("[id]")).map((el) => el.id);
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
});

it("navigates and wraps with arrow keys, moving focus and selection", async () => {
  const user = userEvent.setup();
  render(<Tabs tabs={tabs} />);

  const tabA = screen.getByRole("tab", { name: "Tab A" });
  const tabB = screen.getByRole("tab", { name: "Tab B" });
  const tabC = screen.getByRole("tab", { name: "Tab C" });

  tabA.focus();
  expect(tabA).toHaveFocus();

  await user.keyboard("{ArrowRight}");
  expect(tabB).toHaveAttribute("aria-selected", "true");
  expect(tabB).toHaveFocus();

  await user.keyboard("{ArrowRight}");
  expect(tabC).toHaveAttribute("aria-selected", "true");
  expect(tabC).toHaveFocus();

  // wrap around from last tab back to first
  await user.keyboard("{ArrowRight}");
  expect(tabA).toHaveAttribute("aria-selected", "true");
  expect(tabA).toHaveFocus();

  // wrap around backwards from first tab to last
  await user.keyboard("{ArrowLeft}");
  expect(tabC).toHaveAttribute("aria-selected", "true");
  expect(tabC).toHaveFocus();

  await user.keyboard("{Home}");
  expect(tabA).toHaveAttribute("aria-selected", "true");
  expect(tabA).toHaveFocus();

  await user.keyboard("{End}");
  expect(tabC).toHaveAttribute("aria-selected", "true");
  expect(tabC).toHaveFocus();
});

it("uses roving tabindex so only the active tab is tabbable", async () => {
  render(<Tabs tabs={tabs} />);
  const tabA = screen.getByRole("tab", { name: "Tab A" });
  const tabB = screen.getByRole("tab", { name: "Tab B" });

  expect(tabA).toHaveAttribute("tabIndex", "0");
  expect(tabB).toHaveAttribute("tabIndex", "-1");

  await userEvent.click(tabB);
  expect(tabB).toHaveAttribute("tabIndex", "0");
  expect(tabA).toHaveAttribute("tabIndex", "-1");
});
