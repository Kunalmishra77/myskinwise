"use client";

import * as React from "react";
import { useReducedMotion } from "framer-motion";

/** How long the count-up animation runs once triggered. */
const ANIMATION_MS = 1200;

export interface StatCounterProps {
  value: number;
  suffix?: string;
  label: string;
}

/**
 * Numeric stat with an animated count-up, e.g. "92%" for "even skin tone".
 *
 * SSR-safety: the live site's known bug is a stat that renders "0" until a
 * client-side animation kicks in — visible to no-JS users, crawlers, and
 * anyone whose IntersectionObserver never fires. We avoid that entirely by
 * initialising `display` state to the *final* `value`, not 0. That means the
 * very first render — server or client, before or after hydration — already
 * shows the real number. The count-up is then layered on top purely as
 * progressive enhancement: an effect resets `display` to 0 and animates back
 * up to `value`, but only once the element has scrolled into view (via
 * IntersectionObserver) and only when the user hasn't asked for reduced
 * motion. If IntersectionObserver is unavailable, or reduced motion is
 * preferred, the effect intentionally does nothing further and the initial
 * (correct, final) value simply stays on screen.
 */
export function StatCounter({ value, suffix = "", label }: StatCounterProps) {
  const [display, setDisplay] = React.useState(value);
  const ref = React.useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (prefersReducedMotion) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    let rafId: number | null = null;

    const animate = () => {
      const start = performance.now();
      const from = 0;
      setDisplay(from);

      const step = (now: number) => {
        const progress = Math.min((now - start) / ANIMATION_MS, 1);
        const current = Math.round(from + (value - from) * progress);
        setDisplay(current);
        if (progress < 1) {
          rafId = window.requestAnimationFrame(step);
        }
      };
      rafId = window.requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [value, prefersReducedMotion]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1 text-center">
      <span className="text-4xl font-bold text-ink md:text-5xl">
        {display}
        {suffix}
      </span>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}
