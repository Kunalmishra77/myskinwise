import { render, screen, within } from "@testing-library/react";
import { Breadcrumb } from "./breadcrumb";

const items = [
  { label: "Home", href: "/" },
  { label: "Skin Concerns", href: "/concerns" },
  { label: "Hyperpigmentation", href: "/pigmentation" },
];

describe("Breadcrumb", () => {
  it("renders a nav with accessible name 'Breadcrumb'", () => {
    render(<Breadcrumb items={items} />);
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders all non-last items as links with correct hrefs", () => {
    render(<Breadcrumb items={items} />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });

    expect(within(nav).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(within(nav).getByRole("link", { name: "Skin Concerns" })).toHaveAttribute(
      "href",
      "/concerns",
    );
  });

  it("renders the last item as plain text (not a link) with aria-current='page'", () => {
    render(<Breadcrumb items={items} />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });

    expect(
      within(nav).queryByRole("link", { name: "Hyperpigmentation" }),
    ).not.toBeInTheDocument();

    const current = within(nav).getByText("Hyperpigmentation");
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("emits a BreadcrumbList JSON-LD script with absolute item URLs", () => {
    const { container } = render(<Breadcrumb items={items} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();

    const data = JSON.parse(script?.innerHTML ?? "{}");
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement).toHaveLength(3);
    expect(data.itemListElement[0]).toMatchObject({
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://myskinwise.com/",
    });
    expect(data.itemListElement[2]).toMatchObject({
      "@type": "ListItem",
      position: 3,
      name: "Hyperpigmentation",
      item: "https://myskinwise.com/pigmentation",
    });
  });
});
