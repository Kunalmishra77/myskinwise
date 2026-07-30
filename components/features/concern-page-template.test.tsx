import { render, screen } from "@testing-library/react";
import { ConcernPageTemplate } from "./concern-page-template";
import { CONCERNS } from "@/content/concerns";

describe("ConcernPageTemplate", () => {
  it("links the hero 'Analyse your skin' CTA to the working /skin-check funnel", () => {
    // Previously pointed at /quiz/[concern], a placeholder — the concern
    // pages must send users into the real native Skin Check.
    render(<ConcernPageTemplate content={CONCERNS.pigmentation} />);
    expect(screen.getByRole("link", { name: "Analyse your skin" })).toHaveAttribute(
      "href",
      "/skin-check",
    );
  });

  it("renders a known pigmentation cause in the causes accordion", () => {
    render(<ConcernPageTemplate content={CONCERNS.pigmentation} />);
    expect(screen.getByText("Sun damage")).toBeInTheDocument();
  });

  it("renders other-issues' own causes accordion without leaking the acne block", () => {
    render(<ConcernPageTemplate content={CONCERNS["other-issues"]} />);
    // other-issues now has its own causes, so the section renders...
    expect(screen.getByRole("heading", { name: /reasons of other issues/i })).toBeInTheDocument();
    expect(screen.getByText("Ageing and collagen loss")).toBeInTheDocument();
    // ...but the acne-specific cause title "Excess oil" must never leak onto it.
    expect(screen.queryByText("Excess oil")).not.toBeInTheDocument();
  });

  it("links the CTA to /skin-check for other-issues too", () => {
    render(<ConcernPageTemplate content={CONCERNS["other-issues"]} />);
    expect(screen.getByRole("link", { name: "Analyse your skin" })).toHaveAttribute(
      "href",
      "/skin-check",
    );
  });
});
