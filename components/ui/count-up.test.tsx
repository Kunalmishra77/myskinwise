import { render, screen } from "@testing-library/react";
import { CountUp } from "./count-up";

it("renders the final value immediately (SSR/no-JS-safe — never starts at 0)", () => {
  render(<CountUp value={2000} suffix="+" />);
  expect(screen.getByText("2000+")).toBeInTheDocument();
});

it("supports a custom formatter", () => {
  render(<CountUp value={1234} format={(n) => n.toLocaleString("en-US")} />);
  expect(screen.getByText("1,234")).toBeInTheDocument();
});
