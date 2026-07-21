"use client";

import * as React from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { usePrefersReducedMotion } from "@/components/home/lib/use-reduced-motion";

/**
 * Fixed top scroll-progress bar (rose gradient) tracking page scroll. Kept
 * visible (not hidden) under reduced motion — it's an information affordance,
 * not a decorative flourish — but skips the spring smoothing so it tracks
 * scroll position 1:1 instead of animating.
 */
export function ScrollProgress() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothed = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX: prefersReducedMotion ? scrollYProgress : smoothed }}
      className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-gradient-to-r from-hp-rose via-hp-rose-deep to-hp-rose-ink"
    />
  );
}
