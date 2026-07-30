"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { SITE, waHref } from "@/config/site";
import { useT } from "@/lib/i18n/provider";

/**
 * The site's floating corner actions, organised so nothing overlaps.
 *
 * There are three floating controls a visitor can meet on a page:
 *   - the voice mic launcher  → bottom-RIGHT, owned by VoiceOverlay (size-14)
 *   - WhatsApp                → bottom-LEFT (this file)
 *   - back-to-top             → bottom-RIGHT, stacked ABOVE the mic (this file)
 *
 * Splitting WhatsApp to the left keeps the right column to just two controls
 * (mic + an on-demand back-to-top) instead of a three-high tower, and keeps
 * every one of them clear of the mobile bottom nav, which sits below them.
 *
 * Portalled to <body> for the same reason VoiceOverlay is: the sticky header's
 * backdrop-filter creates a containing block that would otherwise clip a fixed
 * descendant.
 *
 * Hidden on /voice (its own full-screen surface) and never rendered inside the
 * immersive Skin Check / Analyzer flows, which live outside this shell.
 */
export function FloatingActions() {
  const pathname = usePathname();
  const t = useT();
  const [mounted, setMounted] = React.useState(false);
  const [showTop, setShowTop] = React.useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);

  // Reveal back-to-top only once there is a meaningful amount to scroll back
  // over, so it never permanently occupies the corner on short pages.
  React.useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!mounted || pathname === "/voice") return null;

  const scrollTop = () =>
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });

  return createPortal(
    <>
      {/* WhatsApp — bottom-left, brand green, clear of the mic on the right. */}
      <a
        href={waHref(SITE.whatsapp.e164)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("whatsapp.aria")}
        className="fixed left-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition-transform active:scale-95 lg:left-6 lg:bottom-6"
      >
        <WhatsAppGlyph className="size-7" />
      </a>

      {/* Back-to-top — bottom-right, stacked above the voice mic (which sits at
          bottom 5rem / size-14), revealed on scroll. */}
      {showTop && (
        <button
          type="button"
          onClick={scrollTop}
          aria-label={t("action.backToTop")}
          className="fixed right-4 bottom-[calc(9.25rem+env(safe-area-inset-bottom))] z-[60] inline-flex size-12 items-center justify-center rounded-full border border-ink/10 bg-surface text-ink shadow-lift transition-transform active:scale-95 lg:right-6 lg:bottom-[6.25rem]"
        >
          <ArrowUp aria-hidden="true" className="size-5" />
        </button>
      )}
    </>,
    document.body,
  );
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/** WhatsApp's own glyph — lucide has no WhatsApp mark, so it is inlined. */
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.42 1.31-1.95 1.36-.5.05-1.13.07-1.82-.11-.42-.11-.96-.29-1.65-.59-2.9-1.25-4.8-4.17-4.94-4.36-.15-.19-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.27-.29.58-.36.78-.36l.56.01c.18 0 .42-.07.66.5.24.58.83 2.01.9 2.16.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.29.72 1.18 1.54 1.91 1.06.95 1.95 1.24 2.24 1.38.29.14.45.12.62-.07.17-.19.71-.83.9-1.12.19-.29.38-.24.64-.14.26.1 1.65.78 1.94.92.29.14.48.22.55.34.07.12.07.7-.17 1.38Z" />
    </svg>
  );
}
