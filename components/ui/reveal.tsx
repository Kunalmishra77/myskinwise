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
 * Scroll reveal: content slides up into place via Framer's `whileInView`
 * with `viewport={{ once: true }}`.
 *
 * It deliberately animates POSITION ONLY — never opacity. Two reasons, and
 * both are load-bearing:
 *
 * 1. Content visibility. An opacity-based reveal leaves everything below
 *    the fold at `opacity: 0` until it is scrolled to. Anyone who does not
 *    scroll never sees it, and an earlier version of this component had to
 *    have its motion stripped entirely because Framer also serialises that
 *    hidden state into SSR HTML.
 * 2. It is measurably an accessibility failure, not a theoretical one. With
 *    the fade in place, axe-core reported serious `color-contrast`
 *    violations on the homepage in every run — text sampled mid-fade
 *    computes to washed-out colours like #E8D3D7 on #FBF7F6, a ratio of
 *    1.33:1. Sliding content cannot produce that, because the colours never
 *    change.
 *
 * Under prefers-reduced-motion this renders a plain element with no
 * transform at all. Any future change must keep both properties: never hide
 * content, never animate its colour.
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
      initial={{ y: 28 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ ...TRANSITION, delay }}
    >
      {children}
    </MotionTag>
  );
}
