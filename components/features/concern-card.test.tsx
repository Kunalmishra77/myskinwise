import { render, screen } from "@testing-library/react";
import { ConcernCard } from "./concern-card";
import { IMAGES } from "@/content/assets";

describe("ConcernCard", () => {
  it("links to /pigmentation given slug='pigmentation'", () => {
    render(
      <ConcernCard
        slug="pigmentation"
        label="Hyperpigmentation"
        teaser="Fade dark spots and even out your skin tone."
        image={IMAGES.concernRedness}
      />,
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/pigmentation");
  });

  it("renders the teaser text", () => {
    render(
      <ConcernCard
        slug="pigmentation"
        label="Hyperpigmentation"
        teaser="Fade dark spots and even out your skin tone."
        image={IMAGES.concernRedness}
      />,
    );
    expect(
      screen.getByText("Fade dark spots and even out your skin tone."),
    ).toBeInTheDocument();
  });

  it("renders the image with the passed alt text", () => {
    render(
      <ConcernCard
        slug="pigmentation"
        label="Hyperpigmentation"
        teaser="Fade dark spots and even out your skin tone."
        image={IMAGES.concernRedness}
      />,
    );
    expect(screen.getByAltText(IMAGES.concernRedness.alt)).toBeInTheDocument();
  });
});
