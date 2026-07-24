"use client";

import * as React from "react";

/**
 * Generic `matchMedia` subscription via `useSyncExternalStore` — the
 * server snapshot is always `false` (matching SSR's lack of `window`), and
 * the client re-syncs to the real value on the commit right after
 * hydration, with no `useEffect` + `setState` involved. That sidesteps both
 * failure modes a naive `useState` + `useEffect(() => setX(matchMedia...))`
 * hook has here: a hydration mismatch (if the initial state read
 * `window.matchMedia` eagerly during render) and cascading
 * render-then-effect-then-setState renders (flagged by the
 * `react-hooks/set-state-in-effect` rule) if it read it inside an effect.
 */
function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return () => {};
      }
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onStoreChange);
      return () => mediaQueryList.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  const getSnapshot = React.useCallback(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = React.useCallback(() => false, []);

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * SSR-safe `prefers-reduced-motion` hook shared by every homepage motion
 * primitive (MagneticButton, CursorGlow, RevealOnScroll, CountUp, Accordion,
 * ...). Returns `false` on the server and on the very first client render
 * — matching the absence of `window.matchMedia` during SSR — then syncs to
 * the real media-query result immediately after mount and on any later
 * OS-level change.
 *
 * Deliberately a small local hook (rather than always importing framer's
 * `useReducedMotion`) so purely-CSS effects (film grain, gradient mesh) and
 * non-framer primitives (Marquee's CSS animation, CursorGlow's raw
 * mousemove listener) can gate themselves with the exact same signal
 * framer-driven primitives use.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * True on devices with an accurate ("fine") pointer — i.e. a mouse/trackpad,
 * not touch. MagneticButton and CursorGlow are both desktop-only effects
 * that need a real cursor position to react to; this is how they detect
 * that without ever guessing from screen width.
 */
export function usePointerFine(): boolean {
  return useMediaQuery("(pointer: fine)");
}
