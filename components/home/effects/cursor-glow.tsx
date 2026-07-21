"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { usePointerFine, usePrefersReducedMotion } from "@/components/home/lib/use-reduced-motion";

/**
 * Desktop-only fixed radial rose glow that follows the cursor. Disabled on
 * touch devices (checked via `matchMedia("(pointer: fine)")`, since touch
 * has no persistent cursor position) and under `prefers-reduced-motion:
 * reduce`. `pointer-events-none` so it never intercepts clicks/taps.
 */
export function CursorGlow() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const pointerFine = usePointerFine();

  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const springX = useSpring(x, { stiffness: 120, damping: 22, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 120, damping: 22, mass: 0.4 });

  // A real subscription to an external event stream (not an initial-value
  // read), so — unlike the `pointer:fine` check above — this legitimately
  // belongs in an effect.
  React.useEffect(() => {
    if (!pointerFine) return;
    const onMove = (event: MouseEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [pointerFine, x, y]);

  if (!pointerFine || prefersReducedMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-0 size-[440px] rounded-full opacity-40 mix-blend-multiply"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
        background: "radial-gradient(circle, color-mix(in srgb, var(--color-hp-rose) 35%, transparent), transparent 70%)",
      }}
    />
  );
}
