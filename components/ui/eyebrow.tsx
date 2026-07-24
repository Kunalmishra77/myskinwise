import * as React from "react";
import { cn } from "@/lib/utils";

export interface EyebrowProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Italic serif index number prefix, e.g. "01". Omit for unindexed sections. */
  index?: string;
  /**
   * "default" is rose-ink, which clears AA (~4.6–5.2:1) on the warm,
   * surface and blush backgrounds. On the plum dark section rose-ink drops
   * to ~3.4:1, so "dark" swaps to the lighter `rose` token (~6.5:1 there).
   * Always pass tone="dark" inside a plum section. See the rose ramp notes
   * in app/globals.css.
   */
  tone?: "default" | "dark";
}

/**
 * Small uppercase label above a heading, optionally numbered — e.g.
 * `<Eyebrow index="01">The Skin Check</Eyebrow>`. Base typography lives in
 * the `.eyebrow` class in globals.css.
 */
export function Eyebrow({ index, tone = "default", className, children, ...props }: EyebrowProps) {
  return (
    <p
      className={cn("eyebrow flex items-center gap-2.5", tone === "dark" && "eyebrow--dark", className)}
      {...props}
    >
      {index && (
        <span aria-hidden="true" className="font-display text-base italic normal-case tracking-normal">
          {index}
        </span>
      )}
      <span>{children}</span>
    </p>
  );
}
