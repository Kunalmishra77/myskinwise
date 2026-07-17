import { render, screen } from "@testing-library/react";
import { ProcessSteps } from "./process-steps";

const steps = [
  { title: "Take the skin quiz", body: "Answer a few questions about your skin." },
  { title: "Get your custom plan", body: "Our experts formulate a routine for you." },
  { title: "See results", body: "Follow your plan and track your progress." },
];

describe("ProcessSteps", () => {
  it("renders N numbered steps in order", () => {
    render(<ProcessSteps steps={steps} />);
    const numbers = ["1", "2", "3"];
    numbers.forEach((n) => expect(screen.getByText(n)).toBeInTheDocument());
  });

  it("renders the step titles in order", () => {
    render(<ProcessSteps steps={steps} />);
    const titles = screen.getAllByRole("heading", { level: 3 }).map((el) => el.textContent);
    expect(titles).toEqual(["Take the skin quiz", "Get your custom plan", "See results"]);
  });

  it("renders the step bodies", () => {
    render(<ProcessSteps steps={steps} />);
    steps.forEach((step) => expect(screen.getByText(step.body)).toBeInTheDocument());
  });
});
