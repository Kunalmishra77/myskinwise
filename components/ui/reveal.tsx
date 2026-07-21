"use client";

import * as React from "react";
import { motion, type Transition } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/use-media-query";

const MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
  span: motion.span,
} as const;

export type RevealAs = keyof typeof MOTION_TAGS;

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in seconds, e.g. `index * 0.08`. */
  delay?: number;
  /** Element/tag to render. Defaults to "div". */
  as?: RevealAs;
}

const TRANSITION: Transition = { duration: 0.7, ease: [0.22, 1, 0.36, 1] };

/**
 * Staggered scroll reveal: fade + translateY + blur resolving to clear, via
 * Framer's `whileInView` with `viewport={{ once: true }}`.
 *
 * The content-visibility trap this component exists to avoid: an earlier
 * version set `initial={{ opacity: 0 }}` unconditionally, and Framer
 * serialises that hidden state into the SSR HTML. Below-the-fold content —
 * and everything, for any user whose JS is slow or absent — rendered
 * invisible until it happened to scroll into view. A decorative fade must
 * never be able to hide real content, so under prefers-reduced-motion this
 * renders a plain, fully-visible element with no hidden initial state at
 * all. Any future change here must preserve that property.
 */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = MOTION_TAGS[as];
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 34, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ ...TRANSITION, delay }}
    >
      {children}
    </MotionTag>
  );
}
