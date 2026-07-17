"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Phone, MessageCircle } from "lucide-react";
import { SITE, telHref, waHref } from "@/config/site";
import { Button } from "@/components/ui/button";

/** Reveal the bar once the user has scrolled this many px down the page. */
const SCROLL_THRESHOLD = 300;

/**
 * Mobile-only sticky bottom action bar: call, WhatsApp, and the primary
 * "Analyse your skin" CTA. Hidden on `md+` (`md:hidden`) since the header's
 * own CTA (Navbar) already covers desktop.
 *
 * The bar's links are always present in the DOM — visibility is expressed
 * purely via a transform (slid fully off-screen when not "visible") rather
 * than conditional rendering, so the links stay easy to query/test and the
 * bar can animate in/out. `tabIndex={-1}` keeps the off-screen links out of
 * the tab order until the bar is actually visible, and `aria-hidden` on the
 * container keeps the whole region (and its links) out of the accessibility
 * tree while it's off-screen, so screen readers browsing by landmarks/links
 * don't surface a bar the sighted user can't see yet.
 */
export function StickyCTA() {
  const [visible, setVisible] = React.useState(false);
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    // rAF-throttled scroll listener: `scroll` can fire many times per
    // frame, so we coalesce bursts down to at most one state update per
    // animation frame instead of one per event. `rafId` tracks the
    // in-flight frame so cleanup can cancel it — without this, a rAF
    // scheduled just before unmount would still fire afterwards and call
    // `setVisible` on a torn-down component.
    let ticking = false;
    let rafId: number | null = null;
    const update = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
      ticking = false;
      rafId = null;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      rafId = window.requestAnimationFrame(update);
    };

    onScroll(); // pick up an already-scrolled position (e.g. back/forward nav)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <motion.div
      role="region"
      aria-label="Quick contact"
      aria-hidden={!visible || undefined}
      data-visible={visible}
      initial={false}
      animate={{ y: visible ? "0%" : "100%" }}
      // Reduced motion: snap instantly instead of sliding.
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: "easeInOut" }}
      className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-ink/10 bg-surface px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] md:hidden"
    >
      <a
        href={telHref(SITE.phones.general.e164)}
        aria-label="Call us"
        tabIndex={visible ? undefined : -1}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-ink/20 text-ink transition hover:bg-canvas"
      >
        <Phone aria-hidden="true" className="size-5" />
      </a>
      <a
        href={waHref(SITE.whatsapp.e164)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        tabIndex={visible ? undefined : -1}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition hover:brightness-95"
      >
        <MessageCircle aria-hidden="true" className="size-5" />
      </a>
      <Button asChild className="flex-1">
        <Link href="/pigmentation" tabIndex={visible ? undefined : -1}>
          Analyse your skin
        </Link>
      </Button>
    </motion.div>
  );
}
