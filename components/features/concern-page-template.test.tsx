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

  it("omits the causes accordion entirely for other-issues, which has no causes copy", () => {
    render(<ConcernPageTemplate content={CONCERNS["other-issues"]} />);
    // "Excess oil" is an acne-specific cause title; it must never leak onto
    // the other-issues page, and no causes section should render at all
    // since content.causes is [] for other-issues.
    expect(screen.queryByText("Excess oil")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /reasons of/i })).not.toBeInTheDocument();
  });

  it("links the CTA to /skin-check for other-issues too", () => {
    render(<ConcernPageTemplate content={CONCERNS["other-issues"]} />);
    expect(screen.getByRole("link", { name: "Analyse your skin" })).toHaveAttribute(
      "href",
      "/skin-check",
    );
  });
});
