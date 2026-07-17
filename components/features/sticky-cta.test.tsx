import { render, screen, waitFor } from "@testing-library/react";
import { StickyCTA } from "./sticky-cta";
import { SITE, telHref } from "@/config/site";

// jsdom doesn't implement `window.scrollTo`, so scroll position is set
// directly on `scrollY` (a read-only getter in real browsers, but
// configurable here) and a `scroll` event is dispatched to notify listeners.
function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { value, writable: true, configurable: true });
  window.dispatchEvent(new Event("scroll"));
}

describe("StickyCTA", () => {
  it("links to WhatsApp via wa.me with the configured number", () => {
    render(<StickyCTA />);
    const whatsapp = screen.getByRole("link", { name: /whatsapp/i });
    expect(whatsapp).toHaveAttribute("href", "https://wa.me/919319135065");
  });

  it("links to the general phone number via tel: with no spaces", () => {
    render(<StickyCTA />);
    const call = screen.getByRole("link", { name: /call/i });
    const href = call.getAttribute("href");
    expect(href).toBe(telHref(SITE.phones.general.e164));
    expect(href).not.toMatch(/\s/);
  });

  it("links 'Analyse your skin' to the pigmentation quiz route", () => {
    render(<StickyCTA />);
    const analyse = screen.getByRole("link", { name: /analyse your skin/i });
    expect(analyse).toHaveAttribute("href", "/pigmentation");
  });

  it("opens WhatsApp in a new tab safely", () => {
    render(<StickyCTA />);
    const whatsapp = screen.getByRole("link", { name: /whatsapp/i });
    expect(whatsapp).toHaveAttribute("target", "_blank");
    expect(whatsapp).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("is hidden before scrolling and reveals itself once scrollY passes the threshold", async () => {
    render(<StickyCTA />);
    const bar = screen.getByRole("region", { name: /quick contact/i });
    expect(bar).toHaveAttribute("data-visible", "false");

    setScrollY(400);

    await waitFor(() => expect(bar).toHaveAttribute("data-visible", "true"));
  });

  it("hides again once scrolled back above the threshold", async () => {
    render(<StickyCTA />);
    const bar = screen.getByRole("region", { name: /quick contact/i });

    setScrollY(400);
    await waitFor(() => expect(bar).toHaveAttribute("data-visible", "true"));

    setScrollY(0);
    await waitFor(() => expect(bar).toHaveAttribute("data-visible", "false"));
  });

  it("removes the scroll listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<StickyCTA />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    removeSpy.mockRestore();
  });
});
