"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePointerFine, usePrefersReducedMotion } from "@/components/home/lib/use-reduced-motion";

export interface MagneticButtonProps {
  /** Typically a single <Button> (or an <a>/<Link> styled like one). */
  children: React.ReactNode;
  className?: string;
  /** Maximum drift, in px, at the very edge of the hit area. Defaults to 16. */
  strength?: number;
}

/**
 * Makes its child CTA drift slightly toward the cursor when nearby — the
 * "magnetic button" effect. Desktop/pointer-fine only (checked via
 * `matchMedia("(pointer: fine)")`, since a touch device has no hover/mouse
 * position to react to) and disabled entirely under
 * `prefers-reduced-motion: reduce`. On touch devices and under reduced
 * motion this renders as an inert wrapper — the child button behaves and
 * looks completely normal, just without the drift.
 */
export function MagneticButton({ children, className, strength = 16 }: MagneticButtonProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const pointerFine = usePointerFine();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.2 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.2 });

  const active = pointerFine && !prefersReducedMotion;

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!active || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = event.clientX - (rect.left + rect.width / 2);
    const relY = event.clientY - (rect.top + rect.height / 2);
    x.set((relX / (rect.width / 2)) * strength);
    y.set((relY / (rect.height / 2)) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={reset}
      style={active ? { x: springX, y: springY } : undefined}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.div>
  );
}
