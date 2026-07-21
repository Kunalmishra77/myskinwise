"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/use-media-query";

/**
 * Fixed top scroll-progress bar tracking page scroll.
 *
 * Kept visible under prefers-reduced-motion rather than hidden — it is an
 * information affordance, not a decorative flourish — but the spring
 * smoothing is skipped there so it tracks scroll position 1:1 instead of
 * easing toward it.
 */
export function ScrollProgress() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothed = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX: prefersReducedMotion ? scrollYProgress : smoothed }}
      className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-gradient-to-r from-rose via-rose-deep to-rose-ink"
    />
  );
}
