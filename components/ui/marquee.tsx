import * as React from "react";
import { cn } from "@/lib/utils";

export interface MarqueeProps {
  children: React.ReactNode;
  /** Seconds for one full loop. Lower = faster. Defaults to 28. */
  speed?: number;
  reverse?: boolean;
  className?: string;
}

/**
 * Infinite horizontal marquee. A single flex track holds the content twice
 * back-to-back (the second copy is `aria-hidden`) and is translated from 0
 * to -50% via the `animate-marquee` CSS animation (see globals.css) —
 * since the track is exactly double-width, a -50% translate is a seamless
 * loop back to the start. Pure CSS (no JS/client component needed): pausing
 * under reduced motion is handled by Tailwind's `motion-reduce:` variant.
 */
export function Marquee({ children, speed = 28, reverse = false, className }: MarqueeProps) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <div
        className={cn(
          "flex w-max animate-marquee items-center gap-4 motion-reduce:animate-none",
          reverse && "[animation-direction:reverse]",
        )}
        style={{ animationDuration: `${speed}s` }}
      >
        <div className="flex shrink-0 items-center gap-4">{children}</div>
        <div aria-hidden="true" className="flex shrink-0 items-center gap-4">
          {children}
        </div>
      </div>
    </div>
  );
}
