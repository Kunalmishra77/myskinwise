import * as React from "react";
import { cn } from "@/lib/utils";

export type EyebrowProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * Small uppercase label preceding a heading (e.g. "OUR APPROACH" above an
 * H2). Renders a short accent rule before the text — purely decorative
 * (`aria-hidden`), so screen readers just hear the label itself.
 */
export function Eyebrow({ className, children, ...props }: EyebrowProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-ink sm:text-sm",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="h-px w-6 shrink-0 bg-rose-ink/50" />
      {children}
    </p>
  );
}
