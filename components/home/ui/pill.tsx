import * as React from "react";
import { cn } from "@/lib/utils";

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Show a small leading rose dot (e.g. the hero's "AI-POWERED SKIN ANALYSIS" pill). */
  dot?: boolean;
  /** Optional leading icon, rendered before the dot/text (e.g. a lucide icon). */
  icon?: React.ReactNode;
}

/**
 * Small rounded-full label pill used for hero badges and the trust marquee.
 * rose-ink on blush clears ~4.6:1 (WCAG AA) — see aihome-1-report.md for the
 * full contrast table.
 */
export function Pill({ dot, icon, className, children, ...props }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-hp-rose-ink/15 bg-hp-blush px-4 py-2 font-body text-[12.5px] font-semibold uppercase tracking-[0.1em] text-hp-rose-ink",
        className,
      )}
      {...props}
    >
      {dot && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-hp-rose-ink" />}
      {icon}
      {children}
    </span>
  );
}
