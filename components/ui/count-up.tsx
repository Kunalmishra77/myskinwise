"use client";

import * as React from "react";
import { usePrefersReducedMotion } from "@/lib/use-media-query";

const DEFAULT_DURATION_MS = 1600;

export interface CountUpProps {
  value: number;
  suffix?: string;
  /** Animation duration in ms. Defaults to 1600. */
  duration?: number;
  /** Custom formatter, e.g. `(n) => n.toLocaleString()`. Defaults to `${value}${suffix}`. */
  format?: (value: number) => string;
  className?: string;
}

/**
 * Counts a number up when scrolled into view (IntersectionObserver).
 *
 * SSR-safety: state is initialised to the *final* `value`, not 0 — so the
 * very first render, server or client, before or after hydration, already
 * shows the real number. The count-up is layered on top purely as
 * progressive enhancement: an effect resets to 0 and animates back up to
 * `value`, but only once the element has scrolled into view and only when
 * the user hasn't asked for reduced motion. If IntersectionObserver is
 * unavailable, or reduced motion is preferred, the effect does nothing
 * further and the initial (correct, final) value simply stays on screen —
 * no-JS/reduced-motion users always see the real number, never a 0.
 */
export function CountUp({ value, suffix = "", duration = DEFAULT_DURATION_MS, format, className }: CountUpProps) {
  const [display, setDisplay] = React.useState(value);
  const ref = React.useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  React.useEffect(() => {
    if (prefersReducedMotion) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    let rafId: number | null = null;

    const animate = () => {
      const start = performance.now();
      setDisplay(0);

      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        // easeOutCubic — quick start, gentle settle.
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(value * eased));
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
  }, [value, duration, prefersReducedMotion]);

  const text = format ? format(display) : `${display}${suffix}`;

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
