import { render, screen } from "@testing-library/react";
import { Button } from "./button";
it("renders a button with accessible name", () => {
  render(<Button>Analyse your skin</Button>);
  expect(screen.getByRole("button", { name: "Analyse your skin" })).toBeInTheDocument();
});
it("renders as link when asChild wraps an anchor", () => {
  render(<Button asChild><a href="/x">Go</a></Button>);
  expect(screen.getByRole("link", { name: "Go" })).toHaveAttribute("href", "/x");
});
