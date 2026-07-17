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
  // The bar starts off-screen with `aria-hidden="true"` (fix: hidden from
  // AT until revealed), so these link-content assertions opt into
  // `{ hidden: true }` to include it in the query — they're checking the
  // href wiring, not the current a11y-visibility state.
  //
  // The container itself is located by role alone (no `name` filter): an
  // element's own `aria-hidden="true"` makes accessible-name computation
  // resolve to "" regardless of `hidden: true` (that option only bypasses
  // the *inclusion* filter, not name computation), so matching by name
  // would spuriously fail while the bar is hidden.

  it("links to WhatsApp via wa.me with the configured number", () => {
    render(<StickyCTA />);
    const whatsapp = screen.getByRole("link", { name: /whatsapp/i, hidden: true });
    expect(whatsapp).toHaveAttribute("href", "https://wa.me/919319135065");
  });

  it("links to the general phone number via tel: with no spaces", () => {
    render(<StickyCTA />);
    const call = screen.getByRole("link", { name: /call/i, hidden: true });
    const href = call.getAttribute("href");
    expect(href).toBe(telHref(SITE.phones.general.e164));
    expect(href).not.toMatch(/\s/);
  });

  it("links 'Analyse your skin' to the pigmentation quiz route", () => {
    render(<StickyCTA />);
    const analyse = screen.getByRole("link", { name: /analyse your skin/i, hidden: true });
    expect(analyse).toHaveAttribute("href", "/pigmentation");
  });

  it("opens WhatsApp in a new tab safely", () => {
    render(<StickyCTA />);
    const whatsapp = screen.getByRole("link", { name: /whatsapp/i, hidden: true });
    expect(whatsapp).toHaveAttribute("target", "_blank");
    expect(whatsapp).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("is hidden before scrolling and reveals itself once scrollY passes the threshold", async () => {
    render(<StickyCTA />);
    const bar = screen.getByRole("region", { hidden: true });
    expect(bar).toHaveAttribute("data-visible", "false");

    setScrollY(400);

    await waitFor(() => expect(bar).toHaveAttribute("data-visible", "true"));
  });

  it("hides again once scrolled back above the threshold", async () => {
    render(<StickyCTA />);
    const bar = screen.getByRole("region", { hidden: true });

    setScrollY(400);
    await waitFor(() => expect(bar).toHaveAttribute("data-visible", "true"));

    setScrollY(0);
    await waitFor(() => expect(bar).toHaveAttribute("data-visible", "false"));
  });

  it("hides the bar from assistive tech (aria-hidden) while off-screen, and exposes it once revealed", async () => {
    render(<StickyCTA />);
    const bar = screen.getByRole("region", { hidden: true });
    expect(bar).toHaveAttribute("aria-label", "Quick contact");
    expect(bar).toHaveAttribute("aria-hidden", "true");
    // Also unreachable via the default (AT-visible-only) query while hidden.
    expect(screen.queryByRole("region")).not.toBeInTheDocument();

    setScrollY(400);
    await waitFor(() => expect(bar).not.toHaveAttribute("aria-hidden"));
    // Now reachable without opting into `hidden: true`.
    expect(screen.getByRole("region", { name: /quick contact/i })).toBe(bar);

    setScrollY(0);
    await waitFor(() => expect(bar).toHaveAttribute("aria-hidden", "true"));
  });

  it("removes the scroll listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<StickyCTA />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    removeSpy.mockRestore();
  });

  it("cancels a pending rAF on unmount instead of updating state after teardown", () => {
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
    const { unmount } = render(<StickyCTA />);

    // The mount-time onScroll() call above already scheduled one rAF frame
    // (to pick up an already-scrolled position); it's still in-flight
    // because no animation frame has run yet in this synchronous test.
    unmount();

    expect(cancelSpy).toHaveBeenCalled();
    cancelSpy.mockRestore();
  });
});
