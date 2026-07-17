import { render, screen } from "@testing-library/react";
import { StatCounter } from "./stat-counter";
import { BeforeAfterCarousel } from "./before-after-carousel";

describe("StatCounter", () => {
  it("renders final value in markup (SSR-safe)", () => {
    render(<StatCounter value={92} suffix="%" label="even skin tone" />);
    expect(screen.getByText(/92%/)).toBeInTheDocument();
  });

  it("renders the label", () => {
    render(<StatCounter value={92} suffix="%" label="even skin tone" />);
    expect(screen.getByText("even skin tone")).toBeInTheDocument();
  });

  it("renders the final value with no suffix when suffix is omitted", () => {
    render(<StatCounter value={4} label="week program" />);
    expect(screen.getByText("4")).toBeInTheDocument();
  });
});

describe("BeforeAfterCarousel", () => {
  it("renders a graceful placeholder instead of crashing when slides is empty", () => {
    render(<BeforeAfterCarousel slides={[]} />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });
});
