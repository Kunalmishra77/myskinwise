"use client";

import * as React from "react";
import { motion, type Transition } from "framer-motion";
import { usePrefersReducedMotion } from "@/components/home/lib/use-reduced-motion";

const MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
  span: motion.span,
} as const;

export type RevealAs = keyof typeof MOTION_TAGS;

export interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in seconds, e.g. `index * 0.08`. */
  delay?: number;
  /** Element/tag to render. Defaults to "div". */
  as?: RevealAs;
}

const TRANSITION: Transition = { duration: 0.7, ease: [0.22, 1, 0.36, 1] };

/**
 * Staggered scroll reveal: fade + translateY(34px) + blur(6px) -> clear, via
 * Framer's `whileInView` (`viewport={{ once: true }}`).
 *
 * SSR/no-JS + reduced-motion safety: under `usePrefersReducedMotion()` this
 * renders a plain, fully-visible element with no hidden initial state (no
 * opacity-0 gating) — matching the codebase's existing lesson that a
 * decorative reveal must never leave content invisible without scroll/JS.
 * Outside of reduced motion, the `whileInView` fade/blur is the intended,
 * JS-driven effect (per the homepage design brief) — a client-only
 * enhancement layered on top of content that is otherwise present in the
 * DOM.
 */
export function RevealOnScroll({ children, className, delay = 0, as = "div" }: RevealOnScrollProps) {
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
