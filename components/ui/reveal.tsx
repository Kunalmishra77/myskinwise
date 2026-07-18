import * as React from "react";

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Accepted for call-site compatibility; no longer used (see note below). */
  delay?: number;
  /** Accepted for call-site compatibility; no longer used (see note below). */
  y?: number;
}

/**
 * Content wrapper. Renders children fully visible with no motion.
 *
 * A previous version faded content in on scroll via Framer Motion's
 * `initial={{ opacity: 0 }}` + `whileInView`. Framer serializes that initial
 * hidden state into the SSR HTML, so below-the-fold content (and any user
 * whose JS is slow/absent) rendered invisible until it scrolled into view —
 * a real content-visibility regression. Correct, visible content outranks a
 * decorative fade, so this now renders a plain element. The `delay`/`y` props
 * are kept only so existing call sites keep type-checking; add motion back
 * later only in a way that never leaves content invisible without scroll/JS.
 */
export function Reveal({ children, className }: RevealProps) {
  return <div className={className}>{children}</div>;
}
